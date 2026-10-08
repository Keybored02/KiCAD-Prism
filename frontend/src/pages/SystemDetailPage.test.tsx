import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

import { resetDraftGuard, useDraftGuard } from "@/features/system-builder/draft-guard";

import { SystemDetailPage } from "./SystemDetailPage";
import type { SystemDocument } from "@/types/system";

const document: SystemDocument = {
  system: {
    id: "sys_1", kind: "system", name: "Flight stack", description: "Payload stack", folderId: "fld_1", version: 3,
    etag: '"sys:sys_1:3"', instanceCount: 0, openReviewCount: 1, createdBy: "user:a", createdAt: "", updatedAt: "",
  },
  instances: [],
  links: [],
  openReviewCount: 1,
  findingCounts: { error: 2, warning: 0, info: 1, notEvaluated: 0 },
};

function Location() {
  const location = useLocation();
  return <p data-testid="location">{location.pathname + location.search}</p>;
}

function renderAt(url: string) {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route path="/systems/:systemId" element={<><SystemDetailPage user={null} /><Location /></>} />
        <Route path="/" element={<Location />} />
      </Routes>
    </MemoryRouter>,
  );
}

afterEach(() => vi.unstubAllGlobals());

describe("SystemDetailPage", () => {
  it("loads the document, opens an old tab link in the workspace and navigates", async () => {
    vi.stubGlobal("fetch", vi.fn(async (url: string) => {
      const body = url.includes("/snapshots") ? [] : url.includes("/history") ? { events: [], nextCursor: null }
        : url.endsWith("/git") ? null : url.endsWith("/layout") ? { positions: {} } : url.includes("/hierarchy") ? { systemId: "sys_1", boardCount: 0, occurrences: [] } : url.endsWith("/validation") ? { findings: [], notEvaluated: [], exempt: [], counts: document.findingCounts } : document;
      return new Response(JSON.stringify(body), {
        status: 200, headers: { "Content-Type": "application/json", ETag: '"sys:sys_1:3"' },
      });
    }));
    renderAt("/systems/sys_1?tab=history");
    expect(await screen.findByRole("heading", { name: "Flight stack", level: 1 })).toBeTruthy();
    await waitFor(() => expect(screen.getByTestId("location").textContent).toBe("/systems/sys_1?tray=history"));
    expect(screen.getByRole("tab", { name: "History" }).getAttribute("aria-selected")).toBe("true");
    expect(screen.getByRole("button", { name: "Open the findings" }).textContent).toContain("2 errors");
    fireEvent.click(screen.getByRole("tab", { name: /Changes/ }));
    expect(screen.getByTestId("location").textContent).toBe("/systems/sys_1?tray=changes");
    fireEvent.click(screen.getByRole("tab", { name: "Diagram" }));
    expect(screen.getByTestId("location").textContent).toBe("/systems/sys_1?view=diagram&tray=changes");
    fireEvent.click(screen.getByRole("button", { name: "Back to the workspace" }));
    expect(screen.getByTestId("location").textContent).toBe("/?folder=fld_1");
  });

  it("marks an archived system read-only", async () => {
    const archived = { ...document, system: { ...document.system, archivedAt: "2026-10-07T12:00:00Z" } };
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify(archived), {
      status: 200, headers: { "Content-Type": "application/json", ETag: '"sys:sys_1:3"' },
    })));
    renderAt("/systems/sys_1");
    expect(await screen.findByText(/Archived · read-only/)).toBeTruthy();
  });

  it("explains a missing or hidden system", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ detail: "System not found" }), {
      status: 404, headers: { "Content-Type": "application/json" },
    })));
    renderAt("/systems/sys_x");
    await waitFor(() => expect(screen.getByText("System not found")).toBeTruthy());
  });
});

describe("SystemDetailPage unsaved drafts (SB2-102)", () => {
  function Dirty() {
    useDraftGuard(true);
    return null;
  }

  it("asks before a tray change or Back discards an unsaved draft, and keeps editing on cancel", async () => {
    vi.stubGlobal("fetch", vi.fn(async (url: string) => {
      const body = url.includes("/snapshots") ? [] : url.endsWith("/git") ? null : url.endsWith("/layout") ? { positions: {} } : document;
      return new Response(JSON.stringify(body), { status: 200, headers: { "Content-Type": "application/json", ETag: '"sys:sys_1:3"' } });
    }));
    render(
      <MemoryRouter initialEntries={["/systems/sys_1?tray=connections"]}>
        <Routes>
          <Route path="/systems/:systemId" element={<><SystemDetailPage user={null} /><Dirty /><Location /></>} />
          <Route path="/" element={<Location />} />
        </Routes>
      </MemoryRouter>,
    );
    await screen.findByRole("heading", { name: "Flight stack", level: 1 });
    fireEvent.click(screen.getByRole("tab", { name: /Findings/ }));
    expect(await screen.findByText("Discard unsaved changes?")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Keep editing" }));
    expect(screen.getByTestId("location").textContent).toBe("/systems/sys_1?tray=connections");
    fireEvent.click(screen.getByRole("tab", { name: /Findings/ }));
    fireEvent.click(await screen.findByRole("button", { name: "Discard" }));
    await waitFor(() => expect(screen.getByTestId("location").textContent).toBe("/systems/sys_1?tray=findings"));
    fireEvent.click(screen.getByRole("tab", { name: "Diagram" }));  // a view change unmounts no editor
    expect(screen.queryByText("Discard unsaved changes?")).toBeNull();
    resetDraftGuard();
  });
});
