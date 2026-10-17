"""What the stock and price history says about each tracked part, kept so a page can list and chart every part at once.

``parts_view.part_detail`` works one part out when its sheet opens. The Dashboard and Insights need the same facts for all
of them, so housekeeping keeps one row per tracked part (``part_insights``) and renews the oldest. No distributor call.
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any, Callable

from app.services.supply import insights, price_behaviour, prices, promises

SPARK_DAYS = 30
PRICE_MOVE_PERCENT = 5
OFTEN_OUT_SHARE = 0.2

# The groups the Insights lists and the Dashboard bars count, each a test on one part's facts. ``runs_out_*`` are buckets of
# the projected days until zero stock; the others are findings.
KINDS: dict[str, Callable[[dict[str, Any]], bool]] = {
    "runs_out_2w": lambda d: d["days_to_zero"] is not None and d["days_to_zero"] <= 14,
    "runs_out_8w": lambda d: d["days_to_zero"] is not None and 14 < d["days_to_zero"] <= 56,
    "runs_out_later": lambda d: d["days_to_zero"] is not None and d["days_to_zero"] > 56,
    "steady": lambda d: d["trend"] in ("steady", "rising"),
    "few_readings": lambda d: d["trend"] is None and d["stock"] != 0,
    "draining": lambda d: d["trend"] == "falling",
    "restock_late": lambda d: d["restock_expected_in_days"] is not None and d["restock_expected_in_days"] < 0,
    "often_out": lambda d: (d["zero_share"] or 0) >= OFTEN_OUT_SHARE,
    "one_distributor": lambda d: d["holders"] == 1,
    "lead_up": lambda d: bool(d["lead_time_trend"]) and d["lead_time_trend"]["after"] > d["lead_time_trend"]["before"],
    "unusual_drop": lambda d: (d["anomalies"] or 0) > 0,
    "likely_out_4w": lambda d: _likely_out(d, "p_out_4w"),
    "likely_out_8w": lambda d: _likely_out(d, "p_out_8w"),
    "price_moving": lambda d: d["price_change_percent"] is not None and abs(d["price_change_percent"]) >= PRICE_MOVE_PERCENT,
}
LIKELY = 0.5


def _likely_out(facts: dict[str, Any], key: str) -> bool:
    forecast = facts.get("forecast") or {}
    return bool(forecast.get("available")) and not forecast.get("out_now") and (forecast.get(key) or 0) >= LIKELY


RENEW_AFTER = timedelta(hours=20)
RENEW_PER_RUN = 40


def compute(conn, part_id: str, now: datetime) -> dict[str, Any]:
    """The facts for one part, small enough to keep: the trend, when stock runs out, the lead time, the price move, 30 days of stock."""

    from app.services.supply import parts_view  # parts_view lists with these facts, so it is imported here

    days = parts_view.history(conn, part_id, now)
    watch = conn.execute("SELECT threshold FROM watches WHERE part_id = %s", (part_id,)).fetchone()
    insight = parts_view.insight_from(days, watch["threshold"] if watch else None, now)
    offers = parts_view.offers_by_part(conn, [part_id]).get(part_id, [])
    leads = [offer["lead_time_days"] for offer in offers if offer.get("lead_time_days")]
    lead = min(leads) if leads else None
    price = prices.view(prices.daily_cheapest(conn, part_id, now, prices.CHART_DAYS), now.date())
    last = days[-1] if days else None
    band = _outlook_band(conn, part_id, offers, days, (price["trend"] or {}).get("change_percent"))
    behaviour = price_behaviour.load(conn, part_id, now)
    forecast = _forecast(conn, part_id, now)
    arrivals = promises.reliability(conn, part_id, now.date())
    return {
        "confidence": insight["confidence"],
        "trend": insight["trend"],
        "decrease_per_day": insight["decrease_per_day"],
        "days_to_zero": insight["days_to_zero"],
        "restocks": insight["restocks"],
        "restock_interval_days": insight["restock_interval_days"],
        "restock_expected_in_days": insight["restock_expected_in_days"],
        "zero_share": insight["zero_share"],
        "volatility": insight["volatility"],
        "sources_change": insight["sources_change"],
        "concentration": insight["concentration"],
        "anomalies": len(insight["anomalies"]),
        "lead_days": lead,
        "outlook_band": band,
        "lead_gap_days": insights.lead_gap_days(insight, lead),
        "lead_time_trend": parts_view.lead_time_trend(conn, part_id, now),
        "price_change_percent": (price["trend"] or {}).get("change_percent"),
        "forecast": forecast,
        "stock": last["stock"] if last else None,
        "holders": last["sources"] if last else None,
        "spark": [day["stock"] for day in days[-SPARK_DAYS:]],
        "behaviour": {
            "repricing": behaviour["repricing"],
            "leader": (behaviour["leadership"] or {}).get("leader"),
            "restock_first": (behaviour["restock_order"] or {}).get("first"),
            "arrivals": {"on_time": arrivals["on_time"], "resolved": arrivals["arrived"] + arrivals["slipped"]} if arrivals and arrivals["on_time"] is not None else None,
        },
    }


def _forecast(conn, part_id: str, now: datetime) -> dict[str, Any]:
    """Make and keep the part's forecasts and return the little a list shows. A failure leaves the rest of the insights as they are."""

    from app.services.supply import forecast_run

    try:
        with conn.transaction():
            return forecast_run.run_part(conn, part_id, now)
    except Exception:  # noqa: BLE001
        import logging

        logging.getLogger(__name__).info("Forecasts not made for %s", part_id, exc_info=True)
        return {"available": False}


def _outlook_band(conn, part_id: str, offers: list[dict[str, Any]], days: list[dict[str, Any]], price_change: float | None) -> str:
    """Where the part stands on the way to its end of life (see ``outlook``), kept so Insights can count the bands."""

    from app.services.supply import facts, outlook, pcn
    from app.services.supply.part_status import worst_lifecycle
    from app.services.supply.vocabulary import Lifecycle

    lifecycle = worst_lifecycle(Lifecycle(offer["lifecycle"]) for offer in offers)
    found = outlook.outlook(
        lifecycle, offers, zero_stock_days=outlook.trailing_zero_days(days), price_change_percent=price_change,
        notices=pcn.for_part(conn, part_id),
        last_buy_dates=[
            (source["source"], source["value"])
            for item in facts.for_part(conn, part_id) if item["name"] == "last_buy_date" for source in item["sources"]
        ],
    )
    return found["band"]


def refresh(conn, part_id: str, now: datetime) -> None:
    import json

    data = compute(conn, part_id, now)
    conn.execute(
        "INSERT INTO part_insights (part_id, computed_at, data) VALUES (%s, %s, %s::jsonb) "
        "ON CONFLICT (part_id) DO UPDATE SET computed_at = EXCLUDED.computed_at, data = EXCLUDED.data",
        (part_id, now, json.dumps(data)),
    )


def renew(conn, now: datetime | None = None, limit: int = RENEW_PER_RUN) -> int:
    """Work out the facts again for the tracked parts that have none or the oldest. Returns how many."""

    now = now or datetime.now(timezone.utc)
    rows = conn.execute(
        """
        SELECT pt.part_id FROM part_tiers pt LEFT JOIN part_insights i ON i.part_id = pt.part_id
        WHERE i.part_id IS NULL OR i.computed_at < %s ORDER BY COALESCE(i.computed_at, '-infinity'::timestamptz), pt.part_id LIMIT %s
        """,
        (now - RENEW_AFTER, limit),
    ).fetchall()
    for row in rows:
        refresh(conn, row["part_id"], now)
    return len(rows)


def read_all(conn) -> list[dict[str, Any]]:
    """Every tracked part with its facts and the little the lists need to show it."""

    rows = conn.execute(
        """
        SELECT i.part_id, i.computed_at, i.data, p.mpn, m.name AS manufacturer, pt.tier
        FROM part_insights i JOIN part_tiers pt ON pt.part_id = i.part_id JOIN parts p ON p.id = i.part_id
        JOIN manufacturers m ON m.id = p.manufacturer_id
        """
    ).fetchall()
    return [
        {"part_id": row["part_id"], "mpn": row["mpn"], "manufacturer": row["manufacturer"], "tier": row["tier"], "computed_at": row["computed_at"], **row["data"]}
        for row in rows
    ]


def matching(conn, kind: str) -> set[str]:
    """The ids of the tracked parts a kind applies to."""

    test = KINDS[kind]
    return {row["part_id"] for row in read_all(conn) if test(row)}


def of_parts(conn, part_ids: list[str]) -> dict[str, dict[str, Any]]:
    """The facts kept for these parts, by part id (parts without any are left out)."""

    rows = conn.execute("SELECT part_id, data FROM part_insights WHERE part_id = ANY(%s)", (part_ids,)).fetchall()
    return {row["part_id"]: row["data"] for row in rows}
