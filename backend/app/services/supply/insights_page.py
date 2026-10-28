"""The Insights page's numbers: counts of findings, the runway scatter and what the distributors do across all tracked parts.

Reads only, from the facts kept in ``part_insights`` and the market snapshots. A list of the parts behind a count is the Parts
list with ``only`` set to the finding's name.
"""

from __future__ import annotations

import csv
import io
from collections import Counter, defaultdict
from datetime import datetime, timezone
from statistics import median
from typing import Any

from app.services.supply import market, part_insights, parts_view, risk_views, scorecard

TREND_POINTS = 30

SCATTER_MAX = 500

_RISKY_START = ("=", "+", "-", "@", "\t", "\r")

RISK_HEADER = (
    "Manufacturer", "MPN", "Status", "Lifecycle", "Ends", "Stock", "Distributors holding", "Days to zero", "Lead time (days)",
    "Chance out in 4 weeks", "Price change (%)", "Findings",
)

# The findings worth a column in the export, in words; the chart groups (outlook_*, lead_*) have their own columns.
_FINDING_TEXT = {
    "runs_out_2w": "Runs out within 2 weeks", "likely_out_4w": "Likely out within 4 weeks", "draining": "Stock falling",
    "restock_late": "Restock late", "often_out": "Often out of stock", "one_distributor": "One distributor",
    "lead_up": "Lead time rising", "unusual_drop": "Unusual drop", "price_moving": "Price moving",
}

_OUTLOOK_TEXT = {"ended": "Ended", "under_2_years": "Under 2 years", "2_to_5_years": "2 to 5 years", "no_signs": "No signs", "unknown": "Unknown"}


def _distributors(rows: list[dict[str, Any]]) -> dict[str, Any]:
    repricing: dict[str, list[int]] = defaultdict(list)
    leaders: Counter[str] = Counter()
    restocks: Counter[str] = Counter()
    on_time = resolved = 0
    for row in rows:
        behaviour = row.get("behaviour") or {}
        for name, days in (behaviour.get("repricing") or {}).items():
            repricing[name].append(int(days))
        if behaviour.get("leader"):
            leaders[behaviour["leader"]] += 1
        if behaviour.get("restock_first"):
            restocks[behaviour["restock_first"]] += 1
        arrivals = behaviour.get("arrivals")
        if arrivals:
            on_time += int(arrivals["on_time"])
            resolved += int(arrivals["resolved"])
    return {
        "repricing": sorted(({"name": name, "days": round(median(values)), "parts": len(values)} for name, values in repricing.items()), key=lambda item: item["days"]),
        "leaders": [{"name": name, "parts": count} for name, count in leaders.most_common()],
        "restock_first": [{"name": name, "parts": count} for name, count in restocks.most_common()],
        "arrivals": {"on_time": on_time, "resolved": resolved} if resolved else None,
    }


def _market_trends(conn) -> dict[str, list[float]]:
    """The last stored values of each market figure over all followed parts, oldest first."""

    found: dict[str, list[float]] = {}
    for metric in market.METRICS:
        series = next((line for line in market.history(conn, metric)["series"] if line["kind"] == "all"), None)
        found[metric] = [value for _, value in series["points"][-TREND_POINTS:]] if series else []
    return found


def build(conn) -> dict[str, Any]:
    rows = part_insights.read_all(conn)
    counts = {kind: sum(1 for row in rows if test(row)) for kind, test in part_insights.KINDS.items()}
    scatter = []
    no_rate = no_lead = 0
    for row in rows:
        if row["days_to_zero"] is None:
            no_rate += 1
        elif row["lead_days"] is None:
            no_lead += 1
        else:
            scatter.append({
                "part_id": row["part_id"], "mpn": row["mpn"], "manufacturer": row["manufacturer"],
                "days_to_zero": row["days_to_zero"], "lead_days": row["lead_days"],
            })
    scatter.sort(key=lambda item: item["days_to_zero"] - item["lead_days"])
    items, _total = parts_view.ranked_parts(conn, scope="watched")
    tracked_ids = [item["id"] for item in items]
    kept = {row["part_id"]: row for row in rows}
    held = Counter("none" if item["stock"] == 0 else "not_read" if item["stock"] is None else "one" if (kept.get(item["id"]) or {}).get("holders") == 1
                   else "two" if (kept.get(item["id"]) or {}).get("holders") == 2 else "three_plus" if (kept.get(item["id"]) or {}).get("holders") else "unknown" for item in items)
    return {
        "sourcing": {
            "coverage": risk_views.coverage(conn, items),
            "resilience": {name: held.get(name, 0) for name in ("none", "one", "two", "three_plus", "unknown", "not_read")},
        },
        "lifecycle": {"mix": risk_views.lifecycle_mix(items), "outlook": risk_views.outlook_bands(rows), "compliance": risk_views.compliance(conn, tracked_ids)},
        "lead_times": risk_views.lead_histogram(rows),
        "price_movers": risk_views.price_movers(rows),
        "trade": risk_views.trade_overview(conn, tracked_ids),
        "tracked": len(rows),
        "counts": counts,
        "scatter": scatter[:SCATTER_MAX],
        "scatter_missing": {"no_rate": no_rate, "no_lead_time": no_lead},
        "distributors": _distributors(rows) | {"scorecard": scorecard.build(conn, datetime.now(timezone.utc).date())},
        "market": market.overview(conn),
        "market_trends": _market_trends(conn),
    }


def _safe(cell: object) -> str:
    text = "" if cell is None else str(cell)
    return "'" + text if text.startswith(_RISKY_START) else text


def risk_csv(conn) -> str:
    """Every tracked part with its risk figures, one row a part, the parts that need a look first."""

    items, _total = parts_view.ranked_parts(conn, scope="watched")
    kept = {row["part_id"]: row for row in part_insights.read_all(conn)}
    out = io.StringIO()
    writer = csv.writer(out, lineterminator="\r\n")
    writer.writerow(RISK_HEADER)
    for item in items:
        facts = kept.get(item["id"]) or {}
        forecast = facts.get("forecast") or {}
        chance = forecast.get("p_out_4w") if forecast.get("available") else None
        findings = [text for kind, text in _FINDING_TEXT.items() if facts and part_insights.KINDS[kind](facts)]
        writer.writerow([
            _safe(item["manufacturer"]), _safe(item["mpn"]), item["status"], item["lifecycle"],
            _OUTLOOK_TEXT.get(facts.get("outlook_band") or "unknown", "Unknown"),
            "" if item["stock"] is None else item["stock"], facts.get("holders") if facts.get("holders") is not None else "",
            "" if facts.get("days_to_zero") is None else round(facts["days_to_zero"]),
            "" if facts.get("lead_days") is None else round(facts["lead_days"]),
            "" if chance is None else f"{round(chance * 100)}%",
            "" if facts.get("price_change_percent") is None else facts["price_change_percent"],
            "; ".join(findings),
        ])
    return out.getvalue()
