import { describe, expect, it } from "vitest";

import type { SystemDocument } from "@/types/system";

import { childFindingCounts } from "./workspace-top-bar";

describe("childFindingCounts", () => {
  it("sums the subsystems' frozen counts and ignores boards", () => {
    const document = {
      instances: [
        { kind: "assembly", catalog: { findingCounts: { error: 6, warning: 1 } } },
        { kind: "assembly", catalog: { findingCounts: { error: 0, warning: 3 } } },
        { kind: "assembly", catalog: {} },
        { kind: "board", catalog: { findingCounts: { error: 9, warning: 9 } } },
      ],
    } as unknown as SystemDocument;
    expect(childFindingCounts(document)).toEqual({ error: 6, warning: 4 });
  });
});
