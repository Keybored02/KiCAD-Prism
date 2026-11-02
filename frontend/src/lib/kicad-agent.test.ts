import { afterEach, describe, expect, it, vi } from "vitest";

import { openInSystemBrowser } from "./kicad-agent";

afterEach(() => vi.unstubAllGlobals());

const reply = (status: number) => new Response("{}", { status });

describe("openInSystemBrowser", () => {
  it("posts the link to the first agent port", async () => {
    const fetchMock = vi.fn().mockResolvedValue(reply(200));
    vi.stubGlobal("fetch", fetchMock);
    expect(await openInSystemBrowser("https://example.com/")).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe("http://127.0.0.1:48730/open-url");
  });

  it("tries the next port when the first is silent, or is another profile's or an older agent", async () => {
    for (const first of [new TypeError("refused"), reply(403), reply(404)]) {
      const fetchMock = vi.fn();
      if (first instanceof Error) fetchMock.mockRejectedValueOnce(first);
      else fetchMock.mockResolvedValueOnce(first);
      fetchMock.mockResolvedValueOnce(reply(200));
      vi.stubGlobal("fetch", fetchMock);
      expect(await openInSystemBrowser("https://example.com/")).toBe(true);
      expect(fetchMock.mock.calls[1][0]).toBe("http://127.0.0.1:48731/open-url");
    }
  });

  it("gives up on an agent that refuses for real, so the caller copies", async () => {
    for (const status of [429, 502]) {
      const fetchMock = vi.fn().mockResolvedValue(reply(status));
      vi.stubGlobal("fetch", fetchMock);
      expect(await openInSystemBrowser("https://example.com/")).toBe(false);
      expect(fetchMock).toHaveBeenCalledTimes(1);
    }
  });

  it("is false when no agent answers", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("refused")));
    expect(await openInSystemBrowser("https://example.com/")).toBe(false);
  });
});
