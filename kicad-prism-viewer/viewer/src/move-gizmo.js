// Move mode for the system scene (System Builder SB2-29): the pose arithmetic
// behind the gizmo and the numeric panel, kept free of the DOM and WebGPU so it
// can be tested on its own.
//
// Poses follow CONTRACTS_P2 §14: millimetres, `T·R`, unit quaternions
// `[x, y, z, w]` with `w ≥ 0`, column-major 4×4 matrices. A move always acts on
// a top-level instance of the system (a board, or a child system as one rigid
// group), so its pose is in the world frame.

import { cross, dot, normalize, quatAxis, quatMultiply, quatRotate } from "./math.js";

// Snapping: whole millimetres and 15° steps; Shift for fine steps.
export const SNAP = Object.freeze({ mm: 1, fineMm: 0.1, deg: 15, fineDeg: 1 });

export const AXES = Object.freeze([[1, 0, 0], [0, 1, 0], [0, 0, 1]]);

function clean(value) {
  return Math.round(value * 1e9) / 1e9 + 0;
}

/** §14.1 canonical form: normalised rotation with `w ≥ 0`, values rounded to 1e-9. */
export function canonicalPose(pose) {
  const size = Math.hypot(...pose.rotation) || 1;
  const unit = pose.rotation.map((value) => value / size);
  const leading = [unit[3], unit[0], unit[1], unit[2]].find((value) => Math.abs(value) > 1e-12) ?? 1;
  return {
    translationMm: pose.translationMm.map(clean),
    rotation: unit.map((value) => clean(leading < 0 ? -value : value)),
  };
}

/** Column-major 4×4 of `T·R` (the same as the server's `poses.matrix`). */
export function poseMatrix(pose) {
  const [x, y, z, w] = pose.rotation;
  const [tx, ty, tz] = pose.translationMm;
  return [
    1 - 2 * (y * y + z * z), 2 * (x * y + z * w), 2 * (x * z - y * w), 0,
    2 * (x * y - z * w), 1 - 2 * (x * x + z * z), 2 * (y * z + x * w), 0,
    2 * (x * z + y * w), 2 * (y * z - x * w), 1 - 2 * (x * x + y * y), 0,
    tx, ty, tz, 1,
  ];
}

function multiply(a, b) {
  const out = new Array(16);
  for (let column = 0; column < 4; column += 1) {
    for (let row = 0; row < 4; row += 1) {
      out[column * 4 + row] = a[row] * b[column * 4] + a[4 + row] * b[column * 4 + 1]
        + a[8 + row] * b[column * 4 + 2] + a[12 + row] * b[column * 4 + 3];
    }
  }
  return out;
}

/** The inverse of a rotation-plus-translation matrix: `Rᵀ`, `−Rᵀ·t`. */
export function rigidInverse(m) {
  const out = [m[0], m[4], m[8], 0, m[1], m[5], m[9], 0, m[2], m[6], m[10], 0, 0, 0, 0, 1];
  for (let row = 0; row < 3; row += 1) {
    out[12 + row] = -(out[row] * m[12] + out[4 + row] * m[13] + out[8 + row] * m[14]);
  }
  return out;
}

export function snapTo(value, step) {
  return step > 0 ? Math.round(value / step) * step : value;
}

/** Millimetres along an axis for a pointer movement, given the axis's on-screen vector per millimetre. */
export function axisAmount(deltaPx, axisPxPerMm) {
  const lengthSquared = axisPxPerMm[0] ** 2 + axisPxPerMm[1] ** 2;
  if (lengthSquared < 1e-9) return 0;
  return (deltaPx[0] * axisPxPerMm[0] + deltaPx[1] * axisPxPerMm[1]) / lengthSquared;
}

/** Signed screen angle from `a` to `b` around `center`, in radians (y points down: clockwise is positive). */
export function screenAngle(center, a, b) {
  const from = Math.atan2(a[1] - center[1], a[0] - center[0]);
  const to = Math.atan2(b[1] - center[1], b[0] - center[0]);
  let angle = to - from;
  while (angle > Math.PI) angle -= 2 * Math.PI;
  while (angle < -Math.PI) angle += 2 * Math.PI;
  return angle;
}

/**
 * The rotation about `axis` that a screen-space turn of `angle` means. A
 * positive rotation about an axis pointing at the viewer turns
 * counter-clockwise on screen, which is a negative screen angle with y down.
 * `toViewer` is the camera's back vector.
 */
export function ringRotation(axis, toViewer, angle) {
  return dot(axis, toViewer) >= 0 ? -angle : angle;
}

/** The pose's own axes in the world: the gizmo's "local" space. */
export function localAxes(pose) {
  return AXES.map((axis) => quatRotate(pose.rotation, axis));
}

export function translatePose(pose, axis, amountMm) {
  return {
    translationMm: pose.translationMm.map((value, index) => value + axis[index] * amountMm),
    rotation: [...pose.rotation],
  };
}

/** Turn a pose by `angle` (radians) about a world axis through `pivotMm`. */
export function rotatePoseAbout(pose, axis, angle, pivotMm) {
  const turn = quatAxis(axis, angle);
  const offset = pose.translationMm.map((value, index) => value - pivotMm[index]);
  const moved = quatRotate(turn, offset);
  return {
    translationMm: moved.map((value, index) => value + pivotMm[index]),
    rotation: quatMultiply(turn, pose.rotation),
  };
}

/** The top-level occurrence that moves when `key` is selected: a board, or the child system it is in. */
export function moveTarget(descriptor, key) {
  if (key == null) return null;
  const top = `/${String(key).split("/")[1] || ""}`;
  return (descriptor?.occurrences || []).find((item) => item.path === top && item.depth === 1) ?? null;
}

/**
 * The descriptor with the occurrence at `path` posed at `pose` (source
 * "manual"): its world matrix and those of everything inside it move together.
 * Only top-level occurrences move, so a pose is its world matrix.
 */
export function moveDescriptor(descriptor, path, pose) {
  const target = descriptor.occurrences.find((item) => item.path === path);
  if (!target || target.depth !== 1) return descriptor;
  const world = poseMatrix(pose);
  const delta = multiply(world, rigidInverse(target.worldMatrix));
  const inside = `${path}/`;
  return {
    ...descriptor,
    occurrences: descriptor.occurrences.map((item) => {
      if (item.path === path) {
        return { ...item, pose: { ...canonicalPose(pose), source: "manual" }, worldMatrix: world };
      }
      if (item.path.startsWith(inside)) return { ...item, worldMatrix: multiply(delta, item.worldMatrix) };
      return item;
    }),
  };
}

/** Euler angles in degrees, rotating about X, then Y, then Z (world axes), for the numeric panel. */
export function eulerDegrees(rotation) {
  const [x, y, z, w] = rotation;
  const sinY = Math.max(-1, Math.min(1, 2 * (w * y - z * x)));
  const deg = (radians) => clean(radians * 180 / Math.PI);
  return [
    deg(Math.atan2(2 * (w * x + y * z), 1 - 2 * (x * x + y * y))),
    deg(Math.asin(sinY)),
    deg(Math.atan2(2 * (w * z + x * y), 1 - 2 * (y * y + z * z))),
  ];
}

/** The inverse of `eulerDegrees`: `Rz · Ry · Rx`. */
export function rotationFromEuler(degrees) {
  const [rx, ry, rz] = degrees.map((value) => value * Math.PI / 180);
  const q = quatMultiply(quatAxis([0, 0, 1], rz), quatMultiply(quatAxis([0, 1, 0], ry), quatAxis([1, 0, 0], rx)));
  return canonicalPose({ translationMm: [0, 0, 0], rotation: q }).rotation;
}

/** A unit vector perpendicular to `axis`, for drawing its rotation ring. */
export function perpendicular(axis) {
  const helper = Math.abs(axis[0]) < 0.9 ? [1, 0, 0] : [0, 1, 0];
  return normalize(cross(axis, helper));
}
