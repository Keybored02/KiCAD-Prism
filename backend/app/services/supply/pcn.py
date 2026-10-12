"""Product change notices: what a manufacturer announced about parts, entered by a person.

A notice names the parts it covers, what kind of change it is (end of life, not recommended for new designs, last
time buy, other change), and its dates. Prism does not read the PDF for you: people enter what the notice says, so
every date shown is one a person put there. Open notices feed the lifecycle outlook and raise an alert on watched
parts. Closing a notice keeps it.
"""

from __future__ import annotations

import uuid
from datetime import date, datetime, timezone
from typing import Any, Mapping, Sequence

from app.services.supply import parts
from app.services.supply.audit import actor_text, write_audit

KINDS = ("end_of_life", "nrnd", "last_time_buy", "change")
KIND_LABEL = {
    "end_of_life": "End of life",
    "nrnd": "Not recommended for new designs",
    "last_time_buy": "Last time buy",
    "change": "Product change",
}
# Kinds that say the part is heading for its end.
ENDING = ("end_of_life", "nrnd", "last_time_buy")
MAX_PARTS = 100
MAX_TITLE = 200
MAX_NOTES = 1000
SOON_DAYS = 90


class NoticeNotFound(KeyError):
    """No notice with this id."""


class NoticeError(ValueError):
    """The notice does not apply. The message is safe to show."""


def add(
    conn,
    title: str,
    kind: str,
    part_ids: Sequence[str],
    actor: str,
    *,
    notice_url: str = "",
    last_time_buy: date | None = None,
    last_time_ship: date | None = None,
    notes: str = "",
) -> dict[str, Any]:
    actor = actor_text(actor)
    title, notes, notice_url = title.strip(), notes.strip(), notice_url.strip()
    if not title or len(title) > MAX_TITLE:
        raise NoticeError(f"A notice needs a title of up to {MAX_TITLE} characters.")
    if kind not in KINDS:
        raise NoticeError(f"The kind must be one of {', '.join(KINDS)}.")
    if len(notes) > MAX_NOTES:
        raise NoticeError(f"Notes can be at most {MAX_NOTES} characters.")
    if notice_url and not notice_url.lower().startswith("https://"):
        raise NoticeError("The notice address must start with https://.")
    unique = list(dict.fromkeys(part_ids))
    if not unique or len(unique) > MAX_PARTS:
        raise NoticeError(f"A notice covers between 1 and {MAX_PARTS} parts.")
    if last_time_buy and last_time_ship and last_time_ship < last_time_buy:
        raise NoticeError("The last time to ship cannot be before the last time to buy.")
    for part_id in unique:
        parts.get_part(conn, part_id)
    notice_id = uuid.uuid4().hex
    conn.execute(
        """
        INSERT INTO pcns (id, title, kind, notice_url, last_time_buy, last_time_ship, notes, state, created_by)
        VALUES (%s, %s, %s, %s, %s, %s, %s, 'open', %s)
        """,
        (notice_id, title, kind, notice_url, last_time_buy, last_time_ship, notes, actor),
    )
    for part_id in unique:
        conn.execute("INSERT INTO pcn_parts (pcn_id, part_id) VALUES (%s, %s)", (notice_id, part_id))
    write_audit(conn, actor, "pcn.add", notice_id, {"kind": kind, "parts": len(unique), "title": title}, subject_kind="pcn")
    return {"id": notice_id}


def close(conn, notice_id: str, actor: str) -> None:
    actor = actor_text(actor)
    row = conn.execute("SELECT state FROM pcns WHERE id = %s FOR UPDATE", (notice_id,)).fetchone()
    if row is None:
        raise NoticeNotFound(notice_id)
    if row["state"] == "closed":
        return
    conn.execute("UPDATE pcns SET state = 'closed', closed_by = %s, closed_at = NOW() WHERE id = %s", (actor, notice_id))
    write_audit(conn, actor, "pcn.close", notice_id, {}, subject_kind="pcn")


def for_part(conn, part_id: str, *, include_closed: bool = False) -> list[dict[str, Any]]:
    """A part's notices, the soonest last-time-buy first."""

    rows = conn.execute(
        """
        SELECT n.id, n.title, n.kind, n.notice_url, n.last_time_buy, n.last_time_ship, n.notes, n.state, n.created_by, n.created_at,
               (SELECT COUNT(*) FROM pcn_parts x WHERE x.pcn_id = n.id) AS parts
        FROM pcns n JOIN pcn_parts pp ON pp.pcn_id = n.id
        WHERE pp.part_id = %s AND (n.state = 'open' OR %s)
        ORDER BY n.last_time_buy NULLS LAST, n.created_at DESC
        """,
        (part_id, include_closed),
    ).fetchall()

    def day(value: date | None) -> str | None:
        return value.isoformat() if value else None

    return [
        {
            "id": r["id"], "title": r["title"], "kind": r["kind"], "kind_label": KIND_LABEL[r["kind"]], "notice_url": r["notice_url"],
            "last_time_buy": day(r["last_time_buy"]), "last_time_ship": day(r["last_time_ship"]), "notes": r["notes"],
            "state": r["state"], "created_by": r["created_by"], "created_at": r["created_at"].isoformat(), "parts": int(r["parts"]),
        }
        for r in rows
    ]


def alert_detail(notices: Sequence[Mapping[str, Any]], today: date) -> dict[str, Any] | None:
    """For the alert on a watched part: the most pressing open notice that says the part is ending, or None."""

    ending = [n for n in notices if n["state"] == "open" and n["kind"] in ENDING]
    if not ending:
        return None
    chosen = min(ending, key=lambda n: (n["last_time_buy"] or "9999-12-31"))
    soon = bool(chosen["last_time_buy"]) and (date.fromisoformat(chosen["last_time_buy"]) - today).days <= SOON_DAYS
    return {
        "title": chosen["title"], "kind": chosen["kind"], "kind_label": chosen["kind_label"],
        "last_time_buy": chosen["last_time_buy"], "last_time_ship": chosen["last_time_ship"], "soon": soon,
    }


def today() -> date:
    return datetime.now(timezone.utc).date()
