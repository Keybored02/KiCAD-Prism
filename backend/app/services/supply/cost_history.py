"""A tracked project's cost of a board a day, read as a series worth drawing and comparing.

A day's cost is one figure for the lines that had a price that day. Two kinds of day mislead and are left out of every reading of the
series (the project page's chart, its change figures, the Projects view and the Dashboard):

* a day that priced fewer lines than today does (the BOM was costed while some prices were missing, so it reads far too low);
* a day whose figure is over ``OUTLIER_TIMES`` the series median (one price read wrong), which the page lists with its day.

A changed usual build starts a new series (``SAME_SERIES``), as a currency change does for prices.
"""

from __future__ import annotations

import statistics
from datetime import timedelta
from typing import Any

OUTLIER_TIMES = 5
# The rows of the series a project is on now: the build size of its newest row. ``h`` is the history table.
SAME_SERIES = (
    "h.build_quantity = (SELECT l.build_quantity FROM supply_bom_cost_history l WHERE l.project_id = h.project_id AND l.variant = h.variant "
    "ORDER BY l.day DESC LIMIT 1)"
)


def split(rows: list[dict[str, Any]]) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    """The days to draw and the days left out as outliers, from the rows of one series, oldest first."""

    if not rows:
        return [], []
    today = rows[-1]["lines_priced"]
    complete = [row for row in rows if row["lines_priced"] >= today]
    if len(complete) < 3:
        return complete, []
    middle = statistics.median(float(row["cost_per_board"]) for row in complete)
    kept = [row for row in complete if middle <= 0 or float(row["cost_per_board"]) <= middle * OUTLIER_TIMES]
    left_out = [row for row in complete if row not in kept]
    return kept, left_out


def series(conn, project_id: str, variant: str, days: int) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    """The kept days and the outlier days of a project's current series over the last ``days`` days, oldest first."""

    rows = [dict(row) for row in conn.execute(
        f"""
        SELECT day, cost_per_board, currency, lines, lines_priced, build_quantity, rollup FROM supply_bom_cost_history h
        WHERE project_id = %s AND variant = %s AND {SAME_SERIES}
          AND day >= (SELECT MAX(day) FROM supply_bom_cost_history WHERE project_id = h.project_id AND variant = h.variant) - %s
        ORDER BY day
        """,
        (project_id, variant, timedelta(days=days)),
    ).fetchall()]
    return split(rows)


def change_percent(kept: list[dict[str, Any]], days: int = 30) -> float | None:
    """How much the latest kept cost moved against the last kept one at least ``days`` days earlier, in percent."""

    if not kept:
        return None
    latest = kept[-1]
    earlier = [row for row in kept if row["day"] <= latest["day"] - timedelta(days=days)]
    if not earlier or not float(earlier[-1]["cost_per_board"]):
        return None
    return round((float(latest["cost_per_board"]) - float(earlier[-1]["cost_per_board"])) / float(earlier[-1]["cost_per_board"]) * 100, 1)
