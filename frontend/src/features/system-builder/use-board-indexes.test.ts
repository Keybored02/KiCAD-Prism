import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { SystemScene } from "@/types/system";

import { useBoardIndexes } from "./use-board-indexes";

const scene = {
  schema: "prism.system_scene.a0", systemId: "s1", systemVersion: 1, units: "mm", occurrences: [],
  assets: [{ assetId: "sba_obc", projectId: "prj_obc", commit: "a".repeat(40), status: "ready", bundleUrl: "/b",
    sourceRevisionKey: "s", generatorBuild: "g", jobId: null, error: null, bundleToBoard: null }],
} as SystemScene;
const index = { schema: "prism.semantic_index_a0", sourceRevisionKey: "s", components: [], nets: [], terminals: [], indexes: {} };

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("useBoardIndexes", () => {
  it("retries a failed read with backoff (retro D7)", async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ detail: "busy" }), { status: 503 }))
      .mockResolvedValue(new Response(JSON.stringify(index), { status: 200, headers: { "Content-Type": "application/json" } }));
    vi.stubGlobal("fetch", fetchMock);
    const { result } = renderHook(() => useBoardIndexes(scene));
    await act(async () => { await vi.advanceTimersByTimeAsync(0); });
    expect(result.current.get("sba_obc")?.error).toBeTruthy();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await act(async () => { await vi.advanceTimersByTimeAsync(5_000); });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result.current.get("sba_obc")).toMatchObject({ loading: false, error: null });
    expect(result.current.get("sba_obc")?.index).toBeTruthy();
  });
});
