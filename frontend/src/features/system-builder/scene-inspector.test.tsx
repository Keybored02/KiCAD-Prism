import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SceneInspector } from "./scene-inspector";

const handlers = () => ({ onFrameBoard: vi.fn(), onOpenBoard: vi.fn(), onClear: vi.fn() });

describe("SceneInspector", () => {
  it("asks for a selection when there is none", () => {
    render(<SceneInspector selection={null} boardName={null} indexState={null} {...handlers()} />);
    expect(screen.getByText(/Select a board, component or net/)).toBeTruthy();
  });

  it("heads a board selection with the board and explains a restricted box", () => {
    const actions = handlers();
    render(
      <SceneInspector
        selection={{ kind: "board", sourceContext: "3D", occurrence: "/sin_cmbd", standIn: "restricted" }}
        boardName="CMBD" indexState={null} {...actions}
      />,
    );
    expect(screen.getByText("CMBD")).toBeTruthy();
    expect(screen.getByText(/can't see this board's design/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Frame CMBD" }));
    fireEvent.click(screen.getByRole("button", { name: "Open in Boards" }));
    expect(actions.onFrameBoard).toHaveBeenCalled();
    expect(actions.onOpenBoard).toHaveBeenCalled();
  });

  it("waits for the board's design index, and says what was picked when it is unavailable", () => {
    const selection = { kind: "net" as const, netName: "CAN0_N", sourceContext: "3D" as const, occurrence: "/sin_obc1" };
    const { rerender } = render(
      <SceneInspector selection={selection} boardName="OBC-1" indexState={{ index: null, loading: true, error: null }} {...handlers()} />,
    );
    expect(screen.getByText(/Loading OBC-1's design index/)).toBeTruthy();
    rerender(
      <SceneInspector selection={selection} boardName="OBC-1" indexState={{ index: null, loading: false, error: "not built" }} {...handlers()} />,
    );
    expect(screen.getByText(/Net CAN0_N\. Its details are unavailable: not built/)).toBeTruthy();
  });
});
