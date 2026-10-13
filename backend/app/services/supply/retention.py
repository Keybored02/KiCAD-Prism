"""Keeping the sample history from growing without limit.

Raw samples stay for ``RAW_DAYS``. Older ones are rolled into one row per listing
per day (lowest, highest and last stock, last price) and the raw rows deleted.
The roll-up is idempotent, so a run that is interrupted or repeated changes
nothing it should not.
"""

from __future__ import annotations

from datetime import datetime, time, timedelta, timezone

RAW_DAYS = 60
BATCH_DAYS = 30


def _midnight(day) -> datetime:
    return datetime.combine(day, time.min, tzinfo=timezone.utc)


def compact_samples(conn, now: datetime) -> int:
    """Roll up raw samples past their connector's keep time (``RAW_DAYS`` unless the connector says otherwise).

    Returns how many raw rows were removed. A listing's keep time is that of its connector.
    """

    keeps = [
        int(row["days"])
        for row in conn.execute("SELECT DISTINCT COALESCE(retention_days, %s) AS days FROM connectors", (RAW_DAYS,)).fetchall()
    ]
    removed = 0
    for days in keeps or [RAW_DAYS]:
        removed += _compact(conn, now, days)
    return removed


def _compact(conn, now: datetime, days: int) -> int:
    """One keep time. Works in bounded slices of days, so the first run on a large table does not
    hold one long transaction. The cut is at a UTC day boundary: a day is rolled up whole or not at all."""

    cutoff = (now - timedelta(days=days)).date()
    mine = "listing_id IN (SELECT l.id FROM listings l JOIN connectors c ON c.id = l.connector_id WHERE COALESCE(c.retention_days, %s) = %s)"
    oldest = conn.execute(
        f"SELECT MIN((sampled_at AT TIME ZONE 'UTC')::date) AS day FROM samples WHERE sampled_at < %s AND {mine}",
        (_midnight(cutoff), RAW_DAYS, days),
    ).fetchone()["day"]
    if oldest is None:
        return 0
    stop = min(cutoff, oldest + timedelta(days=BATCH_DAYS))
    conn.execute(
        f"""
        INSERT INTO samples_daily (listing_id, day, min_stock, max_stock, last_stock, last_unit_price,
                                   currency, marketplace, sample_count)
        SELECT listing_id,
               (sampled_at AT TIME ZONE 'UTC')::date AS day,
               MIN(stock), MAX(stock),
               (ARRAY_AGG(stock ORDER BY sampled_at DESC))[1],
               (ARRAY_AGG(unit_price ORDER BY sampled_at DESC))[1],
               (ARRAY_AGG(currency ORDER BY sampled_at DESC))[1],
               (ARRAY_AGG(marketplace ORDER BY sampled_at DESC))[1],
               COUNT(*)
        FROM samples
        WHERE sampled_at < %s AND {mine}
        GROUP BY listing_id, (sampled_at AT TIME ZONE 'UTC')::date
        ON CONFLICT (listing_id, day) DO NOTHING
        """,
        (_midnight(stop), RAW_DAYS, days),
    )
    removed = conn.execute(f"DELETE FROM samples WHERE sampled_at < %s AND {mine}", (_midnight(stop), RAW_DAYS, days)).rowcount
    return int(removed or 0)
