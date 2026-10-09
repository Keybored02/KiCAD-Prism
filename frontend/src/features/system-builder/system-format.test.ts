import { describe, expect, it } from "vitest";

import { boardStatus } from "./system-format";
import { instance } from "./test-fixtures";

describe("boardStatus", () => {
  it.each([
    [{ restricted: true }, "Restricted"],
    [{ resolution: "unresolved" as const }, "Source missing"],
    [{ interface: { status: "failed" as const, digest: null, hasPcb: null, jobId: null, errorCode: "source_unavailable" } }, "Extraction failed"],
    [{ interface: { status: "pending" as const, digest: null, hasPcb: null, jobId: "j", errorCode: null } }, "Reading board"],
    [{ trackedRef: null }, "Fixed commit"],
    [{ tipCheckedAt: null }, "Not checked"],
    [{ tipCommit: null }, "Branch missing"],
    [{ updateAvailable: true, pinned: true }, "Update available"],
    [{ updateAvailable: true }, "Changes pending"],
    [{}, "Up to date"],
  ])("%o → %s", (patch, label) => {
    expect(boardStatus(instance("OBC", patch)).label).toBe(label);
  });
});
