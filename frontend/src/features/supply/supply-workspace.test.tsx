import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { User, UserRole } from "@/types/auth";

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
  it.each<UserRole>(["designer", "qa", "admin"])("opens for %s on the Review tab", async (role) => {
    renderAt(role);
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

  it("falls back to Review for an unknown view in the URL", async () => {
    renderAt("admin", "/?section=supply&supplyView=nonsense");
    expect(await screen.findByText("Review content")).toBeTruthy();
  });

  it("leaves the URL alone when the open tab is clicked again", async () => {
    renderAt("admin", "/?section=supply&other=1");
    fireEvent.click(await screen.findByRole("tab", { name: "Review" }));
    expect(screen.getByLabelText("location").textContent).toBe("/?section=supply&other=1");
  });
});
