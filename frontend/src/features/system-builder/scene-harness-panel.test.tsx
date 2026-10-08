import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { PrismSystemSceneHarnessState } from "@/types/prism-semantic-viewer";

import { HarnessPanel } from "./scene-harness-panel";

const state = (patch: Partial<PrismSystemSceneHarnessState> = {}): PrismSystemSceneHarnessState => ({
  harness: { id: "shn_1", level: null, name: "WH-001" },
  segment: { id: "e1~e2", from: "e1", to: "e2", samplesMm: [[0, 0, 0], [10, 0, 0]] },
  pointMm: [5, 0, 0], autoMm: null, node: null, editable: true, ...patch,
});

function renderPanel(harness = state(), moving = true) {
  const handlers = { onAddWaypoint: vi.fn(), onAddBreakout: vi.fn(), onPinned: vi.fn(), onRemove: vi.fn() };
  render(<HarnessPanel state={harness} moving={moving} busy={false} counts={{ breakouts: 1, waypoints: 2 }} {...handlers} />);
  return handlers;
}

describe("harness panel", () => {
  it("adds a waypoint or a breakout where the tube was picked", () => {
    const handlers = renderPanel();
    expect(screen.getByText("1 breakout, 2 waypoints")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Add waypoint/ }));
    fireEvent.click(screen.getByRole("button", { name: /Add breakout/ }));
    expect(handlers.onAddWaypoint).toHaveBeenCalledOnce();
    expect(handlers.onAddBreakout).toHaveBeenCalledOnce();
  });

  it("pins and removes the targeted waypoint", () => {
    const handlers = renderPanel(state({
      node: { id: "shd_1", kind: "waypoint", auto: false, pinned: false, positionMm: [1.5, -2, 30], unsaved: true },
    }));
    expect(screen.getByLabelText("Position in millimetres").textContent).toBe("X 1.5 · Y -2 · Z 30 mm");
    expect(screen.getByText("Not saved")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Pin/ }));
    fireEvent.click(screen.getByRole("button", { name: /Remove/ }));
    expect(handlers.onPinned).toHaveBeenCalledWith(true);
    expect(handlers.onRemove).toHaveBeenCalledOnce();
  });

  it("offers no removal for the automatic breakout, and no edits outside move mode or on a subsystem", () => {
    renderPanel(state({ node: { id: "auto", kind: "breakout", auto: true, pinned: false, positionMm: [0, 0, 0], unsaved: false } }));
    expect(screen.queryByRole("button", { name: /Remove/ })).toBeNull();
    expect(screen.getByText(/stored as a breakout once moved/)).toBeTruthy();
  });

  it("explains why nothing can be edited", () => {
    renderPanel(state(), false);
    expect(screen.getByText("Switch to Route to edit")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Add waypoint/ })).toBeNull();
  });

  it("says a subsystem's harness is edited in its own system", () => {
    renderPanel(state({ harness: { id: "shn_1", level: "/sin_sub", name: "W" }, editable: false }));
    expect(screen.getByText(/belongs to a subsystem/)).toBeTruthy();
  });
});
