"""Port exposure and lookups over one interface artifact (§2.3, §4.2).

Pure functions: no database, no Git. The API and, later, validation and the
drift engine share them so "exposed" and "resolved" mean one thing everywhere.
"""

from __future__ import annotations

from typing import Any, Mapping, Optional


def is_annotated(reference: str) -> bool:
    return "?" not in (reference or "")


def is_exposed(component: Mapping[str, Any], override: Optional[str]) -> bool:
    """§4.2. Unannotated components are never ports (§2.3), whatever the override."""

    if not is_annotated(component.get("reference", "")):
        return False
    if override == "hidden":
        return False
    if override == "promoted":
        return True
    return bool(component.get("candidate")) and not bool(component.get("dnp"))


def port_summary(component: Mapping[str, Any], override: Optional[str]) -> dict[str, Any]:
    """A component as the system document shows it: facts without pins."""

    return {
        "portKey": component["portKey"],
        "memberKeys": list(component["memberKeys"]),
        "reference": component["reference"],
        "libId": component.get("libId"),
        "footprint": component.get("footprint"),
        "value": component.get("value"),
        "dnp": bool(component.get("dnp")),
        "candidate": bool(component.get("candidate")),
        "candidateReason": component.get("candidateReason"),
        "override": override,
        "exposed": is_exposed(component, override),
        "pinCount": len(component.get("pins") or []),
    }


def resolve_ports(
    interface: Mapping[str, Any], overrides: Mapping[str, str]
) -> list[dict[str, Any]]:
    """Every component with its exposure, in artifact order."""

    return [
        port_summary(component, overrides.get(component["portKey"]))
        for component in interface.get("components") or []
    ]


def component_by_key(interface: Mapping[str, Any], port_key: str) -> Optional[dict[str, Any]]:
    """The component whose ``portKey`` or ``memberKeys`` contains ``port_key``.

    At an instance's own baseline a stored ``portKey`` matches exactly; the
    member fallback covers a key that names a non-lowest unit.
    """

    components = interface.get("components") or []
    for component in components:
        if component["portKey"] == port_key:
            return dict(component)
    matches = [c for c in components if port_key in (c.get("memberKeys") or [])]
    return dict(matches[0]) if len(matches) == 1 else None


def port_baseline(component: Mapping[str, Any]) -> dict[str, Any]:
    """§5 port baseline captured when a link end is created or rebound."""

    return {
        "portKey": component["portKey"],
        "memberKeys": sorted(component["memberKeys"]),
        "reference": component["reference"],
        "libId": component.get("libId"),
        "footprint": component.get("footprint"),
        "pinCount": len(component.get("pins") or []),
    }


def pins_by_pad(component: Mapping[str, Any]) -> dict[str, dict[str, Any]]:
    return {str(pin["pad"]): dict(pin) for pin in component.get("pins") or []}
