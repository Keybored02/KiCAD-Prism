"""The datasheet archive: what a manufacturer published, kept as it was, with what changed.

A part's datasheet address comes from a distributor's answer (``parts.datasheet_url``). The file is fetched
through the guarded client (public addresses only, HTTPS, redirects re-checked, size capped) and must
start like a PDF. It is stored by its SHA-256 outside the database; a new hash for the same part is a new
version. The text of the first pages is read in a separate process with a time limit, kept next to the
file, and compared with the version before: phrases that matter for lifecycle are noted, and the share of
text that changed is told. At most ``KEEP_VERSIONS`` versions are kept per part.

Parts are checked weekly, watched ones and parts on project BOMs first. A dead address is retried less and
less often.
"""

from __future__ import annotations

import difflib
import hashlib
import json
import os
import re
import subprocess
import sys
import tempfile
import uuid
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Callable

import psycopg.errors
from urllib.parse import urlsplit

from app.core.config import settings
from app.services.supply import alerts
from app.services.supply.audit import write_audit
from app.services.supply.http_client import SafeHttpClient
from app.services.supply.providers.base import ProviderError

MAX_BYTES = 25 * 1024 * 1024
KEEP_VERSIONS = 5
CHECK_EVERY = timedelta(days=7)
RETRY_DEAD_EVERY = timedelta(days=30)
DEAD_AFTER_FAILURES = 3
EXTRACT_PAGES = 8
EXTRACT_SECONDS = 30
MAX_TEXT_CHARS = 200_000
COMPARE_WORDS = 6000

# Phrases that matter for lifecycle, as they appear in the text, lower case.
MARKERS = {
    "not recommended for new designs": ("not recommended for new design", "nrnd"),
    "obsolete": ("obsolete", "obsoleted"),
    "last time buy": ("last time buy", "last-time buy", "last buy"),
    "end of life": ("end of life", "end-of-life"),
    "discontinued": ("discontinued", "discontinuation"),
    "preliminary": ("preliminary", "advance information"),
}

_PDF = b"%PDF-"
_EXTRACTOR = r"""
import io, json, sys
from pypdf import PdfReader
data = sys.stdin.buffer.read()
reader = PdfReader(io.BytesIO(data))
total = len(reader.pages)
text = []
for page in reader.pages[:%d]:
    try:
        text.append(page.extract_text() or "")
    except Exception:
        text.append("")
sys.stdout.write(json.dumps({"pages": total, "text": "\n".join(text)[:%d]}))
"""


class DatasheetError(ValueError):
    """A datasheet could not be fetched or read. The message is safe to show."""


@dataclass(frozen=True, slots=True)
class Extracted:
    pages: int
    text: str


def archive_root() -> Path:
    configured = settings.CATALOG_ARTIFACT_ROOT.strip()
    base = Path(configured) if configured else Path(settings.KICAD_PROJECTS_ROOT) / ".kicad-prism"
    return base.expanduser().resolve() / "supply-datasheets"


def _blob(sha256: str, suffix: str = "") -> Path:
    if not re.fullmatch(r"[0-9a-f]{64}", sha256):
        raise DatasheetError("Invalid datasheet digest.")
    return archive_root() / sha256[:2] / f"{sha256}{suffix}"


def _write_once(path: Path, data: bytes) -> None:
    if path.exists():
        return
    path.parent.mkdir(parents=True, exist_ok=True)
    handle, temp = tempfile.mkstemp(dir=path.parent, prefix=".tmp-")
    try:
        with os.fdopen(handle, "wb") as out:
            out.write(data)
        os.replace(temp, path)
    except Exception:
        Path(temp).unlink(missing_ok=True)
        raise


def read_file(sha256: str) -> bytes | None:
    path = _blob(sha256)
    return path.read_bytes() if path.exists() else None


def keep_file(data: bytes) -> str:
    """Store a file by its hash (shared with datasheets) and return the hash. The same file is stored once."""

    sha = hashlib.sha256(data).hexdigest()
    _write_once(_blob(sha), data)
    return sha


MAX_HOST = 253


def host_of(url: str) -> str:
    """The host in an address, lower case, or an empty string."""

    return (urlsplit(url.strip()).hostname or "").lower()


def clean_host(text: str) -> str:
    """A host name from what an administrator typed (a bare host or a whole address). Raises DatasheetError if it is not one."""

    value = text.strip().lower()
    host = host_of(value) if "://" in value else value.split("/")[0].split(":")[0]
    if not host or len(host) > MAX_HOST or not re.fullmatch(r"[a-z0-9]([a-z0-9.-]*[a-z0-9])?", host) or ".." in host:
        raise DatasheetError("Enter a host name such as example.com.")
    return host


def denied_hosts(conn) -> list[dict[str, Any]]:
    return [
        {"host": row["host"], "reason": row["reason"], "added_by": row["added_by"], "created_at": row["created_at"].isoformat()}
        for row in conn.execute("SELECT host, reason, added_by, created_at FROM datasheet_denied_hosts ORDER BY host").fetchall()
    ]


def is_denied(conn, url: str) -> bool:
    """Whether the address is on a denied host or a subdomain of one."""

    host = host_of(url)
    if not host:
        return False
    return conn.execute(
        "SELECT 1 FROM datasheet_denied_hosts WHERE %s = host OR %s LIKE '%%.' || host LIMIT 1", (host, host)
    ).fetchone() is not None


def deny(conn, host: str, reason: str, actor: str) -> str:
    host = clean_host(host)
    conn.execute(
        "INSERT INTO datasheet_denied_hosts (host, reason, added_by) VALUES (%s, %s, %s) "
        "ON CONFLICT (host) DO UPDATE SET reason = EXCLUDED.reason",
        (host, reason.strip()[:300], actor),
    )
    write_audit(conn, actor, "datasheet.deny_host", host, {"reason": reason.strip()[:300]}, subject_kind="datasheet_host")
    return host


def allow(conn, host: str, actor: str) -> None:
    conn.execute("DELETE FROM datasheet_denied_hosts WHERE host = %s", (clean_host(host),))
    write_audit(conn, actor, "datasheet.allow_host", host.strip().lower(), {}, subject_kind="datasheet_host")


def fetch(url: str, client: Any | None = None) -> bytes:
    """The bytes at ``url`` if it is a PDF within the size cap."""

    if not url.lower().startswith("https://"):
        raise DatasheetError("The datasheet address is not HTTPS.")
    http = client or SafeHttpClient(None, max_bytes=MAX_BYTES)
    try:
        body = http.request("GET", url, headers={"Accept": "application/pdf,*/*;q=0.5"}).body
    except ProviderError as exc:
        raise DatasheetError(exc.code) from None
    if not body.startswith(_PDF):
        raise DatasheetError("not_a_pdf")
    return body


def extract(data: bytes) -> Extracted:
    """The text of the first pages, read in a child process so a hostile or broken file cannot take the worker down."""

    script = _EXTRACTOR % (EXTRACT_PAGES, MAX_TEXT_CHARS)
    kwargs: dict[str, Any] = {}
    if os.name == "posix":
        import resource

        def limit() -> None:
            resource.setrlimit(resource.RLIMIT_AS, (1 << 30, 1 << 30))

        kwargs["preexec_fn"] = limit
    try:
        done = subprocess.run(  # noqa: S603 - fixed interpreter and script, the file goes to stdin
            [sys.executable, "-I", "-c", script], input=data, capture_output=True, timeout=EXTRACT_SECONDS, **kwargs,
        )
    except subprocess.TimeoutExpired:
        raise DatasheetError("unreadable") from None
    if done.returncode != 0:
        raise DatasheetError("unreadable")
    try:
        parsed = json.loads(done.stdout.decode("utf-8"))
        return Extracted(int(parsed["pages"]), str(parsed["text"]))
    except (ValueError, KeyError, UnicodeDecodeError):
        raise DatasheetError("unreadable") from None


def markers_in(text: str) -> list[str]:
    lowered = text.lower()
    return sorted(name for name, needles in MARKERS.items() if any(needle in lowered for needle in needles))


def _words(text: str) -> list[str]:
    return re.findall(r"[A-Za-z0-9.+%/-]+", text)[:COMPARE_WORDS]


def summarize_change(old_text: str, new_text: str, old_markers: list[str], new_markers: list[str]) -> str:
    """One or two sentences on what differs from the version before."""

    parts = []
    before, after = _words(old_text), _words(new_text)
    if before and after:
        similarity = difflib.SequenceMatcher(None, before, after, autojunk=False).ratio()
        changed = round((1 - similarity) * 100)
        parts.append("The text is the same." if changed == 0 else f"About {changed}% of the first pages' text changed.")
    else:
        parts.append("The file changed; no text could be compared.")
    added = [marker for marker in new_markers if marker not in old_markers]
    gone = [marker for marker in old_markers if marker not in new_markers]
    if added:
        parts.append(f"Now mentions: {', '.join(added)}.")
    if gone:
        parts.append(f"No longer mentions: {', '.join(gone)}.")
    return " ".join(parts)


def _record_check(conn, part_id: str, url: str, now: datetime, status: str, *, failed: bool) -> None:
    conn.execute(
        """
        INSERT INTO datasheet_checks (part_id, url, checked_at, status, failures) VALUES (%s, %s, %s, %s, %s)
        ON CONFLICT (part_id) DO UPDATE SET url = EXCLUDED.url, checked_at = EXCLUDED.checked_at, status = EXCLUDED.status,
            failures = CASE WHEN %s THEN datasheet_checks.failures + 1 ELSE 0 END
        """,
        (part_id, url, now, status, 1 if failed else 0, failed),
    )


def store_version(conn, part_id: str, url: str, data: bytes, now: datetime) -> dict[str, Any] | None:
    """Keep ``data`` as the part's newest datasheet unless that exact file is already kept. Returns the new version row."""

    sha = hashlib.sha256(data).hexdigest()
    if conn.execute("SELECT 1 FROM datasheets WHERE part_id = %s AND sha256 = %s", (part_id, sha)).fetchone():
        return None
    extracted = extract(data)
    text_sha = hashlib.sha256(extracted.text.encode("utf-8")).hexdigest()
    found = markers_in(extracted.text)
    latest = conn.execute(
        "SELECT version, sha256, markers FROM datasheets WHERE part_id = %s ORDER BY version DESC LIMIT 1", (part_id,)
    ).fetchone()
    summary = ""
    if latest is not None:
        old = _blob(latest["sha256"], ".txt")
        old_text = old.read_text(encoding="utf-8") if old.exists() else ""
        summary = summarize_change(old_text, extracted.text, list(latest["markers"]), found)
    _write_once(_blob(sha), data)
    _write_once(_blob(sha, ".txt"), extracted.text.encode("utf-8"))
    version = (latest["version"] if latest else 0) + 1
    datasheet_id = uuid.uuid4().hex
    conn.execute(
        """
        INSERT INTO datasheets (id, part_id, version, url, sha256, size_bytes, pages, text_sha256, markers, change_summary, fetched_at)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """,
        (datasheet_id, part_id, version, url, sha, len(data), extracted.pages, text_sha, found, summary, now),
    )
    _prune(conn, part_id)
    return {"id": datasheet_id, "version": version, "change_summary": summary, "markers": found}


def _prune(conn, part_id: str) -> None:
    """Drop the oldest versions beyond the cap, and files nothing refers to any more."""

    old = conn.execute(
        "SELECT id, sha256 FROM datasheets WHERE part_id = %s ORDER BY version DESC OFFSET %s", (part_id, KEEP_VERSIONS)
    ).fetchall()
    for row in old:
        conn.execute("DELETE FROM datasheets WHERE id = %s", (row["id"],))
        if not conn.execute("SELECT 1 FROM datasheets WHERE sha256 = %s", (row["sha256"],)).fetchone():
            for suffix in ("", ".txt"):
                _blob(row["sha256"], suffix).unlink(missing_ok=True)


def due_parts(conn, now: datetime, limit: int) -> list[dict[str, Any]]:
    """Watched parts and parts on project BOMs with a datasheet address that has not been checked lately."""

    rows = conn.execute(
        """
        SELECT p.id, p.datasheet_url, c.checked_at, COALESCE(c.failures, 0) AS failures,
               (w.part_id IS NOT NULL) AS watched
        FROM parts p
        LEFT JOIN datasheet_checks c ON c.part_id = p.id
        LEFT JOIN watches w ON w.part_id = p.id
        WHERE p.datasheet_url <> ''
          AND (w.part_id IS NOT NULL OR EXISTS (
                SELECT 1 FROM bom_usage u WHERE u.match_key = p.match_key))
          AND (c.checked_at IS NULL
               OR (COALESCE(c.failures, 0) < %s AND c.checked_at <= %s)
               OR (COALESCE(c.failures, 0) >= %s AND c.checked_at <= %s))
        ORDER BY (c.checked_at IS NOT NULL), (w.part_id IS NULL), c.checked_at NULLS FIRST, p.id
        LIMIT %s
        """,
        (DEAD_AFTER_FAILURES, now - CHECK_EVERY, DEAD_AFTER_FAILURES, now - RETRY_DEAD_EVERY, limit),
    ).fetchall()
    return [dict(row) for row in rows]


def check_part(store, part_id: str, url: str, now: datetime, client: Any | None = None) -> str:
    """Fetch one datasheet and keep it if it is new. Returns ``new``, ``unchanged`` or the failure code."""

    try:
        with store.connection() as conn:
            if is_denied(conn, url):
                raise DatasheetError("host_denied")
        data = fetch(url, client)
        with store.connection() as conn:
            created = store_version(conn, part_id, url, data, now)
            _record_check(conn, part_id, url, now, "new" if created else "unchanged", failed=False)
        return "new" if created else "unchanged"
    except psycopg.errors.UniqueViolation:
        # Another poll job kept the same version first; its copy is the one that counts.
        return "unchanged"
    except DatasheetError as exc:
        with store.connection() as conn:
            _record_check(conn, part_id, url, now, str(exc), failed=True)
        return str(exc)


def run_due(store, now: datetime | None = None, limit: int = 2, client: Any | None = None) -> dict[str, int]:
    """Check up to ``limit`` due datasheets. Called from the supply poll job, which keeps it a few at a time."""

    moment = now or datetime.now(timezone.utc)
    with store.connection() as conn:
        due = due_parts(conn, moment, limit)
    tally: dict[str, int] = {}
    for row in due:
        outcome = check_part(store, row["id"], row["datasheet_url"], moment, client)
        if outcome == "new":
            with store.connection() as conn:
                alerts.evaluate_parts(conn, [row["id"]], moment)
        tally[outcome] = tally.get(outcome, 0) + 1
    return tally


def list_versions(conn, part_id: str) -> list[dict[str, Any]]:
    rows = conn.execute(
        "SELECT id, version, url, sha256, size_bytes, pages, markers, change_summary, fetched_at FROM datasheets "
        "WHERE part_id = %s ORDER BY version DESC",
        (part_id,),
    ).fetchall()
    return [
        {
            "id": row["id"], "version": row["version"], "url": row["url"], "size_bytes": row["size_bytes"], "pages": row["pages"],
            "markers": list(row["markers"]), "change_summary": row["change_summary"], "fetched_at": row["fetched_at"].isoformat(),
        }
        for row in rows
    ]


def file_of(conn, datasheet_id: str) -> tuple[str, bytes] | None:
    """(file name, bytes) of a kept version, or None."""

    row = conn.execute(
        "SELECT d.sha256, d.version, p.mpn FROM datasheets d JOIN parts p ON p.id = d.part_id WHERE d.id = %s", (datasheet_id,)
    ).fetchone()
    if row is None:
        return None
    data = read_file(row["sha256"])
    if data is None:
        return None
    safe = re.sub(r"[^A-Za-z0-9._-]+", "_", row["mpn"])[:60] or "datasheet"
    return f"{safe}-v{row['version']}.pdf", data
