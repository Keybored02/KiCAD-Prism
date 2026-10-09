import { describe, expect, it } from "vitest";

import { failedNotice } from "./scene-3d-model";

describe("failedNotice", () => {
  it("adds how to retry to a bare reason", () => {
    expect(failedNotice("EPS › TSMC", "Missing required executable: kicad-cli"))
      .toBe("The 3D view of EPS › TSMC failed: Missing required executable: kicad-cli. Regenerate it from the board's 3D tab.");
  });

  it("does not repeat a retry the server already gave, nor its full stop", () => {
    expect(failedNotice("EPS › TSMC", "The 3D files of this revision are missing or unreadable on this server. Regenerate it from the board's 3D tab."))
      .toBe("The 3D view of EPS › TSMC failed: The 3D files of this revision are missing or unreadable on this server. Regenerate it from the board's 3D tab.");
  });

  it("reads without a reason", () => {
    expect(failedNotice("IN-1", null)).toBe("The 3D view of IN-1 failed. Regenerate it from the board's 3D tab.");
  });
});
