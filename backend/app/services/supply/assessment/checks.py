"""Findings: what is wrong with a part, from facts alone.

Pure functions. ``Facts`` is everything the checks look at; the service builds it from the
database and nothing here reads one. The checks that need data Prism does not hold yet (REACH,
parameter mismatch, package, target price, approved sources per component) are not here; they arrive with
the data, under the ids the plan reserves.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from decimal import Decimal
import statistics
from datetime import date, datetime, timedelta
from typing import Any, Mapping, Sequence

from app.services.supply import stock
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
    # Units a build needs, for the parts that sit on a BOM. None when no build quantity is asked for.
    need: int | None = None
    # Distributors Prism reads. A part held by one of several is a single source; with only one there is no choice.
    distributors: int | None = None
    # Names of substances declared for the part that are on the ECHA Candidate List.
    svhc_listed: Sequence[str] = ()
    # What each distributor quotes per piece at the reference quantity, in the base currency: (distributor name, price).
    prices: Sequence[tuple[str, Decimal]] = ()
    # Where the part stands on the way to its end (``outlook.py``): "ended", "under_2_years", "2_to_5_years", "no_signs", "unknown", or "" when not known.
    outlook: str = ""
    # The earliest last date to buy a distributor states or an open notice gives, when there is one.
    last_buy: date | None = None


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
    """Units on hand across counted, non-marketplace offers, by pile at each distributor (``stock.aggregate``); None when none was read."""

    usable = [o for o in offers if not o["marketplace"]]
    return stock.aggregate(usable, "any").total if usable else None


def lead_time_of(offers: Sequence[Mapping[str, Any]]) -> int | None:
    """The shortest lead time given by an offer that is not marketplace stock."""

    times = [o["lead_time_days"] for o in offers if o["lead_time_days"] is not None and not o["marketplace"]]
    return min(times) if times else None


# At least this many quotes, and one at more than this multiple or less than its inverse of the median, make an outlier.
PRICE_MIN_QUOTES = 3
PRICE_OUTLIER_RATIO = Decimal(2)


def _disagreements(offers: Sequence[Mapping[str, Any]], add) -> None:
    """Distributors that give the part different lifecycles. The manufacturer's word is one thing; the distributors' copies of it are another."""

    named: dict[str, list[str]] = {}
    for offer in offers:
        if offer["marketplace"] or offer.get("lifecycle") in (None, "unknown"):
            continue
        named.setdefault(str(offer["lifecycle"]).replace("_", " "), []).append(str(offer.get("connector_name") or offer["connector_id"]))
    if len(named) > 1:
        who = "; ".join(f"{lifecycle} at {', '.join(sorted(set(names)))}" for lifecycle, names in sorted(named.items()))
        add(ids.LIFECYCLE_DISAGREEMENT, f"Distributors disagree on the lifecycle: {who}.", "lifecycle_disagreement")


# Checks whose severity the last date to buy raises: past it the part can no longer be ordered, near it the time is short.
_DATED = frozenset({ids.LAST_TIME_BUY, ids.ENDING_WITHIN_2_YEARS})
_RANK = {Status.OK: 0, Status.WARNING: 1, Status.ERROR: 2, Status.FATAL: 3}


def _by_last_buy(configured: Status, facts: Facts, settings: AssessmentSettings) -> Status:
    """The check's own severity, raised to fatal once the last date to buy has passed and to error within ``last_buy_error_days`` of it.
    A date only raises: a workspace that set the check to "ok" keeps it a note."""

    if facts.last_buy is None or configured is Status.OK:
        return configured
    days = (facts.last_buy - facts.now.date()).days
    wanted = Status.FATAL if days < 0 else Status.ERROR if days <= settings.last_buy_error_days else configured
    return wanted if _RANK[wanted] > _RANK[configured] else configured


def evaluate(facts: Facts, settings: AssessmentSettings) -> list[Finding]:
    found: list[Finding] = []

    def add(check: str, text: str, scope: str) -> None:
        found.append(Finding(check, _by_last_buy(settings.severity_of(check), facts, settings) if check in _DATED else settings.severity_of(check), text, scope))

    if facts.problem:
        add(ids.PART_NOT_FOUND, "No distributor carries this part number.", "not_found")
    if facts.lifecycle is Lifecycle.OBSOLETE:
        add(ids.OBSOLETE, "The manufacturer lists this part as obsolete.", "obsolete")
    elif facts.lifecycle is Lifecycle.LAST_TIME_BUY:
        add(ids.LAST_TIME_BUY, "The manufacturer has announced a last time buy.", "last_time_buy")
    elif facts.lifecycle is Lifecycle.NRND:
        add(ids.NRND, "The manufacturer does not recommend this part for new designs.", "nrnd")

    offers = list(facts.offers)
    # A lifecycle word or every distributor dropping the part already says it; the outlook adds what notices and last dates to buy say. An "ended" outlook is only ever an obsolete part, which is already said.
    said = facts.lifecycle in (Lifecycle.OBSOLETE, Lifecycle.LAST_TIME_BUY) or (bool(offers) and all(o["discontinued"] for o in offers))
    if facts.outlook == "under_2_years" and not said:
        add(ids.ENDING_WITHIN_2_YEARS, "A notice or a last date to buy says this part ends within 2 years.", "ending_within_2_years")
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
    _disagreements(offers, add)
    quoted = list(facts.prices)
    if len(quoted) >= PRICE_MIN_QUOTES:
        middle = statistics.median(price for _name, price in quoted)
        far = [(name, price) for name, price in quoted if middle > 0 and not middle / PRICE_OUTLIER_RATIO <= price <= middle * PRICE_OUTLIER_RATIO]
        if far:
            name, price = max(far, key=lambda item: abs(item[1] - middle))
            add(ids.PRICE_OUTLIER, f"{name} quotes {price:.4f} a piece against a median of {middle:.4f} across {len(quoted)} distributors.", "price_outlier")
    newest = max((o["fetched_at"] for o in offers if o["fetched_at"] is not None), default=None)
    if newest is not None and facts.now - newest > timedelta(hours=settings.stale_hours):
        add(ids.DATA_STALE, "Distributor data for this part is out of date.", "stale")
    return found
