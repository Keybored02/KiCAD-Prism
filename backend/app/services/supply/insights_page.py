"""The Insights page's numbers: counts of findings, the runway scatter and what the distributors do across all tracked parts.

Reads only, from the facts kept in ``part_insights`` and the market snapshots. A list of the parts behind a count is the Parts
list with ``only`` set to the finding's name.
"""

from __future__ import annotations

from collections import Counter, defaultdict
from statistics import median
from typing import Any

from app.services.supply import market, part_insights

SCATTER_MAX = 500


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
    return {
        "tracked": len(rows),
        "counts": counts,
        "scatter": scatter[:SCATTER_MAX],
        "scatter_missing": {"no_rate": no_rate, "no_lead_time": no_lead},
        "distributors": _distributors(rows),
        "market": market.overview(conn),
    }
