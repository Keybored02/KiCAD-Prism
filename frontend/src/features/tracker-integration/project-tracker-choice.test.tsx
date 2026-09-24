import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";

import { ProjectTrackerChoice } from "./project-tracker-choice";
import type { TrackerSettingsDraft } from "./project-tracker-settings-model";

afterEach(cleanup);

const draft: TrackerSettingsDraft = {
    connectorId: "cn_gh", useOverride: false, containerPath: "", remoteContainerId: "",
    autoMinSeverity: "minor", autoTaskClass: false, promoteMinRole: "designer",
    labels: { base: "prism", severityPrefix: "sev:", classPrefix: "class:", boardPrefix: "board:" },
};
const github = {
    id: "cn_gh", provider: "github", instanceKind: "github.com", displayName: "GitHub-Testing", baseUrl: "",
    bot: { id: null, login: null }, credentialConfigured: true, paused: false,
};

it("publishes to GitHub Issues and shows other trackers as not available yet", () => {
    render(<ProjectTrackerChoice draft={draft} setDraft={vi.fn()} connectors={[github]} isAdmin />);
    const options = screen.getAllByRole("radio");
    expect(options.map((option) => option.textContent)).toEqual([
        "GitHub Issues", "SoonGitLab Issues", "SoonJira", "SoonLinear",
    ]);
    expect(options[0].getAttribute("aria-checked")).toBe("true");
    expect(options.slice(1).every((option) => option.getAttribute("aria-disabled") === "true")).toBe(true);
    expect(screen.getByTestId("tracker-connection").textContent).toBe("Via GitHub-Testing");
});
