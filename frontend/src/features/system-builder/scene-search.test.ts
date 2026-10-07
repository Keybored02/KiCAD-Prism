import { describe, expect, it } from "vitest";

import type { PrismSemanticIndex } from "@/types/prism-selection";

import { hitOccurrence, searchBoards } from "./scene-search";

const index = (references: string[], nets: string[]): PrismSemanticIndex => ({
  schema: "prism.semantic_index_a0",
  sourceRevisionKey: "src",
  components: references.map((reference) => ({ componentUid: `c-${reference}`, reference, value: "10k" })),
  nets: nets.map((name, position) => ({ netUid: `n-${name}`, name, netCode: position + 1 })),
  terminals: [],
  indexes: {} as PrismSemanticIndex["indexes"],
});

describe("searchBoards", () => {
  const obc = index(["U7", "R1"], ["CAN0_N", "GND"]);
  const boards = [
    { occurrence: "/sin_obc1", name: "OBC-1", index: obc },
    { occurrence: "/sin_obc2", name: "OBC-2", index: obc },
    { occurrence: "/sin_cmbd", name: "CMBD", index: index(["U1"], ["CAN0_N"]) },
  ];

  it("finds a board's part on every placement of it, named with the board", () => {
    const hits = searchBoards(boards, "U7");
    expect(hits.map((hit) => [hitOccurrence(hit), hit.title])).toEqual([["/sin_obc1", "U7"], ["/sin_obc2", "U7"]]);
    expect(hits[0].subtitle.startsWith("OBC-1")).toBe(true);
  });

  it("lists parts before nets and keeps hit ids unique across boards", () => {
    const hits = searchBoards(boards, "CAN0");
    expect(hits.every((hit) => hit.kind === "net")).toBe(true);
    expect(new Set(hits.map((hit) => hit.id)).size).toBe(hits.length);
    expect(hits.map(hitOccurrence).sort()).toEqual(["/sin_cmbd", "/sin_obc1", "/sin_obc2"]);
    const mixed = searchBoards(boards, "U");
    const firstNet = mixed.findIndex((hit) => hit.kind === "net");
    expect(firstNet === -1 || mixed.slice(firstNet).every((hit) => hit.kind === "net")).toBe(true);
  });

  it("finds nothing for an empty query", () => {
    expect(searchBoards(boards, "  ")).toEqual([]);
  });
});
