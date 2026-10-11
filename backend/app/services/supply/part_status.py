"""A part's status from what is known about it today.

This is the interim rule, enough to put a dot next to a part. The assessment
pipeline (checks, risk, health) replaces it; callers should only depend on the
status vocabulary, not on these rules.
"""

from __future__ import annotations

from app.services.supply.vocabulary import Lifecycle, Status

# Why a part has no counted stock at all, when it should have.
PROBLEM_NOT_FOUND = "not_found"  # distributors were asked and none carries it
PROBLEM_GONE = "gone"  # it had listings and every one has disappeared

PROBLEM_LABEL = {
    PROBLEM_NOT_FOUND: "No distributor carries this part number",
    PROBLEM_GONE: "Every listing for this part has disappeared",
}

# Most severe first. Used to show one lifecycle for a part with several offers.
_LIFECYCLE_SEVERITY = (
    Lifecycle.OBSOLETE, Lifecycle.LAST_TIME_BUY, Lifecycle.NRND, Lifecycle.ACTIVE, Lifecycle.UNKNOWN,
)

# Most urgent first, for putting the parts that need a look at the top of a list.
STATUS_ORDER = (Status.FATAL, Status.ERROR, Status.WARNING, Status.UNKNOWN, Status.OK)


def worst_lifecycle(lifecycles) -> Lifecycle:
    seen = set(lifecycles)
    for lifecycle in _LIFECYCLE_SEVERITY:
        if lifecycle in seen:
            return lifecycle
    return Lifecycle.UNKNOWN


def part_problem(*, has_counted: bool, has_gone: bool, has_listings: bool, was_searched: bool) -> str | None:
    """Why a part with nothing counted is in trouble, or None if it is merely not read yet."""

    if has_counted:
        return None
    if has_gone:
        return PROBLEM_GONE
    if was_searched and not has_listings:
        return PROBLEM_NOT_FOUND
    return None


def part_status(
    total_stock: int | None,
    threshold: int | None,
    lifecycle: Lifecycle,
    problem: str | None = None,
) -> Status:
    """``total_stock`` is None when nothing counted has been read yet."""

    if total_stock is None:
        return Status.ERROR if problem else Status.UNKNOWN
    if lifecycle is Lifecycle.OBSOLETE:
        return Status.FATAL
    if total_stock == 0:
        return Status.ERROR
    if threshold is not None and total_stock <= threshold:
        return Status.WARNING
    if lifecycle in (Lifecycle.NRND, Lifecycle.LAST_TIME_BUY):
        return Status.WARNING
    return Status.OK
