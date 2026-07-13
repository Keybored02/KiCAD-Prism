"""Diff grouping, a faithful port of frontend/src/lib/diff-grouping.ts.

The web UI groups diff items into domain categories (Components / Nets / Zones /
Graphics for PCB; Symbols / Nets / Sheets / Text for schematics) and reconciles
mixed kinds within a group, so a rerouted net shows as one amber "changed" row
rather than a misleading green+red pair. The plugin has to show *the same rows*,
so this is a direct translation rather than a fresh implementation.

Keep it in step with the TypeScript. If you change grouping or labels there,
change them here, the whole point is that both surfaces say the same thing about
the same board.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Iterable, Literal

Kind = Literal["added", "removed", "changed"]

# label, sort order. Components/Symbols share rank 0: a file is either a board or
# a schematic, so they never compete.
CATEGORY_META: dict[str, tuple[str, int]] = {
    "components": ("Components", 0),
    "symbols": ("Symbols", 0),
    "nets": ("Nets", 1),
    "zones": ("Zones", 2),
    "sheets": ("Sheets", 3),
    "text": ("Text", 4),
    "graphics": ("Graphics", 5),
    "other": ("Other", 9),
}

_CATEGORY_FOR_TYPE: dict[str, str] = {
    # PCB
    "footprint": "components",
    "segment": "nets",
    "arc": "nets",
    "via": "nets",
    "zone": "zones",
    # Board graphics (gr_*) and footprint graphics (fp_*) both group as graphics.
    "gr_text": "graphics",
    "gr_line": "graphics",
    "gr_circle": "graphics",
    "gr_rect": "graphics",
    "gr_arc": "graphics",
    "gr_poly": "graphics",
    "fp_text": "graphics",
    "fp_line": "graphics",
    "fp_circle": "graphics",
    "fp_rect": "graphics",
    "fp_arc": "graphics",
    "fp_poly": "graphics",
    # Schematic
    "symbol": "symbols",
    "label": "nets",
    "global_label": "nets",
    "hierarchical_label": "nets",
    "net_label": "nets",
    "wire": "nets",
    "bus": "nets",
    "bus_entry": "nets",
    "junction": "nets",
    "no_connect": "nets",
    "sheet": "sheets",
    "text": "text",
}

# How items inside a category are bucketed.
_POLICY: dict[str, str] = {
    "components": "per-item",
    "symbols": "per-item",
    "sheets": "per-item",
    "zones": "per-item",
    "text": "per-item",
    "other": "per-item",
    "nets": "by-net",
    "graphics": "by-layer",
}


def category_for(item_type: str | None) -> str:
    if not item_type:
        return "other"
    return _CATEGORY_FOR_TYPE.get(item_type, "other")


def merged_kind(kinds: Iterable[Kind]) -> Kind:
    """{added} → added, {removed} → removed, anything mixed → changed."""
    unique = set(kinds)
    if len(unique) == 1:
        return next(iter(unique))
    return "changed"


@dataclass
class Group:
    id: str
    category: str
    kind: Kind
    label: str
    members: list[tuple[Kind, dict]] = field(default_factory=list)
    count: dict[str, int] = field(
        default_factory=lambda: {"added": 0, "removed": 0, "changed": 0}
    )

    @property
    def category_label(self) -> str:
        return CATEGORY_META[self.category][0]

    @property
    def item_id(self) -> str:
        """The id used to deep-link the diff viewer at this change.

        Raw diff items key on `uuid`; the backend renames it to `id` when it
        summarises them for the web UI. We consume the raw items, so accept both.
        """
        if not self.members:
            return ""
        item = self.members[0][1]
        return str(item.get("id") or item.get("uuid") or "")


def _sub_group_key(category: str, policy: str, item: dict, index: int) -> str:
    if policy == "by-net":
        # PCB segments/vias carry `net`/`net_name`; schematic labels carry the
        # net name as their text.
        for key in ("net", "net_name", "text"):
            v = item.get(key)
            if v not in (None, ""):
                return str(v)
        return "(no net)"
    if policy == "by-layer":
        return str(item.get("layer") or "(no layer)")
    # per-item: every item is its own bucket. Raw diff items key on `uuid` (the
    # backend renames it to `id` for the web UI), so accept either. Fall back to
    # the index rather than a random key so grouping is deterministic, the TS
    # uses Math.random() here, which is fine there but would make our output
    # differ between identical calls.
    return str(item.get("id") or item.get("uuid") or f"{category}-{index}")


def _plural(n: int, one: str, many: str) -> str:
    return f"{n} {one if n == 1 else many}"


def _label_for(group: Group) -> str:
    members = group.members
    if not members:
        return ""
    first = members[0][1]
    cat = group.category

    if cat == "nets":
        if first.get("net_name"):
            net_label = str(first["net_name"])
        elif first.get("net") not in (None, ""):
            net_label = f"Net {first['net']}"
        elif first.get("text"):
            net_label = str(first["text"])
        else:
            net_label = "No net"

        types = [it.get("type") for _, it in members]
        parts: list[str] = []
        segs = sum(1 for t in types if t in ("segment", "wire", "arc"))
        vias = sum(1 for t in types if t == "via")
        lbls = sum(
            1
            for t in types
            if t in ("label", "global_label", "hierarchical_label", "net_label")
        )
        buses = sum(1 for t in types if t in ("bus", "bus_entry"))
        jncs = sum(1 for t in types if t in ("junction", "no_connect"))
        if segs:
            parts.append(_plural(segs, "wire", "wires"))
        if vias:
            parts.append(_plural(vias, "via", "vias"))
        if lbls:
            parts.append(_plural(lbls, "label", "labels"))
        if buses:
            parts.append(_plural(buses, "bus", "buses"))
        if jncs:
            parts.append(_plural(jncs, "junction", "junctions"))
        return f"{net_label}, {', '.join(parts)}" if parts else net_label

    if cat == "graphics":
        layer = first.get("layer") or "No layer"
        return f"{layer}, {_plural(len(members), 'item', 'items')}"

    if cat in ("components", "symbols"):
        ref = first.get("reference") or first.get("lib_id") or "?"
        value = first.get("value")
        return f"{ref} ({value})" if value else str(ref)

    if cat == "zones":
        net_name, layer = first.get("net_name"), first.get("layer")
        if net_name and layer:
            return f"{net_name} ({layer})"
        return str(net_name or first.get("name") or "Zone")

    if cat == "sheets":
        return str(first.get("sheet_name") or first.get("sheet_file") or "Sheet")

    if cat == "text":
        t = str(first.get("text") or "")
        if len(t) > 32:
            return t[:29] + "..."
        return t or "Text"

    return str(first.get("name") or first.get("text") or first.get("type") or "")


def categorise(items: list[tuple[Kind, dict]]) -> list[Group]:
    """Group (kind, item) pairs into category buckets, mirroring the web UI."""
    buckets: dict[str, Group] = {}
    for index, (kind, item) in enumerate(items):
        cat = category_for(item.get("type"))
        key = f"{cat}::{_sub_group_key(cat, _POLICY[cat], item, index)}"
        group = buckets.get(key)
        if group is None:
            group = Group(id=f"g{len(buckets)}", category=cat, kind=kind, label="")
            buckets[key] = group
        group.members.append((kind, item))
        group.count[kind] += 1

    out = list(buckets.values())
    for group in out:
        group.kind = merged_kind(k for k, _ in group.members)
        group.label = _label_for(group)

    out.sort(key=lambda g: (CATEGORY_META[g.category][1], g.label))
    return out


def group_file_diff(diff: dict) -> list[Group]:
    """Turn a pcb/sch diff dict ({added, removed, changed}) into display groups."""
    items: list[tuple[Kind, dict]] = []
    for it in diff.get("added", []):
        items.append(("added", it))
    for it in diff.get("removed", []):
        items.append(("removed", it))
    for entry in diff.get("changed", []):
        # A "changed" entry wraps the item alongside its field-level changes.
        items.append(("changed", entry.get("item", entry)))
    return categorise(items)
