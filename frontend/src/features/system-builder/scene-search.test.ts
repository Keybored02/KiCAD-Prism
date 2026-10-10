import { describe, expect, it } from "vitest";

import type { PrismSemanticIndex } from "@/types/prism-selection";

import { hitOccurrence, searchBoards } from "./scene-search";
import { indexSystemNets } from "./use-system-net-index";

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

  // CAN0_N crosses all three boards; OBC-1's PK_06 is CMBD's OBC1_RWL_RX.
  const systemNets = indexSystemNets([
    { groupId: "g_can", name: "CAN0_N", aliases: ["CAN0_N"], pinCount: 4, large: false, members: [
      { occurrence: "/sin_obc1", net: "CAN0_N" }, { occurrence: "/sin_obc2", net: "CAN0_N" }, { occurrence: "/sin_cmbd", net: "CAN0_N" },
    ] },
    { groupId: "g_rx", name: "OBC1_RWL_RX", aliases: ["OBC1_RWL_RX", "PK_06"], pinCount: 2, large: false, members: [
      { occurrence: "/sin_obc1", net: "PK_06" }, { occurrence: "/sin_cmbd", net: "OBC1_RWL_RX" },
    ] },
  ]);
  const withRx = [
    { occurrence: "/sin_obc1", name: "OBC-1", index: index(["U7"], ["CAN0_N", "GND", "PK_06"]) },
    boards[1],
    { occurrence: "/sin_cmbd", name: "CMBD", index: index(["U1"], ["CAN0_N", "OBC1_RWL_RX"]) },
  ];

  it("shows a net crossing boards once, as its system net (SB2-33)", () => {
    const hits = searchBoards(withRx, "CAN0", { systemNets });
    expect(hits.map((hit) => [hit.title, hit.subtitle])).toEqual([["CAN0_N", "System net · OBC-1, OBC-2, CMBD"]]);
    expect(hits[0].target).toEqual({ occurrence: "/sin_obc1", net: "CAN0_N" });
    // A net that stays on its board is still the board's.
    expect(searchBoards(withRx, "GND", { systemNets }).map((hit) => [hitOccurrence(hit), hit.subtitle.split(" · ")[0]]))
      .toEqual([["/sin_obc1", "OBC-1"], ["/sin_obc2", "OBC-2"]]);
  });

  it("searches one board, finding its system nets by their other boards' names", () => {
    expect(searchBoards(withRx, "U", { board: "/sin_cmbd", systemNets }).map(hitOccurrence)).toEqual(["/sin_cmbd"]);
    const [hit] = searchBoards(withRx, "OBC1_RWL", { board: "/sin_obc1", systemNets });
    expect(hit.systemNet?.groupId).toBe("g_rx");
    // Selecting it selects the board net on the board searched.
    expect(hit.target).toEqual({ occurrence: "/sin_obc1", net: "PK_06" });
    expect(searchBoards(withRx, "OBC1_RWL", { board: "/sin_obc2", systemNets })).toEqual([]);
  });
});
