"""Connector parts placed on a catalog module (CONTRACTS_P2 §3.6, SB2-48b, D-P2-40).

Each unit of a module's symbol is one connector. Here it names the catalog
**part** that is that connector (its footprint gives pads, pin 1 and the
mating frame; its model the body) and where the part sits on the module's
model: a point on a face, the face's outward normal and a quarter-turn
(``placement.module_ports``). Like model alignment (§18.2), a placement
belongs to the component, not to a revision, keyed by the unit's letter.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Mapping, Optional

from app.services.catalog import mates as catalog_mates, models as catalog_models
from app.services.catalog.system_items import KIND_MODULE, component_kind, revision_payload
from app.services.systems.placement import module_ports


def _current_interface(conn: Any, component_id: str) -> dict[str, Any]:
    row = conn.execute(
        """
        SELECT r.interface_json FROM components c JOIN component_revisions r ON r.id = c.current_revision_id
        WHERE c.id = %s
        """,
        (component_id,),
    ).fetchone()
    return revision_payload(dict(row) if row else {})["interface"]


def require_module(conn: Any, component_id: str) -> None:
    row = conn.execute("SELECT is_active FROM components WHERE id = %s", (component_id,)).fetchone()
    if row is None or not int(row["is_active"] or 0):
        raise LookupError("Component not found")
    if component_kind(conn, component_id) != KIND_MODULE:
        raise ValueError("only modules have connector placements")


def part_geometry(conn: Any, part_id: str) -> Optional[dict[str, Any]]:
    """The part's footprint as extractor v6 geometry at the origin (§14.6), or None without a readable one."""
    from kicad_monkey import kicad_pcb_footprint, kicad_sexpr

    from app.services.systems.interface_extractor import _footprint_geometry

    row = conn.execute(
        """
        SELECT a.canonical_path FROM components c JOIN revision_assets ra ON ra.revision_id = c.current_revision_id
        JOIN assets a ON a.id = ra.asset_id
        WHERE c.id = %s AND a.asset_type = 'footprint' ORDER BY a.id LIMIT 1
        """,
        (part_id,),
    ).fetchone()
    path = Path(str(row["canonical_path"])) if row else None
    if path is None or not path.is_file():
        return None
    try:
        footprint = kicad_pcb_footprint.Footprint.from_sexp(kicad_sexpr.parse_sexp(path.read_text()))
        geometry = _footprint_geometry(footprint)
    except Exception:  # an unreadable footprint gives no geometry
        return None
    return geometry if geometry["pads"] else None


def part_model(conn: Any, part_id: str) -> Optional[dict[str, Any]]:
    """The part's first converted model as ``{glbKey, boundsMm, alignment}`` (the housing shape, §17.6)."""
    converter = catalog_models.converter_id()
    aligned = catalog_models.alignments(conn, part_id)
    for asset in catalog_models.step_assets(conn, part_id):
        key = catalog_models.glb_key(asset["sha256"], converter)
        glb = catalog_models.cached(conn, [key]).get(key)
        if glb is None:
            continue
        alignment = aligned.get(str(asset["id"])) or dict(catalog_models.IDENTITY)
        return {"glbKey": key, "boundsMm": json.loads(glb["bounds_json"]),
                "alignment": {k: alignment[k] for k in ("offsetMm", "rotationDeg", "scale")}}
    return None


def _rows(conn: Any, component_id: str) -> dict[str, dict[str, Any]]:
    rows = conn.execute(
        """
        SELECT unit_key, part_id, placement_json, updated_by, updated_at FROM catalog_module_connectors
        WHERE component_id = %s
        """,
        (component_id,),
    ).fetchall()
    return {str(r["unit_key"]): dict(r) for r in rows}


def _connector(conn: Any, row: Mapping[str, Any], pads: list[str]) -> dict[str, Any]:
    part = catalog_mates._part_row(conn, str(row["part_id"])) or {"id": row["part_id"]}
    geometry = part_geometry(conn, str(row["part_id"]))
    placement = json.loads(row["placement_json"])
    footprint_pads = {p["pad"] for p in (geometry or {}).get("pads", []) if p["pad"]}
    return {
        "part": catalog_mates.summary(part), "placement": placement, "geometry": geometry,
        "footprintPose": module_ports.footprint_pose(placement, geometry) if geometry else None,
        "model": part_model(conn, str(row["part_id"])),
        "missingPads": [pad for pad in pads if geometry is not None and pad not in footprint_pads],
        "updatedBy": str(row["updated_by"]), "updatedAt": str(row["updated_at"]),
    }


def list_connectors(conn: Any, component_id: str) -> dict[str, Any]:
    """Every unit of the current interface with its placed connector (or None), plus placements whose unit
    the symbol no longer has (``orphans``) and whether every unit is placed (``complete``)."""
    require_module(conn, component_id)
    units = _current_interface(conn, component_id).get("units") or []
    rows = _rows(conn, component_id)
    out = []
    for unit in units:
        pads = [str(pin["pad"]) for pin in unit.get("pins") or []]
        row = rows.pop(str(unit["key"]), None)
        out.append({"key": str(unit["key"]), "name": str(unit.get("name") or ""), "pads": pads,
                    "connector": _connector(conn, row, pads) if row else None})
    return {"units": out, "orphans": sorted(rows), "complete": bool(out) and not unplaced(out)}


def unplaced(units: list[dict[str, Any]]) -> list[str]:
    """Units without a usable connector: none placed, a part without a footprint, or pads it lacks."""
    return [u["key"] for u in units
            if not u["connector"] or u["connector"]["geometry"] is None or u["connector"]["missingPads"]]


def set_connector(conn: Any, component_id: str, unit_key: str, part_id: str, placement: Mapping[str, Any], *,
                  actor: str, now: str) -> dict[str, Any]:
    require_module(conn, component_id)
    units = {str(u["key"]): u for u in _current_interface(conn, component_id).get("units") or []}
    unit = units.get(unit_key)
    if unit is None:
        raise LookupError(f"The module's symbol has no unit {unit_key}")
    catalog_mates.require_part(conn, part_id)
    geometry = part_geometry(conn, part_id)
    if geometry is None:
        raise ValueError("The connector part has no footprint with pads")
    pads = {p["pad"] for p in geometry["pads"] if p["pad"]}
    missing = [str(pin["pad"]) for pin in unit.get("pins") or [] if str(pin["pad"]) not in pads]
    if missing:
        raise ValueError(f"The part's footprint lacks pad(s) {', '.join(missing)} of unit {unit_key}")
    stored = module_ports.placement_from(placement)
    conn.execute(
        """
        INSERT INTO catalog_module_connectors (component_id, unit_key, part_id, placement_json, updated_by, updated_at)
        VALUES (%s, %s, %s, %s, %s, %s)
        ON CONFLICT (component_id, unit_key) DO UPDATE SET part_id = EXCLUDED.part_id,
            placement_json = EXCLUDED.placement_json, updated_by = EXCLUDED.updated_by, updated_at = EXCLUDED.updated_at
        """,
        (component_id, unit_key, part_id, json.dumps(stored, sort_keys=True), actor, now),
    )
    return list_connectors(conn, component_id)


def remove_connector(conn: Any, component_id: str, unit_key: str) -> dict[str, Any]:
    require_module(conn, component_id)
    conn.execute("DELETE FROM catalog_module_connectors WHERE component_id = %s AND unit_key = %s",
                 (component_id, unit_key))
    return list_connectors(conn, component_id)


def assert_placed(conn: Any, component_id: str) -> None:
    """The §3.3 module gate: every connector placed with a footprint carrying its pads."""
    missing = unplaced(list_connectors(conn, component_id)["units"])
    if missing:
        raise ValueError(f"Cannot release a module revision until every connector is placed: {', '.join(missing)}")


__all__ = ["assert_placed", "list_connectors", "part_geometry", "part_model", "remove_connector", "require_module",
           "set_connector", "unplaced"]
