import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PartInspector } from "./part-inspector";

const selection = { kind: "component" as const, sourceContext: "3D" as const, reference: "U1", occurrence: "/sin_obc" };

describe("PartInspector", () => {
  it("names the board and waits for its design index", () => {
    render(<PartInspector part={{ selection, boardName: "OBC-1", index: { index: null, loading: true, error: null }, clear: vi.fn() }} />);
    expect(screen.getByText("On OBC-1")).toBeInTheDocument();
    expect(screen.getByText(/Loading OBC-1's design index/)).toBeInTheDocument();
  });

  it("says why the details are missing", () => {
    render(<PartInspector part={{ selection, boardName: "OBC-1", index: { index: null, loading: false, error: "Not built" }, clear: vi.fn() }} />);
    expect(screen.getByText("Component U1. Its details are unavailable: Not built")).toBeInTheDocument();
  });
});
