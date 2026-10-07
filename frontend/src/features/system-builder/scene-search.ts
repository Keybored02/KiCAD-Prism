import { searchDesignEntities, type DesignSearchHit } from "@/lib/design-search";
import type { PrismSemanticIndex } from "@/types/prism-selection";

/** One placed board the System 3D tab can search: its placement path, name and design index. */
export interface SearchableBoard {
  occurrence: string;
  name: string;
  index: PrismSemanticIndex;
}

const PER_BOARD = 10;
const LIMIT = 40;
// Placement paths never contain it, so a hit id splits back into placement and board hit.
const SEPARATOR = "|";

/**
 * SB2-31e.2: the 3D tab's design search over every placed board. Each hit is
 * the board's own (component or net), named with its board, so OBC-1's U7 and
 * OBC-2's U7 are two hits. Components first, then nets, best first.
 */
export function searchBoards(boards: readonly SearchableBoard[], query: string): DesignSearchHit[] {
  if (!query.trim()) return [];
  const hits = boards.flatMap((board) =>
    searchDesignEntities(board.index, query, { limit: PER_BOARD }).map((hit) => ({
      ...hit,
      id: `${board.occurrence}${SEPARATOR}${hit.id}`,
      subtitle: [board.name, hit.subtitle].filter(Boolean).join(" · "),
    })));
  return hits
    .sort((a, b) => Number(a.kind === "net") - Number(b.kind === "net") || b.score - a.score)
    .slice(0, LIMIT);
}

/** The placement a hit from `searchBoards` belongs to. */
export function hitOccurrence(hit: DesignSearchHit): string {
  return hit.id.slice(0, hit.id.indexOf(SEPARATOR));
}
