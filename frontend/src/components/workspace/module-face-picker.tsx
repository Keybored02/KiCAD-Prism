import { useEffect, useLayoutEffect, useMemo, useRef } from "react";

import type { Vec3 } from "@/features/system-builder/placement/frames";
import type { ModulePlacement } from "@/features/system-builder/placement/module-ports";
import {
  MODULE_PATH, type SceneConnector, type SceneModel, connectorPath, moduleScene, placementFromPose,
} from "@/features/system-builder/placement/module-scene";
import type { PrismSemanticViewerElement, PrismSystemSceneMoveState } from "@/types/prism-semantic-viewer";

export type PickerModel = SceneModel;
export type PickerConnector = SceneConnector;

/** Snap a normal within about 1° of a module axis onto it, so axis-aligned faces store exact normals. */
export function snapNormal(normal: readonly number[]): Vec3 {
  const length = Math.hypot(normal[0], normal[1], normal[2]);
  const n = normal.map((c) => c / length);
  for (let axis = 0; axis < 3; axis += 1) {
    if (Math.abs(n[axis]) > 0.99985) return [0, 1, 2].map((i) => (i === axis ? Math.sign(n[axis]) : 0)) as Vec3;
  }
  return n.map((c) => Math.round(c * 1e4) / 1e4 + 0) as Vec3;
}

/**
 * A hit on a surface turned well away from the viewer (the wall or floor of a connector's opening)
 * means the face toward the viewer: the module axis closest to the camera direction. Connectors sit in
 * recesses, and their inner walls are not the face anyone means.
 */
export function facingNormal(normal: readonly number[], toCamera: readonly number[]): Vec3 {
  if (normal[0] * toCamera[0] + normal[1] * toCamera[1] + normal[2] * toCamera[2] >= 0.5) return [...normal] as Vec3;
  const along = toCamera.map(Math.abs);
  const axis = along.indexOf(Math.max(...along));
  return [0, 1, 2].map((i) => (i === axis ? Math.sign(toCamera[axis]) : 0)) as Vec3;
}

const round = (value: number) => Math.round(value * 100) / 100 + 0;

/** Camera presets: look square at a face of the module. */
const VIEWS: readonly { label: string; axis: "x" | "y" | "z"; opposite: boolean }[] = [
  { label: "Top", axis: "z", opposite: false }, { label: "Bottom", axis: "z", opposite: true },
  { label: "+X", axis: "x", opposite: false }, { label: "−X", axis: "x", opposite: true },
  { label: "+Y", axis: "y", opposite: false }, { label: "−Y", axis: "y", opposite: true },
];

/**
 * SB2-48b (D-P2-40): place a connector part on a module's model, in the system viewer. Click a face to
 * put the connector there; then the move gizmo of a board's move mode slides it along that face (Shift
 * for 0.1 mm) and its ring turns it a quarter at a time. The module's other connectors are grey.
 */
export function ModuleFacePicker({ module, active, others, onPlace, onMoved, onTurn }: {
  module: PickerModel;
  active: PickerConnector | null;
  others: PickerConnector[];
  /** A click on a face: the connector goes there. */
  onPlace: (originMm: Vec3, normal: Vec3) => void;
  /** The gizmo moved or turned the connector. */
  onMoved: (placement: ModulePlacement) => void;
  onTurn: (delta: 1 | -1) => void;
}) {
  const viewer = useRef<PrismSemanticViewerElement | null>(null);
  const callbacks = useRef({ onPlace, onMoved, onTurn, active });
  useLayoutEffect(() => {
    callbacks.current = { onPlace, onMoved, onTurn, active };
  }, [onPlace, onMoved, onTurn, active]);
  const scene = useMemo(() => moduleScene(module, active, others), [module, active, others]);
  const activeKey = active?.key ?? null;

  useEffect(() => {
    const element = viewer.current;
    if (!element) return;
    void customElements.whenDefined("prism-semantic-viewer").then(() => {
      element.setSystemScene?.(scene);
      element.setLabelsVisible?.(false);
      element.setHarnessesVisible?.(false);
      element.setMoveMode?.(true);
      if (activeKey) element.focusMoveTarget?.(connectorPath(activeKey));
    });
  }, [scene, activeKey]);

  useEffect(() => {
    const element = viewer.current;
    if (!element) return undefined;
    let down: { x: number; y: number } | null = null;
    const onDown = (event: PointerEvent) => {
      down = event.button === 0 ? { x: event.clientX, y: event.clientY } : null;
    };
    const onUp = async (event: PointerEvent) => {
      const start = down;
      down = null;
      // The gizmo stops its own presses, so a press that reached here and barely moved is a click.
      if (!start || Math.hypot(event.clientX - start.x, event.clientY - start.y) > 4) return;
      const over = await element.pickAt?.(event.clientX, event.clientY);
      if (typeof over?.occurrenceKey === "string" && over.occurrenceKey.startsWith("/connector-")) return;
      const hit = element.pickSurfaceAt?.(event.clientX, event.clientY);
      if (!hit || hit.occurrence !== MODULE_PATH) return;
      callbacks.current.onPlace(hit.pointMm.map(round) as Vec3, snapNormal(facingNormal(hit.normal, hit.toCamera)));
    };
    const onMove = (event: Event) => {
      const state = (event as CustomEvent<PrismSystemSceneMoveState>).detail;
      const current = callbacks.current.active;
      if (state.phase !== "commit" || !current || state.target?.occurrence !== connectorPath(current.key)) return;
      callbacks.current.onMoved(placementFromPose(state.target.pose, current.placement));
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "r" && event.key !== "R") return;
      event.preventDefault();
      callbacks.current.onTurn(event.shiftKey ? -1 : 1);
    };
    element.addEventListener("pointerdown", onDown);
    element.addEventListener("pointerup", onUp);
    element.addEventListener("prism-semantic-viewer:move", onMove);
    element.addEventListener("keydown", onKey);
    return () => {
      element.removeEventListener("pointerdown", onDown);
      element.removeEventListener("pointerup", onUp);
      element.removeEventListener("prism-semantic-viewer:move", onMove);
      element.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div className="relative h-full min-h-[420px] w-full overflow-hidden rounded-md border bg-muted/30">
      <prism-semantic-viewer ref={viewer} mode="system" hide-panel="true" active="true" move-allowed="true"
        style={{ position: "absolute", inset: 0 }} />
      <div className="absolute right-2 top-2 flex flex-wrap gap-1" role="group" aria-label="View from">
        {VIEWS.map((view) => (
          <button key={view.label} type="button" onClick={() => viewer.current?.viewAxis?.(view.axis, view.opposite)}
            className="rounded border bg-background/90 px-2 py-0.5 text-xs hover:bg-muted">{view.label}</button>
        ))}
      </div>
      <p className="pointer-events-none absolute bottom-2 left-2 rounded bg-background/80 px-2 py-1 text-xs text-muted-foreground">
        Click a face to place · drag the arrows to slide (Shift 0.1 mm) · the ring or R turns a quarter
      </p>
    </div>
  );
}
