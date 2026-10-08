import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { IcdView } from "./icd-view";

afterEach(() => vi.unstubAllGlobals());

describe("IcdView", () => {
  it("reads the live ICD through the API and shows it in a script-free frame", async () => {
    const fetch = vi.fn<(url: string) => Promise<Response>>(async () => new Response("<!DOCTYPE html><html><head></head><body><h1>ICD</h1></body></html>",
      { headers: { "Content-Type": "text/html" } }));
    vi.stubGlobal("fetch", fetch);
    render(<IcdView systemId="sys_1" etag='"e1"' />);
    const frame = await screen.findByTitle("Interface control document");
    expect(frame).toHaveAttribute("srcdoc", expect.stringContaining("<h1>ICD</h1>"));
    expect(frame).toHaveAttribute("sandbox", "");
    expect(fetch.mock.calls[0][0]).toBe("/api/systems/sys_1/icd.html");
    expect(screen.getByRole("link", { name: /Open in a new tab/ })).toHaveAttribute("href", "/api/systems/sys_1/icd.html");
  });

  it("says why when the ICD cannot be generated", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ detail: "System not found" }),
      { status: 404, headers: { "Content-Type": "application/json" } })));
    render(<IcdView systemId="sys_1" etag='"e1"' />);
    expect(await screen.findByText(/System not found/)).toBeInTheDocument();
  });
});
