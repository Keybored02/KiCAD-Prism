// Frame-time capture while dragging a board with harness tubes (SB2-44).
//
// On a system's 3D tab: turn on Move, pick the board to drag, then paste this
// into the console and run
//   await captureHarnessDrag(document.querySelector('prism-semantic-viewer[mode="system"]'));
// Each frame previews the picked board 0.5 mm further along x (as a gizmo drag
// does), which re-solves the placement and rebuilds every tube; nothing is saved
// (the preview is cancelled at the end).
window.captureHarnessDrag = async function captureHarnessDrag(element, options = {}) {
  const { settleMs = 2000, dragMs = 4000, stepMm = 0.5 } = options;
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const nextFrame = () => new Promise((resolve) => requestAnimationFrame(resolve));
  const target = element.getMoveState?.()?.target;
  if (!target) throw new Error("Turn on Move and pick a board first");
  await sleep(settleMs);
  const start = target.pose;
  const intervals = [];
  let last = await nextFrame();
  const began = last;
  let step = 0;
  while (last - began < dragMs) {
    step += 1;
    element.previewPose({ translationMm: [start.translationMm[0] + step * stepMm, start.translationMm[1], start.translationMm[2]], rotation: start.rotation });
    const now = await nextFrame();
    intervals.push(now - last);
    last = now;
  }
  const stats = element.getStats();
  element.cancelMove();
  const sorted = [...intervals].sort((a, b) => a - b);
  const at = (q) => sorted[Math.min(sorted.length - 1, Math.floor((sorted.length - 1) * q))];
  const mean = intervals.reduce((sum, value) => sum + value, 0) / intervals.length;
  return {
    target: target.displayPath,
    frames: intervals.length,
    meanMs: +mean.toFixed(2),
    p50Ms: +at(0.5).toFixed(2),
    p95Ms: +at(0.95).toFixed(2),
    maxMs: +sorted[sorted.length - 1].toFixed(2),
    fps: +(1000 / mean).toFixed(1),
    cpuP95Ms: +stats.frameCpuP95Ms.toFixed(2),
    triangles: stats.triangles,
    draws: stats.draws,
  };
};
