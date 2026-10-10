import assert from "node:assert/strict";
import test from "node:test";

import { harnessKey, harnessSegments, hubPoint, litEnds, litHarnessWires, refersTo, segmentColor } from "./system-harness.js";

const twoEnd = {
  id: "shw_a", level: null, name: "W1",
  ends: [{ id: "e1", occurrence: "/sin_obc", reference: "J3" }, { id: "e2", occurrence: "/sin_cmbd", reference: "J1" }],
  wires: [{ id: "w1", from: "e1", to: "e2" }, { id: "w2", from: "e1", to: "e2" }],
};
// A 3-end harness with a splice: w1 e1→e2, w2 e1→e3, w3 e2→e3.
const star = {
  id: "shw_b", level: "/sin_bus", name: "WH-001",
  ends: [{ id: "e1" }, { id: "e2" }, { id: "e3" }],
  wires: [{ id: "w1", from: "e1", to: "e2" }, { id: "w2", from: "e1", to: "e3" }, { id: "w3", from: "e2", to: "e3" }],
};

test("a two-end harness is one segment carrying every wire", () => {
  const [segment] = harnessSegments(twoEnd);
  assert.deepEqual([segment.a, segment.b, [...segment.wires]], ["e1", "e2", ["w1", "w2"]]);
  assert.deepEqual(harnessSegments({ ...twoEnd, ends: [twoEnd.ends[0]] }), []);
});

test("more ends make a star; each spoke carries the wires touching its end", () => {
  const spokes = harnessSegments(star);
  assert.deepEqual(spokes.map((segment) => [segment.a, segment.b, [...segment.wires].sort()]),
    [["hub", "e1", ["w1", "w2"]], ["hub", "e2", ["w1", "w3"]], ["hub", "e3", ["w2", "w3"]]]);
});

test("a lit wire lights the spokes it uses and glows the ends it reaches", () => {
  const lit = litHarnessWires([twoEnd, star], [
    { color: "#14ff33", wires: [{ harness: "shw_b", wire: "w2", occurrence: "/sin_bus/sin_pwr" }] },
    { color: "#ff8800", wires: [{ harness: "shw_b", wire: "w2" }, { harness: "shw_b", wire: "nope" }] },
  ]);
  assert.deepEqual([...lit.keys()], ["/sin_bus/shw_b"]);
  const wires = lit.get(harnessKey(star));
  assert.deepEqual([...wires], [["w2", "#14ff33"]]); // the first set keeps the wire
  assert.deepEqual(harnessSegments(star).map((segment) => segmentColor(segment, wires)), ["#14ff33", null, "#14ff33"]);
  assert.deepEqual([...litEnds(star, wires)], [["e1", "#14ff33"], ["e3", "#14ff33"]]);
  assert.equal(segmentColor(harnessSegments(twoEnd)[0], undefined), null);
});

test("two copies of a child system's harness are told apart by the wire's board", () => {
  const copyB = { ...star, level: "/sin_bus2" };
  assert.equal(refersTo(star, { harness: "shw_b", wire: "w1", occurrence: "/sin_bus/sin_pwr" }), true);
  assert.equal(refersTo(copyB, { harness: "shw_b", wire: "w1", occurrence: "/sin_bus/sin_pwr" }), false);
  assert.equal(refersTo(copyB, { harness: "shw_b", wire: "w1" }), true);
  assert.equal(refersTo(twoEnd, { harness: "shw_a", wire: "w1", occurrence: "/anything" }), true);
});

test("the hub is the centroid of the anchored ends", () => {
  assert.deepEqual(hubPoint([[0, 0, 0], null, [2, 4, 6]]), [1, 2, 3]);
  assert.equal(hubPoint([[0, 0, 0], null]), null);
});
