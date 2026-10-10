"""The drift engine (``docs/system-builder/CONTRACTS.md`` §6).

``evaluate`` compares one instance's **stored** link-end baselines (port and
row nets) against a candidate interface and classifies every difference. It is
a pure function: no database, no Git, and no access to the old commit's
interface, which is what lets a rebase from an unreachable baseline evaluate
normally (§10.1).

Detection (SYS-06) applies the outcome; review decisions (SYS-07) consume the
items. Neither re-runs this against another commit at decision time.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from typing import Any, Mapping, Optional, Sequence

from app.services.systems.interface_extractor import canonical_digest, connected_interface_digest

# §6.1 precedence; also the sort order of items on one link end.
ITEM_KINDS = ("connector_missing", "connector_changed", "pin_missing", "net_changed")
MAX_CANDIDATES = 5


class DriftInconsistency(RuntimeError):
    """The item rules and the §6.3 digest disagree: an engine bug, never user data.

    Detection must not auto-advance on a verdict the engine cannot vouch for,
    so this is raised rather than logged.
    """


def pad_sort_key(pad: str) -> tuple:
    """Natural order for pad numbers ("2" < "10" < "A1"); pads stay strings (§2.4)."""

    return tuple(
        (0, int(chunk), "") if chunk.isdigit() else (1, 0, chunk)
        for chunk in re.findall(r"\d+|\D+", pad)
    )


@dataclass(frozen=True)
class Item:
    """One review item (§5 ``system_review_items``)."""

    kind: str
    link_id: str
    end: str
    row_ids: tuple[str, ...]
    pins: tuple[str, ...]
    expected: Any
    observed: Any
    candidates: Optional[tuple[dict, ...]] = None


@dataclass(frozen=True)
class Silent:
    """A change applied without review and audited when applied (§6.1)."""

    kind: str  # connector_relabelled | connector_rebound (the §10.2 audit kinds)
    link_id: str
    end: str
    via: str  # key | memberKeys | rebind
    before: Mapping[str, Any]
    after: Mapping[str, Any]


@dataclass
class Outcome:
    instance_id: str
    items: list[Item] = field(default_factory=list)
    silent: list[Silent] = field(default_factory=list)
    # (link_id, end) -> the port baseline to store when the candidate is accepted.
    port_updates: dict[tuple[str, str], dict] = field(default_factory=dict)
    # §6.3, computed independently of the items; ``evaluate`` asserts they agree.
    digest_equivalent: bool = True

    @property
    def auto_advance(self) -> bool:
        return not self.items


@dataclass(frozen=True)
class _End:
    link_id: str
    end: str
    port: Mapping[str, Any]
    rows: tuple[Mapping[str, Any], ...]  # {id, pin, net}

    @property
    def connected(self) -> dict[str, list[str]]:
        """Accepted nets per connected pad. Rows sharing a pad share its net set."""
        out: dict[str, list[str]] = {}
        for row in self.rows:
            out.setdefault(row["pin"], sorted(set(row["net"])))
        return out


def _ends(links: Sequence[Mapping[str, Any]], instance_id: str) -> list[_End]:
    ends = []
    for link in links:
        for end in ("a", "b"):
            if link[f"{end}_instance_id"] != instance_id:
                continue
            rows = tuple(
                {"id": row["id"], "pin": str(row[f"pin_{end}"]), "net": list(row[f"net_{end}"])}
                for row in link.get("rows") or []
            )
            ends.append(_End(link["id"], end, dict(link[f"{end}_port"]), rows))
    return sorted(ends, key=lambda e: (e.link_id, e.end))


def _pins(component: Mapping[str, Any]) -> dict[str, list[str]]:
    return {str(pin["pad"]): sorted(set(pin["nets"])) for pin in component.get("pins") or []}


def _port_baseline(component: Mapping[str, Any]) -> dict[str, Any]:
    return {
        "portKey": component["portKey"],
        "memberKeys": sorted(component["memberKeys"]),
        "reference": component["reference"],
        "libId": component.get("libId"),
        "footprint": component.get("footprint"),
        "pinCount": len(_pins(component)),
    }


def _resolve_by_key(end: _End, components: Sequence[Mapping[str, Any]]) -> Optional[dict]:
    """§2.3: exactly one component whose memberKeys intersect the baseline's."""

    wanted = set(end.port.get("memberKeys") or [end.port["portKey"]])
    matches = [c for c in components if wanted & set(c.get("memberKeys") or [])]
    return dict(matches[0]) if len(matches) == 1 else None


def _net_overlap(end: _End, pins: Mapping[str, list[str]]) -> float:
    connected = end.connected
    if not connected:
        return 1.0  # no connected pads: nothing disagrees
    equal = sum(1 for pad, nets in connected.items() if pad in pins and pins[pad] == nets)
    return equal / len(connected)


def _rank(end: _End, components: Sequence[Mapping[str, Any]]) -> list[dict]:
    """§6.4 listing: any of reference, libId or pin count equal; ranked descending."""

    ranked = []
    for component in components:
        pins = _pins(component)
        flags = (
            component["reference"] == end.port.get("reference"),
            component.get("libId") == end.port.get("libId"),
            len(pins) == end.port.get("pinCount"),
        )
        if not any(flags):
            continue
        ranked.append({
            "portKey": component["portKey"],
            "memberKeys": sorted(component["memberKeys"]),
            "reference": component["reference"],
            "libId": component.get("libId"),
            "footprint": component.get("footprint"),
            "pinCount": len(pins),
            "referenceEqual": flags[0],
            "libIdEqual": flags[1],
            "pinCountEqual": flags[2],
            "netOverlap": _net_overlap(end, pins),
        })
    ranked.sort(key=lambda c: (
        -c["referenceEqual"], -c["libIdEqual"], -c["pinCountEqual"], -c["netOverlap"], c["portKey"],
    ))
    return ranked


def _rebind(end: _End, free: Sequence[Mapping[str, Any]]) -> Optional[dict]:
    """§6.4 auto-rebind: exactly one free component meets every condition."""

    qualified = []
    for component in free:
        pins = _pins(component)
        if (
            component["reference"] == end.port.get("reference")
            and component.get("libId") == end.port.get("libId")
            and len(pins) == end.port.get("pinCount")
            and all(pad in pins and pins[pad] == nets for pad, nets in end.connected.items())
        ):
            qualified.append(component)
    return dict(qualified[0]) if len(qualified) == 1 else None


def _end_items(end: _End, component: Optional[Mapping[str, Any]], free: Sequence[Mapping[str, Any]]) -> list[Item]:
    all_rows = tuple(row["id"] for row in end.rows)
    all_pins = tuple(sorted({row["pin"] for row in end.rows}, key=pad_sort_key))
    if component is None:
        return [Item(
            "connector_missing", end.link_id, end.end, all_rows, all_pins,
            expected=dict(end.port), observed=None,
            candidates=tuple(_rank(end, free)[:MAX_CANDIDATES]),
        )]
    if component.get("libId") != end.port.get("libId") or component.get("footprint") != end.port.get("footprint"):
        return [Item(
            "connector_changed", end.link_id, end.end, all_rows, all_pins,
            expected={"libId": end.port.get("libId"), "footprint": end.port.get("footprint")},
            observed={"libId": component.get("libId"), "footprint": component.get("footprint")},
        )]
    pins = _pins(component)
    items = []
    for row in sorted(end.rows, key=lambda r: (pad_sort_key(r["pin"]), r["id"])):
        accepted = sorted(set(row["net"]))
        if row["pin"] not in pins:
            items.append(Item("pin_missing", end.link_id, end.end, (row["id"],), (row["pin"],),
                              expected=accepted, observed=None))
        elif pins[row["pin"]] != accepted:
            items.append(Item("net_changed", end.link_id, end.end, (row["id"],), (row["pin"],),
                              expected=accepted, observed=pins[row["pin"]]))
    return items


def _digest_equal(end: _End, component: Optional[Mapping[str, Any]]) -> bool:
    """§6.3: the connected-interface digest of the candidate equals the stored one."""

    if component is None:
        return False
    pins = _pins(component)
    connected = end.connected
    if any(pad not in pins for pad in connected):
        return False
    stored = connected_interface_digest(end.port.get("libId"), end.port.get("footprint"), connected)
    observed = connected_interface_digest(
        component.get("libId"), component.get("footprint"), {pad: pins[pad] for pad in connected}
    )
    return stored == observed


def basis(links: Sequence[Mapping[str, Any]], instance_id: str) -> str:
    """A digest of what an evaluation of ``instance_id`` read: every link end on
    it, with its port baseline and each row's pads and accepted net.

    A review records it when it opens. If rows or ports on the instance change
    while the review is open, its items no longer describe the system, so it
    must be evaluated again rather than applied (§7.1, v1.12).
    """

    ends = []
    for link in sorted(links, key=lambda item: item["id"]):
        for end in ("a", "b"):
            if link[f"{end}_instance_id"] != instance_id:
                continue
            ends.append({
                "link": link["id"], "end": end, "port": dict(link[f"{end}_port"]),
                "rows": sorted(
                    [row["id"], str(row["pin_a"]), str(row["pin_b"]), sorted(set(row[f"net_{end}"]))]
                    for row in link.get("rows") or []
                ),
            })
    return canonical_digest(ends)


def evaluate(
    links: Sequence[Mapping[str, Any]], instance_id: str, candidate: Mapping[str, Any]
) -> Outcome:
    """§6.1–§6.4 for every link end on ``instance_id``.

    ``links`` are in ``SystemStore.list_links`` shape (``a_instance_id``,
    ``a_port``, ``rows`` with ``pin_a``/``net_a`` …). ``candidate`` is a
    ``prism.system_interface.v1`` artifact.
    """

    components = [c for c in candidate.get("components") or [] if "?" not in c["reference"]]
    ends = _ends(links, instance_id)
    by_key = {(e.link_id, e.end): _resolve_by_key(e, components) for e in ends}
    bound = {c["portKey"] for c in by_key.values() if c is not None}
    free = [c for c in components if c["portKey"] not in bound]

    outcome = Outcome(instance_id)
    for end in ends:
        component = by_key[(end.link_id, end.end)]
        via = None
        if component is not None:
            via = "key" if component["portKey"] == end.port["portKey"] else "memberKeys"
        else:
            component = _rebind(end, free)
            via = "rebind" if component is not None else None

        items = _end_items(end, component, free)
        outcome.items.extend(items)
        outcome.digest_equivalent &= _digest_equal(end, component)
        if component is None:
            continue

        after = _port_baseline(component)
        before = dict(end.port)
        if via != "key":
            outcome.silent.append(Silent("connector_rebound", end.link_id, end.end, via, before, after))
        elif after["reference"] != before.get("reference"):
            outcome.silent.append(Silent("connector_relabelled", end.link_id, end.end, via, before, after))
        if any(after[key] != before.get(key) for key in after):
            outcome.port_updates[(end.link_id, end.end)] = after

    # §6.3: "no items" and digest equivalence are the same rule, stated twice.
    if outcome.digest_equivalent != (not outcome.items):
        raise DriftInconsistency(
            f"drift engine disagrees with the connected-interface digest for {instance_id}"
        )
    return outcome
