"""What Prism follows, and why: tracked projects, a person's tier choices, and the tier each part ends up in.

Tier 1 is read daily, tier 2 weekly or monthly, tier 3 (everything else) only when someone asks. A part's tier is the
highest any source gives it, and ``part_tiers`` keeps the sources as its reasons:

* ``project``: a part on a chosen variant of a tracked project (tier 1)
* ``person``: a watch someone set at a tier
* ``component``: a watch made for a catalog component or its approved alternate
* ``legacy``: a watch from before tiers existed (tier 2)

Functions on a connection; none commit. ``recompute`` is the one place ``part_tiers`` is written.
"""

from __future__ import annotations

import json
from datetime import datetime, timezone
from typing import Any, Iterable, Sequence

from app.services.supply import admission, packaging_auto, parts, usage
from app.services.supply.providers import registry
from app.services.supply.audit import actor_text, write_audit
from app.services.supply.identity import alias_key, match_key

TIER_1, TIER_2 = 1, 2
RATES = ("daily", "weekly", "monthly")
# How often each rate reads, in days. A part with two tier-2 reasons takes the shorter.
RATE_DAYS = {"daily": 1, "weekly": 7, "monthly": 30}
BASE_VARIANT = ""
MAX_PROJECT_PARTS = 5000


class TrackingError(ValueError):
    """The request breaks a tracking rule. The message is safe to show."""


def check_tier(tier: Any, rate: Any) -> tuple[int, str]:
    """A valid tier and rate pair. Tier 1 is always daily; tier 2 is weekly or monthly."""

    if tier == TIER_1:
        return TIER_1, "daily"
    if tier == TIER_2:
        if rate not in ("weekly", "monthly"):
            raise TrackingError("Tier 2 is read weekly or monthly.")
        return TIER_2, rate
    raise TrackingError("The tier is 1 or 2.")


# --- projects ---------------------------------------------------------------


_PROJECT_COLUMNS = "project_id, variants, all_variants, packaging, excluded_ids, assembly_ids, tracked_by, tracked_at"


def _kinds(conn) -> tuple[set[str], set[str]]:
    """Connector ids that are regular distributors, and those that are assembly-only."""

    regular, assembly = set(), set()
    for row in conn.execute("SELECT id, provider FROM connectors").fetchall():
        try:
            only = registry.get_spec(row["provider"]).assembly_only
        except registry.UnknownProvider:
            only = False
        (assembly if only else regular).add(row["id"])
    return regular, assembly


def _with_choice(conn, row: Any) -> dict[str, Any]:
    """A stored project with ``connector_ids`` as the dialog shows it: None for every regular distributor, otherwise the list
    of today's connectors it is read at."""

    found = dict(row)
    excluded, assembly = found.pop("excluded_ids") or [], found.pop("assembly_ids") or []
    if not excluded and not assembly:
        found["connector_ids"] = None
    else:
        regular, _ = _kinds(conn)
        found["connector_ids"] = sorted(regular - set(excluded)) + sorted(assembly)
    return found


def tracked_project(conn, project_id: str) -> dict[str, Any] | None:
    row = conn.execute(f"SELECT {_PROJECT_COLUMNS} FROM tracked_projects WHERE project_id = %s", (project_id,)).fetchone()
    return _with_choice(conn, row) if row else None


def list_tracked_projects(conn) -> list[dict[str, Any]]:
    rows = conn.execute(f"SELECT {_PROJECT_COLUMNS} FROM tracked_projects ORDER BY project_id").fetchall()
    return [_with_choice(conn, row) for row in rows]


def project_parts(conn, project_id: str, variants: Sequence[str]) -> list[dict[str, Any]]:
    """The stored BOM lines of a project's variants that carry a manufacturer and a part number."""

    rows = conn.execute(
        f"""
        SELECT DISTINCT u.manufacturer, u.mpn FROM {usage.ALL_USES} u
        WHERE u.project_id = %s AND u.variant = ANY(%s) AND u.match_key <> ''
        ORDER BY u.manufacturer, u.mpn LIMIT %s
        """,
        (project_id, list(variants), MAX_PROJECT_PARTS),
    ).fetchall()
    return [dict(row) for row in rows]


def _stored_variants(conn, project_id: str) -> set[str]:
    return {row["variant"] for row in conn.execute(
        "SELECT DISTINCT variant FROM bom_usage_variants WHERE project_id = %s", (project_id,)
    ).fetchall()} | {BASE_VARIANT}


def follow_new_variants(conn, project_id: str) -> bool:
    """For a project that follows every design: take in the ones its newest BOM has. True when the list changed."""

    row = conn.execute("SELECT variants, all_variants FROM tracked_projects WHERE project_id = %s", (project_id,)).fetchone()
    if not row or not row["all_variants"]:
        return False
    now = sorted(_stored_variants(conn, project_id))
    if now == sorted(row["variants"]):
        return False
    conn.execute("UPDATE tracked_projects SET variants = %s WHERE project_id = %s", (now, project_id))
    return True


def track_project(
    conn,
    project_id: str,
    variants: Iterable[str],
    actor: str,
    *,
    connector_ids: Sequence[str] | None = None,
    may_create_manufacturer: bool = True,
    all_variants: bool = False,
    packaging: str = "cut_tape",
) -> dict[str, Any]:
    """Track a project: its chosen variants' parts join tier 1. Returns what was tracked and what was skipped.

    ``variants`` names the designs; ``''`` is the base design. ``connector_ids`` limits the distributors the project's
    parts are read at (None: every distributor but those that are assembly-only). It is stored as what is left out, so a
    distributor added later is used for the project too; assembly-only ones are used only when named. With ``all_variants`` the
    project follows every design it has now and any it gets later (``variants`` is then ignored).
    """

    actor = actor_text(actor)
    if packaging not in packaging_auto.PACKAGINGS:
        raise TrackingError("The packaging is cut tape, custom reel, full reel, tube or tray, or the smallest order.")
    chosen = list(dict.fromkeys(variants)) or [BASE_VARIANT]
    if not conn.execute("SELECT 1 FROM bom_usage_projects WHERE project_id = %s", (project_id,)).fetchone():
        raise TrackingError("Prism has not read this project's BOM yet. Open its Visualizers once so the BOM is built.")
    stored = _stored_variants(conn, project_id)
    if all_variants:
        chosen = sorted(stored)
    unknown = [name for name in chosen if name not in stored]
    if unknown:
        raise TrackingError(f"This project has no design variant named {unknown[0]!r}.")
    skipped: list[dict[str, Any]] = []
    created = 0
    for line in project_parts(conn, project_id, chosen):
        try:
            with conn.transaction():
                before = parts.find_part(conn, line["manufacturer"], line["mpn"])
                parts.ensure_part(conn, line["manufacturer"], line["mpn"], actor, may_create=may_create_manufacturer)
                created += 0 if before else 1
        except parts.UnknownManufacturer:
            # Several makers have this number and the line does not say which: a person picks (section 11 of the plan).
            skipped.append({
                "mpn": line["mpn"], "reason": "needs_choice", "manufacturer": line["manufacturer"].strip(),
                "candidates": [
                    {"part_id": row["id"], "manufacturer": row["name"]}
                    for row in conn.execute(
                        "SELECT p.id, m.name FROM parts p JOIN manufacturers m ON m.id = p.manufacturer_id WHERE p.match_key = %s ORDER BY lower(m.name)",
                        (match_key(line["mpn"]),),
                    ).fetchall()
                ],
            })
    excluded: list[str] = []
    built_at: list[str] = []
    if connector_ids is not None:
        regular, assembly = _kinds(conn)
        named = set(connector_ids)
        excluded, built_at = sorted(regular - named), sorted(named & assembly)
    conn.execute(
        """
        INSERT INTO tracked_projects (project_id, variants, all_variants, packaging, excluded_ids, assembly_ids, tracked_by) VALUES (%s, %s, %s, %s, %s, %s, %s)
        ON CONFLICT (project_id) DO UPDATE SET variants = EXCLUDED.variants, all_variants = EXCLUDED.all_variants, packaging = EXCLUDED.packaging, excluded_ids = EXCLUDED.excluded_ids,
            assembly_ids = EXCLUDED.assembly_ids
        """,
        (project_id, chosen, all_variants, packaging, excluded, built_at, actor),
    )
    write_audit(conn, actor, "tracking.project", project_id,
                {"variants": chosen, "all_variants": all_variants, "packaging": packaging, "connector_ids": list(connector_ids) if connector_ids is not None else None},
                subject_kind="project")
    recompute(conn)
    # The distributors may have changed without any tier changing.
    admission.sync(conn)
    # Picks Prism made follow the packaging asked for now; a person's picks stay.
    packaging_auto.repick(conn, project_id)
    return {"project_id": project_id, "variants": chosen, "parts_created": created, "skipped": skipped}


def project_open(conn, project_id: str) -> dict[str, Any]:
    """What a tracked project still waits on a person for: parts whose maker is not settled, and lines several makers share."""

    from app.services.supply import settle

    ids = {row["id"] for row in conn.execute(
        "SELECT DISTINCT p.id FROM parts p JOIN manufacturers m ON m.id = p.manufacturer_id JOIN " + usage.ALL_USES + " u ON " + usage.MATCHES_PART + " WHERE u.project_id = %s",
        (project_id,),
    ).fetchall()}
    variants = ((tracked_project(conn, project_id) or {}).get("variants")) or [BASE_VARIANT]
    lines = []
    for line in project_parts(conn, project_id, variants):
        written = line["manufacturer"].strip()
        key = match_key(line["mpn"])
        if (alias_key(written) and (parts.similar_manufacturer(conn, written) or False)) or not key:
            continue
        found = conn.execute(
            "SELECT p.id, m.name FROM parts p JOIN manufacturers m ON m.id = p.manufacturer_id WHERE p.match_key = %s ORDER BY lower(m.name)", (key,)
        ).fetchall()
        if len(found) > 1 and not any(alias_key(written) in parts.part_spelling_keys(conn, row["id"]) for row in found):
            lines.append({"mpn": line["mpn"], "manufacturer": written, "candidates": [{"part_id": row["id"], "manufacturer": row["name"]} for row in found]})
    return {"choices": settle.needs_choice(conn, ids), "lines": lines}


def project_progress(conn, project_id: str) -> dict[str, Any]:
    """How far the first searches of a tracked project's parts have got, per distributor it is read at."""

    ids = [row["part_id"] for row in conn.execute(
        "SELECT part_id FROM part_tiers WHERE reasons @> %s::jsonb", (json.dumps([{"kind": "project", "ref": project_id}]),)
    ).fetchall()]
    connectors = conn.execute(
        """
        SELECT c.id, c.display_name, COUNT(DISTINCT a.part_id) AS admitted, COUNT(DISTINCT d.part_id) AS searched
        FROM connectors c
        LEFT JOIN admissions a ON a.connector_id = c.id AND a.part_id = ANY(%s) AND a.state = 'admitted'
        LEFT JOIN discovery_runs d ON d.connector_id = c.id AND d.part_id = ANY(%s)
        WHERE c.enabled GROUP BY c.id, c.display_name ORDER BY lower(c.display_name)
        """,
        (ids, ids),
    ).fetchall()
    rows = [
        {"connector_id": row["id"], "name": row["display_name"], "parts": int(row["admitted"]), "searched": min(int(row["searched"]), int(row["admitted"]) or int(row["searched"]))}
        for row in connectors if row["admitted"]
    ]
    return {"parts": len(ids), "connectors": rows, "finished": all(item["searched"] >= item["parts"] for item in rows)}


def choose_line(conn, part_id: str, written: str, actor: str) -> None:
    """A person says a BOM line's maker spelling names this part (one of several with the line's number)."""

    parts.get_part(conn, part_id)
    if not alias_key(written):
        raise TrackingError("The line names no maker. Name it on the symbol, or choose it in Review.")
    parts.record_spelling(conn, part_id, written, "person")
    write_audit(conn, actor_text(actor), "tracking.line_choice", part_id, {"manufacturer": written.strip()}, subject_kind="part")


def sync_projects(conn, *, may_create_manufacturer: bool = False, actor: str = "system") -> dict[str, int]:
    """Make every tracked project's parts exist and be in the tiers, after a project's BOM was read again.

    Lines whose part does not exist yet get one (when the manufacturer is known), so a new revision's parts join
    tier 1 without anyone returning to the project. Returns the parts created.
    """

    created = 0
    for project in list_tracked_projects(conn):
        rows = conn.execute(
            f"""
            SELECT DISTINCT u.manufacturer, u.mpn FROM {usage.ALL_USES} u
            WHERE u.project_id = %s AND u.variant = ANY(%s) AND u.match_key <> '' AND NOT EXISTS (
                SELECT 1 FROM parts p JOIN manufacturers m ON m.id = p.manufacturer_id WHERE {usage.MATCHES_PART.strip()}
            )
            LIMIT %s
            """,
            (project["project_id"], list(project["variants"]), MAX_PROJECT_PARTS),
        ).fetchall()
        for line in rows:
            try:
                with conn.transaction():
                    parts.ensure_part(conn, line["manufacturer"], line["mpn"], actor, may_create=may_create_manufacturer)
                    created += 1
            except parts.UnknownManufacturer:
                continue  # several makers have this number and the line does not say which: it waits for a choice
    recompute(conn)
    admission.sync(conn)
    return {"parts_created": created}


def untrack_project(conn, project_id: str, actor: str) -> bool:
    actor = actor_text(actor)
    gone = conn.execute("DELETE FROM tracked_projects WHERE project_id = %s RETURNING project_id", (project_id,)).fetchone()
    if gone:
        write_audit(conn, actor, "tracking.project_removed", project_id, {}, subject_kind="project")
        recompute(conn)
    return gone is not None


# --- derivation --------------------------------------------------------------


def _sources(conn, part_ids: Sequence[str] | None) -> dict[str, list[dict[str, Any]]]:
    """Every reason each part is followed, as ``{part_id: [{kind, ref, tier, rate, variant?}]}``."""

    only = list(part_ids) if part_ids is not None else None
    found: dict[str, list[dict[str, Any]]] = {}
    for row in conn.execute(
        "SELECT id, part_id, tier, rate, origin FROM watches WHERE (%s::text[] IS NULL OR part_id = ANY(%s))", (only, only)
    ).fetchall():
        found.setdefault(row["part_id"], []).append(
            {"kind": row["origin"], "ref": row["id"], "tier": int(row["tier"]), "rate": row["rate"]}
        )
    rows = conn.execute(
        f"""
        SELECT DISTINCT p.id AS part_id, t.project_id, u.variant
        FROM tracked_projects t
        JOIN {usage.ALL_USES} u ON u.project_id = t.project_id AND u.variant = ANY(t.variants)
        JOIN parts p ON p.match_key = u.match_key
        JOIN manufacturers m ON m.id = p.manufacturer_id
        WHERE ({usage.MATCHES_PART.strip()}) AND (%s::text[] IS NULL OR p.id = ANY(%s))
        """,
        (only, only),
    ).fetchall()
    for row in rows:
        found.setdefault(row["part_id"], []).append(
            {"kind": "project", "ref": row["project_id"], "variant": row["variant"], "tier": TIER_1, "rate": "daily"}
        )
    return found


def _decide(reasons: list[dict[str, Any]]) -> tuple[int, str]:
    tier = min(item["tier"] for item in reasons)
    rate = min((item["rate"] for item in reasons if item["tier"] == tier), key=RATE_DAYS.__getitem__)
    return tier, rate


def reschedule(conn, part_id: str, rate: str) -> None:
    """A part read more often than it was planned for is due as its new rate asks, not when the old one said: the next read of each of
    its listings is brought forward to a rate's interval after the last one. A part read less often keeps its plan (it is simply early)."""

    from app.services.supply import tiers

    conn.execute(
        """
        UPDATE poll_state ps SET tier = %s, next_poll_at = LEAST(ps.next_poll_at, ps.last_polled_at + %s)
        FROM listings l WHERE l.id = ps.listing_id AND l.part_id = %s AND ps.last_polled_at IS NOT NULL
        """,
        (rate, tiers.INTERVAL[rate], part_id),
    )


def recompute(conn, part_ids: Iterable[str] | None = None) -> dict[str, int]:
    """Bring ``part_tiers`` in line with every source, for these parts or all of them. Writes only what changed.

    Returns how many parts were added, changed and removed.
    """

    only = sorted(set(part_ids)) if part_ids is not None else None
    if only is not None and not only:
        return {"added": 0, "changed": 0, "removed": 0}
    wanted = _sources(conn, only)
    current = {
        row["part_id"]: row
        for row in conn.execute(
            "SELECT part_id, tier, rate, reasons FROM part_tiers WHERE (%s::text[] IS NULL OR part_id = ANY(%s))", (only, only)
        ).fetchall()
    }
    added = changed = removed = 0
    for part_id, reasons in wanted.items():
        tier, rate = _decide(reasons)
        stored = [{key: item[key] for key in ("kind", "ref", "variant") if key in item} for item in reasons]
        stored.sort(key=lambda item: (item["kind"], item["ref"], item.get("variant", "")))
        row = current.get(part_id)
        if row is None:
            conn.execute(
                "INSERT INTO part_tiers (part_id, tier, rate, reasons) VALUES (%s, %s, %s, %s::jsonb)",
                (part_id, tier, rate, _json(stored)),
            )
            added += 1
            reschedule(conn, part_id, rate)
        elif (row["tier"], row["rate"], row["reasons"]) != (tier, rate, stored):
            conn.execute(
                "UPDATE part_tiers SET tier = %s, rate = %s, reasons = %s::jsonb, updated_at = %s WHERE part_id = %s",
                (tier, rate, _json(stored), datetime.now(timezone.utc), part_id),
            )
            changed += 1
            reschedule(conn, part_id, rate)
    stale = [part_id for part_id in current if part_id not in wanted]
    if stale:
        conn.execute("DELETE FROM part_tiers WHERE part_id = ANY(%s)", (stale,))
        removed = len(stale)
    if added or changed or removed:
        admission.sync(conn)
    return {"added": added, "changed": changed, "removed": removed}


def _json(value: Any) -> str:
    return json.dumps(value, sort_keys=True)


def tier_of(conn, part_id: str) -> dict[str, Any] | None:
    """The tier, rate and reasons of a part, or None for tier 3."""

    row = conn.execute("SELECT tier, rate, reasons FROM part_tiers WHERE part_id = %s", (part_id,)).fetchone()
    return {"tier": int(row["tier"]), "rate": row["rate"], "reasons": row["reasons"]} if row else None


def counts(conn) -> dict[str, int]:
    rows = conn.execute("SELECT tier, COUNT(*) AS n FROM part_tiers GROUP BY tier").fetchall()
    by_tier = {int(row["tier"]): int(row["n"]) for row in rows}
    return {"tier1": by_tier.get(TIER_1, 0), "tier2": by_tier.get(TIER_2, 0)}


__all__ = [
    "TrackingError", "check_tier", "track_project", "untrack_project", "sync_projects", "tracked_project", "list_tracked_projects",
    "project_parts", "recompute", "tier_of", "counts",
]
