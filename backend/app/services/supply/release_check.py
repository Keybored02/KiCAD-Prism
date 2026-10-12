"""The supply check on a project's BOM before it is released, and the snapshot taken at publish.

``check`` reads the BOM from a semantic index and assesses every distinct part (never calling a
distributor). It reports the BOM's health and the parts with an error or fatal finding nobody has
waived. It informs the release; it does not block it.

``freeze`` writes what the check said, with each matched component's approved parts, beside the
release record. The record is evidence: it is never part of the release digest.
"""

from __future__ import annotations

import json
import uuid
from datetime import datetime, timezone
from typing import Any, Iterable, Mapping, Sequence

from app.services.supply import bom_lookup, sources, usage
from app.services.supply.assessment import health as health_rules
from app.services.supply.assessment import service as assessment
from app.services.supply.audit import write_audit
from app.services.supply.bom_lookup import BomLine
from app.services.supply.identity import alias_key, match_key
from app.services.supply.vocabulary import Status

MAX_LISTED = 25
_BLOCKING = ("fatal", "error")


class SnapshotNotFound(KeyError):
    """No snapshot for this build."""


def _open(findings: Sequence[Mapping[str, Any]]) -> list[Mapping[str, Any]]:
    return [f for f in findings if not (f["waiver"] and f["waiver"]["holds"])]


def check(
    conn,
    components: Iterable[Mapping[str, Any]],
    now: datetime | None = None,
    identities: usage.Identities | None = None,
) -> dict[str, Any]:
    """Assess the distinct parts on a BOM. ``components`` are a semantic index's components."""

    now = now or datetime.now(timezone.utc)
    lines = usage.lines_from_components(components, identities)
    bom = [BomLine(line.key, line.manufacturer, line.mpn, line.quantity) for line in lines]
    resolved = bom_lookup.resolve_lines(bom, conn)
    needs: dict[str, int] = {}
    for line in bom:
        part_id = resolved[line.key][1]
        if part_id:
            needs[part_id] = needs.get(part_id, 0) + line.quantity
    assessed = assessment.assess_parts(conn, sorted(needs), needs, now)

    rows = []
    for line in bom:
        state, part_id, _how = resolved[line.key]
        entry = assessed.get(part_id) if part_id else None
        rows.append({
            "manufacturer": line.manufacturer,
            "mpn": line.mpn,
            "quantity": line.quantity,
            "state": state,
            "part_id": part_id,
            "health": entry["health"] if entry else None,
            "status": entry["status"] if entry else None,
            "findings": [
                {"check": f["check"], "severity": f["severity"], "text": f["text"]}
                for f in _open(entry["findings"])
            ] if entry else [],
            "waived": sum(1 for f in entry["findings"] if f["waiver"] and f["waiver"]["holds"]) if entry else 0,
        })
    rolled = health_rules.rollup([(r["health"], r["quantity"], Status(r["status"])) for r in rows if r["status"]])
    blocking = [r for r in rows if r["status"] in _BLOCKING]
    return {
        "health": rolled.score if rolled.status is not Status.UNKNOWN else None,
        "status": rolled.status.value,
        "parts": len(rows),
        "tracked": sum(1 for r in rows if r["part_id"]),
        "not_tracked": sum(1 for r in rows if not r["part_id"]),
        "needing_a_look": len(blocking),
        "attention": [r for r in blocking][:MAX_LISTED],
        "lines": rows,
    }


def avl_for(conn, rows: Iterable[Mapping[str, Any]], component_ids: Mapping[tuple[str, str], str]) -> dict[str, Any]:
    """Each BOM part's catalog component and the approved parts on its list, by component id."""

    found: dict[str, Any] = {}
    for row in rows:
        component_id = component_ids.get((alias_key(row["manufacturer"]), match_key(row["mpn"])))
        if component_id is None or component_id in found:
            continue
        found[component_id] = {
            "manufacturer": row["manufacturer"],
            "mpn": row["mpn"],
            "alternates": [
                {key: item[key] for key in ("manufacturer", "mpn", "rank", "approval")}
                for item in sources.list_sources(conn, component_id)
                if item["approval"] == sources.APPROVED
            ],
        }
    return found


def freeze(
    conn,
    project_id: str,
    build_id: str,
    tag: str,
    commit_sha: str,
    actor: str,
    components: Iterable[Mapping[str, Any]],
    component_ids: Mapping[tuple[str, str], str],
    now: datetime | None = None,
    identities: usage.Identities | None = None,
) -> str | None:
    """Record the BOM check and the approved parts as they stand now. Returns the id, or None if already recorded."""

    result = check(conn, components, now, identities)
    snapshot_id = uuid.uuid4().hex
    created = conn.execute(
        """
        INSERT INTO release_snapshots (id, project_id, build_id, tag, commit_sha, created_by, health, status, assessment, avl)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s::jsonb, %s::jsonb)
        ON CONFLICT (build_id) DO NOTHING RETURNING id
        """,
        (snapshot_id, project_id, build_id, tag, commit_sha, actor, result["health"], result["status"],
         json.dumps(result), json.dumps(avl_for(conn, result["lines"], component_ids))),
    ).fetchone()
    if created is None:
        return None
    write_audit(conn, actor, "release.snapshot", snapshot_id,
                {"project_id": project_id, "build_id": build_id, "tag": tag, "status": result["status"]},
                subject_kind="release_snapshot")
    return snapshot_id


def get_snapshot(conn, project_id: str, build_id: str) -> dict[str, Any]:
    row = conn.execute(
        "SELECT * FROM release_snapshots WHERE project_id = %s AND build_id = %s", (project_id, build_id)
    ).fetchone()
    if row is None:
        raise SnapshotNotFound(build_id)
    return {
        "id": row["id"], "project_id": row["project_id"], "build_id": row["build_id"], "tag": row["tag"],
        "commit_sha": row["commit_sha"], "created_by": row["created_by"], "created_at": row["created_at"].isoformat(),
        "health": float(row["health"]) if row["health"] is not None else None, "status": row["status"],
        "assessment": row["assessment"], "avl": row["avl"],
    }
