import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { User, UserRole } from "@/types/auth";

vi.mock("./overview-view", () => ({ OverviewView: () => <div>Overview content</div> }));
vi.mock("./inbox-view", () => ({ InboxView: () => <div>Inbox content</div> }));
vi.mock("./parts-view", () => ({ PartsView: () => <div>Parts content</div> }));
vi.mock("./review-view", () => ({ ReviewView: () => <div>Review content</div> }));

import { SupplyWorkspace } from "./supply-workspace";

afterEach(cleanup);

function Location() {
  const location = useLocation();
  return <output aria-label="location">{`${location.pathname}${location.search}`}</output>;
}

function renderAt(role: UserRole | null, url = "/?section=supply") {
  const user: User | null = role ? { name: "U", email: "u@example.com", role } : null;
  render(
    <MemoryRouter initialEntries={[url]}>
      <SupplyWorkspace user={user} />
      <Location />
    </MemoryRouter>,
  );
}

describe("the Supply section", () => {
  it.each<UserRole>(["designer", "qa", "admin"])("opens for %s on the Overview tab", async (role) => {
    renderAt(role);
    expect(await screen.findByText("Overview content")).toBeTruthy();
    expect(screen.getByRole("tab", { name: "Overview" }).getAttribute("aria-selected")).toBe("true");
  });

  it("has Parts and Inbox tabs too", async () => {
    renderAt("qa", "/?section=supply&supplyView=parts");
    expect(await screen.findByText("Parts content")).toBeTruthy();
    cleanup();
    renderAt("qa", "/?section=supply&supplyView=inbox");
    expect(await screen.findByText("Inbox content")).toBeTruthy();
  });

  it("shows Review when asked for it", async () => {
    renderAt("qa", "/?section=supply&supplyView=review");
    expect(await screen.findByText("Review content")).toBeTruthy();
    expect(screen.getByRole("tab", { name: "Review" }).getAttribute("aria-selected")).toBe("true");
  });

  it("is closed to viewers and signed-out users, and says why", () => {
    renderAt("viewer");
    expect(screen.getByText("Supply data is not available to your role")).toBeTruthy();
    expect(screen.queryByText("Review content")).toBeNull();
    cleanup();
    renderAt(null);
    expect(screen.getByText("Supply data is not available to your role")).toBeTruthy();
  });

  it("falls back to the Overview for an unknown view in the URL", async () => {
    renderAt("admin", "/?section=supply&supplyView=nonsense");
    expect(await screen.findByText("Overview content")).toBeTruthy();
  });

  it("drops the open part and search when another tab is chosen", async () => {
    renderAt("admin", "/?section=supply&part=p1&partsQ=lm&partsScope=all&other=1");
    // Radix tabs switch on mouse down, as a real press does.
    fireEvent.mouseDown(await screen.findByRole("tab", { name: "Review" }), { button: 0, ctrlKey: false });
    const location = screen.getByLabelText("location").textContent ?? "";
    expect(location).toContain("supplyView=review");
    expect(location).toContain("other=1");
    for (const gone of ["part=", "partsQ", "partsScope"]) expect(location).not.toContain(gone);
  });

  it("leaves the URL alone when the open tab is clicked again", async () => {
    renderAt("admin", "/?section=supply&other=1");
    fireEvent.click(await screen.findByRole("tab", { name: "Overview" }));
    expect(screen.getByLabelText("location").textContent).toBe("/?section=supply&other=1");
  });
});
