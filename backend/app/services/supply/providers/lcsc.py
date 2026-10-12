"""LCSC Electronics: the product page's own data service. No key, no account.

LCSC publishes no API. This reads ``GET https://wmsc.lcsc.com/ftps/wm/product/detail?productCode=C2040``,
the call its product pages make, as Ki-nTree does. It can change without notice. It was checked live: the
answers below are recorded from it.

* Only a SKU can be asked for (an LCSC part number, ``C`` and digits). The keyword search the site uses
  answers 403 to anything but a browser, so there is no search by manufacturer number: ``lookup_mpn`` accepts
  an LCSC number and returns that part, and anything else finds nothing. A part is tracked once its LCSC
  number is given, through Fill from distributor or an import.
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
PAGE_URL = "https://www.lcsc.com/product-detail/{}.html"
ALLOWED_HOSTS = ("wmsc.lcsc.com",)
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

    def _detail(self, sku: str) -> dict[str, Any] | None:
        if self._last_call is not None:
            wait = MIN_INTERVAL_SECONDS - (self._monotonic() - self._last_call)
            if wait > 0:
                self._sleep(wait)
        self._last_call = self._monotonic()
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
        if not _SKU.match(sku):
            return []
        product = self._detail(sku)
        return [_match(sku, product)] if product else []

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
