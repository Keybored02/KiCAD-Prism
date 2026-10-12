"""Provider-neutral records that adapters return.

These are plain frozen values. They validate on construction so a bad adapter
fails loudly at the boundary instead of writing odd rows later. Prices are
``Decimal``; times are timezone-aware UTC.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date, datetime
from decimal import Decimal

from app.services.supply.vocabulary import Lifecycle, Packaging


def _check_utc(value: datetime, name: str) -> None:
    if value.tzinfo is None or value.utcoffset() is None:
        raise ValueError(f"{name} must be timezone-aware")


@dataclass(frozen=True, slots=True)
class PriceBreak:
    quantity: int
    unit_price: Decimal

    def __post_init__(self) -> None:
        if self.quantity < 1:
            raise ValueError("price break quantity must be at least 1")
        if self.unit_price < 0:
            raise ValueError("price must not be negative")


@dataclass(frozen=True, slots=True)
class Incoming:
    """Stock a distributor reports as on order, with a date when it gives one."""

    quantity: int
    expected: date | None = None

    def __post_init__(self) -> None:
        if self.quantity < 1:
            raise ValueError("incoming quantity must be at least 1")


@dataclass(frozen=True, slots=True)
class Offer:
    """One distributor listing at one moment."""

    provider: str
    sku: str
    mpn: str
    manufacturer: str
    stock: int
    fetched_at: datetime
    incoming: tuple[Incoming, ...] = ()
    moq: int = 1
    order_multiple: int = 1
    packaging: Packaging = Packaging.UNKNOWN
    price_breaks: tuple[PriceBreak, ...] = ()
    currency: str = ""
    lead_time_days: int | None = None
    lifecycle: Lifecycle = Lifecycle.UNKNOWN
    discontinued: bool = False
    rohs: bool | None = None
    # True when the distributor says the part is affected by REACH (it may hold a substance of very high concern).
    reach_affected: bool | None = None
    marketplace: bool = False
    product_url: str = ""

    def __post_init__(self) -> None:
        if not self.provider or not self.sku:
            raise ValueError("provider and sku are required")
        if self.stock < 0:
            raise ValueError("stock must not be negative")
        if self.moq < 1 or self.order_multiple < 1:
            raise ValueError("moq and order multiple must be at least 1")
        if self.lead_time_days is not None and self.lead_time_days < 0:
            raise ValueError("lead time must not be negative")
        if self.currency and (len(self.currency) != 3 or not self.currency.isupper()):
            raise ValueError("currency must be a three letter upper case code")
        if self.price_breaks and not self.currency:
            raise ValueError("price breaks need a currency")
        quantities = [brk.quantity for brk in self.price_breaks]
        if quantities != sorted(set(quantities)):
            raise ValueError("price breaks must be unique and ascending by quantity")
        _check_utc(self.fetched_at, "fetched_at")


@dataclass(frozen=True, slots=True)
class PartMatch:
    """A search hit: enough to show a choice and to fetch details for it."""

    provider: str
    sku: str
    mpn: str
    manufacturer: str
    description: str = ""
    product_url: str = ""
    # The manufacturer's datasheet, when the search answer carries one.
    datasheet_url: str = ""

    def __post_init__(self) -> None:
        if not self.provider or not self.sku or not self.mpn:
            raise ValueError("provider, sku and mpn are required")


@dataclass(frozen=True, slots=True)
class PartData:
    """Descriptive data for one part. Parameters keep the provider's own names."""

    match: PartMatch
    description: str = ""
    datasheet_url: str = ""
    package_name: str = ""
    category: str = ""
    parameters: tuple[tuple[str, str], ...] = field(default_factory=tuple)
