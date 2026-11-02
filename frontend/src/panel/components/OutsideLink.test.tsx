import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { OutsideLink } from "./OutsideLink";

afterEach(() => {
  cleanup();
  Reflect.deleteProperty(window, "webkit");
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("OutsideLink", () => {
  it("opens a new tab in a browser", () => {
    render(<OutsideLink href="https://example.com/ds.pdf" label="Open datasheet">Datasheet</OutsideLink>);
    const link = screen.getByRole("link", { name: "Open datasheet" });
    expect(link.getAttribute("href")).toBe("https://example.com/ds.pdf");
    expect(link.getAttribute("target")).toBe("_blank");
  });

  function insideKiCad() {
    Object.defineProperty(window, "webkit", { configurable: true, value: { messageHandlers: { kicad: { postMessage: () => {} } } } });
  }

  it("asks the agent to open the link in the browser inside KiCad, instead of navigating the panel away", async () => {
    insideKiCad();
    const fetchMock = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    render(<OutsideLink href="https://example.com/ds.pdf" label="Open datasheet">Datasheet</OutsideLink>);
    expect(screen.queryByRole("link")).toBeNull();
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Open datasheet" }));
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe("http://127.0.0.1:48730/open-url");
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ url: "https://example.com/ds.pdf" });
    expect(screen.getByRole("button").getAttribute("title")).toBe("Opened in browser");
  });

  it("copies the address when no agent opens it", async () => {
    insideKiCad();
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("refused")));
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
    render(<OutsideLink href="https://example.com/ds.pdf" label="Open datasheet">Datasheet</OutsideLink>);
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Open datasheet" }));
    });
    expect(writeText).toHaveBeenCalledWith("https://example.com/ds.pdf");
    expect(screen.getByRole("button").getAttribute("title")).toBe("Link copied");
  });
});
