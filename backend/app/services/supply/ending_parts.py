"""Library components whose part is ending, and what a person decided about each.

Supply knows a part is ending (not recommended for new designs, last time buy, obsolete, dropped by every distributor, or an
outlook under two years). The library decides what that means for a component. This module only proposes: it lists the
components, the reason and its source, the last-time-buy date, stock and the projects that use the part. Nothing here changes
the catalog.

Two decisions, both for QA and administrators, kept in ``component_restrictions`` (supply data never enters the revision hash):

* ``not_for_new_designs``: the component stays released and keeps resolving where it is placed; it is marked, not hidden.
* ``retired``: recorded after the component was archived through the catalog's own workflow (which takes it out of the export).
  Retiring is allowed while tracked projects still use the part: the dialog shows them first.
"""

from __future__ import annotations

import time
from typing import Any, Mapping, Sequence

from app.services.supply import catalog_read, facts, outlook, part_insights, parts_view, usage
from app.services.supply.audit import actor_text, write_audit
from app.services.supply.identity import alias_key, match_key
from app.services.supply.vocabulary import Lifecycle

LEVELS = ("not_for_new_designs", "retired")
LEVEL_LABEL = {"not_for_new_designs": "Not for new designs", "retired": "Retired"}
MAX_PARTS = 80
MAX_REASON = 300
_ENDING = {
    Lifecycle.NRND.value: "Not recommended for new designs",
    Lifecycle.LAST_TIME_BUY.value: "Last time buy",
    Lifecycle.OBSOLETE.value: "Obsolete",
}
_OUTLOOK = {outlook.ENDED: "Outlook: ended", outlook.UNDER_TWO: "Outlook: under two years"}


def reasons_of(item: Mapping[str, Any], band: str | None) -> list[dict[str, str]]:
    """Why a part is ending, each with its source: the lifecycle distributors state, every distributor dropping it, the outlook."""

    found = []
    if item["lifecycle"] in _ENDING:
        found.append({"kind": item["lifecycle"], "text": _ENDING[item["lifecycle"]], "source": "Distributors"})
    if item["dropped"]:
        found.append({"kind": "dropped", "text": "Every distributor dropped it", "source": "Distributors"})
    if band in _OUTLOOK:
        found.append({"kind": "outlook", "text": _OUTLOOK[band], "source": "Prism's outlook"})
    return found


def restrictions_of(conn, component_ids: Sequence[str]) -> dict[str, dict[str, Any]]:
    ids = list({item for item in component_ids if item})
    if not ids:
        return {}
    return {
        row["component_id"]: {
            "level": row["level"], "reason": row["reason"], "replacement_component_id": row["replacement_component_id"] or None,
            "set_by": row["set_by"], "set_at": row["set_at"].isoformat(),
        }
        for row in conn.execute(
            "SELECT component_id, level, reason, replacement_component_id, set_by, set_at FROM supply_component_restrictions WHERE component_id = ANY(%s)", (ids,)
        ).fetchall()
    }


def set_restriction(conn, component_id: str, level: str, reason: str, replacement_component_id: str, actor: str) -> dict[str, Any]:
    """Mark a component (or record that it was retired). A later mark replaces the earlier one."""

    actor = actor_text(actor)
    if level not in LEVELS:
        raise ValueError(f"The level must be one of: {', '.join(LEVELS)}.")
    reason = " ".join(reason.split())[:MAX_REASON]
    if replacement_component_id == component_id:
        raise ValueError("A component cannot replace itself.")
    conn.execute(
        """
        INSERT INTO supply_component_restrictions (component_id, level, reason, replacement_component_id, set_by) VALUES (%s, %s, %s, %s, %s)
        ON CONFLICT (component_id) DO UPDATE SET level = EXCLUDED.level, reason = EXCLUDED.reason,
            replacement_component_id = EXCLUDED.replacement_component_id, set_by = EXCLUDED.set_by, set_at = NOW()
        """,
        (component_id, level, reason, replacement_component_id, actor),
    )
    write_audit(conn, actor, "component.restriction", component_id, {"level": level, "reason": reason, "replacement": replacement_component_id}, subject_kind="component")
    forget_count()
    return restrictions_of(conn, [component_id])[component_id]


def status_marks(component_ids: Sequence[str]) -> dict[str, str]:
    """The Status text of the KiCad database for components marked not for new designs. Registered with the catalog export at start-up."""

    from app.services.supply.store import supply_store

    with supply_store.connection() as conn:
        found = restrictions_of(conn, list(component_ids))
    return {component_id: LEVEL_LABEL[mark["level"]] for component_id, mark in found.items() if mark["level"] == "not_for_new_designs"}


def clear_restriction(conn, component_id: str, actor: str) -> None:
    actor = actor_text(actor)
    removed = conn.execute("DELETE FROM supply_component_restrictions WHERE component_id = %s RETURNING level", (component_id,)).fetchone()
    forget_count()
    if removed:
        write_audit(conn, actor, "component.restriction.clear", component_id, {"was": removed["level"]}, subject_kind="component")


def _components_of(item: Mapping[str, Any]) -> list[dict[str, Any]]:
    """The catalog components that are this part: those with its number whose maker is its maker."""

    wanted = (alias_key(item["manufacturer"]), match_key(item["mpn"]))
    found = []
    for candidate in catalog_read.search(item["mpn"], 8):
        if catalog_read.component_ids_by_part(iter([candidate])).get(wanted) is not None:
            found.append(candidate)
    return found


_COUNT_FOR = 300.0
_counted: tuple[float, int] | None = None


def undecided_count(conn, role: str | None = None) -> int:
    """How many listed components nobody has decided about, kept for five minutes: working it out searches the catalog."""

    global _counted
    now = time.monotonic()
    if _counted is None or now - _counted[0] > _COUNT_FOR:
        try:
            _counted = (now, sum(1 for row in queue(conn, role)["items"] if row["restriction"] is None))
        except Exception:  # noqa: BLE001 - a tile on the Dashboard must not depend on the catalog answering
            return 0
    return _counted[1]


def forget_count() -> None:
    global _counted
    _counted = None


def queue(conn, role: str | None = None, limit: int = MAX_PARTS) -> dict[str, Any]:
    """Components whose part is ending, worst first, without the ones already retired."""

    tracked = [row["part_id"] for row in conn.execute("SELECT part_id FROM supply_part_tiers").fetchall()]
    items = {item["id"]: item for item in parts_view.summaries_for(conn, tracked)}
    bands = {row["part_id"]: row.get("outlook_band") for row in part_insights.read_all(conn)}
    ending = [(item, reasons_of(item, bands.get(item["id"]))) for item in items.values()]
    ending = [(item, reasons) for item, reasons in ending if reasons]
    ending.sort(key=lambda pair: (-len(pair[1]), pair[0]["mpn"].lower()))
    rows: list[dict[str, Any]] = []
    for item, reasons in ending[:limit]:
        last_buy = [
            {"source": source["source"], "value": source["value"]}
            for fact in facts.for_part(conn, item["id"]) if fact["name"] == "last_buy_date" for source in fact["sources"]
        ]
        used = [{"project_id": use["project_id"], "name": use["project_name"], "quantity": use["quantity"]} for use in usage.used_in(conn, item["id"], role)]
        for component in _components_of(item):
            stage = str(component.get("workflow_stage") or component.get("stage") or "")
            if stage == "archived":
                continue
            rows.append({
                "component": {"id": str(component["id"]), "name": str(component.get("name") or ""), "mpn": str(component.get("mpn") or ""),
                              "manufacturer": str(component.get("manufacturer") or ""), "stage": stage},
                "part_id": item["id"], "reasons": reasons, "last_buy": last_buy, "stock": item["stock"], "status": item["status"],
                "projects": used, "restriction": None,
            })
    marks = restrictions_of(conn, [row["component"]["id"] for row in rows])
    kept = []
    for row in rows:
        row["restriction"] = marks.get(row["component"]["id"])
        if row["restriction"] and row["restriction"]["level"] == "retired":
            continue
        kept.append(row)
    return {"items": kept, "tracked": len(tracked), "more": max(0, len(ending) - limit)}
