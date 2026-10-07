import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { PrismSemanticViewerElement, PrismSystemBoardViewState } from "@/types/prism-semantic-viewer";

import { BoardLayerSections } from "./semantic-3d-board-layers";

const layers = [
  { id: 1, name: "F.Cu", color: "rgb(200 50 50)", visible: true },
  { id: 4, name: "B.Cu", color: "rgb(50 50 200)", visible: false },
];
const boards: PrismSystemBoardViewState[] = [
  { key: "/sin_obc1", name: "OBC-1", standIn: null, layers },
  { key: "/sin_obc2", name: "OBC-2", standIn: null, layers },
  { key: "/sin_cmbd", name: "CMBD", standIn: "restricted", layers: [] },
];

describe("BoardLayerSections", () => {
  it("opens the selected board and toggles a layer on that placement only", () => {
    const setLayerVisible = vi.fn();
    const viewer = { setLayerVisible } as unknown as PrismSemanticViewerElement;
    render(<BoardLayerSections viewer={viewer} boards={boards} selectedBoard="/sin_obc2" />);
    expect(screen.getByRole("button", { name: "OBC-1" }).getAttribute("aria-expanded")).toBe("false");
    expect(screen.getByRole("button", { name: "OBC-2" }).getAttribute("aria-expanded")).toBe("true");
    expect(screen.getAllByText("1/2")).toHaveLength(2);
    expect(screen.getByText("Restricted")).toBeTruthy();
    // OBC-2's section is the only one open: its F.Cu eye hides F.Cu on OBC-2.
    const section = screen.getByRole("region", { name: "OBC-2 layers" });
    fireEvent.click(within(section).getByRole("button", { name: "Hide F.Cu" }));
    expect(setLayerVisible).toHaveBeenCalledWith(1, false, "/sin_obc2");
  });

  it("frames a board from its section", () => {
    const frameBoard = vi.fn();
    render(<BoardLayerSections viewer={{ frameBoard } as unknown as PrismSemanticViewerElement} boards={boards} selectedBoard={null} />);
    fireEvent.click(screen.getByRole("button", { name: "Frame CMBD" }));
    expect(frameBoard).toHaveBeenCalledWith("/sin_cmbd");
  });
});
