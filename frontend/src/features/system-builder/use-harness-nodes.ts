import { useEffect, useRef, useState } from "react";

import { setHarnessNodes } from "@/lib/systems-api";
import type { PrismSemanticViewerElement, PrismSystemSceneHarnessState } from "@/types/prism-semantic-viewer";
import type { HarnessNodeInput, SystemScene } from "@/types/system";

import {
  AUTO, addBreakout, addWaypoint, alongSamples, moveNode, nodeInputs, removeNode, setPinned, storeAuto,
} from "./harness-node-edits";
import { useSystemMutation } from "./use-system-mutation";

type Vec3 = [number, number, number];

/**
 * SB2-45b: the picked harness in the System 3D tab and edits to its breakouts
 * and waypoints. The viewer previews a dragged node; a released drag ("commit")
 * or the panel's buttons save the harness's whole node list with If-Match, and
 * a failed save puts the node back.
 */
export function useHarnessNodes(
  viewer: PrismSemanticViewerElement | null,
  { systemId, etag, reload, scene }: { systemId: string; etag: string; reload: () => Promise<void>; scene: SystemScene | null },
) {
  const [state, setState] = useState<PrismSystemSceneHarnessState | null>(null);
  const { busy, run } = useSystemMutation(reload);
  // A node to give the gizmo once the re-read scene reaches the viewer (it does not exist there before).
  const pendingTarget = useRef<string | null | undefined>(undefined);

  /** The stored nodes of the picked root-level harness, as the save takes them. */
  const stored = (): HarnessNodeInput[] | null => {
    const id = state?.harness?.id;
    const harness = id && !state?.harness?.level ? scene?.harnesses?.find((h) => h.id === id && !h.level) : null;
    return harness ? nodeInputs(harness.nodes ?? []) : null;
  };

  /** Save a node list; then give the gizmo to `target` (a node just added or stored). */
  const save = async (nodes: HarnessNodeInput[], success?: string, target?: string | null) => {
    const id = state?.harness?.id;
    if (!id) return false;
    pendingTarget.current = target;
    const done = await run("nodes", () => setHarnessNodes(systemId, etag, id, nodes), success);
    if (!done) {
      pendingTarget.current = undefined;
      viewer?.cancelHarnessNode?.();
    }
    return Boolean(done);
  };

  /** A segment end that is the automatic breakout is stored first, so the edit can name it. */
  const withSegment = (nodes: HarnessNodeInput[]) => {
    const segment = state?.segment;
    if (!segment) return null;
    let [from, to] = [segment.from, segment.to];
    let list = nodes;
    if ((from === AUTO || to === AUTO) && state?.autoMm) {
      const stored = storeAuto(list, state.autoMm);
      list = stored.nodes;
      [from, to] = [from === AUTO ? stored.id : from, to === AUTO ? stored.id : to];
    }
    return { nodes: list, from, to, along: alongSamples(segment.samplesMm) };
  };

  // The viewer's commit and delete go through the latest closure.
  const onEvent = async (next: PrismSystemSceneHarnessState) => {
    const nodes = stored();
    const node = next.node;
    if (!nodes || !node) return;
    if (next.phase === "commit") {
      if (node.auto) {
        const added = storeAuto(nodes, node.positionMm);
        await save(added.nodes, undefined, added.id);
      } else await save(moveNode(nodes, node.id, node.positionMm));
    } else if (next.phase === "delete" && !node.auto) {
      await save(removeNode(nodes, node.id), node.kind === "breakout" ? "Breakout removed" : "Waypoint removed", null);
    }
  };
  const eventRef = useRef(onEvent);
  useEffect(() => {
    eventRef.current = onEvent;
  });

  useEffect(() => {
    if (!viewer) return;
    const listener = (event: Event) => {
      const next = (event as CustomEvent<PrismSystemSceneHarnessState>).detail;
      setState(next.harness ? next : null);
      if (next.phase === "commit" || next.phase === "delete") void eventRef.current(next);
      if (next.phase === "sync" && pendingTarget.current !== undefined) {
        const target = pendingTarget.current;
        pendingTarget.current = undefined;
        viewer.targetHarnessNode?.(target);
      }
    };
    viewer.addEventListener("prism-semantic-viewer:harness", listener);
    return () => viewer.removeEventListener("prism-semantic-viewer:harness", listener);
  }, [viewer]);

  const nodes = stored();
  return {
    state,
    busy: busy !== null,
    /** How many breakouts and waypoints the picked harness stores. */
    counts: {
      breakouts: nodes?.filter((n) => n.kind === "breakout").length ?? 0,
      waypoints: nodes?.filter((n) => n.kind === "waypoint").length ?? 0,
    },
    /** A waypoint where the tube was picked, in order along its segment. */
    addWaypoint: async () => {
      const base = stored();
      const at = state?.pointMm;
      const split = base && at ? withSegment(base) : null;
      if (!split || !at) return;
      const added = addWaypoint(split.nodes, split.from, split.to, at as Vec3, split.along);
      await save(added.nodes, "Waypoint added", added.id);
    },
    /** A breakout where the tube was picked, at the end of the chain. */
    addBreakout: async () => {
      const base = stored();
      const at = state?.pointMm;
      if (!base || !at) return;
      const added = addBreakout(base, at as Vec3);
      await save(added.nodes, "Breakout added", added.id);
    },
    setPinned: async (pinned: boolean) => {
      const base = stored();
      const node = state?.node;
      if (base && node && !node.auto) await save(setPinned(base, node.id, pinned));
    },
    remove: async () => {
      const base = stored();
      const node = state?.node;
      if (base && node && !node.auto) await save(removeNode(base, node.id), undefined, null);
    },
  };
}
