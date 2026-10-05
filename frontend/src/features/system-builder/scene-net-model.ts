import type {
  PrismSystemSceneEmphasisResult,
  PrismSystemSceneEmphasisSet,
} from "@/types/prism-semantic-viewer";
import type { SystemNetDetail } from "@/types/system";

/** The viewer's palette has eight colours; more nets at once would repeat them. */
export const MAX_HIGHLIGHTED_NETS = 8;

/** What the 3D view lights for the highlighted nets: every member on a board we can see. */
export function emphasisSets(nets: readonly SystemNetDetail[]): PrismSystemSceneEmphasisSet[] {
  return nets.map((net) => ({
    key: net.groupId,
    members: net.members.flatMap((member) => (member.occurrence && member.net ? [{ occurrence: member.occurrence, net: member.net }] : [])),
  }));
}

/** The boards a net reaches (occurrence path and name), in member order, and how many members are restricted. */
export function netBoards(net: SystemNetDetail): { boards: { occurrence: string; name: string }[]; restricted: number } {
  const boards = new Map<string, string>();
  let restricted = 0;
  for (const member of net.members) {
    if (member.redacted || !member.occurrence) {
      restricted += 1;
      continue;
    }
    if (!boards.has(member.occurrence)) boards.set(member.occurrence, member.displayPath || member.occurrence);
  }
  return { boards: [...boards].map(([occurrence, name]) => ({ occurrence, name })), restricted };
}

const REASONS: Record<PrismSystemSceneEmphasisResult["unresolved"][number]["reason"], string> = {
  loading: "still loading",
  restricted: "restricted",
  "not-drawn": "not in the 3D view",
  "unknown-net": "net not in its 3D model",
};

/**
 * Why some of a net's boards don't light, one phrase per reason, naming the
 * boards: "OBC-2 still loading; CMBD net not in its 3D model". Empty when all lit.
 */
export function unlitSummary(net: SystemNetDetail, result: PrismSystemSceneEmphasisResult | undefined): string {
  if (!result || result.unresolved.length === 0) return "";
  const names = new Map(net.members.map((member) => [member.occurrence, member.displayPath || member.occurrence]));
  const byReason = new Map<string, Set<string>>();
  for (const item of result.unresolved) {
    const list = byReason.get(item.reason) ?? new Set<string>();
    list.add(names.get(item.occurrence) || item.occurrence);
    byReason.set(item.reason, list);
  }
  return [...byReason].map(([reason, boards]) => `${[...boards].join(", ")} ${REASONS[reason as keyof typeof REASONS] ?? reason}`).join("; ");
}
