// Frame-time capture for SB2-25 / SB2-30, through the <prism-semantic-viewer>
// element API: on a system's 3D view (mode="system"), let the scene settle,
// then orbit the camera for a few seconds with synthetic drags and record
// every requestAnimationFrame interval.
//
// Paste into the console of a system's 3D tab (e.g. the Perf-25 system), then:
//   await captureFrameTimes(document.querySelector('prism-semantic-viewer[mode="system"]'));
// `lod` forces a level of detail (0 full, 1 board, 2 box); omit it for automatic.
window.captureFrameTimes = async function captureFrameTimes(element, options = {}) {
  const { lod = null, settleMs = 3000, orbitMs = 4000, stepPx = 3 } = options;
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const nextFrame = () => new Promise((resolve) => requestAnimationFrame(resolve));
  element.frameAll?.();
  element.setLodOverride(lod);
  await sleep(settleMs);

  const canvas = element.shadowRoot.getElementById("viewport");
  const rect = canvas.getBoundingClientRect();
  let x = rect.left + rect.width / 2;
  const y = rect.top + rect.height / 2;
  const fire = (type) => canvas.dispatchEvent(new PointerEvent(type, { clientX: x, clientY: y, pointerId: 1, button: 0, buttons: type === "pointerup" ? 0 : 1, bubbles: true }));
  fire("pointerdown");
  const intervals = [];
  let last = await nextFrame();
  const started = last;
  let lodSamples = [];
  while (last - started < orbitMs) {
    x += stepPx;
    fire("pointermove");
    const now = await nextFrame();
    intervals.push(now - last);
    last = now;
    if (intervals.length % 30 === 0) lodSamples.push(element.getStats()?.lod);
  }
  // Release away from the start so the viewer does not treat it as a click.
  fire("pointerup");
  const stats = element.getStats();
  element.setLodOverride(null);
  const sorted = [...intervals].sort((a, b) => a - b);
  const at = (q) => sorted[Math.min(sorted.length - 1, Math.floor((sorted.length - 1) * q))];
  const mean = intervals.reduce((sum, value) => sum + value, 0) / intervals.length;
  return {
    boards: stats.occurrences,
    lod: lod == null ? "auto" : ["full", "board", "box"][lod],
    canvas: [canvas.width, canvas.height],
    frames: intervals.length,
    meanMs: +mean.toFixed(2),
    p50Ms: +at(0.5).toFixed(2),
    p95Ms: +at(0.95).toFixed(2),
    maxMs: +sorted[sorted.length - 1].toFixed(2),
    fps: +(1000 / mean).toFixed(1),
    cpuP95Ms: +stats.frameCpuP95Ms.toFixed(2),
    triangles: stats.triangles,
    draws: stats.draws,
    gpuMemoryMB: +(stats.gpuMemoryBytes / 1048576).toFixed(1),
    detail: stats.lod,
    detailDuringOrbit: lodSamples,
  };
};
