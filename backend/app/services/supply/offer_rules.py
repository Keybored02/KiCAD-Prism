"""Rules read off a part's counted offers, one function each, so the checks, lists, BOM lookup, insights and reports agree.

Offers are rows of ``parts_view.offers_by_part`` (or anything with the same keys). Holders are ``stock.holders``.
"""

from __future__ import annotations

from typing import Any, Mapping, Sequence


def lead_time_of(offers: Sequence[Mapping[str, Any]]) -> int | None:
    """The shortest lead time quoted, in days, by the offers holding stock, else by any: of offers that are not marketplace stock,
    and more than zero (a zero is a distributor saying nothing). A distributor with none to sell quoting a short wait does not
    make the part quicker to get than the one that holds it says."""

    quoted = [o for o in offers if o.get("lead_time_days") and not o.get("marketplace")]
    times = [int(o["lead_time_days"]) for o in quoted if int(o.get("stock") or 0) > 0] or [int(o["lead_time_days"]) for o in quoted]
    return min(times) if times else None


ROHS_VERDICTS = ("compliant", "not_compliant", "disputed", "unknown")


def rohs_verdict(offers: Sequence[Mapping[str, Any]]) -> str:
    """What distributors say of RoHS: compliant when every one that says anything says yes, not compliant when every one says no,
    disputed when they disagree, unknown when none says."""

    said = [bool(o["rohs"]) for o in offers if o.get("rohs") is not None]
    if not said:
        return "unknown"
    if all(said):
        return "compliant"
    return "not_compliant" if not any(said) else "disputed"
