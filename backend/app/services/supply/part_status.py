"""A part's status from what is known about it today.

This is the interim rule, enough to put a dot next to a part. The assessment
pipeline (checks, risk, health) replaces it; callers should only depend on the
status vocabulary, not on these rules.
"""

from __future__ import annotations

from app.services.supply.vocabulary import Lifecycle, Status

# Most severe first. Used to show one lifecycle for a part with several offers.
_LIFECYCLE_SEVERITY = (
    Lifecycle.OBSOLETE, Lifecycle.LAST_TIME_BUY, Lifecycle.NRND, Lifecycle.ACTIVE, Lifecycle.UNKNOWN,
)


def worst_lifecycle(lifecycles) -> Lifecycle:
    seen = set(lifecycles)
    for lifecycle in _LIFECYCLE_SEVERITY:
        if lifecycle in seen:
            return lifecycle
    return Lifecycle.UNKNOWN


def part_status(total_stock: int | None, threshold: int | None, lifecycle: Lifecycle) -> Status:
    """``total_stock`` is None when nothing counted has been read yet."""

    if total_stock is None:
        return Status.UNKNOWN
    if lifecycle is Lifecycle.OBSOLETE:
        return Status.FATAL
    if total_stock == 0:
        return Status.ERROR
    if threshold is not None and total_stock <= threshold:
        return Status.WARNING
    if lifecycle in (Lifecycle.NRND, Lifecycle.LAST_TIME_BUY):
        return Status.WARNING
    return Status.OK
