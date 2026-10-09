"""Module instances: a catalog module's connectors as a board-style interface (CONTRACTS_P2 §5.6, SB2-49).

A module revision's interface lists its units (§3.5: one per connector, pin names
are signals); the module's connector placements (§3.6) say which catalog part each
unit is and where it sits on the module's model. ``as_interface`` presents both in
the shape of a board interface artifact, one "component" per unit with ``portKey``
= the unit letter, so links, harness ends, rows, exports, system nets and mates
treat a module's connectors exactly like a board's:

- each pin carries its signal as its net (an unnamed pin has none);
- ``geometry`` is the connector part's footprint at the origin (§14.6) and
  ``footprintPose`` where that footprint sits in the module frame, so a mate or a
  harness end is "a footprint on a zero-thickness board at that pose";
- the interface carries the module's model and its aligned bounds (the scene's
  box and the System 3D view's GLB).
"""

from __future__ import annotations

import itertools
from typing import Any, Mapping, Optional

from app.services.systems.placement import module_ports

INTERFACE_KIND = "module_interface"


def _aligned_bounds(model: Optional[Mapping[str, Any]]) -> Optional[dict]:
    """The model's bounds after its alignment (``T·Rz·Ry·Rx·S``, §18.2), in the module frame."""
    if not model or not model.get("boundsMm"):
        return None
    from app.services.catalog.models import alignment_matrix

    m = alignment_matrix(model["alignment"])
    lo, hi = model["boundsMm"]["minMm"], model["boundsMm"]["maxMm"]
    corners = [[m[r] * c[0] + m[4 + r] * c[1] + m[8 + r] * c[2] + m[12 + r] for r in range(3)]
               for c in itertools.product(*zip(lo, hi))]
    return {"minMm": [min(p[k] for p in corners) for k in range(3)],
            "maxMm": [max(p[k] for p in corners) for k in range(3)]}


def as_interface(revision_interface: Optional[Mapping[str, Any]], connectors: Optional[Mapping[str, Any]],
                 model: Optional[Mapping[str, Any]] = None) -> Optional[dict]:
    """A module revision's units with today's connector placements as an interface artifact.

    ``connectors`` is the catalog's ``module_connectors`` reply (units with ``connector`` or null);
    ``model`` the module's first converted model ``{glbKey, boundsMm, alignment}``. A unit without a
    placed connector is still a port (links and rows work) but has no geometry, so it can't mate.
    """
    if revision_interface is None:
        return None
    placed = {unit["key"]: unit.get("connector") for unit in (connectors or {}).get("units") or []}
    components = []
    for unit in revision_interface.get("units") or []:
        connector = placed.get(unit["key"]) or {}
        part = connector.get("part") or {}
        geometry = connector.get("geometry")
        frame = module_ports.part_frame(geometry, (connector.get("placement") or {}).get("axis")) if geometry else None
        pins = []
        for pin in unit.get("pins") or []:
            signal = str(pin.get("signal") or "")
            pins.append({"pad": str(pin["pad"]), "nets": [signal] if signal else [], "pcbNets": [signal] if signal else [],
                         "pinNames": [str(pin.get("name") or "")], "pinTypes": [], "powerNet": bool(pin.get("powerNet"))})
        components.append({
            "portKey": unit["key"], "memberKeys": [unit["key"]], "reference": unit.get("name") or f"Unit {unit['key']}",
            "value": part.get("name") or None, "libId": None, "footprint": (geometry or {}).get("footprintName"),
            "mpn": part.get("mpn") or None, "candidate": True, "candidateReason": "module", "dnp": False, "pins": pins,
            "geometry": geometry, "boardThicknessMm": 0.0 if geometry else None,
            "footprintPose": connector.get("footprintPose") if geometry else None,
            # The frame the placement was made with (§3.6): a module port's mating axis is fixed in the catalog.
            "matingFrame": {"axis": frame["axis"], "quarterTurns": 0} if frame else None,
            "module": {"unit": unit["key"], "part": part.get("componentId")} if part else {"unit": unit["key"], "part": None},
        })
    return {"components": components, "hasPcb": False, "kind": INTERFACE_KIND, "boardThicknessMm": 0.0,
            "model": dict(model) if model else None, "boundsMm": _aligned_bounds(model)}


def component(interface: Optional[Mapping[str, Any]], port_key: str) -> Optional[dict]:
    """One unit's component by port key, or None."""
    for found in (interface or {}).get("components") or []:
        if found["portKey"] == port_key:
            return dict(found)
    return None


__all__ = ["INTERFACE_KIND", "as_interface", "component"]
