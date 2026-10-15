import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("./supply-api", () => ({ planSupplyBuild: vi.fn() }));

import { toast } from "sonner";
import type { ProjectSupplyPart } from "@/types/supply";
import { ProjectPlanButton } from "./project-plan-button";
import { planSupplyBuild } from "./supply-api";

afterEach(cleanup);

const parts = [
  { key: "k1", manufacturer: "Acme", mpn: "A-1", quantity: 2 },
  { key: "k2", manufacturer: "", mpn: "", quantity: 1 },
] as ProjectSupplyPart[];

describe("the project's Add to plan", () => {
  it("sends the lines that have a part number under the typed name and date", async () => {
    vi.mocked(planSupplyBuild).mockResolvedValue({ parts: 1, replaced: 0 });
    const done = vi.fn();
    render(<ProjectPlanButton projectId="prj" parts={parts} onDone={done} />);
    fireEvent.click(screen.getByRole("button", { name: "Add to plan" }));
    fireEvent.change(screen.getByLabelText("Boards to build"), { target: { value: "25" } });
    fireEvent.change(screen.getByLabelText("Plan name"), { target: { value: "Spring run" } });
    fireEvent.change(screen.getByLabelText("Needed by"), { target: { value: "2026-05-01" } });
    fireEvent.click(screen.getByRole("button", { name: "Add" }));
    await waitFor(() => expect(planSupplyBuild).toHaveBeenCalledWith({
      name: "Spring run", projectId: "prj", lines: [{ key: "k1", manufacturer: "Acme", mpn: "A-1", quantity: 2 }],
      buildQuantity: 25, attritionPercent: 0, needBy: "2026-05-01",
    }));
    await waitFor(() => expect(done).toHaveBeenCalled());
    expect(toast.success).toHaveBeenCalled();
  });

  it("names the plan after the boards, and shows the reason when it fails", async () => {
    vi.mocked(planSupplyBuild).mockRejectedValue(new Error("No room"));
    render(<ProjectPlanButton projectId="prj" parts={parts} onDone={() => undefined} />);
    fireEvent.click(screen.getByRole("button", { name: "Add to plan" }));
    fireEvent.click(screen.getByRole("button", { name: "Add" }));
    await waitFor(() => expect(planSupplyBuild).toHaveBeenCalledWith(expect.objectContaining({ name: "10 boards", needBy: null })));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("No room"));
  });
});
