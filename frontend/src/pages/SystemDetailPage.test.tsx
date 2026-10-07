import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

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
  it("loads the document, reads the tab from the URL and shows badges", async () => {
    vi.stubGlobal("fetch", vi.fn(async (url: string) => {
      const body = url.includes("/snapshots") ? [] : url.includes("/history") ? { events: [], nextCursor: null } : document;
      return new Response(JSON.stringify(body), {
        status: 200, headers: { "Content-Type": "application/json", ETag: '"sys:sys_1:3"' },
      });
    }));
    renderAt("/systems/sys_1?tab=history");
    expect(await screen.findByRole("heading", { name: "Flight stack" })).toBeTruthy();
    expect(screen.getByRole("tab", { name: "History" }).getAttribute("aria-selected")).toBe("true");
    expect(screen.getByText(/2 errors/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Open source changes" }));
    expect(screen.getByTestId("location").textContent).toBe("/systems/sys_1?tab=changes");
    fireEvent.mouseDown(screen.getByRole("tab", { name: "Overview" }));
    expect(screen.getByTestId("location").textContent).toBe("/systems/sys_1");
    fireEvent.click(screen.getByRole("button", { name: /Back/ }));
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
