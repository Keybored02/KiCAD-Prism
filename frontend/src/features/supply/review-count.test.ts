import { describe, expect, it } from "vitest";

import type { SupplyReviewQueue } from "@/types/supply";
import { reviewCountOf } from "./review-count";

describe("reviewCountOf", () => {
  it("counts every item the Review page lists to decide, pinned listings included", () => {
    const queue = {
      aliases: [], listings: [], manufacturers: [],
      counts: { aliases: 2, unresolved: 3, near: 1 },
      choices: [{}, {}],
      to_approve: { waivers: [{}], alternates: [{}, {}] },
      other_numbers: [{ listings: [{}, {}] }, { listings: [{}] }],
    } as unknown as SupplyReviewQueue;
    expect(reviewCountOf(queue)).toBe(2 + 3 + 1 + 2 + 3 + 3);
  });
});
