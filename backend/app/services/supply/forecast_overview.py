"""Forecasts across all tracked parts, from the ones Prism keeps: the Dashboard tile and "Coming up", and Insights' families.

Reads the kept ``part_insights`` summaries (made by ``forecast_run.run_part``), so no simulation runs here.
"""

from __future__ import annotations

from datetime import date, datetime, timedelta, timezone
from typing import Any

from app.services.supply.assessment import settings_store
from app.services.supply import forecast_lifecycle, forecast_market, forecasting, part_insights

LIKELY = 0.5
COMING_UP = 10


def _rows(conn) -> list[dict[str, Any]]:
    return [row for row in part_insights.read_all(conn) if (row.get("forecast") or {}).get("available")]


def dashboard(conn, today: date | None = None) -> dict[str, Any]:
    """The tile ("likely out in 4 weeks") and the next ten expected events."""

    today = today or datetime.now(timezone.utc).date()
    states = forecasting.model_states(conn)
    rows = _rows(conn)
    likely_4w = [row for row in rows if (row["forecast"].get("p_out_4w") or 0) >= LIKELY and not row["forecast"].get("out_now")]
    events = []
    for row in rows:
        forecast = row["forecast"]
        run = forecast.get("runout")
        if run:
            events.append({"kind": "runout", "date": run["median_date"], "part_id": row["part_id"], "mpn": row["mpn"],
                           "manufacturer": row["manufacturer"], "text": "likely out", "probability": run["p"]})
        price = forecast.get("price_90")
        if price and price.get("now") and abs(price["median"] / price["now"] - 1) >= 0.05:
            up = price["median"] > price["now"]
            events.append({"kind": "price", "date": price["date"], "part_id": row["part_id"], "mpn": row["mpn"],
                           "manufacturer": row["manufacturer"], "text": f"price likely {'up' if up else 'down'} {abs(price['median'] / price['now'] - 1) * 100:.0f}%", "probability": None})
    events.sort(key=lambda item: item["date"])
    return {
        "likely_out_4w": len(likely_4w), "state": states["out_4w"], "coming_up": events[:COMING_UP],
        "part_ids_likely_out_4w": [row["part_id"] for row in likely_4w],
    }


def panel_line(conn, part_id: str) -> dict[str, str] | None:
    """One line for the KiCad panel's Availability block, from the kept forecast, once its models have a good record. Else None."""

    states = forecasting.model_states(conn)
    if not (forecasting.shown(states, "can_buy_8w") and forecasting.shown(states, "out_4w")):
        return None
    forecast = (part_insights.of_parts(conn, [part_id]).get(part_id) or {}).get("forecast") or {}
    if not forecast.get("available") or forecast.get("out_now"):
        return None
    out_4w, can_8w, run = forecast.get("p_out_4w") or 0.0, forecast.get("can_buy_8w") or 0.0, forecast.get("runout")
    if out_4w >= 0.7 and run:
        return {"tone": "warning", "text": f"Likely out by {run['median_date']} ({forecasting.chance_percent(out_4w)}%)"}
    if can_8w >= 0.7:
        return {"tone": "ok", "text": f"Likely in stock for the next 8 weeks ({forecasting.chance_percent(can_8w)}%)"}
    return None


def likely_out_ids(conn, weeks: int) -> set[str]:
    """Parts likely (half or more) to be out everywhere within 4 or 8 weeks, for the Parts list filters."""

    key = "p_out_4w" if weeks <= 4 else "p_out_8w"
    return {row["part_id"] for row in _rows(conn) if (row["forecast"].get(key) or 0) >= LIKELY and not row["forecast"].get("out_now")}


def insights_page(conn, today: date | None = None) -> dict[str, Any]:
    """The Insights Forecasts section: coming up, lead times ahead, early warnings, prices ahead, lifecycle, and the track record."""

    today = today or datetime.now(timezone.utc).date()
    board = dashboard(conn, today)
    families = forecast_market.outlook(conn, today)
    movers = []
    for row in _rows(conn):
        price = row["forecast"].get("price_90")
        if price and price.get("now") and price["now"] > 0:
            movers.append({"part_id": row["part_id"], "mpn": row["mpn"], "manufacturer": row["manufacturer"], "now": price["now"], "low": price["low"],
                           "median": price["median"], "high": price["high"], "change": price["median"] / price["now"] - 1, "flat": bool(price.get("flat"))})
    movers.sort(key=lambda item: -item["change"])
    return {
        "currency": settings_store.load(conn).base_currency,
        "coming_up": board["coming_up"], "likely_out_4w": board["likely_out_4w"],
        "lead_times": families["lead_times"], "warnings": families["warnings"],
        "prices": {"parts": len(movers), "flat": sum(1 for m in movers if m["flat"]), "likeliest_up": movers[:10]},
        "lifecycle": {"last_buy_lag": forecast_lifecycle.last_buy_lag(conn), "changes": forecast_lifecycle.rates(conn, today)["changes"], "needs": forecast_lifecycle.MIN_CHANGES_TO_SHOW},
        "track_record": forecasting.track_record(conn),
    }
