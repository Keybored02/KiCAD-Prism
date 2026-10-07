import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

const listRuns = vi.fn();
const listManufacturers = vi.fn();

vi.mock("@/lib/manufacturing", () => ({
    listRuns: (...a: unknown[]) => listRuns(...a),
    listManufacturers: (...a: unknown[]) => listManufacturers(...a),
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() } }));

// The heavy children are stubbed: this suite is about what the URL opens.
vi.mock("./run-detail", () => ({
    RunDetail: ({ runId }: { runId: string }) => <div>run-detail:{runId}</div>,
}));
vi.mock("./new-run-wizard", () => ({
    NewRunWizard: ({ initialProjectId }: { initialProjectId?: string }) => (
        <div>wizard:{initialProjectId ?? "none"}</div>
    ),
}));
vi.mock("./run-quick-view", () => ({ RunQuickView: () => null }));
vi.mock("./manufacturers-panel", () => ({ ManufacturersPanel: () => null }));

import { ManufacturingDashboard } from "./manufacturing-dashboard";

function Search() {
    return <div data-testid="search">{useLocation().search}</div>;
}

function renderAt(url: string) {
    return render(
        <MemoryRouter initialEntries={[url]}>
            <ManufacturingDashboard user={null} projects={[]} />
            <Search />
        </MemoryRouter>,
    );
}

describe("ManufacturingDashboard deep links", () => {
    afterEach(() => {
        cleanup();
        vi.clearAllMocks();
    });

    it("opens the run named in the URL, then clears the param", async () => {
        listRuns.mockResolvedValue([]);
        listManufacturers.mockResolvedValue([]);
        renderAt("/?section=manufacturing&run=run_9");
        expect(await screen.findByText("run-detail:run_9")).toBeTruthy();
        await waitFor(() => expect(screen.getByTestId("search").textContent).toBe("?section=manufacturing"));
    });

    it("opens the new production dialog for the project in the URL", async () => {
        listRuns.mockResolvedValue([]);
        listManufacturers.mockResolvedValue([]);
        renderAt("/?section=manufacturing&newRunFor=p1");
        expect(await screen.findByText("wizard:p1")).toBeTruthy();
        await waitFor(() => expect(screen.getByTestId("search").textContent).toBe("?section=manufacturing"));
    });

    it("opens nothing without those params", async () => {
        listRuns.mockResolvedValue([]);
        listManufacturers.mockResolvedValue([]);
        renderAt("/?section=manufacturing");
        await waitFor(() => expect(listRuns).toHaveBeenCalled());
        expect(screen.queryByText(/run-detail:/)).toBeNull();
        expect(screen.queryByText(/wizard:/)).toBeNull();
    });
});
