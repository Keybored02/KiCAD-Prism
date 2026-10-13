"""What the background worker said about itself, so health can tell when it runs older code than the server.

A worker does not reload. After an update, a worker started earlier can miss a provider added since, and it then
skips that provider's connectors without an error. Each scan the worker records the providers it knows and the
newest change time among the supply code it loaded; health compares both with the server's.
"""

from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from app.services.supply.providers import registry

_PACKAGE = Path(__file__).resolve().parent


def _newest_change() -> float:
    return max((path.stat().st_mtime for path in _PACKAGE.rglob("*.py")), default=0.0)


# Fixed when the process starts: it describes the code this process loaded, not what is on disk now.
CODE_STAMP = _newest_change()


def record(conn, now: datetime | None = None) -> None:
    """Called by the worker on each scan."""

    conn.execute(
        """
        INSERT INTO worker_seen (id, providers, code_stamp, seen_at) VALUES (1, %s, %s, %s)
        ON CONFLICT (id) DO UPDATE SET providers = EXCLUDED.providers, code_stamp = EXCLUDED.code_stamp, seen_at = EXCLUDED.seen_at
        """,
        (sorted(spec.key for spec in registry.list_specs(include_dev=True)), CODE_STAMP, now or datetime.now(timezone.utc)),
    )


def status(conn, now: datetime | None = None) -> dict[str, Any]:
    """The worker's last report against this process: when it was seen, whether its code is older, which providers it lacks."""

    now = now or datetime.now(timezone.utc)
    row = conn.execute("SELECT providers, code_stamp, seen_at FROM worker_seen WHERE id = 1").fetchone()
    if row is None:
        return {"seen_at": None, "older_than_server": False, "missing_providers": []}
    mine = {spec.key for spec in registry.list_specs(include_dev=True)}
    return {
        "seen_at": row["seen_at"].isoformat(),
        "older_than_server": float(row["code_stamp"]) + 1 < CODE_STAMP,
        "missing_providers": sorted(mine - set(row["providers"])),
    }
