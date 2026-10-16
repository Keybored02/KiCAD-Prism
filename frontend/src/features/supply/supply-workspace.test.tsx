import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { User, UserRole } from "@/types/auth";

vi.mock("./dashboard-view", () => ({ DashboardView: () => <div>Dashboard content</div> }));
vi.mock("./insights-view", () => ({ InsightsView: ({ view }: { view: string }) => <div>Insights content {view}</div> }));
vi.mock("./parts-view", () => ({ PartsView: () => <div>Parts content</div> }));
vi.mock("./connectors-view", () => ({ SupplyConnectorsView: () => <div>Connectors content</div> }));
vi.mock("./review-view", () => ({ ReviewView: () => <div>Review content</div> }));
vi.mock("./projects-view", () => ({ ProjectsView: () => <div>Projects content</div> }));

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
  it.each<UserRole>(["designer", "qa", "admin"])("opens for %s on the Dashboard tab", async (role) => {
    renderAt(role);
    expect(await screen.findByText("Dashboard content")).toBeTruthy();
    expect(screen.getByRole("tab", { name: "Dashboard" }).getAttribute("aria-selected")).toBe("true");
  });

  it("has six tabs", async () => {
    renderAt("qa");
    expect((await screen.findAllByRole("tab")).map((tab) => tab.textContent)).toEqual(["Dashboard", "Parts", "Projects", "Review", "Insights", "Connectors"]);
  });

  it("keeps old addresses working", async () => {
    renderAt("qa", "/?section=supply&supplyView=inbox");
    expect(await screen.findByText("Dashboard content")).toBeTruthy();
    cleanup();
    renderAt("qa", "/?section=supply&supplyView=planning");
    expect(await screen.findByText("Insights content planning")).toBeTruthy();
    cleanup();
    renderAt("qa", "/?section=supply&supplyView=market");
    expect(await screen.findByText("Insights content market")).toBeTruthy();
    cleanup();
    renderAt("qa", "/?section=supply&supplyView=bom-file");
    expect(await screen.findByText("Parts content")).toBeTruthy();
  });

  it("has the Connectors tab, where a DigiKey sign-in returns and says how it went", async () => {
    renderAt("admin", "/?section=supply&supplyView=connectors&signin=ok");
    expect(await screen.findByText("Connectors content")).toBeTruthy();
    expect(screen.getByRole("tab", { name: "Connectors" }).getAttribute("aria-selected")).toBe("true");
    await waitFor(() => expect(screen.getByLabelText("location").textContent).toBe("/?section=supply&supplyView=connectors"));
  });

  it("shows Review when asked for it", async () => {
    renderAt("qa", "/?section=supply&supplyView=review");
    expect(await screen.findByText("Review content")).toBeTruthy();
    expect(screen.getByRole("tab", { name: "Review" }).getAttribute("aria-selected")).toBe("true");
  });

  it("titles each tab and keeps the settings off the other tabs", async () => {
    renderAt("admin", "/?section=supply&supplyView=connectors");
    expect(await screen.findByRole("heading", { name: "Distributor Connectors" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Supply settings" })).toBeNull();
  });

  it("is closed to viewers and signed-out users, and says why", () => {
    renderAt("viewer");
    expect(screen.getByText("Supply data is not available to your role")).toBeTruthy();
    expect(screen.queryByText("Review content")).toBeNull();
    cleanup();
    renderAt(null);
    expect(screen.getByText("Supply data is not available to your role")).toBeTruthy();
  });

  it("falls back to the Dashboard for an unknown view in the URL", async () => {
    renderAt("admin", "/?section=supply&supplyView=nonsense");
    expect(await screen.findByText("Dashboard content")).toBeTruthy();
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
    fireEvent.click(await screen.findByRole("tab", { name: "Dashboard" }));
    expect(screen.getByLabelText("location").textContent).toBe("/?section=supply&other=1");
  });
});
