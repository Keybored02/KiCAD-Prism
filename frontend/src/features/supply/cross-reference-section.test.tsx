import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("./supply-api", () => ({ getCrossReference: vi.fn(), addComponentSource: vi.fn() }));

import { CrossReferenceSection } from "./cross-reference-section";
import * as api from "./supply-api";

const result = {
  candidates: [
    { part_id: "p2", manufacturer: "Globex", mpn: "G-10K", grade: "direct" as const, grade_label: "Direct replacement", same: ["resistance", "package"], differs: [], stock: 500, status: "ok" as const, lifecycle: "active" as const },
    { part_id: "p3", manufacturer: "Globex", mpn: "G-10K-0805", grade: "functional" as const, grade_label: "Same function, other package", same: ["resistance"], differs: ["package"], stock: null, status: "unknown" as const, lifecycle: "unknown" as const },
  ],
  suggested_by_distributors: ["R-10K-NEW"], judged_on: ["resistance", "package"], component_id: "c1",
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(api.getCrossReference).mockResolvedValue(result);
  vi.mocked(api.addComponentSource).mockResolvedValue({ id: "s1", approval: "pending" });
});
afterEach(cleanup);

describe("alternatives to a part", () => {
  it("looks only when asked, grades each, and proposes one to the part's component", async () => {
    render(<CrossReferenceSection partId="p1" canEdit />);
    expect(api.getCrossReference).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Find alternatives" }));
    expect(await screen.findByText("Direct replacement")).toBeTruthy();
    expect(screen.getByText("Same function, other package")).toBeTruthy();
    expect(screen.getByText(/Distributors suggest: R-10K-NEW/)).toBeTruthy();
    expect(screen.getByText(/Differs: package/)).toBeTruthy();
    fireEvent.click(screen.getAllByRole("button", { name: "Propose as alternate" })[0]);
    await waitFor(() => expect(api.addComponentSource).toHaveBeenCalledWith("c1", "Globex", "G-10K"));
  });

  it("offers no proposal to someone who cannot edit, or when no component has the part", async () => {
    vi.mocked(api.getCrossReference).mockResolvedValue({ ...result, component_id: null });
    render(<CrossReferenceSection partId="p1" canEdit />);
    fireEvent.click(screen.getByRole("button", { name: "Find alternatives" }));
    await screen.findByText("Direct replacement");
    expect(screen.queryByRole("button", { name: "Propose as alternate" })).toBeNull();
  });
});
