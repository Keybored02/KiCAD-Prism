import { act, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Scene3dTab } from "./scene-3d-tab";
import { instance, systemDocument } from "./test-fixtures";

// With the element defined (as the viewer bundle does), its ref runs on every
// render. Nothing it calls may set state, or the tab re-renders forever (SB2-31
// froze the page this way through the emphasis report).
const calls = { setNetEmphasis: 0 };
class FakeSemanticViewer extends HTMLElement {
  setSystemScene() {}
  setStatsOverlay() {}
  getViewState() {
    return null;
  }
  setNetEmphasis() {
    calls.setNetEmphasis += 1;
    return [];
  }
}
if (!customElements.get("prism-semantic-viewer")) customElements.define("prism-semantic-viewer", FakeSemanticViewer);

afterEach(() => vi.unstubAllGlobals());

describe("Scene3dTab with the viewer element defined", () => {
  it("settles instead of re-rendering forever", async () => {
    vi.stubGlobal("navigator", { ...navigator, gpu: {} });
    const scene = { schema: "prism.system_scene.a0", systemId: "sys_1", systemVersion: 3, units: "mm", assets: [], occurrences: [] };
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify(scene), { status: 200, headers: { "Content-Type": "application/json" } })));
    render(
      <Scene3dTab
        systemId="sys_1" document={systemDocument([instance("OBC-1")])} etag='"sys:sys_1:3"' canEdit user={null}
        reload={vi.fn(async () => undefined)} onNavigate={vi.fn()}
      />,
    );
    await screen.findByText("0 boards");
    await act(async () => new Promise((resolve) => setTimeout(resolve, 50)));
    const settled = calls.setNetEmphasis;
    await act(async () => new Promise((resolve) => setTimeout(resolve, 100)));
    expect(calls.setNetEmphasis).toBe(settled);
    expect(settled).toBeLessThan(20);
  });
});
