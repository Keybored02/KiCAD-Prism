import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ listConnectors: vi.fn() }));
vi.mock("@/lib/trackers-client", () => ({ listConnectors: mocks.listConnectors }));
vi.mock("./project-tracker-settings", () => ({
    ProjectTrackerSettingsPanel: ({ projectId }: { projectId: string }) => <div>Project {projectId} policy</div>,
}));
vi.mock("./connector-settings", () => ({
    ConnectorSettings: ({ connectorId }: { connectorId: string | null }) => (
        <div>Editing {connectorId ?? "new connection"}</div>
    ),
}));

import { TrackerSettingsDialog } from "./tracker-settings-dialog";

afterEach(() => {
    cleanup();
    mocks.listConnectors.mockReset();
});

it("lets an admin select a configured connection without hiding project policy", async () => {
    mocks.listConnectors.mockResolvedValue([{ id: "cn_1", displayName: "GitHub installation" }]);
    render(<TrackerSettingsDialog projectId="prj_1" isAdmin open onOpenChange={vi.fn()} />);

    expect(screen.getByText("Project prj_1 policy")).toBeTruthy();
    // Radix tabs activate on mousedown, not click.
    fireEvent.mouseDown(screen.getByRole("tab", { name: "Connections" }));
    await waitFor(() => expect(screen.getByText("Editing cn_1")).toBeTruthy());
    fireEvent.click(screen.getByRole("button", { name: "Add connection" }));
    expect(screen.getByText("Editing new connection")).toBeTruthy();
});
