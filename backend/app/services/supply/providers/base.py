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
# Reads the substances of very high concern a distributor names for a listing (one call per listing).
CAP_SUBSTANCES = "substances"
# Names parts the distributor offers in place of a listing (one call per listing, asked for when it matters).
CAP_SUBSTITUTES = "substitutes"

CAPABILITIES = frozenset({
    CAP_SEARCH, CAP_OFFERS, CAP_PARAMETRICS, CAP_MEDIA,
    CAP_LIFECYCLE, CAP_BATCH, CAP_INCOMING, CAP_PCN, CAP_SUBSTANCES, CAP_SUBSTITUTES,
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


class Blocked(ProviderError):
    """The service answered a web page or a challenge where data was expected: it has taken Prism for a bot.

    Not an error to retry. The connector is held off for hours and an administrator is told.
    """

    code = "blocked"


class Unavailable(ProviderError):
    code = "unavailable"


class NotFound(ProviderError):
    """The service answered 404: it has nothing at that address."""

    code = "not_found"


class EgressBlocked(ProviderError):
    code = "egress_denied"


class HostDenied(EgressBlocked):
    """An administrator put this host on the deny list."""

    code = "host_denied"


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
    # The account the connector belongs to (see ``accounts.py``); connectors of one account share their pacing.
    account: str = ""
    credentials: Mapping[str, str] = field(default_factory=dict, repr=False)


class SupplyProvider(Protocol):
    def lookup_mpn(self, mpn: str, manufacturer: str | None = None) -> list[PartMatch]:
        """Search by manufacturer part number. Empty list when nothing matches.

        ``manufacturer`` is a hint for ranking. Do not use it to exclude results:
        whether a result is the same manufacturer is decided by Prism, which knows
        every spelling a manufacturer has gone by.
        """

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
    # False when a call costs nothing (local data), so no call budget applies.
    metered: bool = True
    # The provider's offers come from a file an administrator uploads, not from calls to the distributor.
    csv_fed: bool = False
    # Calls one get_offers batch makes, so the budget is charged what is really spent.
    calls_per_offers_batch: int = 1
    # One answer serves every listing of a part at this provider (DigiKey: a product lists all its packagings), so
    # the poller reads a part's listings together and asks once per group. The provider reports the calls it made
    # in ``last_batch_calls``.
    groups_by_part: bool = False
    # Manufacturer part numbers one search call can look up (``lookup_mpns``). 1 means one number per call.
    search_batch: int = 1
    # Stock here is only what the provider can place on a board it assembles; it is never sold to anyone else, and a
    # tracked part is read here only when the project (or a person) chooses it.
    assembly_only: bool = False
    # The search answer carries the whole offer (stock, prices), so a search is also a read: the poller's first read is not a second call.
    search_reads_offers: bool = False
    # Calls a day the change-notice API allows, when it has a quota of its own apart from the product API (DigiKey: 50).
    # 0 means notices share the connector's daily budget.
    notice_daily_limit: int = 0

    def __post_init__(self) -> None:
        if not _KEY.match(self.key):
            raise ValueError(f"invalid provider key: {self.key!r}")
        unknown = self.capabilities - CAPABILITIES
        if unknown:
            raise ValueError(f"unknown capabilities: {sorted(unknown)}")
        if self.max_batch < 1:
            raise ValueError("max_batch must be at least 1")
        if self.calls_per_offers_batch < 1:
            raise ValueError("calls_per_offers_batch must be at least 1")
        if self.default_daily_budget < 0:
            raise ValueError("default_daily_budget must not be negative")
        names = [item.name for item in self.credential_fields]
        if len(names) != len(set(names)):
            raise ValueError("duplicate credential field names")

    @property
    def required_credentials(self) -> tuple[str, ...]:
        return tuple(item.name for item in self.credential_fields)
