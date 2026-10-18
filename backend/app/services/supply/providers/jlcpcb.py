"""JLCPCB (assembly): the parts search JLCPCB's own parts page uses. No key, no account.

JLCPCB publishes a components API, but only to approved applicants. This reads the call its public parts page makes,
``POST https://jlcpcb.com/api/overseas-pcb-order/v1/shoppingCart/smtGood/selectSmtComponentList`` with
``{"keyword", "currentPage", "pageSize"}``. It is unpublished and can change without notice, like LCSC's. It was
probed on 2026-10-15; the answers under ``tests/fixtures/supply/jlcpcb_live_*.json`` keep the shape that probe
showed (see ``_source`` in each file for how they were made).

* The search is fuzzy and ordered by relevance, one part per call: a manufacturer number brings clones of other makers
  first, and consignment entries ("JLCPCB Assembly", brand and part number of a customer's own stock). Only items with
  the same part number, compared as ``match_key`` does, are returned, and consignment entries are left out.
* An item has ``componentCode`` (the C-number, shared with LCSC), ``componentModelEn``, ``componentBrandEn``,
  ``stockCount``, ``componentLibraryType`` (``base`` for Basic, ``expand`` for Extended), ``preferredComponentFlag``,
  ``componentPrices`` (``startNumber`` and ``productPrice``), ``minPurchaseNum``, ``dataManualUrl`` and ``urlSuffix``.
* The stock is JLCPCB's assembly stock. It is not sold to anyone, so every offer is marked as marketplace stock: shown
  on its own line, never added to a part's total, its status or the checks. Basic, Extended and Preferred are facts.
* Prices are US dollars on the site.
* No limit is published, and the service sits behind a bot filter that answers 403 now and then. It is asked at the
  same pace as LCSC (a call about every 1.5 seconds, 300 a day), and a refusal is a block, not a bad key: the connector
  rests for hours instead of retrying.
"""

from __future__ import annotations

import time
from datetime import datetime, timezone
from decimal import Decimal
from typing import Any, Callable, Mapping, Sequence

from app.services.supply import pacing
from app.services.supply.http_client import SafeHttpClient
from app.services.supply.identity import keep_family, match_key
from app.services.supply.models import Offer, PartData, PartMatch, PriceBreak
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
from app.services.supply.vocabulary import Lifecycle

KEY = "jlcpcb"
SEARCH_URL = "https://jlcpcb.com/api/overseas-pcb-order/v1/shoppingCart/smtGood/selectSmtComponentList"
PAGE_URL = "https://jlcpcb.com/partdetail/{}"
ALLOWED_HOSTS = ("jlcpcb.com",)
PAGE_SIZE = 10
# The same pace as LCSC, with no published limit either: the pacer draws each gap between 0.75 and 1.5 times this (see pacing.py).
PACE_SECONDS = 1.5
CURRENCY = "USD"
DEFAULT_DAILY_BUDGET = 300
LIBRARY = {"base": "Basic", "expand": "Extended"}


class JlcpcbProvider:
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
        self._pacer = pacing.pacer_for(config.account, PACE_SECONDS, monotonic=monotonic, sleep=sleep)

    def _search(self, keyword: str) -> list[dict[str, Any]]:
        self._pacer.wait()
        try:
            answer = self._client.request_json("POST", SEARCH_URL, json={"keyword": keyword, "currentPage": 1, "pageSize": PAGE_SIZE})
        except AuthError as exc:
            # The service takes no key, so a refusal is its bot filter, not a rejected credential.
            raise Blocked("JLCPCB refused the request") from exc
        if not isinstance(answer, dict) or answer.get("code") != 200:
            raise ProviderError("JLCPCB did not answer the part search")
        page = (answer.get("data") or {}).get("componentPageInfo") or {}
        return [item for item in page.get("list") or [] if isinstance(item, dict) and item.get("componentCode")]

    # --- the contract ------------------------------------------------------

    def lookup_mpn(self, mpn: str, manufacturer: str | None = None) -> list[PartMatch]:
        wanted = match_key(mpn)
        if not wanted:
            return []
        found = [item for item in self._search(mpn.strip()) if not _consignment(item)]
        return [_match(item) for item in keep_family(found, wanted, lambda item: str(item.get("componentModelEn") or ""))]

    def get_offers(self, skus: Sequence[str]) -> list[Offer]:
        offers = []
        for sku in skus:
            code = sku.strip().upper()
            item = next((found for found in self._search(code) if str(found.get("componentCode")).upper() == code), None)
            if item is not None:
                offers.append(_offer(item, self._clock()))
        return offers

    def get_part_data(self, match: PartMatch) -> PartData:
        return PartData(match=match)


def _consignment(item: Mapping[str, Any]) -> bool:
    """A customer's own stock held by JLCPCB, which anyone may list: it says nothing about the part."""

    return "jlcpcb assembly" in str(item.get("componentBrandEn") or "").lower()


def _url(item: Mapping[str, Any]) -> str:
    suffix = str(item.get("urlSuffix") or "").strip().strip("/")
    return PAGE_URL.format(suffix) if suffix else PAGE_URL.format(str(item["componentCode"]).upper())


def _match(item: Mapping[str, Any]) -> PartMatch:
    sku = str(item["componentCode"]).upper()
    return PartMatch(
        provider=KEY,
        sku=sku,
        mpn=str(item.get("componentModelEn") or sku),
        manufacturer=str(item.get("componentBrandEn") or ""),
        description=str(item.get("describe") or item.get("componentTypeEn") or ""),
        product_url=_url(item),
        datasheet_url=str(item.get("dataManualUrl") or ""),
    )


def _price_breaks(item: Mapping[str, Any]) -> tuple[PriceBreak, ...]:
    tiers: dict[int, Decimal] = {}
    for band in item.get("componentPrices") or []:
        if not isinstance(band, dict):
            continue
        quantity = parse_count(band.get("startNumber"))
        price = parse_decimal(band.get("productPrice"))
        if quantity and price is not None and price >= 0:
            tiers.setdefault(quantity, price)
    return tuple(PriceBreak(quantity, tiers[quantity]) for quantity in sorted(tiers))


def _offer(item: Mapping[str, Any], now: datetime) -> Offer:
    sku = str(item["componentCode"]).upper()
    breaks = _price_breaks(item)
    library = LIBRARY.get(str(item.get("componentLibraryType") or "").lower(), "")
    facts = []
    if library:
        facts.append(("jlc_library", library))
    if item.get("preferredComponentFlag") is True:
        facts.append(("jlc_preferred", "Preferred"))
    return Offer(
        provider=KEY,
        sku=sku,
        mpn=str(item.get("componentModelEn") or sku),
        manufacturer=str(item.get("componentBrandEn") or ""),
        stock=max(parse_count(item.get("stockCount")) or 0, 0),
        fetched_at=now,
        moq=max(parse_count(item.get("minPurchaseNum")) or 1, 1),
        price_breaks=breaks,
        currency=CURRENCY if breaks else "",
        lifecycle=Lifecycle.UNKNOWN,
        # JLCPCB's stock is for its own assembly, never for sale: it is kept apart from every total and check.
        rohs=True if item.get("rohsFlag") in (1, True) else None,
        marketplace=True,
        product_url=_url(item),
        datasheet_url=str(item.get("dataManualUrl") or ""),
        facts=tuple(facts),
    )


SPEC = ProviderSpec(
    key=KEY,
    label="JLCPCB (assembly)",
    capabilities=frozenset({CAP_SEARCH, CAP_OFFERS}),
    max_batch=1,
    stock_pooling="separate",
    credential_fields=(),
    factory=lambda config: JlcpcbProvider(config),
    default_daily_budget=DEFAULT_DAILY_BUDGET,
    assembly_only=True,
)
