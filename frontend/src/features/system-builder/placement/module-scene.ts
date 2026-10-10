/**
 * The connector picker's scene (CONTRACTS_P2 §3.6, SB2-48b): a module's model and its placed connectors
 * as a `prism.system_scene.a0` descriptor for the system viewer, and the placement a moved connector
 * means. Each connector is a top-level occurrence posed at its face frame `P`: its pin-1 marker is the
 * occurrence's own box, its body (the part's model, else its body box) a child, so the viewer's move
 * gizmo moves both, limited to the face's two axes and quarter-turns about the normal.
 */

import type { SystemScene, SystemSceneOccurrence } from "@/types/system";

import { type ConnectorGeometry, type Vec3 } from "./frames";
import { bodyCorners, inverse } from "./mate";
import { type FaceFrame, type ModulePlacement, faceFrame, partFrame } from "./module-ports";
import { type Pose, matrix, rotate } from "./poses";

type Triple = [number, number, number];
type Bounds = { minMm: number[]; maxMm: number[] };

export interface ModelAlignment {
  offsetMm: Triple;
  rotationDeg: Triple;
  scale: number;
}

export interface SceneModel {
  glbKey: string;
  alignment: ModelAlignment;
  boundsMm?: Bounds | null;
}

export interface SceneConnector {
  key: string;
  placement: ModulePlacement;
  geometry: ConnectorGeometry;
  model: SceneModel | null;
}

export const MODULE_PATH = "/module";
export const connectorPath = (key: string) => `/connector-${key}`;

const ACTIVE_RGBA: [number, number, number, number] = [0.13, 0.64, 0.29, 1];
const OTHER_RGBA: [number, number, number, number] = [0.58, 0.64, 0.72, 1];
const PIN_ONE_RGBA: [number, number, number, number] = [0.86, 0.15, 0.15, 1];
const PIN_ONE_MM = 0.5;
const IDENTITY = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];

function multiply(a: readonly number[], b: readonly number[]): number[] {
  const out = new Array<number>(16);
  for (let c = 0; c < 4; c += 1) {
    for (let r = 0; r < 4; r += 1) {
      out[c * 4 + r] = a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3];
    }
  }
  return out;
}

/** `T(offset) · Rz · Ry · Rx · S`, column-major, as `catalog/models.alignment_matrix`. */
export function alignmentMatrix(alignment: ModelAlignment): number[] {
  const [rx, ry, rz] = alignment.rotationDeg.map((deg) => (deg * Math.PI) / 180);
  const [cx, sx, cy, sy, cz, sz] = [Math.cos(rx), Math.sin(rx), Math.cos(ry), Math.sin(ry), Math.cos(rz), Math.sin(rz)];
  const s = alignment.scale;
  const r = [
    [cz * cy, cz * sy * sx - sz * cx, cz * sy * cx + sz * sx],
    [sz * cy, sz * sy * sx + cz * cx, sz * sy * cx - cz * sx],
    [-sy, cy * sx, cy * cx],
  ];
  const t = alignment.offsetMm;
  return [r[0][0] * s, r[1][0] * s, r[2][0] * s, 0, r[0][1] * s, r[1][1] * s, r[2][1] * s, 0,
    r[0][2] * s, r[1][2] * s, r[2][2] * s, 0, t[0], t[1], t[2], 1];
}

const facePose = (face: FaceFrame): Pose => ({ translationMm: face.originMm, rotation: face.rotation });

/** A footprint-frame point in the face frame (the part's mating frame sits on `P`, so this is `F_part⁻¹ · p`). */
function inFace(frame: NonNullable<ReturnType<typeof partFrame>>, point: readonly number[]): Vec3 {
  const d = [0, 1, 2].map((i) => point[i] - frame.originMm[i]);
  return [frame.xAxis, frame.yAxis, frame.zAxis].map((axis) => d[0] * axis[0] + d[1] * axis[1] + d[2] * axis[2]) as Vec3;
}

function boxOf(points: readonly Vec3[]): Bounds {
  return { minMm: [0, 1, 2].map((i) => Math.min(...points.map((p) => p[i]))),
    maxMm: [0, 1, 2].map((i) => Math.max(...points.map((p) => p[i]))) };
}

function occurrence(path: string, depth: number, kind: string, pose: Pose, extra: Partial<SystemSceneOccurrence>): SystemSceneOccurrence {
  return {
    path, parentPath: depth > 1 ? path.slice(0, path.lastIndexOf("/")) : null, displayPath: "", labels: [], instanceId: path,
    kind, depth, restricted: false, assetId: null, pose: { ...pose, source: "manual" }, worldMatrix: matrix(pose), boundsMm: null,
    ...extra,
  };
}

/** One connector: its marker (top level, the gizmo's target) and its body (child). */
function connectorOccurrences(connector: SceneConnector, active: boolean): SystemSceneOccurrence[] {
  const frame = partFrame(connector.geometry, connector.placement.axis);
  if (!frame) return [];
  const face = faceFrame(connector.placement);
  const pose = facePose(face);
  const path = connectorPath(connector.key);
  const padOne = connector.geometry.pads.find((pad) => pad.pad === "1") ?? connector.geometry.pads[0];
  const dot = inFace(frame, [padOne.positionMm[0], padOne.positionMm[1], 0]);
  const marker = occurrence(path, 1, "connector", pose, {
    box: { boundsMm: { minMm: dot.map((c, i) => c - PIN_ONE_MM + (i === 2 ? PIN_ONE_MM : 0)),
      maxMm: dot.map((c, i) => c + PIN_ONE_MM + (i === 2 ? PIN_ONE_MM : 0)) }, rgba: active ? PIN_ONE_RGBA : OTHER_RGBA },
    move: active ? { translate: [0, 1], rotate: [2], rotateSnapDeg: 90, pivot: "origin" } : false,
  });
  const footprintInFace = matrix(inverse({ translationMm: frame.originMm, rotation: frame.rotation }));
  const body = occurrence(`${path}/body`, 2, "connector-body", pose, connector.model
    ? { model: { glbKey: connector.model.glbKey, matrixMm: multiply(footprintInFace, alignmentMatrix(connector.model.alignment)),
      boundsMm: connector.model.boundsMm ?? null } }
    : { box: { boundsMm: boxOf(bodyCorners(connector.geometry, 0).map((corner) => inFace(frame, corner))),
      rgba: active ? ACTIVE_RGBA : OTHER_RGBA } });
  return [marker, body];
}

/** The picker's scene: the module (fixed, surface-pickable) and its connectors, `active` the one being placed. */
export function moduleScene(module: SceneModel, active: SceneConnector | null, others: readonly SceneConnector[]): SystemScene {
  const identity: Pose = { translationMm: [0, 0, 0], rotation: [0, 0, 0, 1] };
  const occurrences = [
    occurrence(MODULE_PATH, 1, "module", identity, {
      model: { glbKey: module.glbKey, matrixMm: alignmentMatrix(module.alignment), boundsMm: module.boundsMm ?? null },
      move: false, pickSurface: true, worldMatrix: [...IDENTITY],
    }),
    ...others.flatMap((connector) => connectorOccurrences(connector, false)),
    ...(active ? connectorOccurrences(active, true) : []),
  ];
  return { schema: "prism.system_scene.a0", systemId: "module-picker", systemVersion: 0, units: "mm", assets: [], occurrences, harnesses: [] };
}

/**
 * The placement a moved connector means: its face frame's new origin, and the quarter-turns that put the
 * face's base x where the pose's x now points. The normal is unchanged: the gizmo only turns about it.
 */
export function placementFromPose(pose: Pose, previous: ModulePlacement): ModulePlacement {
  const base = faceFrame({ ...previous, quarterTurns: 0 });
  const x = rotate(pose.rotation, [1, 0, 0]);
  const angle = Math.atan2(x[0] * base.yAxis[0] + x[1] * base.yAxis[1] + x[2] * base.yAxis[2],
    x[0] * base.xAxis[0] + x[1] * base.xAxis[1] + x[2] * base.xAxis[2]);
  const turns = ((Math.round(angle / (Math.PI / 2)) % 4) + 4) % 4;
  const round = (value: number) => Math.round(value * 1000) / 1000 + 0;
  return { ...previous, originMm: pose.translationMm.map(round) as Vec3, quarterTurns: turns };
}

