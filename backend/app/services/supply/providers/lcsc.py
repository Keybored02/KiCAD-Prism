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

from app.services.supply.http_client import SafeHttpClient
from app.services.supply.identity import match_key
from app.services.supply.models import Offer, PartData, PartMatch, PriceBreak
from app.services.supply.providers.base import (
    CAP_OFFERS,
    CAP_SEARCH,
    ProviderConfig,
    ProviderError,
    ProviderSpec,
)
from app.services.supply.providers.text_values import parse_count, parse_decimal
from app.services.supply.providers.unrecognised import note
from app.services.supply.vocabulary import Lifecycle

KEY = "lcsc"
DETAIL_URL = "https://wmsc.lcsc.com/ftps/wm/product/detail"
SEARCH_URL = "https://easyeda.com/api/eda/product/search"
PAGE_URL = "https://www.lcsc.com/product-detail/{}.html"
ALLOWED_HOSTS = ("wmsc.lcsc.com", "easyeda.com")
SEARCH_PAGE_SIZE = 20
MIN_INTERVAL_SECONDS = 1.0
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
        self._last_call: float | None = None

    def _pace(self) -> None:
        if self._last_call is not None:
            wait = MIN_INTERVAL_SECONDS - (self._monotonic() - self._last_call)
            if wait > 0:
                self._sleep(wait)
        self._last_call = self._monotonic()

    def _search(self, keyword: str) -> list[dict[str, Any]]:
        self._pace()
        answer = self._client.request_json(
            "GET", SEARCH_URL, params={"keyword": keyword, "currentPage": 1, "pageSize": SEARCH_PAGE_SIZE},
        )
        if not isinstance(answer, dict) or answer.get("code") not in (0, 200):
            raise ProviderError("EasyEDA did not answer the part search")
        found = (answer.get("result") or {}).get("productList") or []
        return [item for item in found if isinstance(item, dict) and _SKU.match(str(item.get("number") or "").upper())]

    def _detail(self, sku: str) -> dict[str, Any] | None:
        self._pace()
        answer = self._client.request_json("GET", DETAIL_URL, params={"productCode": sku})
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
        # The search is loose ("TSR 1-2450" brings TSRN, TSN and M39003 parts), so only the same number is kept.
        return [_search_match(item) for item in self._search(mpn.strip()) if match_key(str(item.get("mpn") or "")) == wanted]

    def get_offers(self, skus: Sequence[str]) -> list[Offer]:
        offers = []
        for sku in skus:
            product = self._detail(sku.strip().upper())
            if product:
                offers.append(_offer(product, self._clock()))
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


def _price_breaks(product: Mapping[str, Any]) -> tuple[PriceBreak, ...]:
    tiers: dict[int, Decimal] = {}
    for band in product.get("productPriceList") or []:
        if not isinstance(band, dict):
            continue
        quantity = parse_count(band.get("ladder"))
        price = parse_decimal(band.get("usdPrice") if band.get("usdPrice") is not None else band.get("productPrice"))
        if quantity and price is not None and price >= 0:
            tiers.setdefault(quantity, price)
    return tuple(PriceBreak(quantity, tiers[quantity]) for quantity in sorted(tiers))


def _offer(product: Mapping[str, Any], now: datetime) -> Offer:
    sku = str(product["productCode"]).upper()
    cycle = str(product.get("productCycle") or "").strip().lower()
    if cycle and cycle not in _CYCLE_KNOWN and cycle != _CYCLE_DROPPED:
        note(KEY, "product cycle", cycle)
    breaks = _price_breaks(product)
    rohs = product.get("isRohsCert")
    return Offer(
        provider=KEY,
        sku=sku,
        mpn=str(product.get("productModel") or sku),
        manufacturer=str(product.get("brandNameEn") or ""),
        stock=max(parse_count(product.get("stockNumber")) or 0, 0),
        fetched_at=now,
        moq=max(parse_count(product.get("minBuyNumber")) or 1, 1),
        order_multiple=max(parse_count(product.get("split")) or 1, 1),
        price_breaks=breaks,
        currency=CURRENCY if breaks else "",
        lifecycle=Lifecycle.UNKNOWN,
        discontinued=cycle == _CYCLE_DROPPED,
        rohs=rohs if isinstance(rohs, bool) else None,
        product_url=PAGE_URL.format(sku),
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
