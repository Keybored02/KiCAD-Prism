"""Findings: what is wrong with a part, from facts alone.

Pure functions. ``Facts`` is everything the checks look at; the service builds it from the
database and nothing here reads one. The checks that need data Prism does not hold yet (REACH,
parameter mismatch, package, target price, approved sources per component) are not here; they arrive with
the data, under the ids the plan reserves.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import Any, Mapping, Sequence

from app.services.supply.assessment import settings as ids
from app.services.supply.assessment.settings import AssessmentSettings
from app.services.supply.vocabulary import Lifecycle, Status


@dataclass(frozen=True, slots=True)
class Facts:
    """One part as the checks see it."""

    lifecycle: Lifecycle
    # Counted offers (exact and manual listings), with their stock, flags and ages.
    offers: Sequence[Mapping[str, Any]]
    now: datetime
    # Set when nothing counted exists although it should: the part cannot be found.
    problem: str | None = None
    # Units needed, for the parts that sit on a BOM. None when there is no demand to compare with.
    need: int | None = None
    # Distributors Prism reads. A part held by one of several is a single source; with only one there is no choice.
    distributors: int | None = None
    # Names of substances declared for the part that are on the ECHA Candidate List.
    svhc_listed: Sequence[str] = ()


@dataclass(frozen=True, slots=True)
class Finding:
    check: str
    severity: Status
    # What it says, in one plain sentence.
    text: str
    # Names the condition. A waiver holds only while the same condition does.
    scope: str
    # Set by waivers.apply.
    waiver: Mapping[str, Any] | None = field(default=None, compare=False)


def stock_of(offers: Sequence[Mapping[str, Any]]) -> int | None:
    """Units on hand across counted, non-marketplace offers; None when none was read."""

    usable = [o for o in offers if not o["marketplace"]]
    return sum(o["stock"] for o in usable) if usable else None


def lead_time_of(offers: Sequence[Mapping[str, Any]]) -> int | None:
    """The shortest lead time given by an offer that is not marketplace stock."""

    times = [o["lead_time_days"] for o in offers if o["lead_time_days"] is not None and not o["marketplace"]]
    return min(times) if times else None


def evaluate(facts: Facts, settings: AssessmentSettings) -> list[Finding]:
    found: list[Finding] = []

    def add(check: str, text: str, scope: str) -> None:
        found.append(Finding(check, settings.severity_of(check), text, scope))

    if facts.problem:
        add(ids.PART_NOT_FOUND, "No distributor carries this part number.", "not_found")
    if facts.lifecycle is Lifecycle.OBSOLETE:
        add(ids.OBSOLETE, "The manufacturer lists this part as obsolete.", "obsolete")
    elif facts.lifecycle is Lifecycle.LAST_TIME_BUY:
        add(ids.LAST_TIME_BUY, "The manufacturer has announced a last time buy.", "last_time_buy")
    elif facts.lifecycle is Lifecycle.NRND:
        add(ids.NRND, "The manufacturer does not recommend this part for new designs.", "nrnd")

    offers = list(facts.offers)
    if not offers:
        return found
    stock = stock_of(offers) or 0
    if offers and all(o["discontinued"] for o in offers):
        add(ids.DISTRIBUTOR_DISCONTINUED, "Every distributor that lists this part has stopped selling it.", "dropped")
    if stock == 0:
        add(ids.NO_DISTRIBUTOR_STOCK, "No distributor has this part in stock.", "no_stock")
    elif facts.need is not None and stock < facts.need:
        add(ids.INSUFFICIENT_STOCK, f"Distributors hold {stock:,} and the build needs {facts.need:,}.", "short")
    holders = {o["connector_id"] for o in offers if o["stock"] > 0 and not o["marketplace"]}
    if len(holders) == 1 and (facts.distributors or 0) > 1:
        add(ids.SINGLE_SOURCE, "Only one distributor has this part in stock.", "single_source")
    lead = lead_time_of(offers)
    if lead is not None and lead > settings.lead_time_days:
        add(ids.LEAD_TIME_OVER_THRESHOLD, f"Lead time is {lead} days, over the {settings.lead_time_days} you accept.", "slow")
    known = [o["rohs"] for o in offers if o.get("rohs") is not None]
    if known and not any(known):
        add(ids.ROHS_NONCOMPLIANT, "Distributors list this part as not RoHS compliant.", "rohs_false")
    if facts.svhc_listed:
        add(ids.REACH_SVHC, f"A declared substance is on the REACH Candidate List: {', '.join(facts.svhc_listed)}.", "svhc_declared")
    elif any(o.get("reach_affected") for o in offers):
        add(ids.REACH_SVHC, "A distributor lists this part as affected by REACH.", "reach_flag")
    newest = max((o["fetched_at"] for o in offers if o["fetched_at"] is not None), default=None)
    if newest is not None and facts.now - newest > timedelta(hours=settings.stale_hours):
        add(ids.DATA_STALE, "Distributor data for this part is out of date.", "stale")
    return found
