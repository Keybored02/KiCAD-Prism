import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { SystemSummary } from "@/types/system";

import { SystemsPage } from "./SystemsPage";

afterEach(() => vi.unstubAllGlobals());

const summary = (patch: Partial<SystemSummary>): SystemSummary => ({
  id: "sys_1", kind: "system", name: "Bus", description: "", folderId: null, version: 3, etag: '"sys:sys_1:3"',
  instanceCount: 0, subsystemCount: 2, moduleCount: 2, openReviewCount: 0, createdBy: "u", createdAt: "2026-10-01T00:00:00Z",
  updatedAt: "2026-10-01T00:00:00Z", boardTotal: 13, lastSnapshot: null, git: null, findingCounts: null, ...patch,
});

describe("SystemsPage (SB2-101)", () => {
  it("lists each system with its boards through subsystems, counts, last snapshot and git", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify([
      summary({ lastSnapshot: { id: "ssn_1", name: "Progress", createdAt: new Date().toISOString() },
        findingCounts: { error: 0, warning: 4, info: 0, notEvaluated: 0 }, git: { branch: "main", outsideChange: true, error: false } }),
      summary({ id: "sys_2", name: "C&DH Stack", subsystemCount: 0, moduleCount: 0, instanceCount: 6, boardTotal: 6, openReviewCount: 1 }),
    ]), { headers: { "Content-Type": "application/json" } })));
    render(<MemoryRouter><SystemsPage /></MemoryRouter>);
    const bus = (await screen.findByRole("link", { name: "Bus" })).closest("tr")!;
    expect(within(bus).getByText("13")).toBeTruthy();
    expect(within(bus).getByText("Progress", { exact: false })).toBeTruthy();
    expect(within(bus).getByText("main")).toBeTruthy();
    expect(within(bus).getByText("4")).toBeTruthy();
    const cndh = screen.getByRole("link", { name: "C&DH Stack" }).closest("tr")!;
    expect(within(cndh).getByText("—")).toBeTruthy();
    expect(screen.getByRole("link", { name: "C&DH Stack" }).getAttribute("href")).toBe("/systems/sys_2");
  });
});
