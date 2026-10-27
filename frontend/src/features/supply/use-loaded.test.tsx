import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useLoaded } from "./use-loaded";

describe("useLoaded cache", () => {
  it("starts from what the last visit showed and reloads behind it", async () => {
    const fetcher = vi.fn().mockResolvedValueOnce("first").mockResolvedValueOnce("second");
    const first = renderHook(() => useLoaded("k", fetcher, "failed", "test"));
    expect(first.result.current.status).toBe("loading");
    await waitFor(() => expect(first.result.current.data).toBe("first"));
    first.unmount();

    const again = renderHook(() => useLoaded("k", fetcher, "failed", "test"));
    expect(again.result.current.status).toBe("ready");
    expect(again.result.current.data).toBe("first");
    await waitFor(() => expect(again.result.current.data).toBe("second"));
  });

  it("keeps kinds of data apart even when their keys match", async () => {
    const fetchA = () => Promise.resolve("a");
    const fetchB = () => Promise.resolve("b");
    const a = renderHook(() => useLoaded("same", fetchA, "failed", "kind-a"));
    await waitFor(() => expect(a.result.current.data).toBe("a"));
    const b = renderHook(() => useLoaded("same", fetchB, "failed", "kind-b"));
    expect(b.result.current.status).toBe("loading");
  });

  it("caches nothing unless asked", async () => {
    const fetchX = () => Promise.resolve("x");
    const first = renderHook(() => useLoaded("k", fetchX, "failed"));
    await waitFor(() => expect(first.result.current.data).toBe("x"));
    first.unmount();
    const again = renderHook(() => useLoaded("k", fetchX, "failed"));
    expect(again.result.current.status).toBe("loading");
  });
});
