"""The one vocabulary every supply surface uses.

Status, lifecycle and packaging values are stored and sent as these strings.
Providers map their own wording into them; nothing downstream sees raw
provider text.
"""

from __future__ import annotations

from enum import StrEnum
from typing import Iterable


class Status(StrEnum):
    """Health of a part, line or BOM. ``UNKNOWN`` means no data, not good."""

    OK = "ok"
    WARNING = "warning"
    ERROR = "error"
    FATAL = "fatal"
    UNKNOWN = "unknown"


class Lifecycle(StrEnum):
    """Manufacturer lifecycle. Distributor discontinuation is not part of it."""

    ACTIVE = "active"
    NRND = "nrnd"
    LAST_TIME_BUY = "last_time_buy"
    OBSOLETE = "obsolete"
    UNKNOWN = "unknown"


# A manufacturer lifecycle that says the part is going: not for new designs, a last date to buy, or gone. As values, so it serves
# Python tests and SQL parameters alike.
ENDING_LIFECYCLES: tuple[str, ...] = (Lifecycle.NRND.value, Lifecycle.LAST_TIME_BUY.value, Lifecycle.OBSOLETE.value)


class Packaging(StrEnum):
    CUT_TAPE = "cut_tape"
    # A reel cut to the quantity asked, with a reeling fee (DigiKey Digi-Reel, Mouser MouseReel).
    CUSTOM_REEL = "custom_reel"
    TAPE_REEL = "tape_reel"
    TRAY = "tray"
    TUBE = "tube"
    BULK = "bulk"
    OTHER = "other"
    # One listing sold as several packagings together (Mouser's usual case).
    SEVERAL = "several"
    UNKNOWN = "unknown"


# Severity order, worst first. UNKNOWN is the absence of a finding, so it only
# wins when nothing else is present.
_STATUS_SEVERITY = {
    Status.FATAL: 4,
    Status.ERROR: 3,
    Status.WARNING: 2,
    Status.OK: 1,
    Status.UNKNOWN: 0,
}


def worst_status(statuses: Iterable[Status]) -> Status:
    """Return the most severe status, or ``UNKNOWN`` for an empty input."""

    worst = Status.UNKNOWN
    for status in statuses:
        if _STATUS_SEVERITY[status] > _STATUS_SEVERITY[worst]:
            worst = status
    return worst
