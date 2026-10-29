"""Keeping the sample history from growing without limit.

Raw samples stay for ``RAW_DAYS``. Older ones are rolled into one row per listing
per day, the day's last reading with every column a sample has, and the raw rows deleted.
``history.days_sql`` reads both as one history.
The roll-up is idempotent, so a run that is interrupted or repeated changes
nothing it should not.

A connector can also say how long any history may be kept (``keep_days``, for a provider whose terms limit
storage): past that, every history of its listings is deleted (samples, daily rows, price breaks, stock-outs and restocks,
arrival promises, change events), except what still describes today. Without it, that history stays for good.

Call counts are operational: they are kept ``CALL_COUNT_DAYS``, well past the four weeks any view reads.
"""

from __future__ import annotations

from datetime import datetime, time, timedelta, timezone

from app.services.supply import freshness
from app.services.supply.project_supply import ROLLUP_MAX_AGE

RAW_DAYS = 60
BATCH_DAYS = 30
CALL_COUNT_DAYS = 90


def _midnight(day) -> datetime:
    return datetime.combine(day, time.min, tzinfo=timezone.utc)


def compact_samples(conn, now: datetime) -> int:
    """Roll up raw samples past their connector's keep time (``RAW_DAYS`` unless the connector says otherwise).

    Returns how many raw rows were removed. A listing's keep time is that of its connector.
    """

    keeps = [
        int(row["days"])
        for row in conn.execute("SELECT DISTINCT COALESCE(retention_days, %s) AS days FROM supply_connectors", (RAW_DAYS,)).fetchall()
    ]
    removed = 0
    for days in keeps or [RAW_DAYS]:
        removed += _compact(conn, now, days)
    return removed


_CUT = "%(now)s - (c.keep_days * INTERVAL '1 day')"
_CUT_DAY = f"({_CUT})::date"

# Each listing history and which of its rows are past the cut. A row that still describes today stays: the price breaks
# held now (no later row ends them), a stock-out not yet over, a promise not yet resolved.
_LISTING_HISTORY = (
    ("supply_samples", f"h.sampled_at < {_CUT}"),
    ("supply_samples_daily", f"h.day < {_CUT_DAY}"),
    (
        "supply_price_breaks_history",
        f"EXISTS (SELECT 1 FROM supply_price_breaks_history n WHERE n.listing_id = h.listing_id AND n.since > h.since AND n.since < {_CUT})",
    ),
    ("supply_stock_events", f"h.day < {_CUT_DAY} AND (h.kind <> 'stock_out' OR h.resolved_on < {_CUT_DAY})"),
    ("supply_arrival_promises", f"h.resolved_at < {_CUT}"),
    ("supply_events", f"h.at < {_CUT}"),
)


def drop_expired(conn, now: datetime) -> int:
    """Delete history past its connector's ``keep_days``, and call counts past ``CALL_COUNT_DAYS``. Returns how many rows
    were removed."""

    removed = 0
    for table, past in _LISTING_HISTORY:
        # A join, not a subquery naming the row's date: that form was evaluated again for every row of the table.
        result = conn.execute(
            f"DELETE FROM {table} h USING supply_listings l JOIN supply_connectors c ON c.id = l.connector_id "
            f"WHERE h.listing_id = l.id AND c.keep_days IS NOT NULL AND {past}",
            {"now": now},
        )
        removed += int(result.rowcount or 0)
    result = conn.execute("DELETE FROM supply_call_counts WHERE day < %s", ((now - timedelta(days=CALL_COUNT_DAYS)).date(),))
    return removed + int(result.rowcount or 0)


def _compact(conn, now: datetime, days: int) -> int:
    """One keep time. Works in bounded slices of days, so the first run on a large table does not
    hold one long transaction. The cut is at a UTC day boundary: a day is rolled up whole or not at all."""

    cutoff = (now - timedelta(days=days)).date()
    mine = "listing_id IN (SELECT l.id FROM supply_listings l JOIN supply_connectors c ON c.id = l.connector_id WHERE COALESCE(c.retention_days, %s) = %s)"
    oldest = conn.execute(
        f"SELECT MIN((sampled_at AT TIME ZONE 'UTC')::date) AS day FROM supply_samples WHERE sampled_at < %s AND {mine}",
        (_midnight(cutoff), RAW_DAYS, days),
    ).fetchone()["day"]
    if oldest is None:
        return 0
    stop = min(cutoff, oldest + timedelta(days=BATCH_DAYS))
    conn.execute(
        f"""
        INSERT INTO supply_samples_daily (listing_id, day, stock, incoming_qty, unit_price, currency, lead_time_days, lifecycle,
                                          discontinued, marketplace, moq, order_multiple)
        SELECT DISTINCT ON (listing_id, (sampled_at AT TIME ZONE 'UTC')::date)
               listing_id, (sampled_at AT TIME ZONE 'UTC')::date, stock, incoming_qty, unit_price, currency, lead_time_days, lifecycle,
               discontinued, marketplace, moq, order_multiple
        FROM supply_samples
        WHERE sampled_at < %s AND {mine}
        ORDER BY listing_id, (sampled_at AT TIME ZONE 'UTC')::date, sampled_at DESC
        ON CONFLICT (listing_id, day) DO NOTHING
        """,
        (_midnight(stop), RAW_DAYS, days),
    )
    removed = conn.execute(f"DELETE FROM supply_samples WHERE sampled_at < %s AND {mine}", (_midnight(stop), RAW_DAYS, days)).rowcount
    return int(removed or 0)


def trim_summaries(conn) -> int:
    """Forget kept summaries nobody has read for a week and rollups past the age a reader accepts, then every change mark no kept
    answer can still depend on (``freshness.trim``). Returns how many marks were removed."""

    conn.execute("DELETE FROM supply_part_summaries WHERE computed_at < NOW() - INTERVAL '7 days'")
    conn.execute("DELETE FROM supply_project_rollups WHERE computed_at < NOW() - %s", (ROLLUP_MAX_AGE,))
    return freshness.trim(conn)
