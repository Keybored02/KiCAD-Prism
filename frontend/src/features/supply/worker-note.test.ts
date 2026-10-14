import { describe, expect, it } from "vitest";

import { workerNote } from "./worker-note";

const NOW = Date.parse("2026-10-14T12:00:00Z");
const worker = (over: Partial<Parameters<typeof workerNote>[0]> = {}) => ({
  seen_at: "2026-10-14T11:59:00Z", older_than_server: false, missing_providers: [], ...over,
});

describe("the background worker note", () => {
  it("is quiet when the worker reported a minute ago with current code", () => {
    expect(workerNote(worker(), NOW)).toEqual({ warning: false, text: "Background worker seen 1 minute ago." });
  });

  it("warns when it never reported or has gone quiet", () => {
    expect(workerNote(worker({ seen_at: null }), NOW).warning).toBe(true);
    const silent = workerNote(worker({ seen_at: "2026-10-14T11:00:00Z" }), NOW);
    expect(silent.warning).toBe(true);
    expect(silent.text).toContain("60 minutes ago");
  });

  it("warns when it runs older code or lacks a provider", () => {
    expect(workerNote(worker({ older_than_server: true }), NOW).text).toContain("Restart it");
    expect(workerNote(worker({ missing_providers: ["avnet", "lcsc"] }), NOW).text).toContain("avnet, lcsc");
  });
});
