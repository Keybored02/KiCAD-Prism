import type {
  PrismSystemSceneEmphasisResult,
  PrismSystemSceneEmphasisSet,
} from "@/types/prism-semantic-viewer";
import type { SystemNetDetail, SystemNetHop, SystemNetHopEnd } from "@/types/system";

/** The key and colour of a traced net (SB2-32): the 3D tab's own selection green. */
export const TRACE_KEY = "trace";
export const TRACE_COLOR = "#14ff33";

/** What the 3D view lights for a traced net: every member, in the selection green. */
export function traceSet(net: SystemNetDetail): PrismSystemSceneEmphasisSet {
  return { ...emphasisSets([net])[0], key: TRACE_KEY, color: TRACE_COLOR };
}

/**
 * A traced net's hops in the order the net travels from `origin` (the board
 * clicked): breadth first over boards, each hop turned to run away from the
 * boards already reached. Hops not reachable from it follow in server order.
 */
export function orderedHops(net: SystemNetDetail, origin: string | null): SystemNetHop[] {
  const left = [...net.hops];
  const ordered: SystemNetHop[] = [];
  const reached = new Set<string | null>(origin ? [origin] : []);
  const touches = (end: SystemNetHopEnd) => end.occurrence !== null && reached.has(end.occurrence);
  for (let progress = true; progress && left.length;) {
    progress = false;
    for (let index = 0; index < left.length;) {
      const hop = left[index];
      if (!touches(hop.from) && !touches(hop.to)) {
        index += 1;
        continue;
      }
      const turned = touches(hop.from) ? hop : { ...hop, from: hop.to, to: hop.from };
      ordered.push(turned);
      if (turned.to.occurrence) reached.add(turned.to.occurrence);
      left.splice(index, 1);
      progress = true;
    }
  }
  return [...ordered, ...left];
}

/** One end of a hop as the card shows it: "OBC-1 J3.12", or a harness end without a board. */
export function hopEndLabel(end: SystemNetHopEnd): string {
  const place = end.displayPath || (end.end ? `Harness end ${end.end}` : "Unmated end");
  const pin = end.reference ? `${end.reference}${end.pad ? `.${end.pad}` : ""}` : end.endPin ? `pin ${end.endPin}` : "";
  return [place, pin].filter(Boolean).join(" ");
}

/** What carries a hop: the link (or harness wire) and its signal. */
export function hopVia(hop: SystemNetHop): string {
  const via = hop.kind === "wire"
    ? [hop.harnessName || "Harness", hop.wireId ? `wire ${hop.wireId}` : ""].filter(Boolean).join(" ")
    : hop.linkName || "Link";
  return hop.signal ? `${via} · ${hop.signal}` : via;
}

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
