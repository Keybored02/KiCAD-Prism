"""Farnell, Newark and element14: the Product Search API (REST).

Written against the description element14 publishes at
partner.element14.com/docs/Product_Search_API_REST__Description, and run against the live service on 2026-10-13
(the manufacturer-number search, the ``id`` search and the ``medium`` group all answer as described).

* Endpoint: ``GET https://api.element14.com/catalog/products``. Generic access needs only
  ``callInfo.apiKey``; contract pricing (a signature) is not used here.
* ``storeInfo.id`` is mandatory and is the store's domain (``uk.farnell.com``, ``www.newark.com``...). That
  is the connector's storefront. The answer does not say which currency its prices are in. The connector's
  currency is used when it names one; otherwise the store's own currency, for the stores where that is not in
  doubt (``STORE_CURRENCY``). For any other store offers have no price until the connector names a currency.
* ``productURL`` (description version 1.3) comes back null from the live service, so a product link is a search
  on the store for the SKU, which lands on the product page.
* Search: ``term=manuPartNum:<number>``. Offers: ``term=id:<SKU>``. ``resultsSettings.responseGroup=medium``
  carries stock, prices, status and RoHS. The description shows several SKUs in one ``id`` term but says
  nothing about a limit, so one SKU is asked for per call until that is checked against the service.
* The wrapper around a manufacturer-number or SKU answer is not in the description (only the keyword
  search's ``keywordSearchReturn`` is), so the first object holding a ``products`` list is used.

Meanings taken from the description: ``stock.level`` is units on hand and ``stock.leastLeadTime`` the
shortest lead time (read as days); ``prices`` is a list of ``from``/``to``/``cost`` quantity bands, so ``from``
is the break and ``cost`` the unit price (inferred from its example); ``translatedMinimumOrderQuality`` is the
minimum order; ``productStatus`` ``NO_LONGER_MANUFACTURED`` is the manufacturer's end; ``releaseStatusCode``
6 and 7 (to be discontinued, discontinued) and ``NO_LONGER_STOCKED`` mean Farnell itself is dropping the part.
No limits are given; one call a second and 1,000 a day are used until they are known. Offers are read ten SKUs
a call (one ``id`` term, SKUs separated by spaces, checked live 2026-10-14); a manufacturer number search takes one
number, since several in one ``manuPartNum`` term find nothing.
"""

from __future__ import annotations

import time
from datetime import datetime, timezone
from decimal import Decimal
from urllib.parse import quote
from typing import Any, Callable, Mapping, Sequence

from app.services.supply.http_client import SafeHttpClient
from app.services.supply.models import Offer, PartData, PartMatch, PriceBreak
from app.services.supply.providers.base import (
    CAP_LIFECYCLE,
    CAP_OFFERS,
    CAP_SEARCH,
    AuthError,
    CredentialField,
    ProviderConfig,
    ProviderError,
    ProviderSpec,
)
from app.services.supply.identity import match_key
from app.services.supply.providers.text_values import parse_count, parse_decimal
from app.services.supply.providers.unrecognised import note
from app.services.supply.vocabulary import Lifecycle

KEY = "farnell"
BASE_URL = "https://api.element14.com/catalog/products"
ALLOWED_HOSTS = ("api.element14.com",)
MIN_INTERVAL_SECONDS = 1.0
MAX_MATCHES = 10

STOREFRONTS = (
    "bg.farnell.com", "cz.farnell.com", "dk.farnell.com", "at.farnell.com", "ch.farnell.com", "de.farnell.com",
    "cpc.farnell.com", "cpcireland.farnell.com", "export.farnell.com", "onecall.farnell.com", "ie.farnell.com",
    "il.farnell.com", "uk.farnell.com", "es.farnell.com", "ee.farnell.com", "fi.farnell.com", "fr.farnell.com",
    "hu.farnell.com", "it.farnell.com", "lt.farnell.com", "lv.farnell.com", "be.farnell.com", "nl.farnell.com",
    "no.farnell.com", "pl.farnell.com", "pt.farnell.com", "ro.farnell.com", "ru.farnell.com", "sk.farnell.com",
    "si.farnell.com", "se.farnell.com", "tr.farnell.com", "canada.newark.com", "mexico.newark.com", "www.newark.com",
    "cn.element14.com", "au.element14.com", "nz.element14.com", "hk.element14.com", "sg.element14.com",
    "my.element14.com", "ph.element14.com", "th.element14.com", "in.element14.com", "tw.element14.com",
    "kr.element14.com", "vn.element14.com",
)

# Stores whose prices are in their country's currency, which is not in doubt. The API does not say, so any store not
# listed here needs the currency set on the connector.
_EURO_STORES = (
    "at", "be", "de", "es", "fi", "fr", "ie", "it", "lt", "lv", "nl", "pt", "sk", "si", "ee",
)
STORE_CURRENCY: Mapping[str, str] = {
    "uk.farnell.com": "GBP",
    "www.newark.com": "USD",
    "canada.newark.com": "CAD",
    **{f"{code}.farnell.com": "EUR" for code in _EURO_STORES},
}

# Meaning of these is in the description. Anything else is logged once and read as having no effect.
_STATUS_ENDED = "NO_LONGER_MANUFACTURED"
_STATUS_DROPPED = frozenset({"NO_LONGER_STOCKED"})
_STATUS_KNOWN = frozenset({"STOCKED", "DIRECT_SHIP", "DEFAULTSTATUS"}) | _STATUS_DROPPED | {_STATUS_ENDED}
_RELEASE_DROPPING = frozenset({6, 7})
_STOCK_STATUS_ENDED = -3


class FarnellProvider:
    def __init__(
        self,
        config: ProviderConfig,
        *,
        client: SafeHttpClient | None = None,
        clock: Callable[[], datetime] | None = None,
        monotonic: Callable[[], float] = time.monotonic,
        sleep: Callable[[float], None] = time.sleep,
    ) -> None:
        self._api_key = config.credentials.get("api_key", "")
        self._store = config.storefront
        self._currency = config.currency or STORE_CURRENCY.get(config.storefront, "")
        self._client = client or SafeHttpClient(ALLOWED_HOSTS)
        self._clock = clock or (lambda: datetime.now(timezone.utc))
        self._monotonic = monotonic
        self._sleep = sleep
        self._last_call: float | None = None

    def _search(self, term: str) -> list[dict[str, Any]]:
        if not self._api_key:
            raise AuthError("Farnell needs an API key")
        if not self._store:
            raise ProviderError("Farnell needs a store, such as uk.farnell.com")
        if self._last_call is not None:
            wait = MIN_INTERVAL_SECONDS - (self._monotonic() - self._last_call)
            if wait > 0:
                self._sleep(wait)
        self._last_call = self._monotonic()
        answer = self._client.request_json("GET", BASE_URL, params={
            "term": term,
            "storeInfo.id": self._store,
            "resultsSettings.responseGroup": "medium",
            "resultsSettings.offset": "0",
            "resultsSettings.numberOfResults": str(MAX_MATCHES),
            "callInfo.responseDataFormat": "JSON",
            "callInfo.apiKey": self._api_key,
        })
        return _products(answer)

    # --- the contract ------------------------------------------------------

    def lookup_mpn(self, mpn: str, manufacturer: str | None = None) -> list[PartMatch]:
        wanted = match_key(mpn)
        if not wanted:
            return []
        matches = []
        for product in self._search(f"manuPartNum:{mpn.strip()}"):
            sku, number = str(product.get("sku") or ""), str(product.get("translatedManufacturerPartNumber") or "")
            if sku and number and match_key(number) == wanted:
                matches.append(_match(product, sku, number, self._store))
        return matches

    def get_offers(self, skus: Sequence[str]) -> list[Offer]:
        # Several SKUs go in one ``id`` term, separated by spaces (checked live on 2026-10-14: four SKUs, one call, all four
        # answered, in no fixed order). One answer holds at most ``MAX_MATCHES`` products, which sets the batch size.
        wanted = [sku for sku in dict.fromkeys(skus) if sku and not any(ch.isspace() for ch in sku)]
        offers = []
        for start in range(0, len(wanted), MAX_MATCHES):
            chunk = wanted[start:start + MAX_MATCHES]
            found = {str(p.get("sku") or ""): p for p in self._search("id:" + " ".join(chunk))}
            offers += [_offer(sku, found[sku], self._currency, self._clock(), self._store) for sku in chunk if sku in found]
        return offers

    def get_part_data(self, match: PartMatch) -> PartData:
        product = next((p for p in self._search(f"id:{match.sku}") if str(p.get("sku") or "") == match.sku), None)
        if product is None:
            return PartData(match=match)
        sheets = [d for d in product.get("datasheets") or [] if isinstance(d, dict) and d.get("url")]
        return PartData(
            match=match,
            description=str(product.get("displayName") or ""),
            datasheet_url=str(sheets[0]["url"]) if sheets else "",
        )


def _products(answer: Any) -> list[dict[str, Any]]:
    """The products of an answer, whatever its wrapper is called."""

    if not isinstance(answer, dict):
        raise ProviderError("Farnell answered with something other than an object")
    holders = [answer] + [value for value in answer.values() if isinstance(value, dict)]
    for holder in holders:
        products = holder.get("products")
        if isinstance(products, list):
            return [p for p in products if isinstance(p, dict)]
    return []


def page_url(store: str, sku: str, product: Mapping[str, Any]) -> str:
    """The product page: the address the service gives when it gives one, else the store's search for the SKU."""

    given = str(product.get("productURL") or "").strip()
    if given.lower().startswith("https://"):
        return given
    return f"https://{store}/search?st={quote(sku, safe='')}" if store else ""


def _match(product: Mapping[str, Any], sku: str, number: str, store: str = "") -> PartMatch:
    return PartMatch(
        provider=KEY,
        sku=sku,
        mpn=number,
        manufacturer=str(product.get("brandName") or ""),
        description=str(product.get("displayName") or ""),
        product_url=page_url(store, sku, product),
        datasheet_url=next((str(d["url"]) for d in product.get("datasheets") or [] if isinstance(d, dict) and d.get("url")), ""),
    )


def _price_breaks(product: Mapping[str, Any]) -> tuple[PriceBreak, ...]:
    tiers: dict[int, Decimal] = {}
    for band in product.get("prices") or []:
        if not isinstance(band, dict):
            continue
        quantity, cost = parse_count(band.get("from")), parse_decimal(band.get("cost"))
        if quantity and cost is not None and cost >= 0:
            tiers.setdefault(quantity, cost)
    return tuple(PriceBreak(quantity, tiers[quantity]) for quantity in sorted(tiers))


def _rohs(code: object) -> bool | None:
    value = str(code or "").strip().upper()
    # "Y-EX" was seen live: compliant by an exemption.
    if value in ("YES", "Y", "Y-EX"):
        return True
    if value in ("NO", "N"):
        return False
    if value:
        note(KEY, "RoHS code", value)
    return None


def _offer(sku: str, product: Mapping[str, Any], currency: str, now: datetime, store: str = "") -> Offer:
    stock_info = product.get("stock") if isinstance(product.get("stock"), dict) else {}
    stock = parse_count(stock_info.get("level")) or 0
    status = str(product.get("productStatus") or "").strip().upper()
    if status and status not in _STATUS_KNOWN:
        note(KEY, "product status", status)
    release = parse_count(product.get("releaseStatusCode"))
    ended = status == _STATUS_ENDED or stock_info.get("status") == _STOCK_STATUS_ENDED
    breaks = _price_breaks(product) if currency else ()
    moq = max(parse_count(product.get("translatedMinimumOrderQuality")) or 1, 1)
    lead = parse_count(stock_info.get("leastLeadTime"))
    return Offer(
        provider=KEY,
        sku=sku,
        mpn=str(product.get("translatedManufacturerPartNumber") or sku),
        manufacturer=str(product.get("brandName") or ""),
        stock=stock,
        fetched_at=now,
        moq=moq,
        # packSize is read as the multiple an order must come in: a pack is the smallest thing sold.
        order_multiple=max(parse_count(product.get("packSize")) or 1, 1),
        price_breaks=breaks,
        currency=currency if breaks else "",
        lead_time_days=lead if lead is not None and stock < moq else None,
        lifecycle=Lifecycle.OBSOLETE if ended else Lifecycle.UNKNOWN,
        discontinued=status in _STATUS_DROPPED or release in _RELEASE_DROPPING,
        rohs=_rohs(product.get("rohsStatusCode")),
        product_url=page_url(store, sku, product),
        datasheet_url=next((str(d["url"]) for d in product.get("datasheets") or [] if isinstance(d, dict) and d.get("url")), ""),
    )


SPEC = ProviderSpec(
    key=KEY,
    label="Farnell / Newark / element14",
    capabilities=frozenset({CAP_SEARCH, CAP_OFFERS, CAP_LIFECYCLE}),
    max_batch=MAX_MATCHES,
    stock_pooling="separate",
    credential_fields=(CredentialField("api_key", "API key"),),
    factory=lambda config: FarnellProvider(config),
    storefronts=STOREFRONTS,
    default_daily_budget=1000,
)
