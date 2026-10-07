import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { clearPose, resetPoses, setPose } from "@/lib/systems-api";
import type { PrismSemanticViewerElement, PrismSystemSceneMoveState } from "@/types/prism-semantic-viewer";

import { useSystemMutation } from "./use-system-mutation";

type MoveTarget = NonNullable<PrismSystemSceneMoveState["target"]>;
/** Where the target was when it was picked, and whether it has been saved elsewhere since. */
type Origin = { instanceId: string; pose: MoveTarget["pose"]; source: MoveTarget["source"]; moved: boolean };

/**
 * SB2-29 move mode for the System 3D tab, on the 3D tab's viewer since SB2-31f.
 * The viewer only previews; a released drag or Enter ("commit") stores the
 * target's pose with If-Match, and a failed save puts the board back.
 */
export function useMoveMode(
  viewer: PrismSemanticViewerElement | null,
  { systemId, etag, reload }: { systemId: string; etag: string; reload: () => Promise<void> },
) {
  const [move, setMove] = useState<PrismSystemSceneMoveState | null>(null);
  // Bumped whenever the view saves, cancels or changes target: the move panel starts over.
  const [epoch, setEpoch] = useState(0);
  const [confirmReset, setConfirmReset] = useState(false);
  const [origin, setOrigin] = useState<Origin | null>(null);
  const { busy, run } = useSystemMutation(reload);

  const markMoved = (instanceId: string) =>
    setOrigin((current) => (current?.instanceId === instanceId && !current.moved ? { ...current, moved: true } : current));

  /** Store the target's position (a released drag, Enter, or Save); on failure the view goes back. */
  const savePose = async (target: MoveTarget) => {
    const saved = await run("pose", () => setPose(systemId, etag, target.instanceId, target.pose));
    if (saved) markMoved(target.instanceId);
    else viewer?.cancelMove?.();
  };
  // The listener is added once per viewer; it reads the latest save through a ref.
  const saveRef = useRef(savePose);
  useEffect(() => {
    saveRef.current = savePose;
  });

  useEffect(() => {
    if (!viewer) return;
    const onMove = (event: Event) => {
      const state = (event as CustomEvent<PrismSystemSceneMoveState>).detail;
      setMove(state);
      const target = state.enabled ? state.target : null;
      setOrigin((current) => {
        if (!target) return null;
        if (current?.instanceId !== target.instanceId) {
          return { instanceId: target.instanceId, pose: target.pose, source: target.source, moved: false };
        }
        return current;
      });
      if (state.phase === "commit" && state.target) void saveRef.current(state.target);
      // Start the panel over when the view's state changed under it; a re-read during
      // typing ("sync" with an unsaved preview) keeps what is typed.
      if (state.phase !== "preview" && !(state.phase === "sync" && state.target?.unsaved)) setEpoch((count) => count + 1);
    };
    viewer.addEventListener("prism-semantic-viewer:move", onMove);
    return () => viewer.removeEventListener("prism-semantic-viewer:move", onMove);
  }, [viewer]);

  return {
    move,
    epoch,
    busy: busy !== null,
    /** The target was saved somewhere else since it was picked. */
    moved: Boolean(origin?.moved && origin.instanceId === move?.target?.instanceId),
    confirmReset,
    setConfirmReset,
    savePose,
    /** Drop an unsaved preview; after saved moves, store the pose the target had when it was picked. */
    revert: async () => {
      viewer?.cancelMove?.();
      const target = move?.target;
      if (!origin?.moved || !target || origin.instanceId !== target.instanceId) return;
      const done = origin.source === "default"
        ? await run("pose", () => clearPose(systemId, etag, origin.instanceId), `${target.displayPath} is back where it was`)
        : await run("pose", () => setPose(systemId, etag, origin.instanceId, origin.pose), `${target.displayPath} is back where it was`);
      if (done) setOrigin({ ...origin, moved: false });
    },
    backToDefault: async (target: MoveTarget) => {
      const done = await run("pose", () => clearPose(systemId, etag, target.instanceId), `${target.displayPath} is back in its default place`);
      if (done) markMoved(target.instanceId);
    },
    resetAll: async () => {
      const done = await run("pose", () => resetPoses(systemId, etag));
      setConfirmReset(false);
      if (done && origin) markMoved(origin.instanceId);
      if (done) toastReset(done.body.reset.length);
    },
  };
}

function toastReset(count: number) {
  toast.success(count === 0 ? "Every board was already in its default place"
    : `${count} ${count === 1 ? "board is" : "boards are"} back in the default layout`);
}
