"""LCSC Electronics: the product page's own data service. No key, no account.

LCSC publishes no API. This reads ``GET https://wmsc.lcsc.com/ftps/wm/product/detail?productCode=C2040``,
the call its product pages make, as Ki-nTree does. It can change without notice. It was checked live: the
answers below are recorded from it.

* An LCSC number (``C`` and digits) is read directly. A manufacturer number is searched with
  ``GET https://easyeda.com/api/eda/product/search?keyword=LM358DR``, the part search of EasyEDA (LCSC's own
  design tool), which answers ``productList`` items with ``number`` (the LCSC number), ``mpn`` and
  ``manufacturer``. The search is loose (``TSR 1-2450`` brings back 17 other parts), so only answers with the same
  part number, compared as ``match_key`` does, are returned.
  LCSC's own keyword search answers 403 to anything but a browser, and ``wwwapi.lcsc.com`` no longer exists.
* ``{"code": 200, "result": null}`` is an unknown code.
* ``stockNumber`` is the stock. ``productPriceList`` holds ``ladder`` (the quantity) and ``usdPrice``; prices
  are US dollars whatever the visitor's region. ``minBuyNumber`` is the minimum order and ``split`` the
  multiple an order comes in.
* ``productCycle`` is ``normal``, ``sold_out`` or ``stop_product`` in everything seen. ``stop_product`` is LCSC
  dropping the part, so it is marked discontinued; it says nothing about the manufacturer, so the lifecycle
  stays unknown. Any other value is logged once and read as having no effect.
* No limit is published. One call a second and 2,000 a day are used.
"""

from __future__ import annotations

import re
import time
from datetime import datetime, timezone
from decimal import Decimal
from typing import Any, Callable, Mapping, Sequence

from app.services.supply import pacing
from app.services.supply.http_client import SafeHttpClient
from app.services.supply.identity import keep_family, match_key
from app.services.supply.models import Alternate, Offer, PartData, PartMatch, PriceBreak
from app.services.supply.providers import packaging_hints
from app.services.supply.providers.base import (
    CAP_OFFERS,
    CAP_SEARCH,
    AuthError,
    Blocked,
    ProviderConfig,
    ProviderError,
    ProviderSpec,
)
from app.services.supply.providers.text_values import parse_count, parse_decimal
from app.services.supply.providers.unrecognised import note
from app.services.supply.vocabulary import Lifecycle, Packaging

KEY = "lcsc"
DETAIL_URL = "https://wmsc.lcsc.com/ftps/wm/product/detail"
SEARCH_URL = "https://easyeda.com/api/eda/product/search"
PAGE_URL = "https://www.lcsc.com/product-detail/{}.html"
ALLOWED_HOSTS = ("wmsc.lcsc.com", "easyeda.com")
SEARCH_PAGE_SIZE = 20
# No limit is known for this service: an assumed, polite pace, drawn at random from 0.75 to 1.5 times this (see pacing.py). Change it when a limit is learned.
PACE_SECONDS = 1.5
CURRENCY = "USD"

_SKU = re.compile(r"^C\d{1,12}$")
_CYCLE_KNOWN = frozenset({"normal", "sold_out"})
_CYCLE_DROPPED = "stop_product"


class LcscProvider:
    def __init__(
        self,
        config: ProviderConfig,
        *,
        client: SafeHttpClient | None = None,
        clock: Callable[[], datetime] | None = None,
        monotonic: Callable[[], float] = time.monotonic,
        sleep: Callable[[float], None] = time.sleep,
    ) -> None:
        self._client = client or SafeHttpClient(ALLOWED_HOSTS)
        self._clock = clock or (lambda: datetime.now(timezone.utc))
        self._monotonic = monotonic
        self._sleep = sleep
        self._pacer = pacing.pacer_for(config.account, PACE_SECONDS, monotonic=monotonic, sleep=sleep)
        # LCSC shows prices in the currency of a cookie. Asking for the connector's currency gets LCSC's own price in it, the
        # one an order is charged; without it, or when LCSC answers in another, the dollar price is used and converted by Prism.
        wanted = (config.currency or "").strip().upper()
        self._currency = wanted if len(wanted) == 3 and wanted.isalpha() and wanted != CURRENCY else ""

    def _pace(self) -> None:
        self._pacer.wait()

    def _search(self, keyword: str) -> list[dict[str, Any]]:
        self._pace()
        try:
            answer = self._client.request_json(
                "GET", SEARCH_URL, params={"keyword": keyword, "currentPage": 1, "pageSize": SEARCH_PAGE_SIZE},
            )
        except AuthError as exc:
            raise Blocked("EasyEDA refused the request") from exc
        if not isinstance(answer, dict) or answer.get("code") not in (0, 200):
            raise ProviderError("EasyEDA did not answer the part search")
        found = (answer.get("result") or {}).get("productList") or []
        return [item for item in found if isinstance(item, dict) and _SKU.match(str(item.get("number") or "").upper())]

    def _detail(self, sku: str) -> dict[str, Any] | None:
        self._pace()
        try:
            answer = self._client.request_json(
                "GET", DETAIL_URL, params={"productCode": sku},
                **({"headers": {"Cookie": f"currencyCode={self._currency}"}} if self._currency else {}),
            )
        except AuthError as exc:
            # The service takes no key, so a refusal is its bot filter, not a rejected credential.
            raise Blocked("LCSC refused the request") from exc
        if not isinstance(answer, dict):
            raise ProviderError("LCSC answered with something other than an object")
        result = answer.get("result")
        if answer.get("code") != 200:
            raise ProviderError("LCSC did not answer the request")
        return result if isinstance(result, dict) and str(result.get("productCode") or "").upper() == sku else None

    # --- the contract ------------------------------------------------------

    def lookup_mpn(self, mpn: str, manufacturer: str | None = None) -> list[PartMatch]:
        sku = mpn.strip().upper()
        if _SKU.match(sku):
            product = self._detail(sku)
            return [_match(sku, product)] if product else []
        wanted = match_key(mpn)
        if not wanted:
            return []
        # The search is loose ("TSR 1-2450" brings TSRN, TSN and M39003 parts), so only the same number and its longer forms are kept.
        return [_search_match(item) for item in keep_family(self._search(mpn.strip()), wanted, lambda item: str(item.get("mpn") or ""))]

    def get_offers(self, skus: Sequence[str]) -> list[Offer]:
        offers = []
        for sku in skus:
            product = self._detail(sku.strip().upper())
            if product:
                offers.append(_offer(product, self._clock(), self._currency))
        return offers

    def get_part_data(self, match: PartMatch) -> PartData:
        product = self._detail(match.sku)
        if not product:
            return PartData(match=match)
        return PartData(
            match=match,
            description=_description(product),
            datasheet_url=str(product.get("pdfUrl") or ""),
        )


def _description(product: Mapping[str, Any]) -> str:
    return str(product.get("productIntroEn") or product.get("productDescEn") or product.get("productNameEn") or "")


def _match(sku: str, product: Mapping[str, Any]) -> PartMatch:
    return PartMatch(
        provider=KEY,
        sku=sku,
        mpn=str(product.get("productModel") or sku),
        manufacturer=str(product.get("brandNameEn") or ""),
        description=_description(product),
        product_url=PAGE_URL.format(sku),
        datasheet_url=str(product.get("pdfUrl") or ""),
        parameters=tuple(
            (str(item.get("paramNameEn") or ""), str(item.get("paramValueEn") or ""))
            for item in product.get("paramVOList") or []
            if isinstance(item, dict) and item.get("paramNameEn")
        ),
    )


def _search_match(item: Mapping[str, Any]) -> PartMatch:
    sku = str(item["number"]).upper()
    return PartMatch(
        provider=KEY,
        sku=sku,
        mpn=str(item.get("mpn") or sku),
        manufacturer=str(item.get("manufacturer") or ""),
        description=str(item.get("package") or ""),
        product_url=PAGE_URL.format(sku),
    )


def _price_breaks(product: Mapping[str, Any], asked: str = "") -> tuple[tuple[PriceBreak, ...], str]:
    """The price bands and their currency. In ``asked`` when LCSC says it answered in that currency (``currencyPrice``), else in
    dollars: ``usdPrice`` is always dollars, and ``productPrice`` is taken as dollars only when the answer names USD."""

    in_asked = bool(asked) and str(product.get("currencyType") or "").strip().upper() == asked
    tiers: dict[int, Decimal] = {}
    for band in product.get("productPriceList") or []:
        if not isinstance(band, dict):
            continue
        quantity = parse_count(band.get("ladder"))
        if in_asked:
            price = parse_decimal(band.get("currencyPrice"))
        elif band.get("usdPrice") is not None:
            price = parse_decimal(band.get("usdPrice"))
        else:
            named = str(band.get("currencyType") or product.get("currencyType") or "").strip().upper()
            price = parse_decimal(band.get("productPrice")) if named == CURRENCY else None
        if quantity and price is not None and price >= 0:
            tiers.setdefault(quantity, price)
    if in_asked and not tiers:
        return _price_breaks(product)
    return tuple(PriceBreak(quantity, tiers[quantity]) for quantity in sorted(tiers)), (asked if in_asked else CURRENCY)


def _alternates(product: Mapping[str, Any]) -> tuple[Alternate, ...]:
    """Parts LCSC lists as alternates of this one. LCSC does not say how close they are; the package is the only note."""

    found = []
    for item in product.get("alternatePartList") or []:
        if not isinstance(item, dict) or not str(item.get("productModel") or "").strip():
            continue
        found.append(Alternate(
            manufacturer=str(item.get("brandNameEn") or "").strip(), mpn=str(item["productModel"]).strip(),
            sku=str(item.get("productCode") or "").strip().upper(), note=str(item.get("encapStandard") or "").strip(),
        ))
    return tuple(found)


def _offer(product: Mapping[str, Any], now: datetime, asked: str = "") -> Offer:
    sku = str(product["productCode"]).upper()
    cycle = str(product.get("productCycle") or "").strip().lower()
    if cycle and cycle not in _CYCLE_KNOWN and cycle != _CYCLE_DROPPED:
        note(KEY, "product cycle", cycle)
    breaks, currency = _price_breaks(product, asked)
    rohs = product.get("isRohsCert")
    packaging = packaging_hints.from_text(product.get("productArrange"))
    moq = max(parse_count(product.get("minBuyNumber")) or 1, 1)
    # "Tape & Reel" is how the maker packs it; what LCSC sells is told by where its price breaks start.
    packaging, reel, inferred = packaging_hints.sold_as(
        packaging, parse_count(product.get("minPacketNumber")) if packaging is Packaging.TAPE_REEL else None, breaks[0].quantity if breaks else moq,
    )
    return Offer(
        provider=KEY,
        sku=sku,
        mpn=str(product.get("productModel") or sku),
        manufacturer=str(product.get("brandNameEn") or ""),
        stock=max(parse_count(product.get("stockNumber")) or 0, 0),
        fetched_at=now,
        moq=moq,
        order_multiple=max(parse_count(product.get("split")) or 1, 1),
        packaging=packaging,
        packaging_inferred=inferred,
        # minPacketNumber is the pieces in a packet; for a reel it is the reel.
        reel_size=reel,
        price_breaks=breaks,
        currency=currency if breaks else "",
        lifecycle=Lifecycle.UNKNOWN,
        discontinued=cycle == _CYCLE_DROPPED,
        rohs=rohs if isinstance(rohs, bool) else None,
        product_url=PAGE_URL.format(sku),
        datasheet_url=str(product.get("pdfUrl") or ""),
        alternates=_alternates(product),
    )


SPEC = ProviderSpec(
    key=KEY,
    label="LCSC",
    capabilities=frozenset({CAP_SEARCH, CAP_OFFERS}),
    max_batch=1,
    stock_pooling="separate",
    credential_fields=(),
    factory=lambda config: LcscProvider(config),
    default_daily_budget=2000,
)
