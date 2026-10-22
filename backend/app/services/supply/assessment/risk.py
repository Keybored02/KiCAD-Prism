"""Risk sub-scores: 1 is good, 5 is bad, each with the reasons behind it.

Pure functions over the same ``Facts`` the checks read. A sub-score with no data scores 1 with no
reasons; health does not punish what Prism cannot see, and ``status`` says "unknown" when there is
nothing to go on.
"""

from __future__ import annotations

from dataclasses import dataclass

from app.services.supply.assessment.checks import Facts, lead_time_of, stock_of
from app.services.supply.vocabulary import Lifecycle


@dataclass(frozen=True, slots=True)
class SubScore:
    name: str
    score: int
    reasons: tuple[str, ...] = ()


_LIFECYCLE_SCORE = {
    Lifecycle.ACTIVE: 1, Lifecycle.UNKNOWN: 1, Lifecycle.NRND: 3, Lifecycle.LAST_TIME_BUY: 4, Lifecycle.OBSOLETE: 5,
}


# What the outlook band adds to the lifecycle score: a notice or last date to buy is as serious as a last time buy.
_OUTLOOK_SCORE = {"ended": (5, "Signals say it has ended."), "under_2_years": (4, "Signals say it ends within 2 years."), "2_to_5_years": (2, "Signals say it may end within 5 years.")}


def lifecycle(facts: Facts) -> SubScore:
    score = _LIFECYCLE_SCORE[facts.lifecycle]
    reasons = [] if facts.lifecycle in (Lifecycle.ACTIVE, Lifecycle.UNKNOWN) else [f"Manufacturer lifecycle: {facts.lifecycle.value.replace('_', ' ')}."]
    ahead = _OUTLOOK_SCORE.get(facts.outlook)
    from_outlook = bool(ahead and ahead[0] > score)
    if ahead and from_outlook:
        score = ahead[0]
        reasons.append(ahead[1])
    # The outlook's "under 2 years" comes from this same fact, so a score it set already counts it.
    if facts.offers and all(o["discontinued"] for o in facts.offers) and not from_outlook:
        score = min(score + 1, 5)
        reasons.append("Every distributor has stopped selling it.")
    return SubScore("lifecycle", score, tuple(reasons))


def sourcing(facts: Facts) -> SubScore:
    """How many distributors hold it. One is a single point of failure."""

    holders = {o["connector_id"] for o in facts.offers if o["stock"] > 0 and not o["marketplace"]}
    if not facts.offers:
        return SubScore("sourcing", 1)
    count = len(holders)
    if count == 0:
        return SubScore("sourcing", 5, ("No distributor holds it.",))
    if count == 1:
        return SubScore("sourcing", 3, ("Only one distributor holds it.",))
    return SubScore("sourcing", 2 if count == 2 else 1, (f"{count} distributors hold it.",) if count == 2 else ())


def inventory(facts: Facts) -> SubScore:
    """Stock against what is needed, or against nothing when no build asks for it."""

    stock = stock_of(facts.offers)
    if stock is None:
        return SubScore("inventory", 1)
    if stock == 0:
        return SubScore("inventory", 5, ("Nothing in stock.",))
    if facts.need is None or facts.need == 0:
        return SubScore("inventory", 1)
    cover = stock / facts.need
    if cover >= 3:
        return SubScore("inventory", 1)
    if cover >= 1.5:
        return SubScore("inventory", 2, (f"Stock covers the build {cover:.1f} times.",))
    if cover >= 1:
        return SubScore("inventory", 3, ("Stock only just covers the build.",))
    return SubScore("inventory", 4, (f"Stock covers {int(cover * 100)}% of the build.",))


_LEAD_BANDS = ((28, 1), (56, 2), (84, 3), (168, 4))


def market(facts: Facts) -> SubScore:
    """Lead time. Price trends join it when there is enough history to read one."""

    lead = lead_time_of(facts.offers)
    if lead is None:
        return SubScore("market", 1)
    score = next((value for limit, value in _LEAD_BANDS if lead <= limit), 5)
    return SubScore("market", score, (f"Lead time {lead} days.",) if score > 1 else ())


def compliance(facts: Facts) -> SubScore:
    known = [o["rohs"] for o in facts.offers if o.get("rohs") is not None]
    if known and not any(known):
        return SubScore("compliance", 5, ("Listed as not RoHS compliant.",))
    if facts.svhc_listed or any(o.get("reach_affected") for o in facts.offers):
        return SubScore("compliance", 3, ("Affected by REACH.",))
    return SubScore("compliance", 1)


def sub_scores(facts: Facts) -> list[SubScore]:
    return [lifecycle(facts), sourcing(facts), inventory(facts), market(facts), compliance(facts)]
