"""Is this merged design structurally sound, before it ever reaches disk?

This is the gate between "the bytes parse" and "KiCad accepts it". Parsing proves the
parentheses balance; it says nothing about whether a track references a net that exists,
or whether two objects now claim the same uuid. Those files load, and then behave
strangely, which is harder to diagnose than an outright refusal.

Running before the write matters. `kicad_check_service.can_open` is authoritative but
costs a subprocess and seconds, so it belongs at commit time. These checks are pure and
fast enough to run on every staging toggle, which means the UI can refuse an incoherent
selection while the user is still assembling it rather than at the end.

What is deliberately NOT checked: anything requiring a library on disk, a schematic
alongside, or KiCad's own rules. `lib_id` is checked for presence, not resolvability,
because a footprint from a library this machine lacks is a normal state for a board
somebody else drew. Refusing that would block merges for the wrong reason.

Every finding is a refusal, not a warning. A merge that could produce one of these should
abort and leave the tree untouched.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass

from . import span_index as si
from .span_index import SpanIndexError

log = logging.getLogger(__name__)

# Nodes that reference a net by index. Pads live inside footprints and carry the net
# NAME inline as well, which is why a footprint spliced from another branch has to be
# remapped rather than copied verbatim.
NET_REFERENCING = ("segment", "via", "arc", "zone")

UNPARSEABLE = "unparseable"
ORPHAN_NET = "orphan_net"
DUPLICATE_UUID = "duplicate_uuid"
DANGLING_PARENT = "dangling_parent"
MISSING_LAYER = "missing_layer"
MISSING_LIB_ID = "missing_lib_id"
NET_NAME_MISMATCH = "net_name_mismatch"


@dataclass(frozen=True)
class Violation:
    """One structural problem, named so the user can act on it."""

    kind: str
    detail: str
    key: str | None = None

    def to_dict(self) -> dict:
        return {"kind": self.kind, "detail": self.detail, "key": self.key}

    def __str__(self) -> str:
        return f"{self.kind}: {self.detail}"


def check_pcb(text: str) -> list[Violation]:
    """Everything that would make a merged board wrong rather than merely unusual."""
    try:
        root, index = si.build_pcb_index(text)
    except SpanIndexError as exc:
        # Nothing else can be checked, and nothing else matters: this file will not open.
        return [Violation(UNPARSEABLE, str(exc))]

    found: list[Violation] = []
    found.extend(_check_nets(root))
    found.extend(_check_duplicate_uuids(root))
    found.extend(_check_layers(root))
    found.extend(_check_footprints(root))
    found.extend(_check_parents(index))
    return found


def check_sch(text: str) -> list[Violation]:
    """The schematic equivalent. No nets or layers, so mostly identity."""
    try:
        root, index = si.build_sch_index(text)
    except SpanIndexError as exc:
        return [Violation(UNPARSEABLE, str(exc))]

    found: list[Violation] = []
    found.extend(
        _check_duplicate_uuids(
            root, kinds=("symbol", "wire", "junction", "label", "global_label", "sheet")
        )
    )
    found.extend(_check_parents(index))
    return found


def _check_nets(root: list) -> list[Violation]:
    """Every referenced net must exist in the board's net table.

    This is the failure a naive splice produces most easily. Net indices are file-local
    and KiCad renumbers them constantly, so a track copied from another branch carries an
    index that means something different here, or nothing at all. KiCad tolerates the
    dangling reference in ways that are hard to predict, and DRC will not necessarily
    say why the connection vanished.

    Two file formats exist and both are current. Older boards carry a numeric table of
    `(net N "name")` and reference nets by index; KiCad 20260206 and later drop the table
    and reference nets by NAME directly. A name-addressed board has nothing to dangle
    against, which is a real advantage for merging: names are stable across branches
    where indices are not. Checking indices against an absent table would call every
    track on such a board an orphan, which is how this was found (11405 false positives
    on a real 9MB board).
    """
    table = si.net_table(root)
    if not table:
        # Name-addressed board. Nothing to validate: there is no table to be absent from.
        return _check_pad_nets_by_name(root)

    found: list[Violation] = []

    for kind in NET_REFERENCING:
        for node in si._children(root, kind):
            index = si.net_index(node)
            # Only a NUMERIC reference can dangle. A name here means the file mixes
            # formats, which is not ours to police.
            if index and index.lstrip("-").isdigit() and index not in table:
                found.append(
                    Violation(
                        ORPHAN_NET,
                        f"a {kind} references net {index}, which is not in the net table",
                    )
                )

    # Pads carry the name alongside the index, so they can disagree with the table in a
    # way nothing else can. A pad claiming net 19 is "GND" while the table says 19 is
    # "+5V" is a silent short waiting to happen.
    for footprint in si._children(root, "footprint"):
        reference = si._property_value(footprint, "Reference")
        for pad in si._children(footprint, "pad"):
            node = si._first(pad, "net")
            if not node or len(node) < 2:
                continue
            index = str(node[1])
            if not index.lstrip("-").isdigit():
                continue  # name-addressed pad in a mixed file; nothing to dangle
            if index not in table:
                found.append(
                    Violation(
                        ORPHAN_NET,
                        f"pad on {reference or 'a footprint'} references net {index}, "
                        "which is not in the net table",
                    )
                )
            elif len(node) > 2:
                claimed = str(node[2])
                actual = table[index]
                if claimed != actual:
                    found.append(
                        Violation(
                            NET_NAME_MISMATCH,
                            f"pad on {reference or 'a footprint'} calls net {index} "
                            f"{claimed!r}, but the net table calls it {actual!r}",
                        )
                    )

    return found


def _check_pad_nets_by_name(root: list) -> list[Violation]:
    """The name-addressed format's only net hazard: an empty name.

    With no table there is nothing to dangle against, so a net reference cannot be
    orphaned. `(net "")` is still worth catching, because it means a pad that should
    connect to something connects to nothing, and a merge is a plausible way to produce
    one.
    """
    found: list[Violation] = []
    for footprint in si._children(root, "footprint"):
        reference = si._property_value(footprint, "Reference")
        for pad in si._children(footprint, "pad"):
            node = si._first(pad, "net")
            if node and len(node) > 1 and str(node[1]) == "":
                found.append(
                    Violation(
                        ORPHAN_NET,
                        f"pad on {reference or 'a footprint'} has an empty net name",
                    )
                )
    return found


def _check_duplicate_uuids(root: list, kinds: tuple = ()) -> list[Violation]:
    """No two objects may claim the same uuid.

    Splicing an object from another branch can introduce a uuid this file already uses:
    both branches descend from the same base, so the same object may have been copied on
    one side. KiCad's behaviour with duplicates is not defined in any way we should rely
    on, and cross-probing (which addresses objects by uuid) would follow the wrong one.
    """
    if not kinds:
        kinds = ("footprint", "zone", *si.GR_KINDS)

    seen: dict[str, str] = {}
    found: list[Violation] = []
    for kind in kinds:
        for node in si._children(root, kind):
            uuid = si._uuid(node)
            if not uuid:
                continue
            if uuid in seen:
                found.append(
                    Violation(
                        DUPLICATE_UUID,
                        f"two objects share the uuid {uuid} "
                        f"(a {seen[uuid]} and a {kind})",
                        key=uuid,
                    )
                )
            else:
                seen[uuid] = kind

    # Footprint graphics are keyed by parent, so a duplicate only matters within one
    # footprint. Checked separately for that reason.
    for footprint in si._children(root, "footprint"):
        local: dict[str, str] = {}
        for kind in si.FP_GRAPHIC_KINDS:
            for node in si._children(footprint, kind):
                uuid = si._uuid(node)
                if not uuid:
                    continue
                if uuid in local:
                    found.append(
                        Violation(
                            DUPLICATE_UUID,
                            f"a footprint has two graphics sharing the uuid {uuid}",
                            key=uuid,
                        )
                    )
                else:
                    local[uuid] = kind

    return found


def _check_layers(root: list) -> list[Violation]:
    """Every referenced layer must exist in the stackup.

    Partial staging can break this: taking a track on In1.Cu without taking the stackup
    change that added In1.Cu leaves a track on a layer the board does not have.
    """
    table = si._first(root, "layers")
    if not table:
        return []

    known = {
        str(entry[1])
        for entry in table
        if isinstance(entry, list) and len(entry) > 1 and isinstance(entry[1], str)
    }
    if not known:
        return []

    found: list[Violation] = []
    for kind in ("segment", "via", "arc", "zone", *si.GR_KINDS):
        for node in si._children(root, kind):
            layer = si._text_of(si._first(node, "layer"))
            # Vias name a layer PAIR and zones may list several; both use (layers ...)
            # rather than (layer ...), so a missing single layer node is normal here.
            if layer and layer not in known:
                found.append(
                    Violation(
                        MISSING_LAYER,
                        f"a {kind} is on layer {layer!r}, which is not in the stackup",
                    )
                )
    return found


def _check_footprints(root: list) -> list[Violation]:
    """A footprint must name the library it came from.

    Presence only. Whether the library resolves on THIS machine is a different question
    with a different answer per user, and blocking a merge over it would punish someone
    for not having a colleague's local library.
    """
    found: list[Violation] = []
    for footprint in si._children(root, "footprint"):
        lib_id = ""
        if len(footprint) > 1 and isinstance(footprint[1], str):
            lib_id = footprint[1]
        if not lib_id:
            node = si._first(footprint, "lib_id")
            lib_id = si._text_of(node)
        if not lib_id:
            found.append(
                Violation(
                    MISSING_LIB_ID,
                    "a footprint does not name a library",
                    key=si._uuid(footprint) or None,
                )
            )
    return found


def _check_parents(index: dict) -> list[Violation]:
    """No child may outlive its parent.

    Staging a silk line whose footprint was removed on the other side would leave a
    graphic with nothing to belong to. The patch builder resolves this before writing,
    so a finding here means that resolution failed.
    """
    found: list[Violation] = []
    for anchor in index.values():
        if anchor.parent_key and anchor.parent_key not in index:
            found.append(
                Violation(
                    DANGLING_PARENT,
                    f"a {anchor.kind} belongs to a footprint that is not in the file",
                    key=anchor.key,
                )
            )
    return found


def describe(violations: list[Violation]) -> str:
    """One line for a refusal message."""
    if not violations:
        return "No structural problems."

    counts: dict[str, int] = {}
    for violation in violations:
        counts[violation.kind] = counts.get(violation.kind, 0) + 1
    parts = [f"{count} {kind}" for kind, count in sorted(counts.items())]
    return ", ".join(parts)
