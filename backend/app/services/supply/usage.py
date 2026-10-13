"""Where parts are used: the parts on each project's BOM.

Read from the projects' semantic indexes that already exist; nothing here builds one, so a
refresh is cheap and a project nobody has opened yet is simply absent. A project's rows are
replaced only when its source revision changed. Only the base design is read (not variants).

A usage row is a part number key and a manufacturer spelling key, so it can be matched to a
supply part later, however the part got into Prism. ``MATCHES_PART`` is that match as SQL.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import Any, Callable, Iterable, Mapping, Sequence

from app.services.supply.bom_fields import identity_of, is_fitted, lcsc_of, prism_id_of
from app.services.supply.identity import alias_key, match_key

MAX_REFERENCES_TEXT = 500

# A usage row `u` is a use of the part `p` (manufacturer `m`) when the numbers match and the
# manufacturer is blank, is the part's own name, or is a confirmed spelling of it.
MATCHES_PART = """
    u.match_key = p.match_key AND (
        u.alias_key = '' OR u.alias_key = m.name_key OR EXISTS (
            SELECT 1 FROM manufacturer_aliases a
            WHERE a.alias_key = u.alias_key AND a.manufacturer_id = p.manufacturer_id AND a.status = 'confirmed'
        )
    )
"""


# With the caller's role twice as parameters ([role, role]); None means every project, for internal callers.
VISIBLE = "(%s::text IS NULL OR %s = ANY(up.visible_roles))"
ALL_ROLES: tuple[str, ...] = ("admin", "designer", "qa")


def role_params(role: str | None) -> list[str | None]:
    return [role, role]


@dataclass(frozen=True, slots=True)
class UsageLine:
    key: str
    manufacturer: str
    mpn: str
    alias_key: str
    match_key: str
    quantity: int
    references: str
    lcsc: str = ""


Identities = Callable[[Iterable[str]], Mapping[str, tuple[str, str]]]


def lines_from_components(components: Iterable[Mapping[str, Any]], identities: Identities | None = None) -> list[UsageLine]:
    """The distinct parts among the fitted components, with how many go on one board. No number, no line.

    A symbol carrying a ``Prism ID`` that ``identities`` knows takes the library component's manufacturer
    and part number, whatever its own fields say (plan 6.4, step 1).
    """

    fitted = [component for component in components if is_fitted(component.get("fields") or {})]
    library: Mapping[str, tuple[str, str]] = {}
    if identities is not None:
        library = identities({prism_id_of(component.get("fields") or {}) for component in fitted} - {""})
    found: dict[str, dict[str, Any]] = {}
    for component in fitted:
        fields = component.get("fields") or {}
        placed = library.get(prism_id_of(fields))
        # A component without a part number yet says nothing; the symbol's own fields stay.
        manufacturer, mpn = placed if placed and placed[1].strip() else identity_of(fields)
        number = match_key(mpn)
        if not number:
            continue
        key = f"{alias_key(manufacturer)}|{number}"
        line = found.setdefault(key, {"manufacturer": manufacturer, "mpn": mpn, "alias": alias_key(manufacturer), "number": number, "refs": [], "lcsc": ""})
        line["refs"].append(str(component.get("reference") or ""))
        line["lcsc"] = line["lcsc"] or lcsc_of(fields)
    return [
        UsageLine(key, line["manufacturer"], line["mpn"], line["alias"], line["number"], len(line["refs"]),
                  " ".join(sorted(ref for ref in line["refs"] if ref))[:MAX_REFERENCES_TEXT], line["lcsc"])
        for key, line in found.items()
    ]


def store_project(
    conn,
    project_id: str,
    project_name: str,
    revision_key: str,
    lines: list[UsageLine],
    now: datetime,
    visible_roles: Sequence[str] = ALL_ROLES,
) -> bool:
    """Replace a project's rows. Returns False, doing nothing, when this revision is already stored."""

    current = conn.execute("SELECT revision_key FROM bom_usage_projects WHERE project_id = %s", (project_id,)).fetchone()
    if current and current["revision_key"] == revision_key:
        conn.execute(
            "UPDATE bom_usage_projects SET project_name = %s, visible_roles = %s WHERE project_id = %s",
            (project_name, list(visible_roles), project_id),
        )
        return False
    conn.execute("DELETE FROM bom_usage WHERE project_id = %s", (project_id,))
    conn.execute(
        """
        INSERT INTO bom_usage_projects (project_id, project_name, revision_key, line_count, updated_at, visible_roles)
        VALUES (%s, %s, %s, %s, %s, %s)
        ON CONFLICT (project_id) DO UPDATE SET project_name = EXCLUDED.project_name, revision_key = EXCLUDED.revision_key,
            line_count = EXCLUDED.line_count, updated_at = EXCLUDED.updated_at, visible_roles = EXCLUDED.visible_roles
        """,
        (project_id, project_name, revision_key, len(lines), now, list(visible_roles)),
    )
    for line in lines:
        conn.execute(
            "INSERT INTO bom_usage (project_id, line_key, manufacturer, mpn, alias_key, match_key, quantity, refs, lcsc) "
            "VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)",
            (project_id, line.key, line.manufacturer, line.mpn, line.alias_key, line.match_key, line.quantity, line.references,
             line.lcsc),
        )
    return True


def refresh(
    conn,
    projects: Iterable[Any],
    existing_index: Callable[[Any], Mapping[str, Any] | None],
    now: datetime,
    visible_roles: Mapping[str, Sequence[str]] | None = None,
    identities: Identities | None = None,
) -> dict[str, int]:
    """Bring usage up to date with the semantic indexes that exist.

    ``projects`` have ``id`` and ``name``; ``existing_index`` returns a project's index or None.
    Projects that are gone from the registry lose their rows. ``visible_roles`` says, per project id,
    which supply roles may see it; a project not in it is visible to all.
    """

    seen: set[str] = set()
    updated = skipped = missing = 0
    for project in projects:
        seen.add(str(project.id))
        try:
            payload = existing_index(project)
        except Exception:  # an unreadable index is one project's problem, not the refresh's
            payload = None
        if not payload:
            missing += 1
            continue
        lines = lines_from_components(payload.get("components") or [], identities)
        revision = str(payload.get("sourceRevisionKey") or "")
        roles = (visible_roles or {}).get(str(project.id), ALL_ROLES)
        if store_project(conn, str(project.id), str(project.name), revision, lines, now, roles):
            updated += 1
        else:
            skipped += 1
    gone = [row["project_id"] for row in conn.execute("SELECT project_id FROM bom_usage_projects").fetchall() if row["project_id"] not in seen]
    for project_id in gone:
        conn.execute("DELETE FROM bom_usage_projects WHERE project_id = %s", (project_id,))
    return {"updated": updated, "unchanged": skipped, "without_index": missing, "removed": len(gone)}


def project_rows(conn, project_id: str) -> list[dict[str, Any]]:
    """The stored BOM lines of a project (manufacturer, number, quantity per board); empty when it was never read."""

    rows = conn.execute(
        "SELECT line_key, manufacturer, mpn, quantity, refs, lcsc FROM bom_usage WHERE project_id = %s ORDER BY line_key", (project_id,)
    ).fetchall()
    return [
        {"key": row["line_key"], "manufacturer": row["manufacturer"], "mpn": row["mpn"], "quantity": int(row["quantity"]),
         "references": row["refs"], "lcsc": row["lcsc"]}
        for row in rows
    ]


def used_in(conn, part_id: str, role: str | None = None) -> list[dict[str, Any]]:
    """The projects whose BOM carries this part and that ``role`` may see, most parts first."""

    rows = conn.execute(
        f"""
        SELECT u.project_id, up.project_name, SUM(u.quantity) AS quantity, LEFT(string_agg(u.refs, ' '), 500) AS refs
        FROM parts p
        JOIN manufacturers m ON m.id = p.manufacturer_id
        JOIN bom_usage u ON {MATCHES_PART}
        JOIN bom_usage_projects up ON up.project_id = u.project_id
        WHERE p.id = %s AND {VISIBLE}
        GROUP BY u.project_id, up.project_name
        ORDER BY SUM(u.quantity) DESC, lower(up.project_name)
        """,
        [part_id, *role_params(role)],
    ).fetchall()
    return [
        {"project_id": row["project_id"], "project_name": row["project_name"], "quantity": int(row["quantity"]), "references": row["refs"]}
        for row in rows
    ]
