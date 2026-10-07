/**
 * SB2-39: a live preview of a mated pair (CONTRACTS_P2 §14.5, §20.14).
 *
 * The browser runs the placement library on the link's two connectors with the
 * frames being picked, and draws the result as an isometric sketch: each
 * connector body, a slab of its board around the pads, and a dot on pad 1.
 */

import type { LinkMate, LinkMateEnd, MatingAxis } from "@/types/system";

import { type StoredFrame, footprintPoint } from "./placement/frames";
import { type MateEnd, type MateResult, bodyCorners, mate } from "./placement/mate";
import { type Pose, compose } from "./placement/poses";

export type Pick = { axis: MatingAxis; quarterTurns: number } | null;

type Point3 = [number, number, number];

export interface PreviewShape {
  side: "a" | "b";
  kind: "board" | "body";
  hull: [number, number][];
}

export interface Preview {
  shapes: PreviewShape[];
  padOne: { side: "a" | "b"; at: [number, number] }[];
  viewBox: [number, number, number, number];
  result: MateResult;
}

const SLAB_MARGIN_MM = 3;
const COS30 = Math.cos(Math.PI / 6);

/** The frame a preview end uses: the pick, else the stored frame, else the inference (null in `mate`). */
function end(data: LinkMateEnd, pick: Pick): MateEnd | null {
  if (!data.geometry) return null;
  const stored: StoredFrame | null = pick ?? (data.stored ? { axis: data.stored.axis, quarterTurns: data.stored.quarterTurns } : null);
  return { geometry: data.geometry, thicknessMm: data.thicknessMm, stored };
}

function slab(data: MateEnd): Point3[] {
  const local = data.geometry.pads.map((p) => footprintPoint(data.geometry, p.positionMm));
  const xs = local.map((p) => p[0]);
  const ys = local.map((p) => p[1]);
  const half = (data.thicknessMm ?? 0) / 2;
  // A board slab around the pads, as a body "below" the mounting surface.
  return bodyCorners(data.geometry, data.thicknessMm, {
    minMm: [Math.min(...xs) - SLAB_MARGIN_MM, Math.min(...ys) - SLAB_MARGIN_MM, -2 * half],
    maxMm: [Math.max(...xs) + SLAB_MARGIN_MM, Math.max(...ys) + SLAB_MARGIN_MM, 0],
  });
}

const apply = (pose: Pose, point: readonly number[]): Point3 =>
  compose(pose, { translationMm: [point[0], point[1], point[2]], rotation: [0, 0, 0, 1] }).translationMm as Point3;

/** Isometric: x to the right and down, y to the left and down, z up. */
const project = ([x, y, z]: readonly number[]): [number, number] => [(x - y) * COS30, (x + y) / 2 - z];

function hull(points: [number, number][]): [number, number][] {
  const sorted = [...points].sort((p, q) => p[0] - q[0] || p[1] - q[1]);
  const cross = (o: [number, number], a: [number, number], b: [number, number]) =>
    (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const build = (list: [number, number][]) => {
    const out: [number, number][] = [];
    for (const point of list) {
      while (out.length >= 2 && cross(out[out.length - 2], out[out.length - 1], point) <= 0) out.pop();
      out.push(point);
    }
    return out;
  };
  const lower = build(sorted);
  const upper = build([...sorted].reverse());
  return [...lower.slice(0, -1), ...upper.slice(0, -1)];
}

/** The sketch for a link and the frames being picked, or null when a frame is unknown. */
export function previewOf(data: LinkMate, picks: { a: Pick; b: Pick }): Preview | null {
  const a = end(data.a, picks.a);
  const b = end(data.b, picks.b);
  if (!a || !b) return null;
  const result = mate(a, b, data.stackHeightMm);
  if (!result) return null;
  const identity: Pose = { translationMm: [0, 0, 0], rotation: [0, 0, 0, 1] };
  const placed = (side: "a" | "b", points: readonly number[][]) =>
    points.map((p) => project(apply(side === "a" ? identity : result.pose, p)));
  const pad = (side: "a" | "b", data: MateEnd) => {
    const one = data.geometry.pads.find((p) => p.pad === "1") ?? data.geometry.pads.find((p) => /^[A-Z]*0*1$/i.test(p.pad));
    if (!one) return [];
    const half = (data.thicknessMm ?? 0) / 2;
    const z = data.geometry.side === "top" ? half : -half;
    return [{ side, at: placed(side, [[one.positionMm[0], one.positionMm[1], z]])[0] }];
  };
  const shapes: PreviewShape[] = [
    { side: "a", kind: "board", hull: hull(placed("a", slab(a))) },
    { side: "a", kind: "body", hull: hull(placed("a", bodyCorners(a.geometry, a.thicknessMm))) },
    { side: "b", kind: "body", hull: hull(placed("b", bodyCorners(b.geometry, b.thicknessMm))) },
    { side: "b", kind: "board", hull: hull(placed("b", slab(b))) },
  ];
  const all = shapes.flatMap((shape) => shape.hull);
  const xs = all.map((p) => p[0]);
  const ys = all.map((p) => p[1]);
  const pad8 = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)) * 0.06;
  return {
    shapes,
    padOne: [...pad("a", a), ...pad("b", b)],
    viewBox: [Math.min(...xs) - pad8, Math.min(...ys) - pad8, Math.max(...xs) - Math.min(...xs) + 2 * pad8,
      Math.max(...ys) - Math.min(...ys) + 2 * pad8],
    result,
  };
}

const FILL = { a: "var(--color-sky-500, #0ea5e9)", b: "var(--color-amber-500, #f59e0b)" };

export function MatePreview({ data, picks, labels }: { data: LinkMate; picks: { a: Pick; b: Pick }; labels: { a: string; b: string } }) {
  const preview = previewOf(data, picks);
  if (!preview) {
    return <p className="text-xs text-muted-foreground">Pick a frame for both connectors to preview the pair.</p>;
  }
  const { result } = preview;
  const unit = preview.viewBox[2] / 300;
  const dotRadius = Math.max(preview.viewBox[2], preview.viewBox[3]) * 0.025;
  return (
    <figure className="space-y-1" aria-label="Mated pair preview">
      <svg viewBox={preview.viewBox.join(" ")} className="h-44 w-full rounded-md border bg-muted/30" role="img"
        aria-label={`${labels.a} mated with ${labels.b}`}>
        {preview.shapes.map((shape) => (
          <polygon key={`${shape.side}-${shape.kind}`} points={shape.hull.map((p) => p.join(",")).join(" ")}
            fill={FILL[shape.side]} fillOpacity={shape.kind === "board" ? 0.18 : 0.45}
            stroke={FILL[shape.side]} strokeWidth={unit} />
        ))}
        {preview.padOne.map((dot) => (
          <circle key={dot.side} cx={dot.at[0]} cy={dot.at[1]} r={dotRadius} fill="var(--color-red-500, #ef4444)"
            stroke="white" strokeWidth={unit * 1.5} />
        ))}
      </svg>
      <figcaption className="text-xs text-muted-foreground">
        <span style={{ color: FILL.a }}>■</span> {labels.a} · <span style={{ color: FILL.b }}>■</span> {labels.b} ·
        {" "}red dots: pad 1 · {result.heightSource === "link"
          ? `stack height ${result.stackHeightMm} mm`
          : `no stack height: drawn ${result.stackHeightMm} mm apart (bodies clear plus 5 mm)`}
        {result.quarterTurns ? ` · turned ${result.quarterTurns * 90}° to put pad 1 on pad 1` : ""}
      </figcaption>
    </figure>
  );
}
