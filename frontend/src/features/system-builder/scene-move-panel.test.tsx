import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { PrismSystemSceneMoveState } from "@/types/prism-semantic-viewer";

import { MovePanel, fieldsPose, poseFields } from "./scene-move-panel";

const S = Math.SQRT1_2;
const target = (patch: Partial<NonNullable<PrismSystemSceneMoveState["target"]>> = {}) => ({
  occurrence: "/sin_obc", instanceId: "sin_obc", displayPath: "OBC-1", kind: "board", restricted: false,
  pose: { translationMm: [12.5, -3, 0] as [number, number, number], rotation: [0, 0, S, S] as [number, number, number, number] },
  source: "default" as const, unsaved: false, ...patch,
});
const state = (patch: Partial<PrismSystemSceneMoveState> = {}): PrismSystemSceneMoveState => ({
  allowed: true, enabled: true, space: "world", dragging: false, target: target(), ...patch,
});

function renderPanel(moveState = state()) {
  const handlers = {
    onPreview: vi.fn(), onSave: vi.fn(), onRevert: vi.fn(), onDefault: vi.fn(), onResetAll: vi.fn(), onSpace: vi.fn(),
  };
  const view = render(<MovePanel state={moveState} busy={false} {...handlers} />);
  return { ...handlers, view };
}

describe("move panel fields", () => {
  it("shows millimetres and degrees, and reads them back", () => {
    const fields = poseFields(target().pose);
    expect(fields).toEqual(["12.5", "-3", "0", "0", "0", "90"]);
    const pose = fieldsPose(fields)!;
    expect(pose.translationMm).toEqual([12.5, -3, 0]);
    pose.rotation.forEach((value, index) => expect(Math.abs(value - [0, 0, S, S][index])).toBeLessThan(1e-9));
    expect(fieldsPose(["1", "", "0", "0", "0", "0"])).toBeNull();
    expect(fieldsPose(["1", "-", "0", "0", "0", "0"])).toBeNull();
  });
});

describe("MovePanel", () => {
  it("asks for a selection when nothing is targeted", () => {
    const { onResetAll } = renderPanel(state({ target: null }));
    expect(screen.getByText(/Select a board to move it/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Reset all positions/ }));
    expect(onResetAll).toHaveBeenCalled();
  });

  it("previews while typing and saves the typed position with Enter", () => {
    const { onPreview, onSave } = renderPanel();
    const y = screen.getByLabelText("Y in millimetres");
    fireEvent.change(y, { target: { value: "-" } });
    expect(onPreview).not.toHaveBeenCalled();
    expect((y as HTMLInputElement).value).toBe("-"); // half-typed numbers stay
    expect(screen.getByRole("alert").textContent).toMatch(/Every field needs a number/);
    fireEvent.change(y, { target: { value: "-40" } });
    expect(onPreview).toHaveBeenLastCalledWith(expect.objectContaining({ translationMm: [12.5, -40, 0] }));
    fireEvent.submit(y.closest("form")!);
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({
      instanceId: "sin_obc", pose: expect.objectContaining({ translationMm: [12.5, -40, 0] }),
    }));
  });

  it("puts the position back with Esc", () => {
    const { onRevert } = renderPanel(state({ target: target({ unsaved: true }) }));
    fireEvent.keyDown(screen.getByLabelText("Rotate Z in degrees"), { key: "Escape" });
    expect(onRevert).toHaveBeenCalled();
  });

  it("offers going back to the default place only for a moved board", () => {
    const { onDefault, view } = renderPanel(state({ target: target({ source: "manual" }) }));
    expect(screen.getByText("Moved")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Back to default" }));
    expect(onDefault).toHaveBeenCalledWith(expect.objectContaining({ instanceId: "sin_obc" }));
    view.unmount();
    renderPanel();
    expect(screen.getByText("Default place")).toBeTruthy();
    expect((screen.getByRole("button", { name: "Back to default" }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("says a child system moves as one group, and switches axes", () => {
    const { onSpace } = renderPanel(state({ target: target({ kind: "assembly", displayPath: "C&DH" }) }));
    expect(screen.getByText(/A child system: it moves as one group/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Board" }));
    expect(onSpace).toHaveBeenCalledWith("local");
  });
});
