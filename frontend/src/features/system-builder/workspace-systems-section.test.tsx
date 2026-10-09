import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { WorkspaceSystemsSection, systemsForLevel } from "./workspace-systems-section";
import type { SystemSummary } from "@/types/system";

const summary = (patch: Partial<SystemSummary>): SystemSummary => ({
  id: "sys_1", kind: "system", name: "Flight stack", description: "", folderId: null, version: 1, etag: "e",
  instanceCount: 3, openReviewCount: 0, createdBy: "user:a", createdAt: "", updatedAt: "", ...patch,
});

describe("systemsForLevel", () => {
  const systems = [
    summary({ id: "b", name: "Beta", folderId: "fld_1" }),
    summary({ id: "a", name: "Alpha", description: "payload harness" }),
    summary({ id: "c", name: "Gamma" }),
  ];

  it("keeps one folder level, sorted by name", () => {
    expect(systemsForLevel(systems, null, "").map((s) => s.id)).toEqual(["a", "c"]);
    expect(systemsForLevel(systems, "fld_1", "").map((s) => s.id)).toEqual(["b"]);
  });

  it("searches name and description across folders", () => {
    expect(systemsForLevel(systems, "fld_1", "HARNESS").map((s) => s.id)).toEqual(["a"]);
  });
});

describe("WorkspaceSystemsSection", () => {
  it("shows the review badge and opens the system", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route path="/" element={<WorkspaceSystemsSection systems={[summary({ openReviewCount: 2, description: "Flight boards" })]} showHeading />} />
          <Route path="/systems/:id" element={<p>system page</p>} />
        </Routes>
      </MemoryRouter>,
    );
    expect(screen.getByText("3 boards")).toBeTruthy();
    expect(screen.getByTitle("Source changes waiting for review").textContent).toBe("2");
    const card = screen.getByRole("link", { name: "Open system Flight stack" });
    expect(card.getAttribute("title")).toBe("Flight boards"); // on hover, not in the card
    expect(screen.queryByText("Flight boards")).toBeNull();
    fireEvent.click(screen.getByRole("link", { name: "Open system Flight stack" }));
    expect(screen.getByText("system page")).toBeTruthy();
  });

  it("renders nothing for an empty level", () => {
    const { container } = render(<WorkspaceSystemsSection systems={[]} showHeading />);
    expect(container.innerHTML).toBe("");
  });
});
