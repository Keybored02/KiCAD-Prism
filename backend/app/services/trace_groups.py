"""
Trace grouping for the three-way merge.

A reroute is one thing an engineer did, but it lands in the file as dozens of segments,
bends and vias. Asking someone to approve each bend is not review: it is a scroll, and
every row scrolled past is a row nobody read. This module answers two questions so the
merge can ask about routing the way people think about it.

**What belongs together.** Segments joined end to end, on the same net, form a run. Runs
are found with union-find over endpoints rather than by grouping on the net name: GND is
one net but usually many separate runs, and merging two unrelated corners of a ground
pour into a single row would hide one behind the other. Vias join the runs they connect,
so a trace that changes layer stays one run.

**What a run belongs to.** A run whose end sits on a pad of a component is attached to
that component. When the component itself is part of the merge, the run can follow
whatever the user picks for it, because moving a part and moving its traces are the same
intent. Attachment uses real pad positions (see `pcb_diff_service._pad_points`), not the
footprint origin and not a bounding box: the origin is often under no pad at all, and a
box claims every unrelated track that happens to pass underneath.

Grouping is advisory and display-level. Every segment is still staged, still gated and
still merged individually. This decides what a person is asked to look at, never what
gets written.
"""

from __future__ import annotations

from dataclasses import dataclass, field

# Endpoints are matched on a rounded coordinate. KiCad writes six decimals and rounds
# through its own internal integer units, so two ends of a joined pair can differ in the
# last place. Nanometre scale is far below any real clearance, so this cannot join two
# tracks that a designer sees as separate.
_QUANT = 1_000_000  # 1e-6 mm

# How close a track end must be to a pad centre to count as landing on it. Pads are
# typically 0.5mm and up, and KiCad snaps routing to the pad anchor, so real connections
# are usually exact. The tolerance covers hand-placed ends that sit slightly off anchor
# without reaching into a neighbouring pad.
PAD_TOLERANCE_MM = 0.05

ROUTING_KINDS = ("segment", "arc", "via")

# Mirrors merge3_service.UNCHANGED. Duplicated rather than imported: merge3_service calls
# into this module, and importing it back would make the pair circular.
UNCHANGED = "unchanged"


def _q(value: float) -> int:
    """Quantise a coordinate so endpoints that should meet actually compare equal."""
    return int(round(value * _QUANT))


@dataclass
class Run:
    """One connected stretch of routing on one net."""

    id: str
    net_name: str
    keys: list[str] = field(default_factory=list)
    layers: set[str] = field(default_factory=set)
    # Footprint keys whose pads this run lands on.
    endpoints_on: set[str] = field(default_factory=set)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "net_name": self.net_name,
            "keys": sorted(self.keys),
            "layers": sorted(self.layers),
            "endpoints_on": sorted(self.endpoints_on),
        }


class _Union:
    """Union-find with path halving. Small, and the only structure this module needs."""

    def __init__(self) -> None:
        self._parent: dict = {}

    def add(self, node) -> None:
        self._parent.setdefault(node, node)

    def find(self, node):
        parent = self._parent
        parent.setdefault(node, node)
        while parent[node] != node:
            parent[node] = parent[parent[node]]
            node = parent[node]
        return node

    def union(self, a, b) -> None:
        root_a, root_b = self.find(a), self.find(b)
        if root_a != root_b:
            self._parent[root_b] = root_a


def _endpoints(item: dict) -> list[tuple[int, int]]:
    """The points at which this routing item can join another.

    A via is a single point on every layer it spans, which is what makes it the joint
    between runs on different layers.
    """
    kind = item.get("type")
    if kind == "via":
        return [(_q(item.get("x", 0.0)), _q(item.get("y", 0.0)))]
    if kind in ("segment", "arc"):
        return [
            (_q(item.get("start_x", 0.0)), _q(item.get("start_y", 0.0))),
            (_q(item.get("end_x", 0.0)), _q(item.get("end_y", 0.0))),
        ]
    return []


def _layers_of(item: dict) -> set[str]:
    if item.get("type") == "via":
        return {
            layer for layer in (item.get("start_layer"), item.get("end_layer")) if layer
        }
    layer = item.get("layer")
    return {layer} if layer else set()


def build_runs(items: dict[str, dict]) -> dict[str, Run]:
    """Group routing items into connected runs.

    `items` is {key -> item} over the UNION of the three sides, so a run is stable even
    when the sides disagree about which segments exist. Grouping only one side's items
    would give the two branches different runs and make a shared choice meaningless.

    Items are joined when they share an endpoint AND a net name. The net check matters:
    two different nets routed to touching pads must never merge into one run, or choosing
    a side for one net would silently move the other.
    """
    union = _Union()
    routing: dict[str, dict] = {}

    for key, item in items.items():
        if item.get("type") not in ROUTING_KINDS:
            continue
        points = _endpoints(item)
        if not points:
            continue
        routing[key] = item
        node = ("item", key)
        union.add(node)
        net = item.get("net_name") or ""
        for point in points:
            # A point is only a joint within its own net.
            union.union(node, ("point", net, point))

    runs: dict[str, Run] = {}
    members: dict = {}
    for key in routing:
        members.setdefault(union.find(("item", key)), []).append(key)

    for group_keys in members.values():
        # Name the run after its lowest key so the id is stable across runs of the
        # algorithm and across the three sides. Anything order-dependent would make the
        # UI reshuffle between refreshes.
        anchor = min(group_keys)
        net = routing[anchor].get("net_name") or ""
        run = Run(id=f"run:{net}:{anchor}", net_name=net, keys=sorted(group_keys))
        for key in group_keys:
            run.layers |= _layers_of(routing[key])
        runs[run.id] = run

    return runs


def attach_to_footprints(
    runs: dict[str, Run],
    items: dict[str, dict],
    footprints: dict[str, dict],
) -> None:
    """Record which components each run lands on, in place.

    Only the free ends of a run are tested. An interior joint is where two segments of the
    same run meet, and while that point can sit on a pad, it does not tell us the run
    terminates there. Free ends are what a component actually anchors.
    """
    pads = _pad_lookup(footprints)
    if not pads:
        return

    for run in runs.values():
        counts: dict[tuple[int, int], int] = {}
        for key in run.keys:
            for point in _endpoints(items[key]):
                counts[point] = counts.get(point, 0) + 1

        for point, seen in counts.items():
            # Seen once means nothing else in this run meets here: a free end. A via alone
            # at a point is also a free end, and a legitimate place for a run to stop.
            if seen != 1:
                continue
            owner = _footprint_at(point, pads)
            if owner:
                run.endpoints_on.add(owner)


def _pad_lookup(footprints: dict[str, dict]) -> dict[tuple[int, int], str]:
    """Board-space pad positions, quantised, mapped to their footprint key.

    When two footprints have pads at the same quantised point the first wins and the
    second is dropped rather than overwriting: an ambiguous pad should attach a run to
    nothing rather than to an arbitrary one of two candidates.
    """
    pads: dict[tuple[int, int], str] = {}
    ambiguous: set[tuple[int, int]] = set()
    for key, footprint in footprints.items():
        for pad in footprint.get("pad_points") or []:
            point = (_q(pad.get("x", 0.0)), _q(pad.get("y", 0.0)))
            if point in pads and pads[point] != key:
                ambiguous.add(point)
                continue
            pads[point] = key
    for point in ambiguous:
        pads.pop(point, None)
    return pads


def _footprint_at(
    point: tuple[int, int], pads: dict[tuple[int, int], str]
) -> str | None:
    """The component whose pad sits at this point, within tolerance."""
    exact = pads.get(point)
    if exact:
        return exact

    tolerance = _q(PAD_TOLERANCE_MM)
    px, py = point
    best: str | None = None
    best_distance = tolerance + 1
    for (qx, qy), key in pads.items():
        dx, dy = abs(qx - px), abs(qy - py)
        if dx > tolerance or dy > tolerance:
            continue
        distance = dx + dy
        if distance < best_distance:
            best, best_distance = key, distance
    return best


# --------------------------------------------------------------------------
# Turning runs into what the merge UI asks about
# --------------------------------------------------------------------------


@dataclass
class TraceGroup:
    """A run, reduced to the decision a person actually makes about it.

    `keys` are the changed routing decisions inside the run. A run is usually mostly
    untouched, and only the changed part is a decision.
    """

    id: str
    net_name: str
    keys: list[str]
    layers: list[str]
    endpoints_on: list[str]
    # Resolutions every member agrees on, so the group can offer them as one choice.
    resolutions: list[str]
    default: str
    # Changed members the group choice does not apply to, because their outcome is already
    # settled (both sides deleted the same segment). Counted in the row's size so it still
    # reports the true scale of the change, but never written to.
    settled: list[str] = field(default_factory=list)
    # The component this group should follow, when exactly one changed component owns it.
    follows: str = ""
    follows_reference: str = ""
    # Members that must stay individually visible however the group is set.
    conflicts: list[str] = field(default_factory=list)
    reason: str = ""

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "net_name": self.net_name,
            "keys": self.keys,
            "layers": self.layers,
            "endpoints_on": self.endpoints_on,
            "resolutions": self.resolutions,
            "default": self.default,
            "settled": self.settled,
            "follows": self.follows,
            "follows_reference": self.follows_reference,
            "conflicts": self.conflicts,
            "reason": self.reason,
        }


def build_groups(
    decisions: list,
    base_items: dict[str, dict],
    ours_items: dict[str, dict],
    theirs_items: dict[str, dict],
) -> list[TraceGroup]:
    """Group the routing decisions in a merge into runs, and say what each should follow.

    Runs are built over the union of all three sides. A run that exists only on one side
    (a reroute adds segments that base never had) still groups correctly, and the two
    branches see the same run boundaries.

    Rules, in the order they matter:

    - A group offers only resolutions EVERY member offers. One member that cannot be
      taken from theirs makes "theirs" unavailable for the group, rather than the group
      claiming an option that would silently do nothing for that member.
    - A member that genuinely conflicts is listed in `conflicts` and stays individually
      visible. A group choice must never be the reason a real conflict went unseen.
    - A group follows a component only when exactly ONE changed component owns it. Two
      changed owners cannot both be followed, so that group asks instead.
    """
    by_key = {d.key: d for d in decisions}
    routing_keys = {
        d.key
        for d in decisions
        if d.kind in ROUTING_KINDS and d.classification != UNCHANGED
    }
    if not routing_keys:
        return []

    # Union of the three sides: a run must be the same shape whichever side an item came
    # from, or a shared choice would mean different things on each branch.
    union_items: dict[str, dict] = {}
    for side in (base_items, ours_items, theirs_items):
        for key, item in side.items():
            union_items.setdefault(key, item)

    # Superseded keys are the pre-move position of a track that moved. They are part of
    # the same run as their replacement, so the run has to know about them.
    for decision in decisions:
        if decision.supersedes and decision.supersedes not in union_items:
            for side in (base_items, ours_items, theirs_items):
                if decision.supersedes in side:
                    union_items[decision.supersedes] = side[decision.supersedes]
                    break

    runs = build_runs(union_items)
    footprints = {
        key: item
        for key, item in union_items.items()
        if item.get("type") == "footprint" and item.get("pad_points")
    }
    attach_to_footprints(runs, union_items, footprints)

    changed_footprints = {
        d.key
        for d in decisions
        if d.kind == "footprint" and d.classification != UNCHANGED
    }
    references = {
        key: (item.get("reference") or "") for key, item in footprints.items()
    }

    groups: list[TraceGroup] = []
    for run in sorted(runs.values(), key=lambda r: r.id):
        members = sorted(routing_keys & set(run.keys))
        if len(members) < 2:
            # A single changed item is not a group. Showing it as one would add a layer of
            # indirection over a row that already says everything.
            continue

        member_decisions = [by_key[key] for key in members]
        groups.append(
            _group_for(run, members, member_decisions, changed_footprints, references)
        )

    return groups


def _group_for(
    run: Run,
    members: list[str],
    member_decisions: list,
    changed_footprints: set[str],
    references: dict[str, str],
) -> TraceGroup:
    """Reduce one run's member decisions to a single offer."""
    # Members with a real choice drive what the group can offer. A settled member (both
    # sides deleted the same segment, so its only resolution is "remove") is carried along
    # by whatever the group decides and must not veto the group's options: intersecting
    # over it would leave the group offering nothing and the row unclickable.
    choosing = [d for d in member_decisions if len(d.resolutions) > 1]

    resolutions: list[str] = []
    if choosing:
        shared = set(choosing[0].resolutions)
        for decision in choosing[1:]:
            shared &= set(decision.resolutions)
        resolutions = [option for option in ("ours", "theirs") if option in shared]

    conflicts = [d.key for d in member_decisions if d.needs_input]

    # Default to what the choosing members already default to when they agree; otherwise
    # ours, the conservative side, since it is what the working tree already holds.
    defaults = {d.default for d in choosing}
    default = defaults.pop() if len(defaults) == 1 else "ours"

    owners = sorted(run.endpoints_on & changed_footprints)
    follows = ""
    reason = ""
    if len(owners) == 1 and resolutions:
        follows = owners[0]
        reason = "attached to a component that changed"
    elif len(owners) > 1:
        # Two changed components on one run. Following either would be a guess about
        # which move caused the reroute, and guessing wrong moves copper.
        names = ", ".join(references.get(key) or key[:8] for key in owners)
        reason = f"attached to {names}, which changed independently"

    return TraceGroup(
        id=run.id,
        net_name=run.net_name,
        # Only the members a group choice can actually be applied to. A settled member
        # stays out: writing "ours" onto a decision whose sole resolution is "remove"
        # would be asking the patch builder for something it cannot honour.
        keys=[d.key for d in choosing] if choosing else members,
        settled=[d.key for d in member_decisions if len(d.resolutions) <= 1],
        layers=sorted(run.layers),
        endpoints_on=sorted(run.endpoints_on),
        resolutions=resolutions,
        default=default,
        follows=follows,
        follows_reference=references.get(follows, ""),
        conflicts=conflicts,
        reason=reason,
    )
