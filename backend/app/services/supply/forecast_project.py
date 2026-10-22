"""Can a project be built: the chance every part can be bought for a number of boards, week by week (P11), and what a board costs (P7).

The board count is a question typed on the screen and nothing is saved: Prism does not plan builds. Each line of the BOM needs
its quantity per board times the boards; the lines are simulated in the same draws, so the chance that every one can be bought is
a share of those draws, and a line's share of draws in which it was short names what holds the build back. A line Prism does not
track, or has too few readings of, is left out and counted, so the chance is of the lines it can speak about.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

import numpy as np

from app.services.supply import bom_lookup, forecast_load, forecast_price, forecast_stock, usage

DRAWS = 1000
WEEKS = 12
HOLDING_BACK = 5
SEED = 20261019


def _reason(holders: list[forecast_stock.Holder], need: int, ratios: dict[str, float]) -> str:
    """One line on why a part is short, in plain words."""

    out = [h.name for h in holders if h.stock <= 0]
    if out and len(out) == len(holders):
        return f"Out of stock at {', '.join(out)}"
    short = [h.name for h in holders if 0 < h.stock < need]
    if len(holders) == 1:
        return f"Only {holders[0].name} holds it"
    if short and not [h for h in holders if h.stock >= need]:
        return f"No distributor holds {need:,} now"
    drained = [h.name for h in holders if forecast_stock.drain_samples(h.series) is not None and h.stock > 0]
    return f"{', '.join(drained)} draining" if drained else "Stock may run out before the build"


def forecast(conn, project_id: str, variant: str, boards: int, now: datetime | None = None) -> dict[str, Any]:
    """The project's buildability by week and its board cost range. ``boards`` is what is being asked, never stored."""

    now = now or datetime.now(timezone.utc)
    rows = usage.project_rows(conn, project_id, variant)
    if not rows:
        return {"available": False, "reason": "no_bom"}
    boards = max(int(boards), 1)
    lines = [bom_lookup.BomLine(row["key"], row["manufacturer"], row["mpn"], row["quantity"], lcsc=row["lcsc"]) for row in rows]
    resolved = bom_lookup.resolve_lines(lines, conn)
    models, ratios, _cases = forecast_load.pooled(conn, now.astimezone(timezone.utc).date())
    pool = forecast_price.pooled_moves(conn, [r["part_id"] for r in conn.execute("SELECT part_id FROM part_tiers").fetchall()], now)

    names = {row["key"]: row for row in rows}
    availability: list[np.ndarray] = []  # each (draws, weeks + 1)
    details: list[dict[str, Any]] = []
    unknown = 0
    cost_now = low_30 = high_30 = low_90 = high_90 = 0.0
    cost_lines = 0
    price_30: list[np.ndarray] = []
    price_90: list[np.ndarray] = []
    price_now = 0.0
    for key, (state, part_id, _how) in resolved.items():
        if state != bom_lookup.TRACKED or not part_id:
            unknown += 1
            continue
        per_board = names[key]["quantity"]
        need = per_board * boards
        holders = forecast_load.holders(conn, part_id, now)
        live = [h for h in holders if h.series]
        series_days = max(((h.series[-1][0] - h.series[0][0]).days for h in live), default=0)
        if not live or series_days < 7:
            unknown += 1
        else:
            sim = forecast_stock.simulate(live, models, ratios, draws=DRAWS, horizon=WEEKS * 7, seed=SEED)
            held = np.stack([sim.stock[:, :, week * 7] >= need for week in range(WEEKS + 1)], axis=2)  # (holders, draws, weeks)
            ok = held.any(axis=0)
            availability.append(ok)
            details.append({
                "key": key, "part_id": part_id, "mpn": names[key]["mpn"], "manufacturer": names[key]["manufacturer"], "per_board": per_board,
                "need": need, "short_share": float((~ok[:, 8]).mean()), "short_ever": float((~ok).any(axis=1).mean()),
                "reason": _reason(live, need, ratios),
            })
        series = forecast_price.series_of(conn, part_id, now)
        if len(series) >= 2:
            own = forecast_price.own_moves(conn, part_id, now)
            d30 = forecast_price.draw_prices(series, pool, 30, DRAWS, SEED, own)
            d90 = forecast_price.draw_prices(series, pool, 90, DRAWS, SEED, own)
            if d30 is not None and d90 is not None:
                price_30.append(d30 * per_board)
                price_90.append(d90 * per_board)
                price_now += series[-1][1] * per_board
                cost_lines += 1
    out: dict[str, Any] = {"available": bool(availability), "boards": boards, "lines": len(resolved), "unknown_lines": unknown, "weeks": [], "holding_back": []}
    if availability:
        every = np.logical_and.reduce(availability)  # (draws, weeks + 1)
        out["weeks"] = [float(every[:, week].mean()) for week in range(WEEKS + 1)]
        # Each forecast line's chance of being short at 8 weeks, for the project's parts table.
        out["by_line"] = {item["key"]: item["short_share"] for item in details}
        out["holding_back"] = sorted(details, key=lambda item: (-item["short_share"], -item["short_ever"]))[:HOLDING_BACK]
        out["holding_back"] = [item for item in out["holding_back"] if item["short_ever"] > 0]
        out["inputs"] = {"lines_forecast": len(availability), "draws": DRAWS}
    if price_30:
        total_30, total_90 = np.sum(price_30, axis=0), np.sum(price_90, axis=0)
        low_30, mid_30, high_30 = (float(v) for v in np.percentile(total_30, [10, 50, 90]))
        low_90, mid_90, high_90 = (float(v) for v in np.percentile(total_90, [10, 50, 90]))
        out["cost"] = {
            "now": price_now, "lines_priced": cost_lines,
            "h30": {"low": low_30, "median": mid_30, "high": high_30}, "h90": {"low": low_90, "median": mid_90, "high": high_90},
        }
    return out
