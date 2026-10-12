import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { User, UserRole } from "@/types/auth";
import { alertFixture } from "./supply-test-fixtures";

vi.mock("./supply-api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./supply-api")>()),
  listSupplyAlerts: vi.fn(),
  acknowledgeSupplyAlert: vi.fn(),
  snoozeSupplyAlert: vi.fn(),
}));

import * as api from "./supply-api";
import { InboxView } from "./inbox-view";

const mocked = vi.mocked(api);

function Location() {
  return <output aria-label="location">{useLocation().search}</output>;
}

function renderView(role: UserRole = "designer") {
  const user: User = { name: role, email: `${role}@example.com`, role };
  render(
    <MemoryRouter initialEntries={["/?section=supply&supplyView=inbox"]}>
      <InboxView user={user} />
      <Location />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mocked.listSupplyAlerts.mockResolvedValue({
    items: [
      alertFixture({ id: 1, kind: "part_lost", severity: "error", mpn: "GONE-1", detail: { problem: "gone" } }),
      alertFixture({ id: 2 }),
      alertFixture({ id: 3, kind: "lifecycle", severity: "fatal", mpn: "EOL-1", detail: { lifecycle: "obsolete" } }),
      alertFixture({ id: 4, kind: "out_of_stock", severity: "error", mpn: "OOS-1", detail: { stock: 0 } }),
      alertFixture({ id: 5, kind: "rupture_soon", mpn: "DRAIN-1", detail: { days_to_zero: 9, decrease_per_day: 40, confidence: "medium" } }),
      alertFixture({ id: 6, kind: "price_up", mpn: "PRICEY-1", detail: { change_percent: 30, days: 20, was: "1", now: "1.3", currency: "EUR" } }),
    ],
  });
});
afterEach(cleanup);

describe("the inbox", () => {
  it("says what each alert is about in plain words", async () => {
    renderView();
    expect(await screen.findByText("Every listing for this part has disappeared")).toBeTruthy();
    expect(screen.getByText("40 in stock, at or below the 100 you set")).toBeTruthy();
    expect(screen.getByText("Marked obsolete")).toBeTruthy();
    expect(screen.getByText("Out of stock")).toBeTruthy();
    expect(screen.getByText("Could run out in about 9 days at the recent rate (medium confidence)")).toBeTruthy();
    expect(screen.getByText("Cheapest price up 30% in 20 days, from 1 to 1.3 EUR")).toBeTruthy();
  });

  it("opens the part from the alert", async () => {
    renderView();
    fireEvent.click(await screen.findByRole("button", { name: "GONE-1" }));
    const search = screen.getByLabelText("location").textContent ?? "";
    expect(search).toContain("supplyView=parts");
    expect(search).toContain("part=p1");
  });

  it("acknowledges and then reloads", async () => {
    mocked.acknowledgeSupplyAlert.mockResolvedValue(undefined);
    renderView();
    fireEvent.click((await screen.findAllByRole("button", { name: /Acknowledge/ }))[1]);
    await waitFor(() => expect(mocked.acknowledgeSupplyAlert).toHaveBeenCalledWith(2));
    await waitFor(() => expect(mocked.listSupplyAlerts).toHaveBeenCalledTimes(2));
  });

  it("snoozes for the chosen time", async () => {
    mocked.snoozeSupplyAlert.mockResolvedValue(undefined);
    renderView();
    const trigger = (await screen.findAllByRole("button", { name: /Snooze/ }))[0];
    fireEvent.keyDown(trigger, { key: "Enter" });
    fireEvent.click(await screen.findByRole("menuitem", { name: "1 day" }));
    await waitFor(() => expect(mocked.snoozeSupplyAlert).toHaveBeenCalledWith(1, 24));
  });

  it("shows a quiet alert without a second acknowledge", async () => {
    mocked.listSupplyAlerts.mockResolvedValue({
      items: [alertFixture({ state: "acknowledged", acknowledged_by: "ana@example.com" })],
    });
    renderView();
    expect(await screen.findByText("Acknowledged by ana@example.com")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Acknowledge/ })).toBeNull();
    expect(screen.getByRole("button", { name: /Snooze/ })).toBeTruthy();
  });

  it("gives readers the list without the buttons", async () => {
    renderView("qa");
    expect(await screen.findByText("Out of stock")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Acknowledge/ })).toBeNull();
    expect(screen.queryByRole("button", { name: /Snooze/ })).toBeNull();
    expect(screen.getByText(/Designers and administrators acknowledge and snooze/)).toBeTruthy();
  });

  it("shows cleared alerts on request", async () => {
    renderView();
    await screen.findByText("Out of stock");
    mocked.listSupplyAlerts.mockResolvedValue({
      items: [alertFixture({ state: "resolved", resolved_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString() })],
    });
    fireEvent.click(screen.getByLabelText("Show cleared"));
    expect(await screen.findByText("Cleared 2 h ago")).toBeTruthy();
    expect(mocked.listSupplyAlerts).toHaveBeenLastCalledWith(true, expect.anything());
    expect(screen.queryByRole("button", { name: /Acknowledge/ })).toBeNull();
  });

  it("explains an empty inbox", async () => {
    mocked.listSupplyAlerts.mockResolvedValue({ items: [] });
    renderView();
    expect(await screen.findByText("Nothing needs you")).toBeTruthy();
  });

  it("shows an action's failure and keeps the list", async () => {
    mocked.acknowledgeSupplyAlert.mockRejectedValue(new Error("This alert has already cleared."));
    renderView();
    fireEvent.click((await screen.findAllByRole("button", { name: /Acknowledge/ }))[0]);
    const alerts = await screen.findAllByRole("alert");
    expect(alerts.some((node) => node.textContent?.includes("already cleared"))).toBe(true);
    expect(within(screen.getByRole("list")).getAllByRole("listitem")).toHaveLength(6);
  });

  it("reports a load failure and retries", async () => {
    mocked.listSupplyAlerts.mockRejectedValueOnce(new Error("Backend is down")).mockResolvedValue({ items: [] });
    renderView();
    expect(await screen.findByText("Backend is down")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(await screen.findByText("Nothing needs you")).toBeTruthy();
  });
});
