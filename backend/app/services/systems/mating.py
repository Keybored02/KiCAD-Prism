"""Stored mating frames against the live geometry (CONTRACTS_P2 §15.2–§15.3).

Pure helpers: the service reads the interface and the stored records and asks
here what a port's mating state is, whether a stored frame is stale, and what
a confirmation would store.
"""

from __future__ import annotations

from typing import Any, Mapping, Optional

from app.services.systems.interface_extractor import canonical_digest
from app.services.systems.placement.frames import AXES, infer
from app.services.systems.store import Conflict, Invalid


def geometry_digest(component: Mapping[str, Any]) -> Optional[str]:
    geometry = component.get("geometry")
    return canonical_digest(geometry) if geometry is not None else None


def is_stale(component: Optional[Mapping[str, Any]], stored: Mapping[str, Any]) -> bool:
    """A stored frame is stale when its port's geometry is gone or differs from confirmation time."""
    if component is None:
        return True
    return stored.get("geometryDigest") != geometry_digest(component)


def port_state(component: Mapping[str, Any], stored: Optional[Mapping[str, Any]]) -> dict:
    """``GET …/mating`` row: the inference and the stored record (with ``stale``), if any."""
    return {
        "portKey": component["portKey"],
        "reference": component.get("reference") or "",
        "footprint": component.get("footprint") or "",
        "hasGeometry": component.get("geometry") is not None,
        "inferred": infer(component.get("geometry")),
        "stored": None if stored is None else {
            "mode": stored["mode"], "axis": stored["axis"], "quarterTurns": stored["quarterTurns"],
            "stale": is_stale(component, stored),
        },
    }


def record_for(component: Mapping[str, Any], mode: str, axis: Optional[str], quarter_turns: Optional[int]) -> dict:
    """What ``PUT …/mating/{portKey}`` stores; ``confirmed`` takes the inference as it is."""
    if mode == "confirmed":
        if axis is not None or quarter_turns not in (None, 0):
            raise Invalid("a confirmation takes the inferred frame; send mode 'override' to change it")
        inferred = infer(component.get("geometry"))
        if inferred["axis"] is None:
            raise Conflict("mating_not_inferable: this connector's frame cannot be inferred; pick one (override)")
        axis, quarter_turns = inferred["axis"], 0
    elif mode == "override":
        if axis not in AXES:
            raise Invalid(f"axis must be one of {', '.join(AXES)}")
        if quarter_turns is None or not 0 <= int(quarter_turns) <= 3:
            raise Invalid("quarterTurns must be 0, 1, 2 or 3")
    else:
        raise Invalid("mode must be 'confirmed' or 'override'")
    return {"mode": mode, "axis": axis, "quarterTurns": int(quarter_turns or 0),
            "geometryDigest": geometry_digest(component)}
