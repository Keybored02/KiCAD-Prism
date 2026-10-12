import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import { toast } from "sonner";
import { BomPlanButton } from "./bom-plan-button";
import type { BomSupply } from "./use-bom-supply";

afterEach(cleanup);

function supplyWith(planBuild: BomSupply["planBuild"]): BomSupply {
  return { buildQuantity: 25, planBuild } as unknown as BomSupply;
}

describe("the Add to plan button", () => {
  it("sends the build under the typed name and date, and says what it did", async () => {
    const planBuild = vi.fn().mockResolvedValue({ parts: 40, replaced: 38 });
    render(<BomPlanButton supply={supplyWith(planBuild)} />);
    fireEvent.click(screen.getByRole("button", { name: "Add to plan" }));
    fireEvent.change(screen.getByLabelText("Plan name"), { target: { value: "Spring run" } });
    fireEvent.change(screen.getByLabelText("Needed by"), { target: { value: "2026-05-01" } });
    fireEvent.click(screen.getByRole("button", { name: "Add" }));
    await waitFor(() => expect(planBuild).toHaveBeenCalledWith("Spring run", "2026-05-01"));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('"Spring run" asks for 40 parts', { description: "It replaced 38 earlier lines under that name." }));
  });

  it("names the plan after the build when no name is typed, and shows the reason when it fails", async () => {
    const planBuild = vi.fn().mockRejectedValue(new Error("Give the plan a name"));
    render(<BomPlanButton supply={supplyWith(planBuild)} />);
    fireEvent.click(screen.getByRole("button", { name: "Add to plan" }));
    fireEvent.click(screen.getByRole("button", { name: "Add" }));
    await waitFor(() => expect(planBuild).toHaveBeenCalledWith("25 boards", null));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Give the plan a name"));
  });
});
