"""Exports: the connectors a system publishes to its parents (CONTRACTS_P2 §4).

An export points at one board port of this system. It resolves at the board's
baseline exactly like a link end: by ``memberKeys`` intersection, so
re-annotating or re-placing the connector keeps the export. When a baseline
advances, ``refresh_after_advance`` moves each export's stored port baseline to
the component it now resolves to. An export that no longer resolves, or whose
port is no longer exposed, is the ``SYS-V16 export_unresolved`` error.

A **re-export** passes a child assembly's export up: it targets
``(assembly instance, child export ID)`` and resolves through that
instance's pinned revision interface (SB2-06).

``as_interface`` presents a revision's export interface in the shape of a
board interface artifact (one "component" per export, ``portKey`` = export
ID), so links, rows, generators and observed values treat an assembly's
exports exactly like a board's connectors.
"""

from __future__ import annotations

from typing import Any, Mapping, Optional, Sequence

from app.services.systems import exposure

INTERFACE_SCHEMA = "prism.system_export_interface.v1"


def as_interface(revision_interface: Optional[Mapping[str, Any]]) -> Optional[dict]:
    """A revision's ``prism.system_export_interface.v1`` as an interface artifact (§6.1)."""

    if revision_interface is None:
        return None
    components = []
    for entry in revision_interface.get("exports") or []:
        if not entry.get("resolved", True):
            continue  # publish refuses these; an old revision may still carry one
        components.append({
            "portKey": entry["id"], "memberKeys": [entry["id"]], "reference": entry["name"],
            "value": entry.get("reference"), "libId": entry.get("libId"), "footprint": entry.get("footprint"),
            "candidate": True, "candidateReason": "export", "dnp": False,
            "pins": [dict(pin) for pin in entry.get("pins") or []],
            "export": {"name": entry["name"], "reference": entry.get("reference"),
                       "occurrence": entry.get("occurrence"), "description": entry.get("description", ""),
                       # P2 §22.2: part of a connector in the child, so never one end of a b2b mate.
                       **({"subport": True} if entry.get("subport") else {})},
        })
    return {"components": components, "hasPcb": False, "kind": "export_interface"}


def resolve(interface: Optional[Mapping[str, Any]], port: Mapping[str, Any]) -> Optional[dict]:
    """The unique component whose ``memberKeys`` intersect the stored baseline's."""

    if interface is None:
        return None
    wanted = set(port.get("memberKeys") or [port["portKey"]])
    matches = [c for c in interface.get("components") or [] if wanted & set(c.get("memberKeys") or [])]
    return dict(matches[0]) if len(matches) == 1 else None


def refresh_after_advance(
    store: Any, change: Any, instance_id: str, candidate: Mapping[str, Any],
) -> None:
    """Keep export port baselines in step with a new board baseline (audited like link relabels)."""

    for export in store.list_exports(change.system_id):
        port = export["target_port"]
        if export["target_instance_id"] != instance_id or not port:
            continue
        component = resolve(candidate, port)
        if component is None:
            continue  # reported as SYS-V16 until someone retargets or deletes it
        after = exposure.port_baseline(component)
        if after == dict(port):
            continue
        kind = "connector_relabelled" if after["portKey"] == port["portKey"] else "connector_rebound"
        store.set_export_port(change, export["id"], after)
        change.audit(kind, {"instanceId": instance_id, "exportId": export["id"], "before": dict(port),
                            "after": after})


def _pins(component: Mapping[str, Any]) -> list[dict]:
    pins = []
    for pad, pin in sorted(exposure.pins_by_pad(component).items(), key=lambda item: _natural(item[0])):
        pins.append({"pad": pad, "nets": list(pin.get("nets") or []), "powerNet": pin.get("powerNet"),
                     "pinNames": pin.get("pinNames"), "pinTypes": pin.get("pinTypes")})
    return pins


def _natural(pad: str) -> tuple:
    from app.services.systems.drift import pad_sort_key

    return pad_sort_key(pad)


def _split(component: Mapping[str, Any], export: Mapping[str, Any],
           subports: Sequence[Mapping[str, Any]]) -> tuple[dict, Optional[str], bool]:
    """The component an export publishes on a split connector (P2 §22.2): only its sub-port's pads,
    or the remainder's, with the sub-port's name and whether it is part of a connector."""
    from app.services.systems import subports as subports_module

    on = subports_module.on_connector(subports, export["target_instance_id"],
                                      {"portKey": component["portKey"], "memberKeys": component.get("memberKeys")})
    if not on:
        return dict(component), None, False
    subport_id = export.get("target_subport_id")
    pads = subports_module.end_pads(exposure.pins_by_pad(component), on, subport_id)
    name = next((s["name"] for s in on if s["id"] == subport_id), None)
    return {**component, "pins": [p for p in component.get("pins") or [] if str(p["pad"]) in pads]}, name, True


def interface(
    exports: Sequence[Mapping[str, Any]], instances: Mapping[str, Mapping[str, Any]],
    interfaces: Mapping[str, Optional[Mapping[str, Any]]], overrides: Mapping[str, Mapping[str, str]],
    subports: Sequence[Mapping[str, Any]] = (),
) -> dict:
    """``prism.system_export_interface.v1`` over baseline interfaces (§4.3).

    ``interfaces`` maps instance ID to its baseline interface (None while not
    extracted). An export that does not resolve is listed with
    ``resolved: false`` and no pins, so a publish can refuse it. An export of a
    sub-port, or of a split connector's remainder, lists only those pads and
    ``subport: true`` (P2 §22.2); ``subports`` are the system's sub-port rows.
    """

    out = []
    for export in exports:
        entry: dict[str, Any] = {"id": export["id"], "name": export["name"], "description": export["description"],
                                 "occurrence": "/" + export["target_instance_id"]}
        port = export["target_port"]
        if not port:
            # A re-export: the child's export, one level further down (§4.1).
            child = _child_export(interfaces.get(export["target_instance_id"]), export["target_export_id"])
            if child is None:
                entry.update({"resolved": False, "reference": None, "libId": None, "footprint": None,
                              "pinCount": 0, "pins": []})
            else:
                inner = child["export"].get("occurrence") or ""
                child, name, partial = _split(child, export, subports)
                reference = child["export"].get("reference")
                entry.update({"resolved": True, "occurrence": "/" + export["target_instance_id"] + inner,
                              "reference": f"{reference}.{name}" if name and reference else reference,
                              "libId": child.get("libId"), "footprint": child.get("footprint"),
                              "pinCount": len(child["pins"]), "pins": _pins(child)})
                if partial or child["export"].get("subport"):
                    entry["subport"] = True
            out.append(entry)
            continue
        component = resolve(interfaces.get(export["target_instance_id"]), port)
        exposed = component is not None and exposure.is_exposed(
            component, overrides.get(export["target_instance_id"], {}).get(component["portKey"])
        )
        if component is None or not exposed:
            entry.update({"resolved": False, "reference": (port or {}).get("reference"), "libId": None,
                          "footprint": None, "pinCount": 0, "pins": []})
        else:
            baseline = exposure.port_baseline(component)
            part, name, partial = _split(component, export, subports)
            entry.update({"resolved": True,
                          "reference": f"{baseline['reference']}.{name}" if name else baseline["reference"],
                          "libId": baseline["libId"], "footprint": baseline["footprint"],
                          "pinCount": len(part["pins"]) if partial else baseline["pinCount"],
                          "pins": _pins(part)})
            if partial:
                entry["subport"] = True
        out.append(entry)
    return {"schema": INTERFACE_SCHEMA, "exports": out}


def _child_export(interface: Optional[Mapping[str, Any]], export_id: Optional[str]) -> Optional[dict]:
    if interface is None or not export_id:
        return None
    return next((dict(c) for c in interface.get("components") or [] if c["portKey"] == export_id), None)


def findings(
    exports: Sequence[Mapping[str, Any]], interfaces: Mapping[str, Optional[Mapping[str, Any]]],
    overrides: Mapping[str, Mapping[str, str]], unevaluated: set[str],
) -> list[dict]:
    """SYS-V16 for each port export that no longer resolves or is not exposed at its baseline.

    Instances in ``unevaluated`` (interface not extracted, or source
    unavailable) are skipped: unevaluated is never reported as passed or failed.
    """

    out = []
    for export in exports:
        port = export["target_port"]
        iid = export["target_instance_id"]
        if not port:
            if interfaces.get(iid) is not None and _child_export(interfaces[iid], export["target_export_id"]) is None:
                out.append({"exportId": export["id"], "instanceId": iid, "reference": None,
                            "reason": "child_export_missing", "name": export["name"]})
            continue
        if iid in unevaluated or interfaces.get(iid) is None:
            continue
        component = resolve(interfaces[iid], port)
        if component is None:
            reason = "connector_missing"
        elif not exposure.is_exposed(component, overrides.get(iid, {}).get(component["portKey"])):
            reason = "port_not_exposed"
        else:
            continue
        out.append({"exportId": export["id"], "instanceId": iid, "reference": port.get("reference"),
                    "reason": reason, "name": export["name"]})
    return out
