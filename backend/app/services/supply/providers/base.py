"""The contract between Prism and a distributor adapter.

A ``ProviderSpec`` describes a provider without needing credentials, so the
UI can list providers and build a setup form. ``spec.factory`` turns a
connector's configuration into an object with the three lookup methods.

Adapters never write to the database and never log credentials. They raise
``ProviderError`` subclasses and let the caller decide what to do.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from typing import Callable, Literal, Mapping, Protocol, Sequence

from app.services.supply.models import Offer, PartData, PartMatch

CAP_SEARCH = "search"
CAP_OFFERS = "offers"
CAP_PARAMETRICS = "parametrics"
CAP_MEDIA = "media"
CAP_LIFECYCLE = "lifecycle"
CAP_BATCH = "batch"
CAP_INCOMING = "incoming"
CAP_PCN = "pcn"

CAPABILITIES = frozenset({
    CAP_SEARCH, CAP_OFFERS, CAP_PARAMETRICS, CAP_MEDIA,
    CAP_LIFECYCLE, CAP_BATCH, CAP_INCOMING, CAP_PCN,
})

_KEY = re.compile(r"^[a-z][a-z0-9_]{1,31}$")

StockPooling = Literal["pooled", "separate"]


class ProviderError(Exception):
    """Base class. ``code`` is safe to show; the message may not be."""

    code = "provider_error"


class AuthError(ProviderError):
    code = "auth_failed"


class RateLimited(ProviderError):
    code = "rate_limited"

    def __init__(self, message: str = "", *, retry_after_seconds: int | None = None) -> None:
        super().__init__(message)
        self.retry_after_seconds = retry_after_seconds


class Unavailable(ProviderError):
    code = "unavailable"


class EgressBlocked(ProviderError):
    code = "egress_denied"


class ResponseTooLarge(ProviderError):
    code = "response_too_large"


@dataclass(frozen=True, slots=True)
class CredentialField:
    name: str
    label: str
    secret: bool = True


@dataclass(frozen=True, slots=True)
class ProviderConfig:
    """What an adapter is built from. Credentials stay out of ``repr``."""

    connector_id: str
    storefront: str = ""
    currency: str = ""
    credentials: Mapping[str, str] = field(default_factory=dict, repr=False)


class SupplyProvider(Protocol):
    def lookup_mpn(self, mpn: str, manufacturer: str | None = None) -> list[PartMatch]:
        """Search by manufacturer part number. Empty list when nothing matches."""

    def get_offers(self, skus: Sequence[str]) -> list[Offer]:
        """Current offers for known SKUs. Unknown SKUs are left out, not raised."""

    def get_part_data(self, match: PartMatch) -> PartData:
        """Descriptive data for one match."""


@dataclass(frozen=True, slots=True)
class ProviderSpec:
    key: str
    label: str
    capabilities: frozenset[str]
    max_batch: int
    stock_pooling: StockPooling
    credential_fields: tuple[CredentialField, ...]
    factory: Callable[[ProviderConfig], SupplyProvider]
    storefronts: tuple[str, ...] = ()
    default_daily_budget: int = 1000
    dev_only: bool = False

    def __post_init__(self) -> None:
        if not _KEY.match(self.key):
            raise ValueError(f"invalid provider key: {self.key!r}")
        unknown = self.capabilities - CAPABILITIES
        if unknown:
            raise ValueError(f"unknown capabilities: {sorted(unknown)}")
        if self.max_batch < 1:
            raise ValueError("max_batch must be at least 1")
        if self.default_daily_budget < 0:
            raise ValueError("default_daily_budget must not be negative")
        names = [item.name for item in self.credential_fields]
        if len(names) != len(set(names)):
            raise ValueError("duplicate credential field names")

    @property
    def required_credentials(self) -> tuple[str, ...]:
        return tuple(item.name for item in self.credential_fields)
