"""Catalog items that are not library parts: ``module`` and ``assembly`` (CONTRACTS_P2 §3).

An ``assembly`` is a System Builder system published from a snapshot; a
``module`` is a bought or in-house peripheral with connectors (M6). Both are
ordinary components with revisions and the normal workflow, but:

- their identity is an IPN held as a ``provisional_ipn`` identity with source
  ``prism`` (P2-1.2): that reuses the catalog's identity uniqueness without a
  new identity kind, and approval/release accept it for these kinds;
- a revision carries ``interface`` (units → pins) and, for assemblies,
  ``source_ref`` (the snapshot it came from plus the facts its release gates
  need), stored as JSON text;
- they have no symbol or footprint, so they are never placeable, never in the
  KiCad DBL export, and KLC does not gate them.

Release gates read only catalog data: publishing copies the snapshot's
open-review count and child revisions into ``source_ref`` because snapshots
are immutable and the catalog may live in another database.
"""

from __future__ import annotations

import json
from typing import Any, Mapping

from app.services.catalog.metadata_normalization import IDENTITY_KIND_PROVISIONAL_IPN, normalize_metadata
from app.services.catalog.normalization import utc_now_iso

KIND_PART = "part"
KIND_MODULE = "module"
KIND_ASSEMBLY = "assembly"
KINDS = (KIND_PART, KIND_MODULE, KIND_ASSEMBLY)
SYSTEM_KINDS = (KIND_MODULE, KIND_ASSEMBLY)
IPN_SOURCE = "prism"
_CATEGORY = {KIND_MODULE: "Modules", KIND_ASSEMBLY: "Assemblies"}



def is_library_part(component: dict[str, Any]) -> bool:
    """Modules and assemblies are never KiCad library parts (CONTRACTS_P2 §3.1)."""
    return component.get("kind", "part") == "part"

def _json(value: Mapping[str, Any]) -> str:
    return json.dumps(dict(value), sort_keys=True, separators=(",", ":"))


def component_kind(conn: Any, component_id: str) -> str:
    row = conn.execute("SELECT kind FROM components WHERE id = %s", (component_id,)).fetchone()
    return str(row["kind"]) if row else KIND_PART


def item_metadata(*, kind: str, ipn: str, name: str, description: str, manufacturer: str,
                  datasheet_url: str) -> dict[str, Any]:
    if kind not in SYSTEM_KINDS:
        raise ValueError(f"kind must be one of {', '.join(SYSTEM_KINDS)}")
    ipn = ipn.strip()
    if not ipn:
        raise ValueError("an IPN is required")
    return normalize_metadata({
        "identity_kind": IDENTITY_KIND_PROVISIONAL_IPN,
        "identity_source": IPN_SOURCE,
        "source_internal_part_number": ipn,
        "name": name.strip() or ipn,
        "value": ipn,
        "description": description.strip() or name.strip() or ipn,
        "datasheet_url": datasheet_url.strip(),
        "manufacturer": manufacturer.strip(),
        "category": _CATEGORY[kind],
    })


def set_payload(conn: Any, revision_id: str, *, interface: Mapping[str, Any],
                source_ref: Mapping[str, Any]) -> None:
    conn.execute(
        "UPDATE component_revisions SET interface_json = %s, source_ref_json = %s, updated_at = %s WHERE id = %s",
        (_json(interface), _json(source_ref), utc_now_iso(), revision_id),
    )


def revision_payload(revision: Mapping[str, Any]) -> dict[str, Any]:
    """``interface`` and ``sourceRef`` of a revision row (empty objects for parts)."""

    def parse(raw: Any) -> dict:
        try:
            value = json.loads(raw or "{}")
        except (TypeError, ValueError):
            return {}
        return value if isinstance(value, dict) else {}

    return {"interface": parse(revision.get("interface_json")), "sourceRef": parse(revision.get("source_ref_json"))}


def assert_release_gates(conn: Any, kind: str, revision: Mapping[str, Any]) -> None:
    """Fail closed on the §3.3 gates. ``part`` keeps its existing gates (not here)."""

    payload = revision_payload(revision)
    source_ref = payload["sourceRef"]
    if kind == KIND_ASSEMBLY:
        if source_ref.get("kind") != "system_snapshot" or not source_ref.get("snapshotId"):
            raise ValueError("Cannot release an assembly revision without its source snapshot")
        if int(source_ref.get("openReviewCount", 1)) != 0:
            raise ValueError("Cannot release an assembly whose snapshot has open reviews")
        if source_ref.get("hierarchyValid") is not True:
            raise ValueError("Cannot release an assembly whose hierarchy is not valid")
        for child in source_ref.get("children") or []:
            row = conn.execute(
                "SELECT release_status FROM component_revisions WHERE id = %s AND component_id = %s",
                (str(child.get("revisionId") or ""), str(child.get("componentId") or "")),
            ).fetchone()
            if row is None or str(row["release_status"]) != "released":
                raise ValueError("Cannot release an assembly that pins an unreleased child revision")
    if not payload["interface"].get("exports") and not payload["interface"].get("units"):
        reason = payload["interface"].get("error")
        raise ValueError(f"Cannot release a {kind} revision without an interface" + (f": {reason}" if reason else ""))
    if kind == KIND_MODULE:
        # SB2-48: a module is placed in 3D by its model.
        model = conn.execute(
            """
            SELECT 1 FROM revision_assets ra JOIN assets a ON a.id = ra.asset_id
            WHERE ra.revision_id = %s AND ra.asset_type = '3dmodel'
              AND (lower(a.canonical_path) LIKE '%%.step' OR lower(a.canonical_path) LIKE '%%.stp')
            LIMIT 1
            """,
            (str(revision["id"]),),
        ).fetchone()
        if model is None:
            raise ValueError("Cannot release a module revision without a STEP model")


__all__ = [
    "KINDS", "KIND_ASSEMBLY", "KIND_MODULE", "KIND_PART", "SYSTEM_KINDS",
    "assert_release_gates", "component_kind", "item_metadata", "revision_payload", "set_payload",
]
