"""Reading a kept notice PDF: which parts it names, what kind of change it is, and its last-time-buy and last-time-ship dates.

The text is read in a child process with a time and memory limit, as datasheets are (``datasheets.extract``). What is read is a
suggestion: it is stored apart from the notice and counts for nothing until a person confirms it. A date is read only when it is
written out unambiguously (``31 December 2026``, ``Dec 31, 2026``, ``2026-12-31``); ``03/04/2026`` could be either order and is
left alone. A part is named only when its number is one Prism already knows.
"""

from __future__ import annotations

import json
import re
from datetime import date, datetime, timezone
from typing import Any

from app.services.supply import datasheets, pcn
from app.services.supply.audit import actor_text, write_audit
from app.services.supply.identity import match_key

MAX_OTHER_NUMBERS = 20
MAX_GIVE_UP = 3

_MONTHS = {
    name: index for index, names in enumerate(
        (("jan", "january"), ("feb", "february"), ("mar", "march"), ("apr", "april"), ("may",), ("jun", "june"), ("jul", "july"),
         ("aug", "august"), ("sep", "sept", "september"), ("oct", "october"), ("nov", "november"), ("dec", "december")), start=1,
    ) for name in names
}
_MONTH = r"(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)"
_DATE = (
    rf"(?P<iso>\d{{4}}-\d{{2}}-\d{{2}})|(?P<d1>\d{{1,2}})(?:st|nd|rd|th)?[ \-/.]+(?P<m1>{_MONTH})\.?,?[ \-/.]+(?P<y1>\d{{4}})"
    rf"|(?P<m2>{_MONTH})\.?[ \-/.]+(?P<d2>\d{{1,2}})(?:st|nd|rd|th)?,?[ \-/.]+(?P<y2>\d{{4}})"
)
_DATE_RE = re.compile(_DATE, re.IGNORECASE)
_LTB = re.compile(r"(?:last[ -]time[ -]buys?|last[ -]buy|\bltb\b)", re.IGNORECASE)
_LTS = re.compile(r"(?:last[ -]time[ -]ship(?:ments?)?|last[ -]ship(?:ment)?|\blts\b)", re.IGNORECASE)
_WINDOW = 90
_NUMBER = re.compile(r"(?<![A-Za-z0-9])[A-Z0-9][A-Z0-9\-./]{4,30}(?![A-Za-z0-9])")
# Words that look like part numbers and are not.
_NOT_NUMBERS = frozenset({"JEDEC", "ISO9001", "IATF16949", "ROHS", "ROHS3", "REACH", "CHINA", "TAIWAN", "MALAYSIA", "EAR99"})


def _month(name: str) -> int:
    word = name.lower().rstrip(".")
    return _MONTHS.get(word) or _MONTHS[word[:3]]


def _as_date(match: re.Match[str]) -> date | None:
    try:
        if match.group("iso"):
            return date.fromisoformat(match.group("iso"))
        if match.group("d1"):
            return date(int(match.group("y1")), _month(match.group("m1")), int(match.group("d1")))
        return date(int(match.group("y2")), _month(match.group("m2")), int(match.group("d2")))
    except (ValueError, KeyError):
        return None


def _date_after(text: str, label: re.Pattern[str]) -> date | None:
    """The first unambiguous date written within a short way after the label, or None."""

    for found in label.finditer(text):
        window = text[found.end():found.end() + _WINDOW]
        # A date belongs to the label it follows, not to a later one in the window.
        other = (_LTS if label is _LTB else _LTB).search(window)
        if other:
            window = window[:other.start()]
        when = _DATE_RE.search(window)
        if when and (parsed := _as_date(when)):
            return parsed
    return None


def read_text(text: str) -> dict[str, Any]:
    """What the notice text says: ``kind`` (from its wording), ``last_time_buy``, ``last_time_ship`` and candidate part numbers."""

    flat = re.sub(r"\s+", " ", text)
    kind = pcn.kind_from_text(flat[:4000])
    ltb, lts = _date_after(flat, _LTB), _date_after(flat, _LTS)
    numbers = []
    for token in _NUMBER.findall(text):
        cleaned = token.strip("-./")
        if (re.search(r"[A-Z]", cleaned) and re.search(r"\d", cleaned) and cleaned not in _NOT_NUMBERS
                and not _DATE_RE.fullmatch(cleaned) and cleaned not in numbers):
            numbers.append(cleaned)
    return {
        "kind": kind, "last_time_buy": ltb.isoformat() if ltb else None, "last_time_ship": lts.isoformat() if lts else None,
        "numbers": numbers[:400],
    }


def _known_parts(conn, numbers: list[str]) -> tuple[list[dict[str, str]], list[str]]:
    keys = {match_key(number): number for number in numbers if match_key(number)}
    if not keys:
        return [], []
    rows = conn.execute("SELECT id, mpn, match_key FROM parts WHERE match_key = ANY(%s) ORDER BY mpn", (list(keys),)).fetchall()
    known = [{"part_id": row["id"], "mpn": row["mpn"]} for row in rows]
    found = {row["match_key"] for row in rows}
    other = [number for key, number in keys.items() if key not in found][:MAX_OTHER_NUMBERS]
    return known, other


def parse_one(store, notice_id: str, now: datetime | None = None) -> str:
    """Read one kept notice file. Returns ``parsed``, ``nothing`` or the failure."""

    moment = now or datetime.now(timezone.utc)
    with store.connection() as conn:
        row = conn.execute("SELECT file_sha256, kind FROM pcns WHERE id = %s", (notice_id,)).fetchone()
    data = datasheets.read_file(row["file_sha256"]) if row and row["file_sha256"] else None
    if data is None:
        return "no_file"
    try:
        text = datasheets.extract(data).text
    except datasheets.DatasheetError:
        with store.connection() as conn:
            conn.execute("UPDATE pcns SET parse_state = 'unreadable', parse_failures = parse_failures + 1, parsed_at = %s WHERE id = %s", (moment, notice_id))
        return "unreadable"
    read = read_text(text)
    with store.connection() as conn:
        known, other = _known_parts(conn, read.pop("numbers"))
        suggestion = {**read, "known_parts": known, "other_numbers": other}
        empty = not (read["last_time_buy"] or read["last_time_ship"] or known) and read["kind"] == row["kind"]
        conn.execute(
            "UPDATE pcns SET parsed = %s::jsonb, parse_state = %s, parsed_at = %s WHERE id = %s",
            (json.dumps(suggestion), "nothing" if empty else "parsed", moment, notice_id),
        )
    return "nothing" if empty else "parsed"


def run_due(store, limit: int = 2, now: datetime | None = None) -> dict[str, int]:
    """Read a few kept notices nobody has read yet."""

    with store.connection() as conn:
        waiting = [row["id"] for row in conn.execute(
            "SELECT id FROM pcns WHERE file_sha256 <> '' AND parse_state = '' ORDER BY created_at DESC LIMIT %s", (limit,)
        ).fetchall()]
    tally: dict[str, int] = {}
    for notice_id in waiting:
        outcome = parse_one(store, notice_id, now)
        tally[outcome] = tally.get(outcome, 0) + 1
    return tally


def apply(conn, notice_id: str, actor: str, *, dates: bool, kind: bool, part_ids: list[str]) -> None:
    """A person accepts what was read: its dates, its kind, and the parts it named. Anything not chosen is left as it was."""

    actor = actor_text(actor)
    row = conn.execute("SELECT parsed, parse_state, kind FROM pcns WHERE id = %s FOR UPDATE", (notice_id,)).fetchone()
    if row is None:
        raise pcn.NoticeNotFound(notice_id)
    if row["parse_state"] != "parsed" or not row["parsed"]:
        raise pcn.NoticeError("There is nothing read from this notice to confirm.")
    parsed = row["parsed"]
    if dates:
        for column in ("last_time_buy", "last_time_ship"):
            if parsed.get(column):
                conn.execute(f"UPDATE pcns SET {column} = %s WHERE id = %s", (date.fromisoformat(parsed[column]), notice_id))  # noqa: S608 - fixed names
    if kind and parsed.get("kind") in pcn.KINDS:
        conn.execute("UPDATE pcns SET kind = %s WHERE id = %s", (parsed["kind"], notice_id))
    allowed = {item["part_id"] for item in parsed.get("known_parts", [])}
    for part_id in part_ids:
        if part_id not in allowed:
            raise pcn.NoticeError("That part was not named in the notice.")
        conn.execute("INSERT INTO pcn_parts (pcn_id, part_id) VALUES (%s, %s) ON CONFLICT DO NOTHING", (notice_id, part_id))
    conn.execute("UPDATE pcns SET parse_state = 'confirmed' WHERE id = %s", (notice_id,))
    write_audit(conn, actor, "pcn.confirm_parsed", notice_id, {"dates": dates, "kind": kind, "parts": len(part_ids)}, subject_kind="pcn")


def dismiss(conn, notice_id: str, actor: str) -> None:
    actor = actor_text(actor)
    result = conn.execute("UPDATE pcns SET parse_state = 'dismissed' WHERE id = %s AND parse_state = 'parsed'", (notice_id,))
    if result.rowcount == 0:
        raise pcn.NoticeError("There is nothing read from this notice to dismiss.")
    write_audit(conn, actor, "pcn.dismiss_parsed", notice_id, {}, subject_kind="pcn")
