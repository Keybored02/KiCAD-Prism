"""Keeping a copy of each notice's PDF, so the notice survives the manufacturer moving or removing the page.

A notice with an https address and no copy is fetched a few at a time by the supply poll job, through the same guarded
client, size cap and host deny list as datasheets, and stored by hash in the datasheet archive. A failure is retried
after a day, and given up on after ``GIVE_UP_AFTER`` tries. The notice itself never depends on the copy.
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any

from app.services.supply import datasheets

RETRY_AFTER = timedelta(days=1)
GIVE_UP_AFTER = 4


def due(conn, now: datetime, limit: int) -> list[dict[str, Any]]:
    rows = conn.execute(
        """
        SELECT id, notice_url FROM pcns
        WHERE notice_url LIKE 'https://%%' AND file_sha256 = '' AND file_failures < %s
          AND (file_checked_at IS NULL OR file_checked_at <= %s)
        ORDER BY file_checked_at NULLS FIRST, created_at DESC LIMIT %s
        """,
        (GIVE_UP_AFTER, now - RETRY_AFTER, limit),
    ).fetchall()
    return [dict(row) for row in rows]


def keep_one(store, notice_id: str, url: str, now: datetime, client: Any | None = None) -> str:
    """Fetch one notice file. Returns ``kept`` or the failure code."""

    try:
        with store.connection() as conn:
            if datasheets.is_denied(conn, url):
                raise datasheets.DatasheetError("host_denied")
        sha = datasheets.keep_file(datasheets.fetch(url, client))
    except datasheets.DatasheetError as exc:
        with store.connection() as conn:
            conn.execute(
                "UPDATE pcns SET file_checked_at = %s, file_status = %s, file_failures = file_failures + 1 WHERE id = %s",
                (now, str(exc)[:80], notice_id),
            )
        return str(exc)
    with store.connection() as conn:
        conn.execute(
            "UPDATE pcns SET file_sha256 = %s, file_checked_at = %s, file_status = 'kept', file_failures = 0 WHERE id = %s",
            (sha, now, notice_id),
        )
    return "kept"


def run_due(store, now: datetime | None = None, limit: int = 2, client: Any | None = None) -> dict[str, int]:
    moment = now or datetime.now(timezone.utc)
    with store.connection() as conn:
        waiting = due(conn, moment, limit)
    tally: dict[str, int] = {}
    for row in waiting:
        outcome = keep_one(store, row["id"], row["notice_url"], moment, client)
        tally[outcome] = tally.get(outcome, 0) + 1
    return tally


def file_of(conn, notice_id: str) -> tuple[str, bytes] | None:
    """(file name, bytes) of a notice's kept copy, or None."""

    row = conn.execute("SELECT file_sha256 FROM pcns WHERE id = %s", (notice_id,)).fetchone()
    if row is None or not row["file_sha256"]:
        return None
    data = datasheets.read_file(row["file_sha256"])
    return (f"notice-{notice_id[:8]}.pdf", data) if data is not None else None
