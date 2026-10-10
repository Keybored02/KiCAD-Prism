/**
 * SB2-38: mated stacks in the System 3D tab (CONTRACTS_P2 §14.9, §20.13).
 *
 * A stack is the members of the root system joined by driving mates: the root
 * and everything placed from it. Moving a member "with its stack" moves the
 * whole stack rigidly, which the server can only store as poses for the root
 * and for members whose mated position is already overridden; the others
 * follow through their mates.
 */

import type { SystemScene, SystemSceneOccurrence } from "@/types/system";

import { inverse } from "./placement/mate";
import { type Pose, compose } from "./placement/poses";

export interface Stack {
  root: SystemSceneOccurrence;
  members: SystemSceneOccurrence[];
}

const poseOf = (occurrence: { pose: { translationMm: number[]; rotation: number[] } }): Pose => ({
  translationMm: [...occurrence.pose.translationMm] as Pose["translationMm"],
  rotation: [...occurrence.pose.rotation] as Pose["rotation"],
});

/** The stack a root-level occurrence belongs to, or null when it is mated to nothing. */
export function stackOf(scene: SystemScene, path: string): Stack | null {
  const top = scene.occurrences.filter((o) => o.parentPath === null);
  const byPath = new Map(top.map((o) => [o.path, o]));
  const rootOf = (occurrence: SystemSceneOccurrence): SystemSceneOccurrence => {
    let current = occurrence;
    for (let hops = 0; current.mate && hops < top.length; hops += 1) {
      const parent = byPath.get(current.mate.from);
      if (!parent) break;
      current = parent;
    }
    return current;
  };
  const target = byPath.get(path);
  if (!target) return null;
  const root = rootOf(target);
  const members = top.filter((o) => rootOf(o).path === root.path);
  return members.length > 1 ? { root, members } : null;
}

/** The pose changes that move `path`'s whole stack so that `path` lands on `pose`. */
export function stackMove(scene: SystemScene, path: string, pose: Pose): { instanceId: string; translationMm: number[]; rotation: number[] }[] {
  const stack = stackOf(scene, path);
  const target = scene.occurrences.find((o) => o.path === path);
  if (!stack || !target) return [];
  // The rigid move that takes the target from where it is to `pose`, applied on the left.
  const delta = compose(pose, inverse(poseOf(target)));
  // Only the root and hand-placed members are stored; the others follow through their mates.
  return stack.members.flatMap((member) => {
    if (member.path !== stack.root.path && !member.mate?.overridden) return [];
    const moved = member.path === path ? pose : compose(delta, poseOf(member));
    return [{ instanceId: member.instanceId, translationMm: moved.translationMm, rotation: moved.rotation }];
  });
}

/** What a stack move overwrote, to put it back: stored poses re-stored, the rest cleared. */
export function stackUndo(scene: SystemScene, changed: readonly { instanceId: string }[]) {
  const poses: { instanceId: string; translationMm: number[]; rotation: number[] }[] = [];
  const clear: string[] = [];
  for (const { instanceId } of changed) {
    const before = scene.occurrences.find((o) => o.instanceId === instanceId && o.parentPath === null);
    if (before && before.pose.source === "manual") {
      poses.push({ instanceId, translationMm: [...before.pose.translationMm], rotation: [...before.pose.rotation] });
    } else {
      clear.push(instanceId);
    }
  }
  return { poses, clear };
}
