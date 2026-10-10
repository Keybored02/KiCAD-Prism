// Placing a system scene's boards (System Builder SB2-27; the viewer since SB2-31f).
//
// The `prism.system_scene.a0` descriptor (CONTRACTS_P2 §20) places each board
// occurrence by a world matrix in millimetres; an asset (one bundle) draws at
// world · bundleToBoard, scaled to the renderer's metres. Occurrences without
// geometry (restricted, still building, missing, failed) draw as their box.

const MM = 0.001; // descriptor millimetres → renderer metres

// Stand-in boxes by why the board has no geometry.
export const STAND_INS = Object.freeze({
  restricted: { color: [0.55, 0.57, 0.6, 1], label: "Restricted" },
  loading: { color: [0.7, 0.76, 0.82, 1], label: "Loading…" },
  building: { color: [0.62, 0.72, 0.84, 1], label: "Building 3D view…" },
  missing: { color: [0.78, 0.76, 0.7, 1], label: "No 3D view" },
  failed: { color: [0.86, 0.6, 0.56, 1], label: "3D view failed" },
  unknown: { color: [0.78, 0.76, 0.7, 1], label: "" },
});

const SCALE_MM = Object.freeze([MM, 0, 0, 0, 0, MM, 0, 0, 0, 0, MM, 0, 0, 0, 0, 1]);

// Column-major product in double precision: placement composes in float64 and is
// narrowed to float32 once, when the occurrence buffer is written.
function mat4Multiply(a, b) {
  const output = new Array(16);
  for (let column = 0; column < 4; column += 1) {
    for (let row = 0; row < 4; row += 1) {
      output[column * 4 + row] = a[row] * b[column * 4] + a[4 + row] * b[column * 4 + 1]
        + a[8 + row] * b[column * 4 + 2] + a[12 + row] * b[column * 4 + 3];
    }
  }
  return output;
}

function translation([x, y, z]) {
  return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, x, y, z, 1];
}

function scaling([x, y, z]) {
  return [x, 0, 0, 0, 0, y, 0, 0, 0, 0, z, 0, 0, 0, 0, 1];
}

/** An asset occurrence's model matrix in renderer metres: S(1/1000) · world · bundleToBoard. */
export function assetOccurrenceMatrix(worldMatrix, bundleToBoard) {
  return mat4Multiply(SCALE_MM, mat4Multiply(worldMatrix, bundleToBoard));
}

/** A stand-in's matrix: the unit box mapped onto the occurrence's box (own frame, mm), then placed. */
export function standInMatrix(worldMatrix, boundsMm) {
  const min = boundsMm.minMm;
  const size = boundsMm.maxMm.map((value, index) => Math.max(value - min[index], 0.2));
  return mat4Multiply(SCALE_MM, mat4Multiply(worldMatrix, mat4Multiply(translation(min), scaling(size))));
}

/**
 * Why an occurrence draws as a stand-in, or null when its asset draws it.
 * `state` is the asset's load state here (waiting, loading, loaded, failed).
 */
export function standInKind(occurrence, asset, state) {
  if (occurrence.restricted) return "restricted";
  if (!occurrence.assetId || !asset) return "missing";
  if (state === "loaded") return null;
  if (state === "failed") return "failed";
  if (asset.status === "ready") return asset.bundleUrl && asset.bundleToBoard ? "loading" : "building";
  return STAND_INS[asset.status] ? asset.status : "unknown";
}

/** Whether an asset can be loaded: its bundle is final and placed in the board frame. */
export function assetLoadable(asset) {
  return Boolean(asset && asset.status === "ready" && asset.bundleUrl && asset.bundleToBoard);
}

/**
 * What a re-read scene means for a board already known by asset id (retro D5):
 * "create" (new, or its bundle URL changed, or it failed: start over), "load"
 * (kept waiting at a stable URL that is now ready: a staged bundle finished),
 * or "keep" (loading, loaded, or still not ready).
 */
export function boardTransition(known, asset) {
  if (!known || known.bundleUrl !== asset.bundleUrl || known.loadState === "failed") return "create";
  if (known.loadState === "waiting" && assetLoadable(asset)) return "load";
  return "keep";
}

/**
 * Occurrences to place: boards, restricted assemblies (one box for a hidden child system), and
 * occurrences that bring their own geometry: a catalog `model` or a coloured `box` (SB2-48b).
 */
export function drawnOccurrences(descriptor) {
  return (descriptor?.occurrences || []).filter((item) => item.kind === "board" || item.restricted || item.model || item.box);
}

/** A colour's stand-in renderer id: boxes of one colour share a renderer. */
export function boxRendererId(rgba) {
  return `box:${rgba.map((value) => Number(value).toFixed(3)).join(",")}`;
}

/**
 * Whether every board whose bundle is ready draws its own geometry, not a box
 * (and at least one does): when the system's first full frame is counted (SB2-30).
 */
export function allReadyBoardsDrawn(placed) {
  if (!placed.length) return false;
  let drawn = 0;
  for (const item of placed) {
    if (!item.standIn) drawn += 1;
    else if (item.standIn === "loading") return false;
  }
  return drawn > 0;
}
