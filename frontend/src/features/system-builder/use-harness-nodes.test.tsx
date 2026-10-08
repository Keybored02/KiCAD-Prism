import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { PrismSemanticViewerElement } from "@/types/prism-semantic-viewer";
import type { SystemScene } from "@/types/system";

import { useHarnessNodes } from "./use-harness-nodes";

afterEach(() => vi.unstubAllGlobals());

const scene = { harnesses: [{ id: "hrn_1", level: null, nodes: [] }] } as unknown as SystemScene;

function harnessEvent(viewer: EventTarget, detail: Record<string, unknown>) {
  act(() => {
    viewer.dispatchEvent(new CustomEvent("prism-semantic-viewer:harness", { detail }));
  });
}

describe("useHarnessNodes in Route mode (D-P2-51)", () => {
  it("saves a breakout where a Shift-click lands on the picked harness", async () => {
    const fetch = vi.fn<(url: string, init?: RequestInit) => Promise<Response>>(async () => new Response(JSON.stringify({}),
      { status: 200, headers: { "Content-Type": "application/json", ETag: '"sys:sys_1:4"' } }));
    vi.stubGlobal("fetch", fetch);
    const viewer = new EventTarget() as unknown as PrismSemanticViewerElement;
    const reload = vi.fn(async () => undefined);
    renderHook(() => useHarnessNodes(viewer, { systemId: "sys_1", etag: '"sys:sys_1:3"', reload, scene }));
    const picked = { harness: { id: "hrn_1", level: null, name: "PERF-01" }, segment: null, pointMm: [1, 2, 3], node: null, editable: true };
    harnessEvent(viewer, { phase: "select", ...picked });
    harnessEvent(viewer, { phase: "route-click", ...picked, breakout: true });
    await waitFor(() => expect(fetch).toHaveBeenCalled());
    const [url, init] = fetch.mock.calls[0];
    expect(url).toBe("/api/systems/sys_1/harnesses/hrn_1/nodes");
    expect(JSON.parse(String(init?.body))).toEqual([expect.objectContaining({ kind: "breakout", positionMm: [1, 2, 3] })]);
    expect(new Headers(init?.headers).get("If-Match")).toBe('"sys:sys_1:3"');
  });
});
