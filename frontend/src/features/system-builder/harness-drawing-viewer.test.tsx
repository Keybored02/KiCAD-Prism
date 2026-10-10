import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { SystemHarness } from "@/types/system";

import { HarnessDrawingViewer, parseDrawing } from "./harness-drawing-viewer";

afterEach(() => vi.unstubAllGlobals());

const SVG = `<svg xmlns='http://www.w3.org/2000/svg' width='800' height='400' viewBox='0 0 800 400'>
<g data-w='W1 W2' data-segment='s1'><path d='M 0 0 L 10 0'/></g>
<g data-w='W1' data-wire='shw_1'><path d='M 0 0 L 5 5'/></g>
<g data-w='W2' data-wire='shw_2'><path d='M 0 0 L 6 6'/></g>
<g data-w='W2'><text>W2 BK</text></g>
</svg>`;

const harness = {
  id: "shn_1", name: "C&DH power", updatedAt: "t",
  ends: [{ id: "a", mates: { port: { reference: "HPDRM J4" } } }, { id: "b", mates: { port: { reference: "LPDRM J1" } } }],
  wires: [{ id: "shw_1", from: { end: "a", pin: "1" }, to: { end: "b", pin: "15" }, signal: "PWR", gaugeAwg: 24, colour: "red" },
    { id: "shw_2", from: { end: "a", pin: "14" }, to: { end: "b", pin: "9" }, signal: "GND", gaugeAwg: 24, colour: "black" }],
} as unknown as SystemHarness;

describe("harness drawing viewer (SB2-111)", () => {
  it("drops scripts and handlers from the drawing", () => {
    const svg = parseDrawing(`<svg xmlns='http://www.w3.org/2000/svg' onload='x()'><script>x()</script><a href='javascript:x()'/></svg>`)!;
    expect(svg.getAttribute("onload")).toBeNull();
    expect(svg.querySelector("script")).toBeNull();
    expect(svg.querySelector("a")!.getAttribute("href")).toBeNull();
    expect(parseDrawing("not svg")).toBeNull();
  });

  it("loads the drawing and traces a hovered wire through the bundle", async () => {
    vi.stubGlobal("ResizeObserver", class { observe() {} disconnect() {} });
    const fetchMock = vi.fn(async () => new Response(SVG, { status: 200, headers: { "Content-Type": "image/svg+xml" } }));
    vi.stubGlobal("fetch", fetchMock);
    render(<HarnessDrawingViewer systemId="sys_1" harness={harness} onClose={vi.fn()} />);
    const host = screen.getByTestId("harness-drawing");
    await waitFor(() => expect(host.querySelector("svg")).not.toBeNull());
    expect(String((fetchMock.mock.calls[0] as unknown[])[0])).toBe("/api/systems/sys_1/harnesses/shn_1/outputs/drawing.svg");

    fireEvent.pointerOver(host.querySelector("text")!);
    await waitFor(() => expect(host.classList.contains("tracing")).toBe(true));
    const on = [...host.querySelectorAll("[data-on]")].map((g) => g.getAttribute("data-w"));
    expect(on).toEqual(["W1 W2", "W2", "W2"]); // the sheath it runs in, its fan, its tag; not W1's fan
    expect(screen.getByText(/W2 · HPDRM J4 : 14 → LPDRM J1 : 9 · GND · 24 AWG · black/)).toBeTruthy();

    fireEvent.click(host.querySelector("text")!);
    fireEvent.pointerLeave(host);
    expect(host.classList.contains("tracing")).toBe(true); // pinned
    fireEvent.keyDown(host, { key: "Escape" });
    await waitFor(() => expect(host.classList.contains("tracing")).toBe(false));
  });
});
