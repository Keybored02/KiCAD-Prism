"""Mapping generators for a link's rows (``docs/system-builder/CONTRACTS.md`` §8.5).

Each generator proposes pin pairs between the link's two ports at their
baselines. They are pure and never overwrite: a pair that touches a pad
already used by a row of the link is reported as skipped, not proposed. The
client applies proposals through ``PUT …/links/{lid}/rows`` with
``source = generator``, where the server validates them like any other row.
"""

from __future__ import annotations

import re
from collections import defaultdict
from typing import Any, Mapping, Optional, Sequence

from app.services.systems.drift import pad_sort_key
from app.services.systems.store import Invalid

GENERATORS = ("identity", "reverse", "offset", "net_name")
MAX_OFFSET = 10_000

_INTEGER = re.compile(r"^-?[0-9]+$")


def _leaf(net: str) -> str:
    return net.rsplit("/", 1)[-1]


def _pads(pins: Mapping[str, Mapping[str, Any]], window: Optional[Mapping[str, Any]], side: str) -> list[str]:
    """The side's pads in natural order, limited to ``{from, to}`` (inclusive) when given."""

    pads = sorted(pins, key=pad_sort_key)
    if not window:
        return pads
    start, end = str(window.get("from") or ""), str(window.get("to") or "")
    for bound in (start, end):
        if bound and bound not in pins:
            raise Invalid(f"range bound {bound} is not a pad of the {side} port")
    lo = pads.index(start) if start else 0
    hi = pads.index(end) if end else len(pads) - 1
    if lo > hi:
        raise Invalid(f"the {side} range runs backwards")
    return pads[lo:hi + 1]


def _pairs(generator: str, pins_a: Mapping[str, Mapping[str, Any]], pins_b: Mapping[str, Mapping[str, Any]],
           options: Mapping[str, Any]) -> list[tuple[str, str]]:
    pads_a = _pads(pins_a, options.get("rangeA"), "A")
    pads_b = _pads(pins_b, options.get("rangeB"), "B")
    if generator == "identity":
        wanted = set(pads_b)
        return [(pad, pad) for pad in pads_a if pad in wanted]
    if generator == "reverse":
        return list(zip(pads_a, reversed(pads_b)))
    if generator == "offset":
        offset = options.get("offset")
        if not isinstance(offset, int) or isinstance(offset, bool) or abs(offset) > MAX_OFFSET:
            raise Invalid(f"offset must be an integer within ±{MAX_OFFSET}")
        wanted = set(pads_b)
        out = []
        for pad in pads_a:
            if _INTEGER.match(pad):
                target = str(int(pad) + offset)
                if target in wanted:
                    out.append((pad, target))
        return out
    if generator == "net_name":
        by_leaf: dict[str, list[str]] = defaultdict(list)
        for pad in pads_b:
            for net in sorted(set(pins_b[pad].get("nets") or [])):
                by_leaf[_leaf(net).casefold()].append(pad)
        used: set[str] = set()
        out = []
        for pad in pads_a:
            for net in sorted(set(pins_a[pad].get("nets") or [])):
                match = next((b for b in by_leaf.get(_leaf(net).casefold(), []) if b not in used), None)
                if match is not None:
                    used.add(match)
                    out.append((pad, match))
                    break
        return out
    raise Invalid(f"unknown generator {generator!r}; use one of {', '.join(GENERATORS)}")


_AUTO_NET = re.compile(r"^(Net|unconnected)-\(")


def _signal(nets_a: Sequence[str], nets_b: Sequence[str]) -> str:
    """SB2-118: the row's signal is the first net a designer named, side A first; KiCad's own names
    (``Net-(J3-Pad112)``, ``unconnected-(…)``) only when neither side has another."""
    leaves = [_leaf(net) for net in [*nets_a, *nets_b]]
    return next((leaf for leaf in leaves if not _AUTO_NET.match(leaf)), leaves[0] if leaves else "")


def generate(generator: str, pins_a: Mapping[str, Mapping[str, Any]], pins_b: Mapping[str, Mapping[str, Any]],
             existing: Sequence[Mapping[str, Any]], options: Mapping[str, Any] | None = None) -> dict:
    """``{rows, skipped}`` for one generator run.

    ``pins_a``/``pins_b`` map pad to pin facts (``nets``, ``pinNames``) at each
    end's baseline; ``existing`` is the link's current rows (``pin_a``,
    ``pin_b``). A proposed pair whose pads are both unconnected is skipped
    unless ``options.includeUnconnected`` is true.
    """

    options = dict(options or {})
    taken_a = {row["pin_a"] for row in existing}
    taken_b = {row["pin_b"] for row in existing}
    include_unconnected = bool(options.get("includeUnconnected"))
    rows, skipped = [], []
    for pad_a, pad_b in _pairs(generator, pins_a, pins_b, options):
        nets_a = sorted(set(pins_a[pad_a].get("nets") or []))
        nets_b = sorted(set(pins_b[pad_b].get("nets") or []))
        reason = None
        if pad_a in taken_a or pad_b in taken_b:
            reason = "existing"
        elif not nets_a and not nets_b and not include_unconnected:
            reason = "unconnected"
        if reason:
            skipped.append({"pinA": pad_a, "pinB": pad_b, "reason": reason})
            continue
        signal = _signal(nets_a, nets_b)
        rows.append({
            "pinA": pad_a, "pinB": pad_b, "signal": signal, "source": "generator",
            "netA": nets_a, "netB": nets_b,
            "pinNamesA": pins_a[pad_a].get("pinNames"), "pinNamesB": pins_b[pad_b].get("pinNames"),
        })
    return {"generator": generator, "rows": rows, "skipped": skipped}
