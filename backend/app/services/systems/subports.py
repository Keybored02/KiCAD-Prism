"""Sub-ports (SB2-105, CONTRACTS_P2 §22): named pad sets carved out of a connector on an instance.

Pure helpers: which end a pad belongs to, a definition's checks, and the row moves a change of
sub-ports needs (§22.3). The store writes; the service decides.
"""

from __future__ import annotations

import re
from typing import Any, Iterable, Mapping, Optional, Sequence

from app.services.systems.drift import pad_sort_key

MAX_PER_CONNECTOR = 16
MAX_PER_SYSTEM = 200
NAME = re.compile(r"^[A-Za-z0-9_+\-]{1,32}$")


def same_connector(a: Mapping[str, Any], b: Mapping[str, Any]) -> bool:
    """Two port baselines name one connector: the same key, or overlapping member keys (P1 §6)."""
    if a.get("portKey") and a.get("portKey") == b.get("portKey"):
        return True
    return bool(set(a.get("memberKeys") or ()) & set(b.get("memberKeys") or ()))


def on_connector(subports: Iterable[Mapping[str, Any]], instance_id: str,
                 port: Mapping[str, Any]) -> list[dict]:
    """The sub-ports of ``instance_id`` carved from the connector ``port`` names."""
    return [dict(s) for s in subports if s["instance_id"] == instance_id and same_connector(s["port"], port)]


def owner(subports: Sequence[Mapping[str, Any]], pad: str) -> Optional[str]:
    """The sub-port holding ``pad``, or None for the remainder."""
    for subport in subports:
        if pad in subport["pads"]:
            return subport["id"]
    return None


def end_pads(all_pads: Iterable[str], subports: Sequence[Mapping[str, Any]], subport_id: Optional[str]) -> set[str]:
    """The pads an end may use: its sub-port's, or for the remainder every pad no sub-port holds."""
    if subport_id is not None:
        found = next((s for s in subports if s["id"] == subport_id), None)
        return set(found["pads"]) if found else set()
    taken = {pad for s in subports for pad in s["pads"]}
    return {pad for pad in all_pads if pad not in taken}


def label(reference: str, name: Optional[str]) -> str:
    return f"{reference}.{name}" if name else reference


def check_definition(name: str, pads: Sequence[str], connector_pads: Iterable[str],
                     others: Sequence[Mapping[str, Any]]) -> list[str]:
    """Problems with a sub-port ``name`` / ``pads`` among the connector's ``others`` (§22.1), as
    ``code: message`` strings; empty when it is valid. Pads are returned sorted by the caller."""
    problems = []
    known = set(connector_pads)
    if not isinstance(name, str) or not NAME.match(name):
        problems.append("invalid_name: a sub-port name is 1–32 characters of letters, digits, _ + -")
    elif any(o["name"].lower() == name.lower() for o in others):
        problems.append(f"subport_name_taken: this connector already has a sub-port named {name}")
    if not pads:
        problems.append("subport_empty: a sub-port needs at least one pad")
    missing = sorted({p for p in pads if p not in known}, key=pad_sort_key)
    if missing:
        problems.append(f"pin_not_found: pads {', '.join(missing)} are not on this connector")
    if len(set(pads)) != len(pads):
        problems.append("subport_overlap: a pad is listed twice")
    taken = {pad: o["name"] for o in others for pad in o["pads"]}
    clash = sorted({p for p in pads if p in taken}, key=pad_sort_key)
    if clash:
        problems.append(f"subport_overlap: pads {', '.join(clash)} are already in {taken[clash[0]]}")
    if known and len(set(pads) | set(taken)) >= len(known):
        problems.append("subport_overlap: the sub-ports would take every pad; leave at least one on the connector")
    return problems


def plan_moves(links: Sequence[Mapping[str, Any]], instance_id: str, port: Mapping[str, Any],
               after: Sequence[Mapping[str, Any]]) -> list[dict]:
    """The row moves that put every row of every link on the connector at the end now holding its
    pad (§22.3), given the connector's sub-ports ``after`` the change.

    A link whose rows all belong to another end is retargeted; a link whose rows split keeps the
    rows of its current end (or, when none stay, of the end with most rows) and gives the rest to
    new links, one per end. Returns ``[{linkId, end, action, rowIds, toSubportId, newLinkName}]``.
    """

    ids = {s["id"] for s in after}
    names = {s["id"]: s["name"] for s in after}
    moves: list[dict] = []
    for link in links:
        for end in ("a", "b"):
            if link[f"{end}_instance_id"] != instance_id or not same_connector(link[f"{end}_port"], port):
                continue
            current = link.get(f"{end}_subport_id")
            current = current if current in ids else None if current is None else "__gone__"
            groups: dict[Optional[str], list[str]] = {}
            for row in sorted(link["rows"], key=lambda r: r["id"]):
                groups.setdefault(owner(after, row[f"pin_{end}"]), []).append(row["id"])
            if not groups:
                if current == "__gone__":
                    moves.append(_move(link, end, "retarget", [], None, names))
                continue
            if set(groups) == {current}:
                continue
            keep = current if current in groups else max(
                groups, key=lambda key: (len(groups[key]), key is None, names.get(key, "")))
            if keep != current:
                moves.append(_move(link, end, "retarget", groups[keep], keep, names))
            for key in sorted((k for k in groups if k != keep), key=lambda k: (k is not None, names.get(k, ""))):
                moves.append(_move(link, end, "split", groups[key], key, names))
    return moves


def _move(link: Mapping[str, Any], end: str, action: str, row_ids: list[str], to: Optional[str],
          names: Mapping[str, str]) -> dict:
    new_name = None
    if action == "split":
        new_name = " · ".join(part for part in (link["name"], names.get(to) if to else None) if part)
    return {"linkId": link["id"], "end": end, "action": action, "rowIds": row_ids,
            "toSubportId": to, "newLinkName": new_name}
