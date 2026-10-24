import { describe, expect, it } from "vitest";

import type { ProjectSupplyPart } from "@/types/supply";
import { limitingKeys, linesByPart, matchesChip } from "./project-part-filters";

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

  it("judge a part on two lines by what both lines need", () => {
    // 60 in stock covers each of its lines (40 and 40) but not both (80): it limits the build, not the part with 70 for 50.
    const parts = [line("x1", 60, 40, "x"), line("x2", 60, 40, "x"), line("y", 70, 50)];
    expect([...limitingKeys(parts)].sort()).toEqual(["x1", "x2"]);
  });
});

describe("a project's lines by part", () => {
  it("add the pieces, needs, notes and references of a part on two lines and keep the cost of the line that carries it", () => {
    const first = { ...line("x1", 60, 40, "x"), quantity: 2, notes: 1, references: "R1 R2", line_cost: "4.00" };
    const second = { ...line("x2", 60, 20, "x"), quantity: 1, notes: 0, references: "R9", line_cost: null };
    const merged = linesByPart([second, first]).get("x");
    expect([merged?.quantity, merged?.need, merged?.notes, merged?.references, merged?.line_cost]).toEqual([3, 60, 1, "R9 R1 R2", "4.00"]);
  });
});
