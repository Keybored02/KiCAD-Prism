"""Persistence for the KiCad path libraries an administrator declares (``ws_kicad_libraries``).

The row is the declaration (name, variables, source) and the fetch's reported
state. Whether a library resolves is decided by the clone's ready marker on
disk, not by ``state``, so a stale row never binds a variable to a missing
folder. Every write forgets the resolver's cached rows in this process; the
others pick it up within its TTL.
"""

from __future__ import annotations

from contextlib import contextmanager
from datetime import datetime, timezone
from typing import Any, Iterator

from psycopg.types.json import Jsonb

from app.core.errors import Conflict, Invalid, NotFound
from app.services import kicad_libraries
from app.services.postgres_database import database

STATES = ("pending", "fetching", "ready", "failed")
#: ``update``'s "leave this column alone" marker.
UNSET = object()

_COLUMNS = (
    "name, variables, git_url, ref, subdir, path, state, error, progress, size_bytes, "
    "fetched_at, created_at, updated_at, updated_by"
)


@contextmanager
def connect() -> Iterator[Any]:
    with database.connection() as conn:
        conn.execute("SET search_path TO workspace, public")
        yield conn


def declared() -> list[dict[str, Any]]:
    """Every row, in the form :func:`kicad_libraries.validate_entry` takes."""

    with connect() as conn:
        rows = conn.execute("SELECT name, variables, git_url, ref, subdir, path FROM ws_kicad_libraries ORDER BY name").fetchall()
    return [
        {
            "name": row["name"],
            "variables": row["variables"],
            "git": row["git_url"],
            "ref": row["ref"],
            "subdir": row["subdir"],
            "path": row["path"],
        }
        for row in rows
    ]


def list_all() -> list[dict[str, Any]]:
    with connect() as conn:
        return [_view(row) for row in conn.execute(f"SELECT {_COLUMNS} FROM ws_kicad_libraries ORDER BY name").fetchall()]


def list_views() -> list[dict[str, Any]]:
    """Every library in force for the console: the environment's stock preset (locked), then the declared ones."""

    views = [_stock_view(stock)] if (stock := kicad_libraries.preset()) is not None else []
    return views + list_all()


def get(name: str) -> dict[str, Any]:
    with connect() as conn:
        row = conn.execute(f"SELECT {_COLUMNS} FROM ws_kicad_libraries WHERE name = %s", (name,)).fetchone()
    if row is None:
        raise NotFound(f"There is no library named {name}")
    return _view(row)


def create(fields: dict[str, Any], *, updated_by: str) -> dict[str, Any]:
    """Declare a library; it is fetched afterwards. Raises ``Invalid`` or ``Conflict``."""

    library = _checked(fields)
    with connect() as conn:
        taken = _taken_variables(conn, exclude=None)
        _require_free(library, taken)
        try:
            row = conn.execute(
                f"""
                INSERT INTO ws_kicad_libraries (name, variables, git_url, ref, subdir, path, updated_by)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                RETURNING {_COLUMNS}
                """,
                (
                    library.name,
                    Jsonb(list(library.variables)),
                    library.git or None,
                    library.ref or None,
                    library.subdir,
                    library.path or None,
                    updated_by,
                ),
            ).fetchone()
        except Exception as error:
            if getattr(error, "sqlstate", "") == "23505":
                raise Conflict(f"A library named {library.name} already exists") from error
            raise
    kicad_libraries.forget_rows()
    return _view(row)


def update(name: str, fields: dict[str, Any], *, updated_by: str) -> dict[str, Any]:
    """Change a declaration. A new source or ref resets the fetch to ``pending``."""

    current = get(name)
    merged = {
        "name": name,
        "variables": fields.get("variables", current["variables"]),
        "git": fields.get("git", current["git"]),
        "ref": fields.get("ref", current["ref"]),
        "subdir": fields.get("subdir", current["subdir"]),
        "path": fields.get("path", current["path"]),
    }
    library = _checked(merged)
    changed_source = (library.git, library.ref, library.subdir, library.path) != (
        current["git"] or "",
        current["ref"] or "",
        current["subdir"] or "",
        current["path"] or "",
    )
    with connect() as conn:
        _require_free(library, _taken_variables(conn, exclude=name))
        row = conn.execute(
            f"""
            UPDATE ws_kicad_libraries
               SET variables = %s, git_url = %s, ref = %s, subdir = %s, path = %s,
                   state = CASE WHEN %s THEN 'pending' ELSE state END,
                   error = CASE WHEN %s THEN NULL ELSE error END,
                   updated_at = now(), updated_by = %s
             WHERE name = %s
            RETURNING {_COLUMNS}
            """,
            (
                Jsonb(list(library.variables)),
                library.git or None,
                library.ref or None,
                library.subdir,
                library.path or None,
                changed_source,
                changed_source,
                updated_by,
                name,
            ),
        ).fetchone()
    kicad_libraries.forget_rows()
    return _view(row)


def delete(name: str) -> None:
    with connect() as conn:
        deleted = conn.execute("DELETE FROM ws_kicad_libraries WHERE name = %s", (name,)).rowcount
    if not deleted:
        raise NotFound(f"There is no library named {name}")
    kicad_libraries.forget_rows()


def record_fetch(
    name: str,
    *,
    state: str,
    error: str | None | object = UNSET,
    progress: int | None | object = UNSET,
    size_bytes: int | None | object = UNSET,
) -> None:
    """The fetch's progress, as the console shows it; a deleted library is not an error."""

    if state not in STATES:
        raise Invalid(f"Unknown fetch state {state!r}")
    sets, values = ["state = %s", "updated_at = now()"], [state]
    for column, value in (("error", error), ("progress", progress), ("size_bytes", size_bytes)):
        if value is not UNSET:
            sets.append(f"{column} = %s")
            values.append(value)
    if state == "ready":
        sets.append("fetched_at = %s")
        values.append(datetime.now(timezone.utc))
    with connect() as conn:
        conn.execute(f"UPDATE ws_kicad_libraries SET {', '.join(sets)} WHERE name = %s", (*values, name))


def _checked(fields: dict[str, Any]) -> kicad_libraries.Library:
    try:
        return kicad_libraries.validate_entry(fields)
    except ValueError as error:
        raise Invalid(str(error)) from error


def _taken_variables(conn: Any, *, exclude: str | None) -> dict[str, str]:
    """Variable to the library that binds it, the environment's stock preset included."""

    taken: dict[str, str] = {}
    stock = kicad_libraries.preset()
    if stock is not None:
        taken.update({variable: stock.name for variable in stock.variables})
    for row in conn.execute("SELECT name, variables FROM ws_kicad_libraries").fetchall():
        if row["name"] != exclude:
            taken.update({variable: row["name"] for variable in row["variables"]})
    return taken


def _require_free(library: kicad_libraries.Library, taken: dict[str, str]) -> None:
    for variable in library.variables:
        if variable in taken:
            raise Conflict(f"{variable} is already bound by the library {taken[variable]}")


def _stock_view(stock: kicad_libraries.Library) -> dict[str, Any]:
    return {
        "name": stock.name,
        "variables": list(stock.variables),
        "git": stock.git,
        "ref": stock.ref,
        "subdir": "",
        "path": "",
        "state": "ready" if stock.ready else "pending",
        "error": None,
        "progress": None,
        "sizeBytes": None,
        "fetchedAt": None,
        "createdAt": None,
        "updatedAt": None,
        "updatedBy": "",
        "ready": stock.ready,
        "locked": True,
    }


def _ready(row: dict[str, Any]) -> bool:
    """Whether the library resolves now: the disk's answer, not the row's ``state``."""

    try:
        return kicad_libraries.validate_entry(
            {
                "name": row["name"],
                "variables": row["variables"],
                "git": row["git_url"],
                "ref": row["ref"],
                "subdir": row["subdir"],
                "path": row["path"],
            }
        ).ready
    except ValueError:
        return False


def _view(row: dict[str, Any]) -> dict[str, Any]:
    return {
        "name": row["name"],
        "variables": list(row["variables"]),
        "git": row["git_url"] or "",
        "ref": row["ref"] or "",
        "subdir": row["subdir"] or "",
        "path": row["path"] or "",
        "state": row["state"],
        "error": row["error"],
        "progress": row["progress"],
        "sizeBytes": row["size_bytes"],
        "fetchedAt": row["fetched_at"],
        "createdAt": row["created_at"],
        "updatedAt": row["updated_at"],
        "updatedBy": row["updated_by"],
        "ready": _ready(row),
        "locked": False,
    }
