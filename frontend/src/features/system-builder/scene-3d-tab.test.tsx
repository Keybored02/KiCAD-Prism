import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { scenePollDelay, summarizeScene } from "./scene-3d-model";
import { Scene3dTab } from "./scene-3d-tab";
import { instance, systemDocument } from "./test-fixtures";
import type { SystemScene, SystemSceneAsset, SystemSceneOccurrence } from "@/types/system";

afterEach(() => vi.unstubAllGlobals());

// The viewer bundle defines the element; the tab waits for it before driving it.
if (!customElements.get("prism-semantic-viewer")) customElements.define("prism-semantic-viewer", class extends HTMLElement {});

const box = { minMm: [0, -90, -0.8], maxMm: [132, 0, 0.8] };
const occurrence = (label: string, patch: Partial<SystemSceneOccurrence> = {}): SystemSceneOccurrence => ({
  path: `/sin_${label}`, parentPath: null, displayPath: label, labels: [label], instanceId: `sin_${label}`, kind: "board", depth: 1,
  restricted: false, assetId: `sba_${label}`, pose: { translationMm: [0, 0, 0], rotation: [0, 0, 0, 1], source: "default" },
  worldMatrix: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1], boundsMm: box, ...patch,
});
const asset = (label: string, patch: Partial<SystemSceneAsset> = {}): SystemSceneAsset => ({
  assetId: `sba_${label}`, projectId: `prj_${label}`, commit: "a".repeat(40), status: "ready", bundleUrl: `/b/${label}/bundle.json`,
  sourceRevisionKey: "src", generatorBuild: "build", jobId: null, error: null,
  bundleToBoard: [1000, 0, 0, 0, 0, 1000, 0, 0, 0, 0, 1000, 0, 0, 0, -0.8, 1], ...patch,
});
const scene = (occurrences: SystemSceneOccurrence[], assets: SystemSceneAsset[]): SystemScene => ({
  schema: "prism.system_scene.a0", systemId: "sys_1", systemVersion: 3, units: "mm", assets, occurrences,
});

const mixed = scene(
  [
    occurrence("CMBD", { restricted: true, assetId: null }),
    occurrence("OBC-1"),
    occurrence("OBC-2"),
    occurrence("PSU", { assetId: "sba_PSU", boundsMm: null }),
    occurrence("Payload", { kind: "assembly", assetId: null }),
  ],
  [asset("OBC-1"), asset("OBC-2", { status: "failed", bundleUrl: null, bundleToBoard: null, error: "kicad-cli missing" }),
    asset("PSU", { status: "building", bundleUrl: null, bundleToBoard: null })],
);

describe("scene summary", () => {
  it("sorts drawn occurrences by why they are not drawn in full", () => {
    const summary = summarizeScene(mixed);
    expect(summary.boards).toBe(4); // the open assembly is a group, not drawn
    expect(summary.restricted.map((item) => item.displayPath)).toEqual(["CMBD"]);
    expect(summary.failed.map((item) => [item.occurrence.displayPath, item.error])).toEqual([["OBC-2", "kicad-cli missing"]]);
    expect(summary.building.map((item) => item.displayPath)).toEqual(["PSU"]);
    expect(summary.unplaced.map((item) => item.displayPath)).toEqual(["PSU"]);
  });

  it("polls only while something is still coming", () => {
    expect(scenePollDelay(mixed)).toBe(5000);
    expect(scenePollDelay(scene([occurrence("OBC-1")], [asset("OBC-1")]))).toBeNull();
    expect(scenePollDelay(null)).toBeNull();
  });
});

describe("Scene3dTab", () => {
  const props = {
    systemId: "sys_1", document: systemDocument([instance("OBC-1")]), etag: '"sys:sys_1:3"', canEdit: true, user: null,
    reload: vi.fn(async () => undefined), onNavigate: vi.fn(),
  };

  it("reads the scene and explains restricted, failed and building boards", async () => {
    vi.stubGlobal("navigator", { ...navigator, gpu: {} });
    const fetchMock = vi.fn(async () => new Response(JSON.stringify(mixed), { status: 200, headers: { "Content-Type": "application/json" } }));
    vi.stubGlobal("fetch", fetchMock);
    render(<Scene3dTab {...props} />);
    expect(await screen.findByText(/CMBD is restricted: drawn as a grey box showing only its size/)).toBeTruthy();
    expect(screen.getByText(/The 3D view of OBC-2 failed: kicad-cli missing/)).toBeTruthy();
    expect(screen.getByText(/Generating the 3D view of PSU/)).toBeTruthy();
    expect(screen.getByText("4 boards")).toBeTruthy();
    expect(String((fetchMock.mock.calls[0] as unknown[])[0])).toContain("/api/systems/sys_1/scene");
    // The board 3D tab's viewer, in system mode (SB2-31e.2).
    expect(document.querySelector("prism-semantic-viewer")?.getAttribute("mode")).toBe("system");
  });

  it("saves a released drag with If-Match, and puts the board back when the save fails", async () => {
    vi.stubGlobal("navigator", { ...navigator, gpu: {} });
    const json = (body: unknown, status = 200, etag?: string) => new Response(JSON.stringify(body), {
      status, headers: { "Content-Type": "application/json", ...(etag ? { ETag: etag } : {}) },
    });
    const responses: Response[] = [];
    const fetchMock = vi.fn(async (url: string) => (String(url).endsWith("/scene") ? json(mixed) : responses.shift()!));
    vi.stubGlobal("fetch", fetchMock);
    render(<Scene3dTab {...props} />);
    await screen.findByText("4 boards");
    const element = document.querySelector("prism-semantic-viewer") as unknown as HTMLElement & Record<string, unknown>;
    element.setMoveMode = vi.fn();
    // The tab listens once the element is there; give its effects a turn.
    await act(async () => undefined);
    element.cancelMove = vi.fn();
    fireEvent.click(screen.getByRole("button", { name: /Move/ }));
    expect(element.setMoveMode).toHaveBeenCalledWith(true);

    const pose = { translationMm: [10, 20, 0], rotation: [0, 0, 0, 1] };
    const commit = (phase: string) => act(() => {
      element.dispatchEvent(new CustomEvent("prism-semantic-viewer:move", { detail: {
        phase, allowed: true, enabled: true, space: "world", dragging: false,
        target: { occurrence: "/sin_OBC-1", instanceId: "sin_OBC-1", displayPath: "OBC-1", kind: "board", restricted: false,
          pose, source: "manual", unsaved: true },
      } }));
    });
    responses.push(json({ instanceId: "sin_OBC-1", ...pose, source: "manual" }, 200, '"sys:sys_1:4"'));
    commit("commit");
    await waitFor(() => expect(props.reload).toHaveBeenCalled());
    const put = fetchMock.mock.calls.find((call) => String(call[0]).endsWith("/poses/sin_OBC-1")) as unknown as [string, RequestInit];
    expect(put[1].method).toBe("PUT");
    expect(new Headers(put[1].headers).get("If-Match")).toBe('"sys:sys_1:3"');
    expect(JSON.parse(String(put[1].body))).toEqual(pose);
    expect(element.cancelMove).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Position of OBC-1")).toBeTruthy();

    responses.push(json({ detail: "System has changed; reload it" }, 412, '"sys:sys_1:9"'));
    commit("commit");
    await waitFor(() => expect(element.cancelMove).toHaveBeenCalled());
  });

  it("asks before lighting a net over 200 pins, then lights its members", async () => {
    vi.stubGlobal("navigator", { ...navigator, gpu: {} });
    const json = (body: unknown) => new Response(JSON.stringify(body), { status: 200, headers: { "Content-Type": "application/json" } });
    const gnd = { groupId: "g1", name: "GND", aliases: ["GND", "GND_3"], pinCount: 600, large: true };
    const fetchMock = vi.fn(async (url: string) => {
      if (String(url).endsWith("/scene")) return json(mixed);
      if (String(url).includes("/nets?")) return json({ systemId: "sys_1", groups: [gnd], total: 1 });
      return json({ ...gnd, hops: [], members: [
        { occurrence: "/sin_OBC-1", displayPath: "OBC-1", net: "GND" },
        { occurrence: null, redacted: true },
      ] });
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<Scene3dTab {...props} />);
    await screen.findByText("4 boards");
    const element = document.querySelector("prism-semantic-viewer") as unknown as HTMLElement & Record<string, unknown>;
    element.setNetEmphasis = vi.fn(() => [{ key: "g1", color: "#14ff33", lit: 1, unresolved: [] }]);
    element.frameNetEmphasis = vi.fn(() => true);
    fireEvent.click(screen.getByTitle("Highlight system nets"));
    fireEvent.change(screen.getByLabelText("Search system nets"), { target: { value: "gnd" } });
    fireEvent.click(await screen.findByRole("button", { name: "Show" }));
    expect(await screen.findByText("Highlight GND?")).toBeTruthy();
    expect(fetchMock.mock.calls.some((call) => String(call[0]).endsWith("/nets/g1"))).toBe(false);
    fireEvent.click(screen.getByRole("button", { name: "Highlight" }));
    await waitFor(() => expect(element.setNetEmphasis).toHaveBeenLastCalledWith([
      { key: "g1", members: [{ occurrence: "/sin_OBC-1", net: "GND" }] },
    ]));
    expect(await screen.findByText(/1 on restricted boards/)).toBeTruthy();
    // A newly shown net is framed once, on the first board it reaches.
    expect(element.frameNetEmphasis).toHaveBeenCalledWith("g1", "/sin_OBC-1");
    fireEvent.click(screen.getByRole("button", { name: "Stop highlighting GND" }));
    await waitFor(() => expect(element.setNetEmphasis).toHaveBeenLastCalledWith([]));
  });

  it("shows the diagram and a notice without WebGPU, and never reads the scene", async () => {
    vi.stubGlobal("navigator", { ...navigator, gpu: undefined });
    const fetchMock = vi.fn(async () => new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    render(<Scene3dTab {...props} />);
    expect(screen.getByText(/The 3D view needs WebGPU/)).toBeTruthy();
    expect(document.querySelector("prism-semantic-viewer")).toBeNull();
    await waitFor(() => expect(fetchMock.mock.calls.some((call) => String((call as unknown[])[0]).includes("/scene"))).toBe(false));
  });
});
