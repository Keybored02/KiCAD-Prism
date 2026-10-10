import { describe, expect, it } from "vitest";

import { migrateLegacyTab, workspaceParams, workspaceStateFromParams } from "./workspace-state";

const params = (query: string) => new URLSearchParams(query);

describe("workspace URL state", () => {
  it("reads the view, tray and selection, falling back on anything unknown", () => {
    expect(workspaceStateFromParams(params("view=diagram&tray=history&sel=link:slk_1"))).toEqual({
      view: "diagram", tray: "history", selection: { kind: "link", id: "slk_1" },
    });
    expect(workspaceStateFromParams(params("view=nope&tray=nope&sel=nope:1"))).toEqual({ view: "3d", tray: null, selection: null });
    expect(workspaceStateFromParams(params("sel=instance:"))).toEqual({ view: "3d", tray: null, selection: null });
  });

  it("writes only what differs from the default and keeps unrelated parameters", () => {
    const written = workspaceParams({ view: "3d", tray: "changes", selection: { kind: "harness", id: "shn_1" } }, params("import=1&tab=boards"));
    expect(written.toString()).toBe("import=1&tray=changes&sel=harness%3Ashn_1");
    expect(workspaceStateFromParams(written).selection).toEqual({ kind: "harness", id: "shn_1" });
  });

  it("keeps a link's row to show, and drops it from anything but a link (SB2-112)", () => {
    const written = workspaceParams({ view: "3d", tray: "connections", selection: { kind: "link", id: "slk_1", row: "srw_4" } });
    expect(workspaceStateFromParams(written).selection).toEqual({ kind: "link", id: "slk_1", row: "srw_4" });
    expect(workspaceStateFromParams(params("sel=harness:shn_1&row=srw_4")).selection).toEqual({ kind: "harness", id: "shn_1" });
  });

  it("translates links to the old tabs", () => {
    expect(migrateLegacyTab(params("view=icd"))).toBeNull();
    expect(migrateLegacyTab(params("tab=overview"))?.state).toEqual({ view: "3d", tray: null, selection: null });
    expect(migrateLegacyTab(params("tab=diagram"))?.state.view).toBe("diagram");
    expect(migrateLegacyTab(params("tab=boards&board=sin_1"))?.state.selection).toEqual({ kind: "instance", id: "sin_1" });
    expect(migrateLegacyTab(params("tab=connectivity&link=slk_1"))?.state).toEqual({
      view: "3d", tray: "connections", selection: { kind: "link", id: "slk_1" },
    });
    expect(migrateLegacyTab(params("tab=connectivity&harness=shn_1"))?.state.selection).toEqual({ kind: "harness", id: "shn_1" });
    expect(migrateLegacyTab(params("tab=import"))).toEqual({
      state: { view: "3d", tray: "connections", selection: null }, importing: true,
    });
    expect(migrateLegacyTab(params("tab=changes"))?.state.tray).toBe("changes");
    expect(migrateLegacyTab(params("tab=history"))?.state.tray).toBe("history");
  });
});
