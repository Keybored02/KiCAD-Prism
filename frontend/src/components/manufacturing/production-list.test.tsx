import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

import { DEFAULT_FILTERS, type ProductionFilters } from "./production-filters";
import { ProductionList } from "./production-list";
import { makeRun } from "./test-fixtures";

// Radix menus need these in jsdom.
vi.stubGlobal("ResizeObserver", class {
    observe() {}
    unobserve() {}
    disconnect() {}
});
if (!Element.prototype.hasPointerCapture) {
    Element.prototype.hasPointerCapture = () => false;
}
if (!Element.prototype.scrollIntoView) {
    Element.prototype.scrollIntoView = () => {};
}

const RUNS = [
    makeRun({ id: "a", job_number: "JOB-0001", status: "draft", updated_at: "2026-01-01T00:00:00Z" }),
    makeRun({ id: "b", job_number: "JOB-0002", status: "in_production", manufacturer_name: "Beta Fab", open_defect_count: 2, updated_at: "2026-03-01T00:00:00Z" }),
    makeRun({ id: "c", job_number: "JOB-0003", status: "closed", updated_at: "2026-02-01T00:00:00Z" }),
    makeRun({ id: "x", job_number: "JOB-0004", status: "cancelled", updated_at: "2026-02-02T00:00:00Z" }),
];

function renderList(props: Partial<React.ComponentProps<typeof ProductionList>> = {}) {
    const onOpen = vi.fn();
    const onFiltersChange = vi.fn();
    const utils = render(
        <MemoryRouter>
            <ProductionList
                runs={RUNS}
                filters={DEFAULT_FILTERS}
                onFiltersChange={onFiltersChange}
                onOpen={onOpen}
                {...props}
            />
        </MemoryRouter>,
    );
    return { onOpen, onFiltersChange, ...utils };
}

describe("ProductionList", () => {
    afterEach(cleanup);

    it("shows the active runs by default and counts every status on its chip", () => {
        renderList();
        expect(screen.getByText("JOB-0001")).toBeTruthy();
        expect(screen.getByText("JOB-0002")).toBeTruthy();
        expect(screen.queryByText("JOB-0003")).toBeNull();

        const chips = screen.getByRole("group", { name: "Filter by status" });
        expect(within(chips).getByRole("button", { name: /^Active 2$/ }).getAttribute("aria-pressed")).toBe("true");
        expect(within(chips).getByRole("button", { name: /^Closed 1$/ })).toBeTruthy();
        expect(within(chips).getByRole("button", { name: /^Cancelled 1$/ })).toBeTruthy();
        expect(within(chips).getByRole("button", { name: /^All 4$/ })).toBeTruthy();
        // Cancelled runs are not active, so they stay out of the default list.
        expect(screen.queryByText("JOB-0004")).toBeNull();
    });

    it("lists cancelled runs under their own chip, with a cancelled badge", () => {
        renderList({ filters: { ...DEFAULT_FILTERS, status: "cancelled" } });
        const row = screen.getByText("JOB-0004").closest("[data-run-row]") as HTMLElement;
        expect(within(row).getByText("Cancelled")).toBeTruthy();
        expect(screen.queryByText("JOB-0001")).toBeNull();
    });

    it("changes the status filter from a chip", () => {
        const { onFiltersChange } = renderList();
        fireEvent.click(screen.getByRole("button", { name: /^Closed/ }));
        expect(onFiltersChange).toHaveBeenCalledWith({ ...DEFAULT_FILTERS, status: "closed" });
    });

    it("reports the search text and the open-defects toggle", () => {
        const { onFiltersChange } = renderList();
        fireEvent.change(screen.getByLabelText("Search production"), { target: { value: "beta" } });
        expect(onFiltersChange).toHaveBeenLastCalledWith({ ...DEFAULT_FILTERS, query: "beta" });

        fireEvent.click(screen.getByRole("button", { name: /Open defects/ }));
        expect(onFiltersChange).toHaveBeenLastCalledWith({ ...DEFAULT_FILTERS, openDefectsOnly: true });
    });

    it("applies the filters it is given", () => {
        renderList({ filters: { ...DEFAULT_FILTERS, status: "all", openDefectsOnly: true } });
        expect(screen.getByText("JOB-0002")).toBeTruthy();
        expect(screen.queryByText("JOB-0001")).toBeNull();
    });

    it("opens a run on click, Enter and Space", () => {
        const { onOpen } = renderList();
        const row = screen.getByText("JOB-0002").closest("[data-run-row]") as HTMLElement;
        fireEvent.click(row);
        fireEvent.keyDown(row, { key: "Enter" });
        fireEvent.keyDown(row, { key: " " });
        expect(onOpen).toHaveBeenCalledTimes(3);
        expect(onOpen).toHaveBeenCalledWith("b");
    });

    it("moves focus between rows with the arrow keys", () => {
        renderList();
        const rows = Array.from(document.querySelectorAll<HTMLElement>("[data-run-row]"));
        expect(rows).toHaveLength(2);
        rows[0].focus();
        fireEvent.keyDown(rows[0], { key: "ArrowDown" });
        expect(document.activeElement).toBe(rows[1]);
        fireEvent.keyDown(rows[1], { key: "ArrowUp" });
        expect(document.activeElement).toBe(rows[0]);
    });

    it("marks the selected row", () => {
        renderList({ selectedId: "b" });
        const row = screen.getByText("JOB-0002").closest("[data-run-row]") as HTMLElement;
        expect(row.getAttribute("aria-pressed")).toBe("true");
    });

    it("shows open defects on a row and an updated time", () => {
        renderList();
        const row = screen.getByText("JOB-0002").closest("[data-run-row]") as HTMLElement;
        expect(within(row).getByTitle("2 open defect(s)")).toBeTruthy();
        expect(within(row).getByText("In production")).toBeTruthy();
    });

    it("leaves out the project name when the list is one project's", () => {
        renderList({ hideProject: true });
        expect(screen.getByText("Job / Board")).toBeTruthy();
        expect(screen.queryByText("Job / Project")).toBeNull();
    });

    it("explains an empty list and offers the action it was given", () => {
        renderList({ runs: [], emptyAction: <button type="button">Start one</button> });
        expect(screen.getByText("No production yet.")).toBeTruthy();
        expect(screen.getByRole("button", { name: "Start one" })).toBeTruthy();
    });

    it("explains a filtered-out list and clears the filters", () => {
        const filters: ProductionFilters = { ...DEFAULT_FILTERS, status: "ordered", query: "zzz" };
        const { onFiltersChange } = renderList({ filters });
        expect(screen.getByText("No production matches these filters.")).toBeTruthy();
        fireEvent.click(screen.getByRole("button", { name: "Clear filters" }));
        expect(onFiltersChange).toHaveBeenCalledWith({ ...filters, status: "active", query: "", openDefectsOnly: false });
    });

    it("groups rows under a labelled header", () => {
        const { unmount } = renderList();
        // Ungrouped: the name shows once, on its row.
        expect(screen.getAllByText("Beta Fab")).toHaveLength(1);
        unmount();
        renderList({ filters: { ...DEFAULT_FILTERS, status: "all", group: "manufacturer" } });
        // Grouped: once more as the group's header.
        expect(screen.getAllByText("Beta Fab")).toHaveLength(2);
        expect(screen.getAllByText("Acme Fab").length).toBeGreaterThan(1);
    });

    it("changes grouping and sorting from the View menu", async () => {
        const { onFiltersChange } = renderList();
        fireEvent.keyDown(screen.getByRole("button", { name: /View/ }), { key: "Enter" });
        fireEvent.click(await screen.findByRole("menuitemradio", { name: "Manufacturer" }));
        expect(onFiltersChange).toHaveBeenLastCalledWith({ ...DEFAULT_FILTERS, group: "manufacturer" });

        fireEvent.keyDown(screen.getByRole("button", { name: /View/ }), { key: "Enter" });
        fireEvent.click(await screen.findByRole("menuitemradio", { name: "Job number" }));
        expect(onFiltersChange).toHaveBeenLastCalledWith({ ...DEFAULT_FILTERS, sort: "job" });
    });
});
