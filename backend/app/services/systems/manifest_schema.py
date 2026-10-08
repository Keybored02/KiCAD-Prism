"""``prism.system_manifest.v1`` (``docs/system-builder/CONTRACTS_P2.md`` §9).

The manifest is the portable form of one system: what a snapshot freezes,
what a catalog ``assembly`` revision points at, and (M7) what a Git-tracked
system commits. These models are the contract. The JSON Schema in
``docs/system-builder/schemas/system_manifest.v1.schema.json`` is generated
from them (``python -m app.services.systems.manifest_schema``) and a test
fails if the committed file drifts.

Digests (§9.3): ``full`` covers everything except ``meta``; ``connectivity``
also drops presentation and placement facts (canvas layout, mating frames,
poses, harness nodes and harness geometry fields), so rearranging the diagram
or moving a board never changes it.
"""

from __future__ import annotations

import hashlib
import json
import sys
from typing import Annotated, Any, Literal, Optional, Union

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

SCHEMA = "prism.system_manifest.v1"


def _id(prefix: str) -> Any:
    return Field(pattern=rf"^{prefix}_[0-9a-f]{{32}}$")


SystemId = Annotated[str, _id("sys")]
InstanceId = Annotated[str, _id("sin")]
LinkId = Annotated[str, _id("slk")]
RowId = Annotated[str, _id("srw")]
ExportId = Annotated[str, _id("sxp")]
HarnessId = Annotated[str, _id("shn")]
HarnessEndId = Annotated[str, _id("she")]
WireId = Annotated[str, _id("shw")]
HarnessNodeId = Annotated[str, _id("shd")]
SnapshotId = Annotated[str, _id("ssn")]
Sha = Annotated[str, Field(pattern=r"^[0-9a-f]{40}$")]
Pad = Annotated[str, Field(min_length=1, max_length=100)]
Nets = list[Annotated[str, Field(max_length=1000)]]
Label = Annotated[str, Field(min_length=1, max_length=100)]
Vec3 = Annotated[list[float], Field(min_length=3, max_length=3)]
Quat = Annotated[list[float], Field(min_length=4, max_length=4)]


class _Model(BaseModel):
    model_config = ConfigDict(extra="forbid", frozen=True)


# ---------------------------------------------------------------------------
# Baselines captured at link or export creation (P1 §5, extended)


class PortBaseline(_Model):
    portKey: str = Field(min_length=1, max_length=2000)
    memberKeys: list[str] = Field(min_length=1)
    reference: str
    libId: Optional[str] = None
    footprint: Optional[str] = None
    pinCount: int = Field(ge=0)


class ExportBaseline(_Model):
    """What a parent accepted about a child's export (§4.3)."""

    exportId: ExportId
    name: str
    reference: str
    libId: Optional[str] = None
    footprint: Optional[str] = None
    pinCount: int = Field(ge=0)


class PortEnd(_Model):
    instanceId: InstanceId
    portKey: str = Field(min_length=1, max_length=2000)
    port: PortBaseline

    @model_validator(mode="after")
    def _key_matches(self) -> "PortEnd":
        if self.port.portKey != self.portKey:
            raise ValueError("port.portKey must equal portKey")
        return self


class ExportEnd(_Model):
    instanceId: InstanceId
    exportId: ExportId
    export: ExportBaseline

    @model_validator(mode="after")
    def _id_matches(self) -> "ExportEnd":
        if self.export.exportId != self.exportId:
            raise ValueError("export.exportId must equal exportId")
        return self


End = Union[PortEnd, ExportEnd]


# ---------------------------------------------------------------------------
# Instances (§5.1)


class PortOverride(_Model):
    portKey: str = Field(min_length=1, max_length=2000)
    state: Literal["hidden", "promoted"]


class BoardInstance(_Model):
    id: InstanceId
    label: Label
    kind: Literal["board"]
    projectId: str = Field(min_length=1, max_length=200)
    baselineCommit: Sha
    trackedRef: Optional[str] = Field(default=None, max_length=200)
    pinned: bool
    portOverrides: list[PortOverride] = Field(default_factory=list)


class CatalogRef(_Model):
    componentId: str = Field(min_length=1, max_length=200)
    revisionId: str = Field(min_length=1, max_length=200)
    revisionVersion: int = Field(ge=1)
    identity: str = Field(description="IPN or MPN, display only")


class CatalogInstance(_Model):
    id: InstanceId
    label: Label
    kind: Literal["assembly", "module"]
    catalog: CatalogRef
    follow: Literal["pinned", "latest_released"]


Instance = Annotated[Union[BoardInstance, CatalogInstance], Field(discriminator="kind")]


# ---------------------------------------------------------------------------
# Exports (§4)


class PortTarget(_Model):
    instanceId: InstanceId
    portKey: str = Field(min_length=1, max_length=2000)


class ExportTarget(_Model):
    """Re-export of a child's export (§4.1)."""

    instanceId: InstanceId
    exportId: ExportId


class ExportPortTarget(_Model):
    """A board port export, with the port baseline it resolves through (§4.1, P2-1.3)."""

    instanceId: InstanceId
    portKey: str = Field(min_length=1, max_length=2000)
    port: PortBaseline

    @model_validator(mode="after")
    def _key_matches(self) -> "ExportPortTarget":
        if self.port.portKey != self.portKey:
            raise ValueError("port.portKey must equal portKey")
        return self


class Export(_Model):
    id: ExportId
    name: str = Field(min_length=1, max_length=100)
    description: str = Field(default="", max_length=2000)
    target: Union[ExportPortTarget, ExportTarget]


# ---------------------------------------------------------------------------
# Links and rows (P1 §5 plus §6)


class Row(_Model):
    id: RowId
    pinA: Pad
    pinB: Pad
    signal: str = Field(default="", max_length=200)
    source: Literal["manual", "generator", "import"]
    netA: Nets
    netB: Nets


class Link(_Model):
    id: LinkId
    name: str = Field(default="", max_length=200)
    type: Literal["unspecified", "b2b"]
    harnessLabel: Optional[str] = Field(default=None, max_length=200)
    a: End
    b: End
    rows: list[Row]
    stackHeightMm: Optional[float] = Field(default=None, gt=0, allow_inf_nan=False,
                                           description="b2b only: the mated pair's stack height (§16.2)")

    @model_validator(mode="after")
    def _stack_height_is_b2b(self) -> "Link":
        if self.stackHeightMm is not None and self.type != "b2b":
            raise ValueError("stackHeightMm applies to b2b links only")
        return self


# ---------------------------------------------------------------------------
# Harnesses (§6.3; geometry fields are placement-only, §9.3)


class PartRef(_Model):
    componentId: str = Field(min_length=1, max_length=200)
    revisionId: str = Field(min_length=1, max_length=200)
    # As the catalog showed the part at assignment (SB2-18); omitted from the digest when null.
    name: Optional[str] = Field(default=None, max_length=500)
    mpn: Optional[str] = Field(default=None, max_length=500)
    manufacturer: Optional[str] = Field(default=None, max_length=500)


class HarnessEnd(_Model):
    id: HarnessEndId
    ordinal: int = Field(ge=0)
    mates: Optional[End] = None
    part: Optional[PartRef] = Field(default=None, description="null = Generic mating block")
    pinCount: int = Field(ge=1, description="end pins; copied from the mated connector while Generic")
    pinMap: Optional[dict[str, str]] = Field(default=None, description="end pin -> mated pin; null = identity")
    bootMm: Optional[float] = Field(default=None, ge=0, allow_inf_nan=False)
    partPins: Optional[list[Pad]] = Field(default=None, description="the part's pins; null while Generic (SB2-18)")


class WirePoint(_Model):
    end: HarnessEndId
    pin: Pad


class Wire(_Model):
    id: WireId
    source: WirePoint = Field(alias="from")
    target: WirePoint = Field(alias="to")
    signal: str = Field(default="", max_length=200)
    gaugeAwg: Optional[int] = Field(default=None, ge=0, le=40)
    colour: Optional[str] = Field(default=None, max_length=40)
    label: Optional[str] = Field(default=None, max_length=100)
    netFrom: Nets
    netTo: Nets

    model_config = ConfigDict(extra="forbid", frozen=True, populate_by_name=True)


class HarnessNode(_Model):
    id: HarnessNodeId
    kind: Literal["breakout", "waypoint"]
    positionMm: Vec3
    pinned: bool = False
    order: int = Field(ge=0)
    ends: list[HarnessEndId] = Field(default_factory=list, description="breakout: the ends it branches to")
    between: Optional[list[str]] = Field(default=None, min_length=2, max_length=2,
                                         description="waypoint: the two ends or breakouts it lies between")


class Harness(_Model):
    id: HarnessId
    name: str = Field(min_length=1, max_length=200)
    label: Optional[str] = Field(default=None, max_length=200)
    ends: list[HarnessEnd] = Field(min_length=1, max_length=32)
    wires: list[Wire]
    nodes: list[HarnessNode] = Field(default_factory=list)
    cutLengthMm: Optional[float] = Field(default=None, gt=0, allow_inf_nan=False)
    serviceAllowancePct: Optional[float] = Field(default=None, ge=0, le=100, allow_inf_nan=False)


# ---------------------------------------------------------------------------
# Mating and placement (placement-only, §9.3; conventions frozen in SB2-10)


class MatingFrame(_Model):
    axis: Literal["top", "bottom", "+x", "-x", "+y", "-y"]
    quarterTurns: int = Field(ge=0, le=3)


class Mating(_Model):
    """A stored connector frame (§15.2): inferred frames are recomputed, never stored."""

    instanceId: InstanceId
    portKey: str = Field(min_length=1, max_length=2000)
    mode: Literal["confirmed", "override"]
    frame: MatingFrame
    geometryDigest: Optional[str] = Field(default=None, pattern=r"^sha256:[0-9a-f]{64}$",
                                          description="the port's v6 geometry when confirmed; stale if it differs")


class Pose(_Model):
    instanceId: InstanceId
    translationMm: Vec3
    rotation: Quat = Field(description="unit quaternion x, y, z, w")
    source: Literal["auto", "manual", "default"]

    @field_validator("translationMm", "rotation")
    @classmethod
    def _finite(cls, value: list[float]) -> list[float]:
        if any(v != v or v in (float("inf"), float("-inf")) for v in value):
            raise ValueError("must be finite")
        return value

    @field_validator("rotation")
    @classmethod
    def _unit(cls, value: list[float]) -> list[float]:
        if abs(sum(v * v for v in value) - 1.0) > 1e-6:
            raise ValueError("rotation must be a unit quaternion")
        return value


class DrivingMate(_Model):
    instanceId: InstanceId
    linkId: LinkId


class Placement(_Model):
    poses: list[Pose] = Field(default_factory=list)
    drivingMates: list[DrivingMate] = Field(default_factory=list, description="user overrides only")


# ---------------------------------------------------------------------------
# Canvas layout (presentation, §9.1; revises P1 invariant 6)


class CanvasPosition(_Model):
    x: float = Field(allow_inf_nan=False)
    y: float = Field(allow_inf_nan=False)


class CanvasLayout(_Model):
    """The saved diagram arrangement: node key (instance, harness or subsystem ID) -> position."""

    positions: dict[Annotated[str, Field(min_length=1, max_length=200)], CanvasPosition] = Field(
        default_factory=dict, max_length=1000
    )


# ---------------------------------------------------------------------------
# The manifest


class SystemHeader(_Model):
    id: SystemId
    name: str = Field(min_length=1, max_length=200)
    description: str = Field(default="", max_length=4000)
    optionalRules: list[Literal["SYS-V09"]] = Field(
        default_factory=list, description="opt-in validation rules this system runs (P2 §8.4)")


class SnapshotHeader(_Model):
    id: SnapshotId
    name: str = Field(min_length=1, max_length=200)
    note: str = Field(default="", max_length=4000)


class Meta(_Model):
    createdAt: str
    createdBy: str
    sourceVersion: int = Field(ge=1, description="system version the manifest was taken at")
    snapshot: Optional[SnapshotHeader] = None


class Manifest(_Model):
    schema_: Literal["prism.system_manifest.v1"] = Field(alias="schema")
    system: SystemHeader
    meta: Meta
    instances: list[Instance]
    exports: list[Export] = Field(default_factory=list)
    links: list[Link] = Field(default_factory=list)
    harnesses: list[Harness] = Field(default_factory=list)
    mating: list[Mating] = Field(default_factory=list)
    placement: Placement = Field(default_factory=Placement)
    layout: CanvasLayout = Field(default_factory=CanvasLayout)

    model_config = ConfigDict(extra="forbid", frozen=True, populate_by_name=True)

    @model_validator(mode="after")
    def _references(self) -> "Manifest":
        problems = reference_problems(self)
        if problems:
            raise ValueError("; ".join(problems))
        return self


def reference_problems(manifest: Manifest) -> list[str]:
    """§9.2 referential rules a single manifest can check on its own."""

    problems: list[str] = []
    kinds = {i.id: i.kind for i in manifest.instances}
    labels = [i.label.casefold() for i in manifest.instances]
    if len(kinds) != len(manifest.instances):
        problems.append("instance ids must be unique")
    if len(set(labels)) != len(labels):
        problems.append("instance labels must be unique (case-insensitive)")

    def end_ok(end: Any, where: str) -> None:
        kind = kinds.get(end.instanceId)
        if kind is None:
            problems.append(f"{where}: unknown instance {end.instanceId}")
        elif isinstance(end, (PortEnd, PortTarget, ExportPortTarget)) and kind not in ("board", "module"):
            problems.append(f"{where}: portKey ends need a board or module instance")
        elif isinstance(end, (ExportEnd, ExportTarget)) and kind != "assembly":
            problems.append(f"{where}: exportId ends need an assembly instance")

    names = [e.name.casefold() for e in manifest.exports]
    if len(set(names)) != len(names):
        problems.append("export names must be unique (case-insensitive)")
    for export in manifest.exports:
        end_ok(export.target, f"export {export.name}")

    rows: set[str] = set()
    for link in manifest.links:
        end_ok(link.a, f"link {link.id} a")
        end_ok(link.b, f"link {link.id} b")
        seen = set()
        for row in link.rows:
            if row.id in rows:
                problems.append(f"row {row.id} appears twice")
            rows.add(row.id)
            if (row.pinA, row.pinB) in seen:
                problems.append(f"link {link.id}: duplicate row {row.pinA} ↔ {row.pinB}")
            seen.add((row.pinA, row.pinB))

    for harness in manifest.harnesses:
        ends = {e.id: e for e in harness.ends}
        if len(ends) != len(harness.ends):
            problems.append(f"harness {harness.id}: end ids must be unique")
        for end in harness.ends:
            if end.mates is not None:
                end_ok(end.mates, f"harness {harness.id} end {end.id}")
        for wire in harness.wires:
            for point in (wire.source, wire.target):
                if point.end not in ends:
                    problems.append(f"wire {wire.id}: unknown end {point.end}")
        breakout_ids = {n.id for n in harness.nodes if n.kind == "breakout"}
        for node in harness.nodes:
            for end_id in node.ends:
                if end_id not in ends:
                    problems.append(f"node {node.id}: unknown end {end_id}")
            if (node.kind == "waypoint") != (node.between is not None):
                problems.append(f"node {node.id}: a waypoint, and only a waypoint, lies between two nodes")
            for other in node.between or []:
                if other not in ends and other not in breakout_ids:
                    problems.append(f"node {node.id}: unknown node {other}")

    for mating in manifest.mating:
        if kinds.get(mating.instanceId) not in ("board", "module"):
            problems.append(f"mating on {mating.instanceId}: needs a board or module instance")
    posed = [p.instanceId for p in manifest.placement.poses]
    if len(set(posed)) != len(posed):
        problems.append("at most one pose per instance")
    for pose in manifest.placement.poses:
        if pose.instanceId not in kinds:
            problems.append(f"pose: unknown instance {pose.instanceId}")
    links = {link.id for link in manifest.links}
    for driving in manifest.placement.drivingMates:
        if driving.linkId not in links or driving.instanceId not in kinds:
            problems.append(f"driving mate {driving.linkId}: unknown link or instance")
    return problems


# ---------------------------------------------------------------------------
# Digests (§9.3)


def _canonical(value: Any) -> str:
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False)


def _sha(value: Any) -> str:
    return "sha256:" + hashlib.sha256(_canonical(value).encode("utf-8")).hexdigest()


def full_view(manifest: Manifest) -> dict:
    body = manifest.model_dump(mode="json", by_alias=True, exclude_none=False)
    body.pop("meta")
    # Fields added after M0 are omitted while unset, so older manifests keep their digests.
    if not body["system"]["optionalRules"]:
        body["system"].pop("optionalRules")
    for link in body["links"]:
        if link["stackHeightMm"] is None:
            link.pop("stackHeightMm")
    for harness in body["harnesses"]:
        for end in harness["ends"]:
            if end["partPins"] is None:
                end.pop("partPins")
            for key in ("name", "mpn", "manufacturer"):
                if end["part"] is not None and end["part"][key] is None:
                    end["part"].pop(key)
    return body


def connectivity_view(manifest: Manifest) -> dict:
    """``full_view`` without placement-only facts."""

    body = full_view(manifest)
    body["system"].pop("optionalRules", None)  # a check setting, not connectivity
    for link in body["links"]:
        link.pop("stackHeightMm", None)  # placement (§16.2)
    body.pop("layout")
    body.pop("mating")
    body.pop("placement")
    for harness in body["harnesses"]:
        harness.pop("nodes")
        harness.pop("cutLengthMm")
        harness.pop("serviceAllowancePct")
        for end in harness["ends"]:
            end.pop("bootMm")
    return body


def digests(manifest: Manifest) -> dict[str, str]:
    return {"full": _sha(full_view(manifest)), "connectivity": _sha(connectivity_view(manifest))}


def json_schema() -> dict:
    schema = Manifest.model_json_schema(by_alias=True)
    schema["$id"] = "https://kicad-prism/schemas/system_manifest.v1.schema.json"
    schema["title"] = SCHEMA
    return schema


if __name__ == "__main__":  # regenerate the committed schema
    sys.stdout.write(json.dumps(json_schema(), indent=2, sort_keys=True) + "\n")
