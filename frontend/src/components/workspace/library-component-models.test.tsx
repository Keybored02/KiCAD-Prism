import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { chooseOption } from "@/test/select";

import { ModelsPanel, previewUrl } from "./library-component-models";

afterEach(() => vi.unstubAllGlobals());

const MODEL = {
  assetId: "ast_1", name: "PinHeader_1x04_P2.54mm_Vertical.step", stepSha256: "a".repeat(64),
  glb: { key: "b".repeat(64), converter: "geometer-2026.9.7", bounds: { minMm: [-1.27, -8.89, -3], maxMm: [1.27, 1.27, 8.54] }, materials: 2, sizeBytes: 53672 },
  alignment: { offsetMm: [0, 0, 0], rotationDeg: [0, 0, 0], scale: 1, updatedBy: null, updatedAt: null },
};

function stubApi() {
  const calls: [string, RequestInit][] = [];
  vi.stubGlobal("fetch", vi.fn(async (url: string, init: RequestInit = {}) => {
    calls.push([url, init]);
    const json = (body: unknown) => new Response(JSON.stringify(body), { status: 200, headers: { "Content-Type": "application/json" } });
    if (url.endsWith("/mates-with")) return json({ items: [{ componentId: "cmp_socket", name: "Socket", mpn: "PS-104", manufacturer: "Test" }] });
    if (init.method === "PUT") return json({ items: [{ ...MODEL, alignment: { ...JSON.parse(String(init.body)), updatedBy: "a", updatedAt: "t" } }] });
    return json({ items: [MODEL] });
  }));
  return calls;
}

describe("ModelsPanel", () => {
  it("shows the converted model and previews an unsaved alignment mated with a partner", async () => {
    const calls = stubApi();
    render(<ModelsPanel componentId="cmp_plug" canMutate />);
    expect(await screen.findByText(/2.54 × 10.16 × 11.54 mm · 2 colours/)).toBeTruthy();
    const preview = () => screen.getByTestId("model-preview").getAttribute("src") ?? "";
    expect(preview()).toBe(previewUrl("cmp_plug", "ast_1", MODEL.alignment as never, "front", null));
    fireEvent.change(screen.getByLabelText("Offset Z"), { target: { value: "-8.54" } });
    await chooseOption("Preview mated with", "PS-104");
    await waitFor(() => expect(preview()).toContain("offset=0%2C0%2C-8.54"));
    expect(preview()).toContain("partner=cmp_socket");
    fireEvent.click(screen.getByRole("tab", { name: "Side" }));
    await waitFor(() => expect(preview()).toContain("view=side"));
    fireEvent.click(screen.getByRole("button", { name: "Save alignment" }));
    await waitFor(() => expect(calls.some(([, init]) => init.method === "PUT")).toBe(true));
    const [url, init] = calls.find(([, i]) => i.method === "PUT")!;
    expect([url, JSON.parse(String(init.body))]).toEqual(["/api/catalog/components/cmp_plug/models/ast_1/alignment",
      { offsetMm: [0, 0, -8.54], rotationDeg: [0, 0, 0], scale: 1 }]);
  });

  it("lets viewers preview but not save", async () => {
    stubApi();
    render(<ModelsPanel componentId="cmp_plug" canMutate={false} />);
    expect(await screen.findByTestId("model-preview")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Save alignment" })).toBeNull();
    expect(screen.queryByRole("button", { name: /Convert/ })).toBeNull();
  });
});
