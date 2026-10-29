"""Read one part now.

A person asks for a fresh reading of a part instead of waiting for its turn. It reads that part's
counted listings at each distributor that holds one, and spends the interactive reserve, never the
polling budget. One person may ask for the same part once every fifteen minutes.
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any, Callable

from app.services.supply import poller, parts, trouble
from app.services.supply.audit import actor_text, write_audit
from app.services.supply.connectors import ConnectorService

COOLDOWN = timedelta(minutes=15)
ACTION = "part.refresh"

_STOPPED_TEXT = {
    poller.STOPPED_INACTIVE: "is disabled or paused",
    poller.STOPPED_COOLING_DOWN: "is cooling down after an error",
    poller.STOPPED_BUDGET: "has used today's allowance for asking",
    "auth_failed": "rejected its credentials",
    "rate_limited": "is limiting requests",
    "blocked": "was refused",
    "error": "did not answer",
}


class TooSoon(ValueError):
    """The same person asked for this part a short while ago. The message says how long to wait."""


def _wait_text(remaining: timedelta) -> str:
    minutes = max(1, int(remaining.total_seconds() // 60) + 1)
    return f"You read this part a moment ago. You can read it again in {minutes} {'minute' if minutes == 1 else 'minutes'}."


def read_now(
    connectors: ConnectorService,
    part_id: str,
    actor: str,
    *,
    clock: Callable[[], datetime] | None = None,
    reader: poller.Poller | None = None,
) -> dict[str, Any]:
    actor = actor_text(actor)
    now = (clock or (lambda: datetime.now(timezone.utc)))()
    store = connectors.store
    with store.connection() as conn:
        parts.get_part(conn, part_id)
        last = conn.execute(
            "SELECT MAX(at) AS at FROM supply_audit_events WHERE action = %s AND subject_id = %s AND actor = %s",
            (ACTION, part_id, actor),
        ).fetchone()["at"]
        if last is not None and now - last < COOLDOWN:
            raise TooSoon(_wait_text(COOLDOWN - (now - last)))
        connector_ids = [
            row["connector_id"]
            for row in conn.execute(
                "SELECT DISTINCT connector_id FROM supply_listings WHERE part_id = %s AND supply_counted(match_state) "
                "ORDER BY connector_id",
                (part_id,),
            ).fetchall()
        ]
        if connector_ids:
            # Asking about a part nothing lists is not a reading, so it does not start the wait.
            write_audit(conn, actor, ACTION, part_id, {"connectors": len(connector_ids)}, subject_kind="part")

    reader = reader or poller.Poller(connectors, store=store, clock=clock)
    read = 0
    problems: list[dict[str, str]] = []
    for connector_id in connector_ids:
        summary = reader.poll_connector(connector_id, interactive=True, only_part=part_id)
        read += summary.polled
        if summary.stopped and summary.stopped != poller.STOPPED_NOTHING_DUE:
            name = connectors.get(connector_id)["display_name"]
            problems.append({
                "connector": name,
                "reason": trouble.stopped_text(store, connector_id, name, summary.stopped, now, _STOPPED_TEXT.get(summary.stopped, "could not be read")),
            })
    return {"read": read, "connectors": len(connector_ids), "problems": problems}
