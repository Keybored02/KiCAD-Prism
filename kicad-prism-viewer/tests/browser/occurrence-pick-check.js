// Browser check for SB2-24: picks on a system's placed boards resolve to the
// right placement, through the <prism-semantic-viewer> element API only.
//
// Run on a system's 3D tab (mode="system") whose placements include the same
// board more than once, by pasting this file into the console, then:
//   await runOccurrencePickCheck(document.querySelector('prism-semantic-viewer[mode="system"]'), {
//     placements: ["/OBC-A", "/OBC-B"], references: ["U1", ...],
//     outlineMm: [minX, minY, maxX, maxY], topZMm: 1.82 });
// `placements` are occurrence paths of one board's placements; `outlineMm` and
// `topZMm` are that board's outline and top face in its own frame.
//
// 1. Overview from the top (the `z` view): aim at every part on every
//    placement, and at a grid of points on each placement's top face. Every
//    hit must name the placement aimed at. (Whether a part resolves to itself
//    is reported, not required: at overview zoom a 0402's centre is about a
//    pixel, and a taller neighbour or another board may hide it.)
// 2. Framed: select a sample of parts per placement with setSelection({
//    reference, occurrence }); the camera frames that part on that placement,
//    and a pick at its centre must resolve to the part on that placement.
window.runOccurrencePickCheck = async function runOccurrencePickCheck(element, options) {
  const { placements, references, outlineMm, topZMm, settleMs = 3500, framedPerCopy = 8 } = options;
  const settle = () => new Promise((resolve) => setTimeout(resolve, settleMs));
  const topView = () => window.dispatchEvent(new KeyboardEvent("keydown", { key: "z" }));
  const [minX, minY, maxX, maxY] = outlineMm.map((value) => value / 1000);
  // The camera eases toward a framed part; projecting during the move and
  // picking a frame later would aim beside it. Wait until the part stops moving
  // on screen (under 0.25 px across 250 ms), at most 6 s.
  const settledOn = async (reference, key) => {
    let last = null;
    for (let waited = 0; waited < 6000; waited += 250) {
      await new Promise((resolve) => setTimeout(resolve, 250));
      const point = element.projectComponent(reference, key);
      if (point && last && Math.hypot(point.x - last.x, point.y - last.y) < 0.25) return;
      last = point;
    }
  };
  const aim = async (reference, key) => {
    const point = element.projectComponent(reference, key);
    if (!point) return null;
    return element.pickAt(point.x, point.y);
  };

  element.frameAll();
  topView();
  await settle();

  const parts = [];
  for (const key of placements) {
    for (const reference of references) {
      const hit = await aim(reference, key);
      if (hit) parts.push({ key, reference, gotKey: hit.occurrenceKey ?? null, gotReference: hit.selection?.reference ?? null });
    }
  }

  const grid = [];
  const inset = 0.002;
  const steps = 8;
  for (const key of placements) {
    for (let i = 0; i <= steps; i += 1) {
      for (let j = 0; j <= steps; j += 1) {
        const local = [
          minX + inset + (maxX - minX - 2 * inset) * i / steps,
          minY + inset + (maxY - minY - 2 * inset) * j / steps,
          topZMm / 1000,
        ];
        const point = element.projectPoint(local, key);
        if (!point) continue;
        const hit = await element.pickAt(point.x, point.y);
        grid.push({ key, gotKey: hit?.occurrenceKey ?? null, kind: hit?.kind });
      }
    }
  }

  const framed = [];
  const visible = [...new Set(parts.filter((row) => row.gotReference === row.reference).map((row) => row.reference))];
  const stride = Math.max(1, Math.floor(visible.length / framedPerCopy));
  for (const key of placements) {
    for (let index = 0; index < visible.length && framed.filter((row) => row.key === key).length < framedPerCopy; index += stride) {
      const reference = visible[index];
      element.setSelection({ reference, occurrence: key });
      await settledOn(reference, key);
      const hit = await aim(reference, key);
      framed.push({ key, reference, gotKey: hit?.occurrenceKey ?? null, gotReference: hit?.selection?.reference ?? null });
    }
  }
  element.setSelection(null);

  const tally = (rows, test) => rows.filter(test).length;
  const wrongCopy = parts.filter((row) => row.gotKey !== row.key);
  // A grid point may land on another board in front of this one; only a hit naming a different placement of this board fails.
  const gridFailures = grid.filter((row) => row.gotKey !== row.key && placements.includes(row.gotKey));
  const framedFailures = framed.filter((row) => row.gotKey !== row.key || row.gotReference !== row.reference);
  return {
    pass: parts.length > 0 && !wrongCopy.length && !gridFailures.length && framed.length > 0 && !framedFailures.length,
    overview: {
      total: parts.length,
      rightOccurrence: parts.length - wrongCopy.length,
      rightPart: tally(parts, (row) => row.gotKey === row.key && row.gotReference === row.reference),
      wrongOccurrence: wrongCopy,
    },
    framed: { total: framed.length, right: framed.length - framedFailures.length, failures: framedFailures },
    grid: {
      total: grid.length,
      rightOccurrence: tally(grid, (row) => row.gotKey === row.key),
      board: tally(grid, (row) => row.kind === "board"),
      feature: tally(grid, (row) => row.kind === "feature"),
      failures: gridFailures,
    },
  };
};
