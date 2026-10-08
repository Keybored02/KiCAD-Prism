"""Review decisions and their application (``docs/system-builder/CONTRACTS.md`` §7.1).

A decision is validated against the review's **stored** candidate: the
interface artifact at ``to_commit`` and the item's own candidates. Nothing is
re-resolved (§1 invariant 5). Decisions stay editable until the last item of
a review is decided; the review is then applied in the same transaction:
pending silent changes first, then every decision, then the baseline moves to
``to_commit``.

Every function here runs inside a caller's ``SystemStore.mutation``.
"""

from __future__ import annotations

from typing import Any, Callable, Mapping, Optional

from app.services.systems import csv_import, drift, exports, exposure, subports
from app.services.systems.interface_extractor import EXTRACTOR_VERSION
from app.services.systems.store import Conflict, Invalid, Mutation, NotFound, SystemStore

# §7.1: decision -> item kinds it may answer. keep_pinned covers a whole review.
ALLOWED = {
    "accept": frozenset({"net_changed", "connector_changed"}),
    "remap": frozenset({"net_changed", "pin_missing"}),
    "bind_candidate": frozenset({"connector_missing"}),
    "remove_rows": frozenset({"net_changed", "pin_missing"}),
}


def _pins(component: Mapping[str, Any]) -> dict[str, list[str]]:
    return {str(p["pad"]): sorted(set(p["nets"])) for p in component.get("pins") or []}


# §9.3: an import review's items answer whether to create each proposed row.
IMPORT_ALLOWED = frozenset({"accept", "remove_rows"})


def _open_source_review(store: SystemStore, system_id: str, review_id: str) -> dict:
    review = store.get_review(system_id, review_id)
    if review["status"] != "open":
        raise Conflict(f"review is {review['status']}")
    if review["kind"] not in ("source_update", "child_update"):
        raise Conflict(f"a {review['kind']} review has no item decisions")
    return review


# child_update candidates come from the catalog, which the service reads: revision ID -> interface artifact.
ChildLoader = Callable[[str], Optional[dict]]


class StaleReview(Exception):
    """Rows or ports on the review's instance changed after it opened (v1.12).

    Raised before anything is written, so the caller can roll back and have
    the review evaluated again.
    """

    def __init__(self, review: Mapping[str, Any]) -> None:
        super().__init__(review["id"])
        self.review = dict(review)


def is_stale(store: SystemStore, review: Mapping[str, Any]) -> bool:
    recorded = (review.get("pending_changes") or {}).get("basis")
    if recorded is None:
        return False  # opened before reviews recorded their basis
    return drift.basis(store.drift_links(review["system_id"]), review["instance_id"]) != recorded


def candidate_interface(store: SystemStore, review: Mapping[str, Any],
                        child_loader: Optional[ChildLoader] = None) -> dict:
    if review["kind"] == "child_update":
        found = child_loader(review["to_commit"]) if child_loader else None
        if found is None:
            raise Conflict("the review's candidate revision cannot be read from the catalog")
        return found
    instance = store.get_instance(review["system_id"], review["instance_id"])
    found = store.get_interface(instance["project_id"], review["to_commit"], EXTRACTOR_VERSION)
    if found is None:  # detection extracted it before opening the review
        raise Conflict("the review's candidate interface is not available")
    return found


def _resolved_component(
    candidate: Mapping[str, Any], port: Mapping[str, Any]
) -> Optional[dict]:
    """The candidate component a stored port baseline now names, by member keys."""

    wanted = set(port.get("memberKeys") or [port["portKey"]])
    matches = [c for c in candidate.get("components") or [] if wanted & set(c.get("memberKeys") or [])]
    return dict(matches[0]) if len(matches) == 1 else None


def _end_component(review: Mapping[str, Any], item: Mapping[str, Any], link: Mapping[str, Any],
                   candidate: Mapping[str, Any]) -> Optional[dict]:
    """The component an item's link end resolves to once the review's port updates apply."""

    port = dict(link[f"{item['link_end']}_port"])
    for update in (review.get("pending_changes") or {}).get("portUpdates") or []:
        if (update["linkId"], update["end"]) == (link["id"], item["link_end"]):
            port = dict(update["port"])
    return _resolved_component(candidate, port)


def _validate(store: SystemStore, review: Mapping[str, Any], item: Mapping[str, Any],
              decision: str, payload: Mapping[str, Any], candidate: Mapping[str, Any]) -> None:
    if decision not in ALLOWED:
        raise Invalid(f"unknown decision {decision!r}")
    if item["kind"] not in ALLOWED[decision]:
        raise Invalid(f"{decision} does not apply to a {item['kind']} item")
    link = store.get_link(review["system_id"], item["link_id"])
    if decision == "bind_candidate":
        end = item["link_end"]
        if link.get(f"{end}_subport_id") or (link.get(f"{end}_port") and subports.on_connector(
                store.list_subports(review["system_id"]), link[f"{end}_instance_id"], link[f"{end}_port"])):
            raise Conflict("port_split: this connector has sub-ports; remove them before binding it to another "
                           "connector (P2 §22.4)")
        port_key = payload.get("portKey")
        offered = {c["portKey"] for c in item.get("candidates") or []}
        if port_key not in offered:
            raise Invalid("portKey must be one of the item's candidates")
        component = next(c for c in candidate["components"] if c["portKey"] == port_key)
        pins = _pins(component)
        missing = sorted({r[f"pin_{item['link_end']}"] for r in link["rows"] if r["id"] in item["row_ids"]}
                         - set(pins), key=drift.pad_sort_key)
        if missing:
            raise Conflict(f"pads {', '.join(missing)} do not exist on {component['reference']}; remove those rows first")
    elif decision == "remap":
        pad = payload.get("pad")
        if not isinstance(pad, str) or not pad:
            raise Invalid("remap needs payload.pad")
        component = _end_component(review, item, link, candidate)
        if component is None or pad not in _pins(component):
            raise Invalid(f"pad {pad} does not exist on the resolved port")
    elif decision == "accept" and item["kind"] == "connector_changed":
        component = _end_component(review, item, link, candidate)
        pins = _pins(component) if component else {}
        missing = sorted({r[f"pin_{item['link_end']}"] for r in link["rows"] if r["id"] in item["row_ids"]}
                         - set(pins), key=drift.pad_sort_key)
        if missing:
            raise Conflict(f"pads {', '.join(missing)} no longer exist; remap or remove those rows first")


def decide(store: SystemStore, change: Mutation, review_id: str, item_id: str, decision: str,
           payload: Optional[Mapping[str, Any]], child_loader: Optional[ChildLoader] = None) -> dict:
    """Record a decision; apply the review if it was the last undecided item."""

    review = store.get_review(change.system_id, review_id)
    if review["kind"] == "import" and review["status"] == "open":
        return _decide_import(store, change, review, item_id, decision, payload)
    review = _open_source_review(store, change.system_id, review_id)
    item = next((i for i in review["items"] if i["id"] == item_id), None)
    if item is None:
        raise NotFound("Review item not found")
    if is_stale(store, review):
        raise StaleReview(review)
    candidate = candidate_interface(store, review, child_loader)
    _validate(store, review, item, decision, dict(payload or {}), candidate)
    store.set_item_decision(change, review_id, item_id, decision, payload)
    review = store.get_review(change.system_id, review_id)
    if all(i["decision"] for i in review["items"]):
        apply_review(store, change, review, candidate)
    return store.get_review(change.system_id, review_id)


def apply_review(store: SystemStore, change: Mutation, review: Mapping[str, Any],
                 candidate: Mapping[str, Any]) -> None:
    """§7.1: atomically apply every decision and move the baseline to ``to_commit``."""

    pending = review.get("pending_changes") or {}
    links = {link["id"]: link for link in store.drift_links(change.system_id)}
    for update in pending.get("portUpdates") or []:
        if update["linkId"] in links:
            store.set_link_port(change, update["linkId"], update["end"], update["port"])
    for silent in pending.get("silent") or []:
        if silent["linkId"] in links:
            change.audit(silent["kind"], {"instanceId": review["instance_id"], **silent})

    links = {link["id"]: link for link in store.drift_links(change.system_id)}
    for item in review["items"]:
        link = links.get(item["link_id"])
        if link is None:
            continue  # the link was deleted while the review was open
        end = item["link_end"]
        rows = [r for r in link["rows"] if r["id"] in item["row_ids"]]
        payload = item["decision_payload"] or {}
        decision = item["decision"]
        # Re-validate: rows may have been edited since the decision was taken.
        _validate(store, review, item, decision, payload, candidate)
        if decision == "remove_rows":
            store.delete_rows(change, link["id"], [r["id"] for r in rows])
            continue
        if decision == "bind_candidate":
            component = next(c for c in candidate["components"] if c["portKey"] == payload["portKey"])
            store.set_link_port(change, link["id"], end, exposure.port_baseline(component))
            change.audit("connector_rebound", {"instanceId": review["instance_id"], "linkId": link["id"],
                                               "end": end, "via": "bind_candidate",
                                               "before": link[f"{end}_port"],
                                               "after": exposure.port_baseline(component)})
        else:
            component = _end_component(review, item, link, candidate)
            if decision == "accept" and item["kind"] == "connector_changed" and component is not None:
                store.set_link_port(change, link["id"], end, exposure.port_baseline(component))
        pins = _pins(component) if component else {}
        for row in rows:
            pad = payload["pad"] if decision == "remap" else row[f"pin_{end}"]
            store.update_row_end(change, link["id"], row["id"], end,
                                 pin=pad if decision == "remap" else None, nets=pins.get(pad, []))

    if review["kind"] == "child_update":
        store.set_catalog_revision(change, review["instance_id"], review["to_commit"], kind="review_applied",
                                   payload={"reviewId": review["id"]})
        store.set_review_status(change, review["id"], "applied")
        return
    exports.refresh_after_advance(store, change, review["instance_id"], candidate)
    store.set_baseline(change, review["instance_id"], review["to_commit"], kind="review_applied",
                       payload={"reviewId": review["id"]})
    store.close_applied_renames(change, review["instance_id"], review["to_commit"])  # P2 §23.3
    store.set_review_status(change, review["id"], "applied")


def keep_pinned(store: SystemStore, change: Mutation, review_id: str) -> dict:
    """§7.1: close the whole review, pin the instance, keep the baseline."""

    review = _open_source_review(store, change.system_id, review_id)
    store.set_review_status(change, review_id, "kept_pinned", audit_kind="review_kept_pinned",
                            payload={"instanceId": review["instance_id"], "to": review["to_commit"]})
    if review["kind"] == "child_update":
        store.set_follow(change, review["instance_id"], "pinned")
    else:
        store.update_instance(change, review["instance_id"], pinned=True)
    return store.get_review(change.system_id, review_id)


def _import_proposal(item: Mapping[str, Any]) -> dict:
    proposal = dict(item["observed"])
    signal = (item["decision_payload"] or {}).get("signal")
    if isinstance(signal, str):
        proposal["signal"] = signal
    return proposal


def _decide_import(store: SystemStore, change: Mutation, review: Mapping[str, Any], item_id: str,
                   decision: str, payload: Optional[Mapping[str, Any]]) -> dict:
    """§9.3: ``accept`` creates the proposed row, ``remove_rows`` drops it.

    ``accept`` may carry ``{"signal": ...}`` to rename the signal. The rows are
    written, all at once, when the last item is decided.
    """

    item = next((i for i in review["items"] if i["id"] == item_id), None)
    if item is None:
        raise NotFound("Review item not found")
    if decision not in IMPORT_ALLOWED:
        raise Invalid(f"{decision} does not apply to an import item")
    payload = dict(payload or {})
    if "signal" in payload and (not isinstance(payload["signal"], str) or len(payload["signal"]) > 200):
        raise Invalid("payload.signal must be a string of at most 200 characters")
    interfaces = csv_import.baseline_interfaces(store, change.system_id)
    if decision == "accept":
        csv_import.resolve_proposal(item["observed"], interfaces)
    store.set_item_decision(change, review["id"], item_id, decision, payload or None)
    review = store.get_review(change.system_id, review["id"])
    if all(i["decision"] for i in review["items"]):
        accepted = [_import_proposal(i) for i in review["items"] if i["decision"] == "accept"]
        report = csv_import.apply_rows(store, change, accepted, interfaces)
        store.set_review_status(change, review["id"], "applied", audit_kind="review_applied",
                                payload={"kind": "import", **report})
    return store.get_review(change.system_id, review["id"])
