import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./supply-api", () => ({ addPartNumber: vi.fn(), removePartNumber: vi.fn(), markPartNumbers: vi.fn() }));

import { PartNumbers } from "./part-numbers";
import * as api from "./supply-api";

const mocked = vi.mocked(api);
const numbers = [{ mpn: "LM358DR", match_key: "LM358DR", source: "suffix" }];

beforeEach(() => vi.clearAllMocks());
afterEach(cleanup);

describe("the numbers of a part", () => {
  it("shows the catalog number and the others, and adds and removes one", async () => {
    mocked.addPartNumber.mockResolvedValue({ added: true, numbers });
    mocked.removePartNumber.mockResolvedValue(undefined);
    const changed = vi.fn();
    render(<PartNumbers partId="p1" mpn="LM358D" numbers={numbers} canEdit onChanged={changed} />);
    expect(screen.getByText("LM358D")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Add a number" }));
    fireEvent.change(screen.getByLabelText("Another number"), { target: { value: " LM358DT " } });
    fireEvent.click(screen.getByRole("button", { name: "Add" }));
    await waitFor(() => expect(mocked.addPartNumber).toHaveBeenCalledWith("p1", "LM358DT"));
    fireEvent.click(screen.getByRole("button", { name: "Remove LM358DR" }));
    await waitFor(() => expect(mocked.removePartNumber).toHaveBeenCalledWith("p1", "LM358DR"));
    expect(changed).toHaveBeenCalledTimes(2);
  });

  it("shows nothing to a reader when there are no other numbers, and no buttons when they may not edit", () => {
    const { container, rerender } = render(<PartNumbers partId="p1" mpn="LM358D" numbers={[]} canEdit={false} onChanged={vi.fn()} />);
    expect(container.textContent).toBe("");
    rerender(<PartNumbers partId="p1" mpn="LM358D" numbers={numbers} canEdit={false} onChanged={vi.fn()} />);
    expect(screen.getByText("LM358DR")).toBeTruthy();
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("offers the longer numbers the maker lists, a grade apart from a packaging, and counts one on a click", async () => {
    mocked.markPartNumbers.mockResolvedValue({ counted: 1 });
    const changed = vi.fn();
    render(<PartNumbers partId="p1" mpn="74AHC1G09GV" numbers={[]} soldAs={[{ key: "74AHC1G09GVQ100H", mpn: "74AHC1G09GV-Q100H", kind: "grade", connectors: ["DigiKey"] }]} canEdit onChanged={changed} />);
    expect(screen.getByText("74AHC1G09GV-Q100H")).toBeTruthy();
    expect(screen.getByText("grade")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Count 74AHC1G09GV-Q100H" }));
    await waitFor(() => expect(mocked.markPartNumbers).toHaveBeenCalledWith("p1", ["74AHC1G09GVQ100H"]));
    expect(changed).toHaveBeenCalled();
  });
});
