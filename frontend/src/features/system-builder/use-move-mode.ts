import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { clearPose, resetPoses, setPose } from "@/lib/systems-api";
import type { PrismSemanticViewerElement, PrismSystemSceneMoveState } from "@/types/prism-semantic-viewer";

import { useSystemMutation } from "./use-system-mutation";

type MoveTarget = NonNullable<PrismSystemSceneMoveState["target"]>;

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
  const { busy, run } = useSystemMutation(reload);

  /** Store the target's position (a released drag, Enter, or Save); on failure the view goes back. */
  const savePose = async (target: MoveTarget) => {
    const saved = await run("pose", () => setPose(systemId, etag, target.instanceId, target.pose));
    if (!saved) viewer?.cancelMove?.();
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
    confirmReset,
    setConfirmReset,
    savePose,
    backToDefault: async (target: MoveTarget) => {
      await run("pose", () => clearPose(systemId, etag, target.instanceId), `${target.displayPath} is back in its default place`);
    },
    resetAll: async () => {
      const done = await run("pose", () => resetPoses(systemId, etag));
      setConfirmReset(false);
      if (done) toastReset(done.body.reset.length);
    },
  };
}

function toastReset(count: number) {
  toast.success(count === 0 ? "Every board was already in its default place"
    : `${count} ${count === 1 ? "board is" : "boards are"} back in the default layout`);
}
