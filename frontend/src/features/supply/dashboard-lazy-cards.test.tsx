import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("./alerts-by-day-chart", () => ({ default: ({ kinds }: { kinds: string[] }) => <div>Alerts chart: {kinds.join(",")}</div> }));
vi.mock("./project-cost-chart", () => ({ default: ({ projects }: { projects: unknown[] }) => <div>Cost chart: {projects.length}</div> }));

import { AlertsByDayCard, ProjectCostCard } from "./dashboard-lazy-cards";

afterEach(cleanup);

describe("the dashboard charts that need a chart library", () => {
  it("counts the alerts opened, by kind, and shows them as a table on request", async () => {
    render(<AlertsByDayCard days={[{ day: "2026-03-01", out_of_stock: 2, pcn: 1 }, { day: "2026-03-02", out_of_stock: 1 }]} />);
    expect(screen.getByText("4 alerts opened")).toBeTruthy();
    expect(await screen.findByText("Alerts chart: out_of_stock,pcn")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Show Alerts opened, last 30 days as a table" }));
    expect(screen.getByText("Change notice")).toBeTruthy();
  });

  it("draws nothing when no alert was opened", () => {
    render(<AlertsByDayCard days={[]} />);
    expect(screen.getByText("No alerts opened")).toBeTruthy();
    expect(screen.queryByText(/Alerts chart/)).toBeNull();
  });

  it("names the tracked projects and draws their cost", async () => {
    render(<ProjectCostCard projects={[{ project_id: "p1", project_name: "Power board", currency: "EUR", points: [["2026-03-01", 12.5]] }]} />);
    expect(screen.getByText("1 project tracked")).toBeTruthy();
    expect(await screen.findByText("Cost chart: 1")).toBeTruthy();
  });
});
