import { searchDesignEntities, type DesignSearchHit } from "@/lib/design-search";
import type { PrismSemanticIndex } from "@/types/prism-selection";
import type { SystemNetListed } from "@/types/system";

import { boardNetKey, type SystemNetIndex } from "./use-system-net-index";

/** One placed board the System 3D tab can search: its placement path, name and design index. */
export interface SearchableBoard {
  occurrence: string;
  name: string;
  index: PrismSemanticIndex;
}

/** A search hit in the System 3D tab: a board's part or net, or a system net (SB2-33). */
export interface SceneSearchHit extends DesignSearchHit {
  /** For a net: the board net to select, which traces its system net (SB2-32). */
  target?: { occurrence: string; net: string };
  /** The system net the hit stands for: one hit across every board it reaches. */
  systemNet?: SystemNetListed;
}

const PER_BOARD = 10;
const LIMIT = 40;
// Placement paths never contain it, so a hit id splits back into placement and board hit.
const SEPARATOR = "|";
const NO_NETS: SystemNetIndex = new Map();

/**
 * SB2-31e.2 / SB2-33: the 3D tab's design search over every placed board, or
 * one (`board`). Parts are the board's own, named with the board. A net that
 * crosses boards is one result for its system net, found by any of its names
 * (the header search's ranking over names and aliases); a net that stays on
 * its board is that board's. Components first, then nets, best first.
 */
export function searchBoards(
  boards: readonly SearchableBoard[],
  query: string,
  { board = null, systemNets = NO_NETS }: { board?: string | null; systemNets?: SystemNetIndex } = {},
): SceneSearchHit[] {
  if (!query.trim()) return [];
  const scoped = board ? boards.filter((item) => item.occurrence === board) : boards;
  const names = new Map(boards.map((item) => [item.occurrence, item.name]));
  const hits: SceneSearchHit[] = [];
  const bySystemNet = new Map<string, SceneSearchHit>();
  const keepSystemNet = (hit: SceneSearchHit) => {
    const seen = bySystemNet.get(hit.systemNet!.groupId);
    if (!seen || hit.score > seen.score) bySystemNet.set(hit.systemNet!.groupId, hit);
  };

  for (const item of scoped) {
    for (const hit of searchDesignEntities(item.index, query, { limit: PER_BOARD })) {
      const id = `${item.occurrence}${SEPARATOR}${hit.id}`;
      const target = hit.kind === "net" && hit.net ? { occurrence: item.occurrence, net: hit.net.name } : undefined;
      const group = target ? systemNets.get(boardNetKey(target.occurrence, target.net)) : undefined;
      if (group) keepSystemNet({ ...hit, id, target, systemNet: group, subtitle: reach(group, names) });
      else hits.push({ ...hit, id, target, subtitle: [item.name, hit.subtitle].filter(Boolean).join(" · ") });
    }
  }
  // A system net also matches by the names it has on other boards.
  for (const hit of searchSystemNets(systemNets, query, board, names)) keepSystemNet(hit);

  return [...hits, ...bySystemNet.values()]
    .sort((a, b) => Number(a.kind === "net") - Number(b.kind === "net") || b.score - a.score)
    .slice(0, LIMIT);
}

/** The system nets (on `board`, or all) whose name or an alias matches, ranked as the header search ranks nets. */
function searchSystemNets(
  systemNets: SystemNetIndex,
  query: string,
  board: string | null,
  names: ReadonlyMap<string, string>,
): SceneSearchHit[] {
  const groups = new Map<string, SystemNetListed>();
  for (const group of systemNets.values()) {
    const members = (group.members ?? []).filter((member) => names.has(member.occurrence));
    if (members.length && (!board || members.some((member) => member.occurrence === board))) groups.set(group.groupId, group);
  }
  if (!groups.size) return [];
  const index: PrismSemanticIndex = {
    schema: "prism.semantic_index_a0",
    sourceRevisionKey: "system-nets",
    components: [],
    nets: [...groups.values()].map((group) => ({ netUid: group.groupId, name: group.name, aliases: group.aliases })),
    terminals: [],
    indexes: {} as PrismSemanticIndex["indexes"],
  };
  return searchDesignEntities(index, query, { limit: LIMIT }).flatMap((hit) => {
    const group = hit.net ? groups.get(hit.net.netUid) : undefined;
    if (!group) return [];
    const members = (group.members ?? []).filter((member) => names.has(member.occurrence));
    const member = members.find((item) => item.occurrence === board) ?? members[0];
    return [{ ...hit, id: `${member.occurrence}${SEPARATOR}system:${group.groupId}`, target: member, systemNet: group, subtitle: reach(group, names) }];
  });
}

/** "System net · OBC-1, CMBD": the drawn boards a system net reaches. */
function reach(group: SystemNetListed, names: ReadonlyMap<string, string>): string {
  const boards = [...new Set((group.members ?? []).flatMap((member) => names.get(member.occurrence) ?? []))];
  return `System net · ${boards.join(", ")}`;
}

/** The placement a hit from `searchBoards` belongs to. */
export function hitOccurrence(hit: DesignSearchHit): string {
  return hit.id.slice(0, hit.id.indexOf(SEPARATOR));
}
