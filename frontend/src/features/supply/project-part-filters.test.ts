import { describe, expect, it } from "vitest";

import type { ProjectSupplyPart } from "@/types/supply";
import { limitingKeys, matchesChip } from "./project-part-filters";

const line = (key: string, stock: number | null, need: number | null, part_id: string | null = `p-${key}`) => ({ key, part_id, stock, need } as ProjectSupplyPart);

describe("the lines limiting a build", () => {
  it("are the ones whose stock covers the fewest boards, ties included", () => {
    const parts = [line("a", 500, 100), line("b", 50, 100), line("c", 25, 50), line("d", 9000, 10)];
    expect([...limitingKeys(parts)].sort()).toEqual(["b", "c"]);
    expect(matchesChip(parts[1], "limiting", limitingKeys(parts))).toBe(true);
    expect(matchesChip(parts[0], "limiting", limitingKeys(parts))).toBe(false);
  });

  it("leave out lines with no stock figure, no need or no part, and are none when nothing is known", () => {
    expect([...limitingKeys([line("a", null, 10), line("b", 5, null), line("c", 1, 10, null)])]).toEqual([]);
  });
});
