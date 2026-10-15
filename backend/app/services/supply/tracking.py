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

from app.services.supply import parts, usage
from app.services.supply.audit import actor_text, write_audit
from app.services.supply.identity import alias_key

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


def tracked_project(conn, project_id: str) -> dict[str, Any] | None:
    row = conn.execute(
        "SELECT project_id, variants, connector_ids, tracked_by, tracked_at FROM tracked_projects WHERE project_id = %s",
        (project_id,),
    ).fetchone()
    return dict(row) if row else None


def list_tracked_projects(conn) -> list[dict[str, Any]]:
    rows = conn.execute(
        "SELECT project_id, variants, connector_ids, tracked_by, tracked_at FROM tracked_projects ORDER BY project_id"
    ).fetchall()
    return [dict(row) for row in rows]


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


def track_project(
    conn,
    project_id: str,
    variants: Iterable[str],
    actor: str,
    *,
    connector_ids: Sequence[str] | None = None,
    may_create_manufacturer: bool = True,
) -> dict[str, Any]:
    """Track a project: its chosen variants' parts join tier 1. Returns what was tracked and what was skipped.

    ``variants`` names the designs; ``''`` is the base design. ``connector_ids`` limits the distributors the project's
    parts are read at (None: every distributor but those that are assembly-only).
    """

    actor = actor_text(actor)
    chosen = list(dict.fromkeys(variants)) or [BASE_VARIANT]
    if not conn.execute("SELECT 1 FROM bom_usage_projects WHERE project_id = %s", (project_id,)).fetchone():
        raise TrackingError("Prism has not read this project's BOM yet.")
    stored = {row["variant"] for row in conn.execute(
        "SELECT DISTINCT variant FROM bom_usage_variants WHERE project_id = %s", (project_id,)
    ).fetchall()} | {BASE_VARIANT}
    unknown = [name for name in chosen if name not in stored]
    if unknown:
        raise TrackingError(f"This project has no design variant named {unknown[0]!r}.")
    skipped: list[dict[str, str]] = []
    created = 0
    for line in project_parts(conn, project_id, chosen):
        if not alias_key(line["manufacturer"]):
            skipped.append({"mpn": line["mpn"], "reason": "no_manufacturer"})
            continue
        try:
            with conn.transaction():
                before = parts.find_part(conn, line["manufacturer"], line["mpn"])
                parts.ensure_part(conn, line["manufacturer"], line["mpn"], actor, may_create=may_create_manufacturer)
                created += 0 if before else 1
        except parts.UnknownManufacturer:
            skipped.append({"mpn": line["mpn"], "reason": "unknown_manufacturer"})
    conn.execute(
        """
        INSERT INTO tracked_projects (project_id, variants, connector_ids, tracked_by) VALUES (%s, %s, %s, %s)
        ON CONFLICT (project_id) DO UPDATE SET variants = EXCLUDED.variants, connector_ids = EXCLUDED.connector_ids
        """,
        (project_id, chosen, list(connector_ids) if connector_ids is not None else None, actor),
    )
    write_audit(conn, actor, "tracking.project", project_id,
                {"variants": chosen, "connector_ids": list(connector_ids) if connector_ids is not None else None},
                subject_kind="project")
    recompute(conn)
    return {"project_id": project_id, "variants": chosen, "parts_created": created, "skipped": skipped}


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
            if not alias_key(line["manufacturer"]):
                continue
            try:
                with conn.transaction():
                    parts.ensure_part(conn, line["manufacturer"], line["mpn"], actor, may_create=may_create_manufacturer)
                    created += 1
            except parts.UnknownManufacturer:
                continue
    recompute(conn)
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
        elif (row["tier"], row["rate"], row["reasons"]) != (tier, rate, stored):
            conn.execute(
                "UPDATE part_tiers SET tier = %s, rate = %s, reasons = %s::jsonb, updated_at = %s WHERE part_id = %s",
                (tier, rate, _json(stored), datetime.now(timezone.utc), part_id),
            )
            changed += 1
    stale = [part_id for part_id in current if part_id not in wanted]
    if stale:
        conn.execute("DELETE FROM part_tiers WHERE part_id = ANY(%s)", (stale,))
        removed = len(stale)
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
