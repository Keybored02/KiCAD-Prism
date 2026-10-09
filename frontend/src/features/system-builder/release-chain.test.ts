import { describe, expect, it } from "vitest";

import type { InstanceCatalogRef } from "@/types/system";

import { releaseChain } from "./release-chain";

const ref = (fields: Partial<InstanceCatalogRef>) => ({
  componentId: "c", revisionId: "r", follow: "pinned", version: 2, releaseStatus: "released", identity: null,
  latestReleasedRevisionId: null, systemId: null, snapshotName: null, ...fields,
}) as InstanceCatalogRef;

describe("releaseChain (SB2-122)", () => {
  it("states this revision, a newer release and a newer one on its way", () => {
    expect(releaseChain(ref({ latestReleasedVersion: 2, newestVersion: 2 })).text).toBe("v2 · released");
    expect(releaseChain(ref({ latestReleasedVersion: 3, newestVersion: 4, newestReleaseStatus: "qa_review" })))
      .toEqual({ text: "v2 · released · v3 released · v4 in QA review", newerReleased: 3 });
    expect(releaseChain(ref({ releaseStatus: "qa_review", latestReleasedVersion: 1, newestVersion: 2 })).text).toBe("v2 · in QA review");
    expect(releaseChain(null).text).toBe("—");
  });
});
