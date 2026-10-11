"""Mouser Search API, version 1.

Written against the Swagger 2.0 description Mouser serves at
api.mouser.com/api/docs/V1 (the page at /api/docs/ui/index renders it).

* ``POST /api/v1/search/partnumber?apiKey=...`` with
  ``{"SearchByPartRequest": {"mouserPartNumber": "A|B", "partSearchOptions": "Exact"}}``.
  Despite its name the field takes Mouser or manufacturer part numbers, up to 10
  separated by ``|``, each 3 to 40 characters. ``Exact`` keeps the answer to the
  numbers asked for, so a search does not flood Review with every suffix.
  One call serves both discovery and polling.
* Errors come back as HTTP 200 with an ``Errors`` list. An error about the API key
  is treated as rejected credentials; any other is a provider error.

The answer is display text: stock as "1,234 In Stock", prices as currency
strings, lead time as "84 Days". ``text_values`` reads them. Prices are in the
currency of the account behind the key; there is no storefront to choose.

Mouser's published limits (30 calls a minute, 1,000 a day) are not in the
description; the default daily budget follows them, and calls from one adapter
are spaced ``MIN_INTERVAL_SECONDS`` apart so a run cannot burst past the minute.
"""

from __future__ import annotations

import time
from datetime import date, datetime, timezone
from decimal import Decimal
from typing import Any, Callable, Mapping, Sequence

from app.services.supply.http_client import SafeHttpClient
from app.services.supply.models import Incoming, Offer, PartData, PartMatch, PriceBreak
from app.services.supply.providers.base import (
    CAP_BATCH,
    CAP_INCOMING,
    CAP_LIFECYCLE,
    CAP_OFFERS,
    CAP_SEARCH,
    AuthError,
    CredentialField,
    ProviderConfig,
    ProviderError,
    ProviderSpec,
)
from app.services.supply.providers.text_values import parse_count, parse_decimal, parse_lead_time_days
from app.services.supply.vocabulary import Lifecycle, Packaging

KEY = "mouser"
SEARCH_URL = "https://api.mouser.com/api/v1/search/partnumber"
ALLOWED_HOSTS = ("api.mouser.com",)
MAX_BATCH = 10
MIN_INTERVAL_SECONDS = 2.0

# Mouser's lifecycle wording, lower case, to the canonical set. Anything else is unknown.
_LIFECYCLE = {
    "new product": Lifecycle.ACTIVE,
    "new at mouser": Lifecycle.ACTIVE,
    "active": Lifecycle.ACTIVE,
    "not recommended for new designs": Lifecycle.NRND,
    "nrnd": Lifecycle.NRND,
    "end of life": Lifecycle.LAST_TIME_BUY,
    "last time buy": Lifecycle.LAST_TIME_BUY,
    "obsolete": Lifecycle.OBSOLETE,
}

_PACKAGING = {
    "cut tape": Packaging.CUT_TAPE,
    "reel": Packaging.TAPE_REEL,
    "full reel": Packaging.TAPE_REEL,
    "mousereel": Packaging.TAPE_REEL,
    "tray": Packaging.TRAY,
    "tube": Packaging.TUBE,
    "bulk": Packaging.BULK,
}


class MouserProvider:
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
        self._client = client or SafeHttpClient(ALLOWED_HOSTS)
        self._clock = clock or (lambda: datetime.now(timezone.utc))
        self._monotonic = monotonic
        self._sleep = sleep
        self._last_call: float | None = None

    def _search(self, numbers: Sequence[str]) -> list[dict[str, Any]]:
        if not self._api_key:
            raise AuthError("Mouser needs an API key")
        if self._last_call is not None:
            wait = MIN_INTERVAL_SECONDS - (self._monotonic() - self._last_call)
            if wait > 0:
                self._sleep(wait)
        self._last_call = self._monotonic()
        answer = self._client.request_json(
            "POST", SEARCH_URL, params={"apiKey": self._api_key},
            json={"SearchByPartRequest": {"mouserPartNumber": "|".join(numbers), "partSearchOptions": "Exact"}},
        )
        if not isinstance(answer, dict):
            raise ProviderError("Mouser answered with something other than an object")
        _raise_for_errors(answer.get("Errors") or [])
        results = answer.get("SearchResults") or {}
        return [part for part in results.get("Parts") or [] if isinstance(part, dict)]

    # --- the contract ------------------------------------------------------

    def lookup_mpn(self, mpn: str, manufacturer: str | None = None) -> list[PartMatch]:
        if not 3 <= len(mpn.strip()) <= 40:
            return []  # outside what the search accepts; nothing to ask
        matches = []
        for part in self._search([mpn.strip()]):
            sku, number = str(part.get("MouserPartNumber") or ""), str(part.get("ManufacturerPartNumber") or "")
            # "N/A" stands for a Mouser number that cannot be ordered.
            if not sku or not number or sku.upper() == "N/A":
                continue
            matches.append(PartMatch(
                provider=KEY, sku=sku, mpn=number,
                manufacturer=str(part.get("Manufacturer") or ""),
                description=str(part.get("Description") or ""),
                product_url=str(part.get("ProductDetailUrl") or ""),
            ))
        return matches

    def get_offers(self, skus: Sequence[str]) -> list[Offer]:
        wanted = {sku.upper(): sku for sku in skus}
        offers: list[Offer] = []
        for start in range(0, len(skus), MAX_BATCH):
            for part in self._search(skus[start:start + MAX_BATCH]):
                sku = wanted.get(str(part.get("MouserPartNumber") or "").upper())
                if sku is not None:
                    offers.append(_offer(sku, part, self._clock()))
        return offers

    def get_part_data(self, match: PartMatch) -> PartData:
        part = next((item for item in self._search([match.sku]) if item.get("MouserPartNumber") == match.sku), None)
        if part is None:
            return PartData(match=match)
        attributes = tuple(
            (str(item.get("AttributeName") or ""), str(item.get("AttributeValue") or ""))
            for item in part.get("ProductAttributes") or []
            if isinstance(item, dict) and item.get("AttributeName")
        )
        return PartData(
            match=match,
            description=str(part.get("Description") or ""),
            datasheet_url=str(part.get("DataSheetUrl") or ""),
            category=str(part.get("Category") or ""),
            parameters=attributes,
        )


def _raise_for_errors(errors: Sequence[Any]) -> None:
    for error in errors:
        if not isinstance(error, dict):
            continue
        about = " ".join(str(error.get(field) or "") for field in ("PropertyName", "Code", "Message")).lower()
        if "api key" in about or "apikey" in about or "unauthorized" in about:
            raise AuthError("Mouser rejected the API key")
        raise ProviderError(f"Mouser reported an error ({str(error.get('Code') or 'unknown')[:40]})")


def _stock(part: Mapping[str, Any]) -> int:
    for field in ("AvailabilityInStock", "Availability"):
        value = parse_count(part.get(field))
        if value is not None:
            return value
    return 0


def _price_breaks(part: Mapping[str, Any]) -> tuple[tuple[PriceBreak, ...], str]:
    tiers: dict[int, Decimal] = {}
    currencies = set()
    for tier in part.get("PriceBreaks") or []:
        if not isinstance(tier, dict):
            continue
        quantity, price = parse_count(tier.get("Quantity")), parse_decimal(tier.get("Price"))
        currency = str(tier.get("Currency") or "").upper()
        if not quantity or price is None or price < 0 or len(currency) != 3:
            continue
        currencies.add(currency)
        tiers.setdefault(quantity, price)
    if len(currencies) != 1:
        return (), ""
    return tuple(PriceBreak(quantity, tiers[quantity]) for quantity in sorted(tiers)), currencies.pop()


def _incoming(part: Mapping[str, Any]) -> tuple[Incoming, ...]:
    found = []
    for item in part.get("AvailabilityOnOrder") or []:
        if not isinstance(item, dict):
            continue
        quantity = parse_count(item.get("Quantity"))
        if not quantity:
            continue
        expected = None
        try:
            expected = date.fromisoformat(str(item.get("Date") or "")[:10])
        except ValueError:
            pass
        found.append(Incoming(quantity, expected))
    return tuple(found)


def _packaging(part: Mapping[str, Any]) -> Packaging:
    values = {
        _PACKAGING.get(str(item.get("AttributeValue") or "").strip().lower(), Packaging.OTHER)
        for item in part.get("ProductAttributes") or []
        if isinstance(item, dict) and str(item.get("AttributeName") or "").strip().lower() == "packaging"
    }
    # One Mouser number often covers cut tape and reel together; then there is no single packaging.
    return values.pop() if len(values) == 1 else Packaging.UNKNOWN


def _rohs(text: object) -> bool | None:
    value = str(text or "").lower()
    if not value:
        return None
    if "non" in value or "not compliant" in value:
        return False
    return True if "compliant" in value else None


def _offer(sku: str, part: Mapping[str, Any], now: datetime) -> Offer:
    breaks, currency = _price_breaks(part)
    return Offer(
        provider=KEY,
        sku=sku,
        mpn=str(part.get("ManufacturerPartNumber") or sku),
        manufacturer=str(part.get("Manufacturer") or ""),
        stock=_stock(part),
        fetched_at=now,
        incoming=_incoming(part),
        moq=max(parse_count(part.get("Min")) or 1, 1),
        order_multiple=max(parse_count(part.get("Mult")) or 1, 1),
        packaging=_packaging(part),
        price_breaks=breaks,
        currency=currency,
        lead_time_days=parse_lead_time_days(part.get("LeadTime")),
        lifecycle=_LIFECYCLE.get(str(part.get("LifecycleStatus") or "").strip().lower(), Lifecycle.UNKNOWN),
        discontinued=str(part.get("IsDiscontinued") or "").strip().lower() == "true",
        rohs=_rohs(part.get("ROHSStatus")),
        product_url=str(part.get("ProductDetailUrl") or ""),
    )


SPEC = ProviderSpec(
    key=KEY,
    label="Mouser",
    capabilities=frozenset({CAP_SEARCH, CAP_OFFERS, CAP_BATCH, CAP_LIFECYCLE, CAP_INCOMING}),
    max_batch=MAX_BATCH,
    stock_pooling="separate",
    credential_fields=(CredentialField("api_key", "Search API key"),),
    factory=lambda config: MouserProvider(config),
    default_daily_budget=1000,
)
