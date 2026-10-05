import assert from "node:assert/strict";
import test from "node:test";

const {
  axisAmount, canonicalPose, eulerDegrees, moveDescriptor, moveTarget, poseMatrix, rigidInverse,
  ringRotation, rotatePoseAbout, rotationFromEuler, screenAngle, snapTo, translatePose,
} = await import("./move-gizmo.js");

const close = (actual, expected, tolerance = 1e-9) => {
  assert.equal(actual.length, expected.length);
  actual.forEach((value, index) => assert.ok(Math.abs(value - expected[index]) <= tolerance, `${actual} != ${expected}`));
};
const S = Math.SQRT1_2;
const apply = (m, p) => [0, 1, 2].map((r) => m[r] * p[0] + m[4 + r] * p[1] + m[8 + r] * p[2] + m[12 + r]);

test("a pose matrix rotates, then translates, column-major", () => {
  const m = poseMatrix({ translationMm: [10, 20, 30], rotation: [0, 0, S, S] }); // 90° about z
  close(apply(m, [1, 0, 0]), [10, 21, 30]);
  close(m.slice(12, 15), [10, 20, 30]);
});

test("the rigid inverse undoes the matrix", () => {
  const m = poseMatrix({ translationMm: [5, -7, 2], rotation: rotationFromEuler([30, -20, 75]) });
  close(apply(rigidInverse(m), apply(m, [3, 4, 5])), [3, 4, 5], 1e-6); // the quaternion is rounded to 1e-9
});

test("canonical poses keep w non-negative and round float noise", () => {
  assert.deepEqual(canonicalPose({ translationMm: [1e-12, -0, 2], rotation: [0, 0, -2, -2] }),
    { translationMm: [0, 0, 2], rotation: [0, 0, 0.707106781, 0.707106781] });
});

test("snapping rounds to the step", () => {
  assert.equal(snapTo(12.4, 1), 12);
  assert.equal(snapTo(-7.6, 1), -8);
  assert.equal(snapTo(0.26, 0.1).toFixed(1), "0.3");
  assert.equal(snapTo(Math.PI / 5, Math.PI / 12), Math.PI / 6); // 36° snaps to 30° in 15° steps
});

test("a pointer drag converts to millimetres along the axis's screen direction", () => {
  // The axis shows as 4 px per mm, pointing right and down.
  const axis = [4 * S, 4 * S];
  assert.ok(Math.abs(axisAmount([40 * S, 40 * S], axis) - 10) < 1e-9);
  assert.ok(Math.abs(axisAmount([40 * S, -40 * S], axis)) < 1e-9, "across the axis moves nothing");
  assert.equal(axisAmount([10, 10], [0, 0]), 0, "an axis pointing at the viewer cannot be dragged");
});

test("ring drags turn the right way whichever side the camera is on", () => {
  // Screen y points down: from right (1, 0) to bottom (0, 1) is a quarter turn clockwise.
  const angle = screenAngle([0, 0], [1, 0], [0, 1]);
  assert.ok(Math.abs(angle - Math.PI / 2) < 1e-12);
  // Looking down +z (camera above): clockwise on screen is a negative turn about +z.
  assert.equal(ringRotation([0, 0, 1], [0, 0, 1], angle), -angle);
  assert.equal(ringRotation([0, 0, 1], [0, 0, -1], angle), angle);
});

test("rotating about a pivot keeps the pivot still", () => {
  const pose = { translationMm: [100, 0, 0], rotation: [0, 0, 0, 1] };
  const pivot = [150, 20, 0];
  const turned = rotatePoseAbout(pose, [0, 0, 1], Math.PI / 2, pivot);
  const before = rigidInverse(poseMatrix(pose));
  const local = apply(before, pivot); // the pivot in the board's own frame
  close(apply(poseMatrix(turned), local), pivot);
  close(turned.rotation, [0, 0, S, S]);
});

test("translating moves along a world axis", () => {
  assert.deepEqual(translatePose({ translationMm: [1, 2, 3], rotation: [0, 0, 0, 1] }, [0, 1, 0], 5).translationMm, [1, 7, 3]);
});

test("euler angles round-trip through the rotation", () => {
  for (const degrees of [[0, 0, 0], [30, 0, 0], [0, -45, 0], [0, 0, 90], [10, 20, 30], [-170, 60, 135]]) {
    close(eulerDegrees(rotationFromEuler(degrees)), degrees, 1e-6);
  }
});

const descriptor = {
  occurrences: [
    { path: "/a", depth: 1, kind: "board", worldMatrix: poseMatrix({ translationMm: [0, 0, 0], rotation: [0, 0, 0, 1] }),
      pose: { translationMm: [0, 0, 0], rotation: [0, 0, 0, 1], source: "default" } },
    { path: "/g", depth: 1, kind: "assembly", worldMatrix: poseMatrix({ translationMm: [100, 0, 0], rotation: [0, 0, 0, 1] }),
      pose: { translationMm: [100, 0, 0], rotation: [0, 0, 0, 1], source: "default" } },
    { path: "/g/b", depth: 2, kind: "board", worldMatrix: poseMatrix({ translationMm: [110, 5, 0], rotation: [0, 0, 0, 1] }),
      pose: { translationMm: [10, 5, 0], rotation: [0, 0, 0, 1], source: "default" } },
  ],
};

test("selecting inside a child system moves the whole child system", () => {
  assert.equal(moveTarget(descriptor, "/g/b").path, "/g");
  assert.equal(moveTarget(descriptor, "/a").path, "/a");
  assert.equal(moveTarget(descriptor, null), null);
});

test("moving a child system carries its members as a rigid group", () => {
  const moved = moveDescriptor(descriptor, "/g", { translationMm: [200, 50, 0], rotation: [0, 0, S, S] });
  const group = moved.occurrences.find((item) => item.path === "/g");
  const member = moved.occurrences.find((item) => item.path === "/g/b");
  assert.equal(group.pose.source, "manual");
  close(group.worldMatrix.slice(12, 15), [200, 50, 0]);
  // The member's (10, 5) offset inside the group turns with it: (−5, 10) from the group's origin.
  close(member.worldMatrix.slice(12, 15), [195, 60, 0]);
  assert.deepEqual(member.pose, descriptor.occurrences[2].pose, "a member's own pose is frozen in its snapshot");
  assert.equal(moved.occurrences[0], descriptor.occurrences[0], "other boards are untouched");
  assert.equal(moveDescriptor(descriptor, "/g/b", { translationMm: [0, 0, 0], rotation: [0, 0, 0, 1] }), descriptor,
    "only top-level occurrences move");
});
