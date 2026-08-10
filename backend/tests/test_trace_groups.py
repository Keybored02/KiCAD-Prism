"""Grouping routing changes into the runs a person actually decides about.

The rules under test are the ones that decide whether a group is safe to offer as a
single choice. Most of them exist because the alternative is a group that quietly moves
copper the user did not look at.
"""

from dataclasses import dataclass, field

from app.services.trace_groups import (
    attach_to_footprints,
    build_groups,
    build_runs,
)


@dataclass
class FakeDecision:
    """Stands in for Decision3. Only the fields grouping reads."""

    key: str
    kind: str
    classification: str = "only_ours"
    resolutions: list = field(default_factory=lambda: ["ours", "theirs"])
    default: str = "ours"
    supersedes: str = ""
    _needs_input: bool = False

    @property
    def needs_input(self) -> bool:
        return self._needs_input


def seg(key, x1, y1, x2, y2, net="N1", layer="F.Cu"):
    return key, {
        "type": "segment",
        "uuid": key,
        "start_x": x1,
        "start_y": y1,
        "end_x": x2,
        "end_y": y2,
        "layer": layer,
        "net_name": net,
    }


def via(key, x, y, net="N1", start="F.Cu", end="B.Cu"):
    return key, {
        "type": "via",
        "uuid": key,
        "x": x,
        "y": y,
        "net_name": net,
        "start_layer": start,
        "end_layer": end,
    }


def footprint(key, reference, pads):
    return key, {
        "type": "footprint",
        "uuid": key,
        "reference": reference,
        "pad_points": [
            {"number": str(i), "x": x, "y": y} for i, (x, y) in enumerate(pads)
        ],
    }


# --------------------------------------------------------------------------
# Runs
# --------------------------------------------------------------------------


def test_touching_segments_form_one_run():
    items = dict([seg("a", 0, 0, 1, 0), seg("b", 1, 0, 2, 0), seg("c", 2, 0, 3, 0)])
    runs = build_runs(items)
    assert len(runs) == 1
    assert sorted(next(iter(runs.values())).keys) == ["a", "b", "c"]


def test_separate_stretches_of_the_same_net_stay_separate():
    """The reason grouping is by connectivity and not by net name.

    GND is one net and many unrelated traces. Collapsing them into one row would hide
    one change behind another, which is what grouping is supposed to prevent.
    """
    items = dict([seg("a", 0, 0, 1, 0), seg("b", 50, 50, 51, 50)])
    runs = build_runs(items)
    assert len(runs) == 2


def test_different_nets_meeting_at_a_point_do_not_join():
    """Two nets routed to touching pads must never share a run.

    If they did, choosing a side for one net would silently move the other, and a merge
    would short two nets together without ever showing a row for it.
    """
    items = dict([seg("a", 0, 0, 1, 0, net="N1"), seg("b", 1, 0, 2, 0, net="N2")])
    runs = build_runs(items)
    assert len(runs) == 2


def test_a_via_joins_runs_across_layers():
    items = dict(
        [
            seg("top", 0, 0, 1, 0, layer="F.Cu"),
            via("v", 1, 0),
            seg("bot", 1, 0, 2, 0, layer="B.Cu"),
        ]
    )
    runs = build_runs(items)
    assert len(runs) == 1
    run = next(iter(runs.values()))
    assert run.layers == {"F.Cu", "B.Cu"}


def test_endpoints_join_despite_floating_point_noise():
    """KiCad rounds through internal integer units, so joined ends can differ in the
    last decimal place. Nanometre drift must not split a run."""
    items = dict([seg("a", 0, 0, 1.0000001, 0), seg("b", 1.0, 0, 2, 0)])
    assert len(build_runs(items)) == 1


def test_run_ids_are_stable_across_input_order():
    pairs = [seg("a", 0, 0, 1, 0), seg("b", 1, 0, 2, 0), seg("c", 9, 9, 8, 9)]
    forward = set(build_runs(dict(pairs)))
    backward = set(build_runs(dict(reversed(pairs))))
    assert forward == backward


# --------------------------------------------------------------------------
# Attachment
# --------------------------------------------------------------------------


def test_a_run_attaches_to_the_components_at_its_free_ends():
    items = dict([seg("a", 0, 0, 1, 0), seg("b", 1, 0, 2, 0)])
    fps = dict([footprint("U1", "U1", [(0, 0)]), footprint("U2", "U2", [(2, 0)])])
    items.update(fps)
    runs = build_runs(items)
    attach_to_footprints(runs, items, fps)
    assert next(iter(runs.values())).endpoints_on == {"U1", "U2"}


def test_a_pad_under_an_interior_joint_does_not_attach():
    """An interior point is where two segments of the run meet, not where it ends.

    A pad there is a component the trace passes over, not one it terminates on, and
    following it would move copper that has nothing to do with that component.
    """
    items = dict([seg("a", 0, 0, 1, 0), seg("b", 1, 0, 2, 0)])
    fps = dict([footprint("U9", "U9", [(1, 0)])])
    items.update(fps)
    runs = build_runs(items)
    attach_to_footprints(runs, items, fps)
    assert next(iter(runs.values())).endpoints_on == set()


def test_two_footprints_sharing_a_pad_position_attach_to_neither():
    """Ambiguity resolves to nothing rather than to an arbitrary winner."""
    items = dict([seg("a", 0, 0, 1, 0)])
    fps = dict([footprint("U1", "U1", [(0, 0)]), footprint("U2", "U2", [(0, 0)])])
    items.update(fps)
    runs = build_runs(items)
    attach_to_footprints(runs, items, fps)
    assert next(iter(runs.values())).endpoints_on == set()


# --------------------------------------------------------------------------
# Groups
# --------------------------------------------------------------------------


def _items(*pairs):
    return dict(pairs)


def test_a_group_follows_a_single_changed_component():
    items = _items(
        seg("a", 0, 0, 1, 0),
        seg("b", 1, 0, 2, 0),
        footprint("U1", "U1", [(0, 0)]),
    )
    decisions = [
        FakeDecision("a", "segment"),
        FakeDecision("b", "segment"),
        FakeDecision("U1", "footprint", classification="conflict"),
    ]
    groups = build_groups(decisions, {}, items, items)
    assert len(groups) == 1
    assert groups[0].follows == "U1"
    assert groups[0].follows_reference == "U1"


def test_a_run_between_two_changed_components_follows_neither():
    """Following either would be a guess about which move caused the reroute."""
    items = _items(
        seg("a", 0, 0, 1, 0),
        seg("b", 1, 0, 2, 0),
        footprint("U1", "U1", [(0, 0)]),
        footprint("U2", "U2", [(2, 0)]),
    )
    decisions = [
        FakeDecision("a", "segment"),
        FakeDecision("b", "segment"),
        FakeDecision("U1", "footprint", classification="conflict"),
        FakeDecision("U2", "footprint", classification="conflict"),
    ]
    groups = build_groups(decisions, {}, items, items)
    assert groups[0].follows == ""
    assert "changed independently" in groups[0].reason


def test_an_unchanged_component_does_not_make_a_run_follow_it():
    items = _items(
        seg("a", 0, 0, 1, 0),
        seg("b", 1, 0, 2, 0),
        footprint("U1", "U1", [(0, 0)]),
    )
    decisions = [FakeDecision("a", "segment"), FakeDecision("b", "segment")]
    groups = build_groups(decisions, {}, items, items)
    assert groups[0].follows == ""


def test_a_settled_member_does_not_veto_the_groups_options():
    """Both sides deleting the same segment is not a choice, and must not remove the
    group's. Intersecting over it left the row with no buttons at all, which happened on
    a real board."""
    items = _items(seg("a", 0, 0, 1, 0), seg("b", 1, 0, 2, 0), seg("c", 2, 0, 3, 0))
    decisions = [
        FakeDecision("a", "segment"),
        FakeDecision("b", "segment"),
        FakeDecision(
            "c", "segment", classification="both_same", resolutions=["remove"]
        ),
    ]
    groups = build_groups(decisions, {}, items, items)
    assert groups[0].resolutions == ["ours", "theirs"]
    assert groups[0].settled == ["c"]
    assert "c" not in groups[0].keys


def test_a_group_offers_only_what_every_choosing_member_offers():
    items = _items(seg("a", 0, 0, 1, 0), seg("b", 1, 0, 2, 0))
    decisions = [
        FakeDecision("a", "segment", resolutions=["ours", "theirs"]),
        FakeDecision("b", "segment", resolutions=["ours", "both"]),
    ]
    groups = build_groups(decisions, {}, items, items)
    assert groups[0].resolutions == ["ours"]


def test_a_conflicting_member_is_listed_so_it_stays_visible():
    items = _items(seg("a", 0, 0, 1, 0), seg("b", 1, 0, 2, 0))
    decisions = [
        FakeDecision("a", "segment"),
        FakeDecision("b", "segment", classification="conflict", _needs_input=True),
    ]
    groups = build_groups(decisions, {}, items, items)
    assert groups[0].conflicts == ["b"]


def test_a_lone_changed_segment_is_not_grouped():
    """A group of one adds indirection over a row that already says everything."""
    items = _items(seg("a", 0, 0, 1, 0), seg("b", 1, 0, 2, 0))
    decisions = [FakeDecision("a", "segment")]
    assert build_groups(decisions, {}, items, items) == []


def test_a_run_split_across_the_two_sides_still_groups():
    """Ours and theirs rarely hold the same segments after a reroute. Grouping over the
    union keeps the run one shape, so a choice means the same thing on both branches."""
    ours = _items(seg("a", 0, 0, 1, 0))
    theirs = _items(seg("b", 1, 0, 2, 0))
    decisions = [FakeDecision("a", "segment"), FakeDecision("b", "segment")]
    groups = build_groups(decisions, {}, ours, theirs)
    assert len(groups) == 1
    assert sorted(groups[0].keys) == ["a", "b"]


def test_unchanged_routing_is_not_grouped():
    items = _items(seg("a", 0, 0, 1, 0), seg("b", 1, 0, 2, 0))
    decisions = [
        FakeDecision("a", "segment", classification="unchanged"),
        FakeDecision("b", "segment", classification="unchanged"),
    ]
    assert build_groups(decisions, {}, items, items) == []


def test_grouping_never_invents_keys():
    """Every key a group offers has to be a real decision. A key that is not staged
    would be silently dropped, and the row would claim to move copper it did not."""
    items = _items(seg("a", 0, 0, 1, 0), seg("b", 1, 0, 2, 0), seg("c", 2, 0, 3, 0))
    decisions = [FakeDecision("a", "segment"), FakeDecision("b", "segment")]
    keys = {d.key for d in decisions}
    for group in build_groups(decisions, {}, items, items):
        assert set(group.keys) <= keys
        assert set(group.settled) <= keys
