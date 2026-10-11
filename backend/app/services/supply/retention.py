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
    """Roll up raw samples older than ``RAW_DAYS``. Returns how many raw rows were removed.

    Works in bounded slices of days, so the first run on a large table does not
    hold one long transaction. The cut is at a UTC day boundary: a day is rolled
    up whole or not at all.
    """

    cutoff = (now - timedelta(days=RAW_DAYS)).date()
    oldest = conn.execute(
        "SELECT MIN((sampled_at AT TIME ZONE 'UTC')::date) AS day FROM samples "
        "WHERE sampled_at < %s",
        (_midnight(cutoff),),
    ).fetchone()["day"]
    if oldest is None:
        return 0
    stop = min(cutoff, oldest + timedelta(days=BATCH_DAYS))
    conn.execute(
        """
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
        WHERE sampled_at < %s
        GROUP BY listing_id, (sampled_at AT TIME ZONE 'UTC')::date
        ON CONFLICT (listing_id, day) DO NOTHING
        """,
        (_midnight(stop),),
    )
    removed = conn.execute("DELETE FROM samples WHERE sampled_at < %s", (_midnight(stop),)).rowcount
    return int(removed or 0)
