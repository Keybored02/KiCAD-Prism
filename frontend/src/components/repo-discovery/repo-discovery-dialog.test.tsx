import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { DiscoveredRepository } from "@/lib/repo-discovery";

const discovery = vi.hoisted(() => ({
  loadDiscoverySources: vi.fn(),
  loadDiscoveredRepositories: vi.fn(),
  startDiscoveryScan: vi.fn(),
  setRepositoryDismissed: vi.fn(),
}));
const jobs = vi.hoisted(() => ({ watchPrismJob: vi.fn(), isAbortError: () => false }));

vi.mock("@/lib/repo-discovery", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/repo-discovery")>()),
  ...discovery,
}));
vi.mock("@/lib/jobs", () => jobs);

// The real dialog is covered by its own tests; here it only records how it was opened.
vi.mock("../import-dialog", () => ({
  ImportDialog: (props: {
    initialUrl?: string;
    onNext?: () => void;
    onOpenChange: (open: boolean) => void;
    onImportComplete: () => void;
  }) => (
    <div role="dialog" aria-label="import">
      <span>importing {props.initialUrl}</span>
      <button onClick={props.onImportComplete}>finish</button>
      {props.onNext && <button onClick={props.onNext}>next</button>}
      <button onClick={() => props.onOpenChange(false)}>close import</button>
    </div>
  ),
}));

import { RepoDiscoveryDialog } from "./repo-discovery-dialog";

function repo(name: string, overrides: Partial<DiscoveredRepository> = {}): DiscoveredRepository {
  return {
    id: `id-${name}`,
    fullName: name,
    webUrl: `https://git.example.com/${name}`,
    cloneUrl: `git@git.example.com:${name}.git`,
    defaultBranch: "main",
    archived: false,
    state: "kicad",
    projects: [{ name: "psu", relative_path: ".", project_key: ".::psu.kicad_pro", has_schematic: true, has_pcb: true }],
    importedCount: 0,
    repositoryImported: false,
    dismissed: false,
    error: "",
    scannedAt: null,
    ...overrides,
  };
}

const SOURCE = { id: "cn_gl", provider: "gitlab", displayName: "Acme GitLab", host: "git.example.com" };

function open(onImported = vi.fn()) {
  render(<RepoDiscoveryDialog open onOpenChange={vi.fn()} onImported={onImported} />);
  return onImported;
}

describe("repository discovery dialog", () => {
  beforeEach(() => {
    Object.values(discovery).forEach((mock) => mock.mockReset());
    jobs.watchPrismJob.mockReset();
    discovery.loadDiscoverySources.mockResolvedValue([SOURCE]);
    discovery.loadDiscoveredRepositories.mockResolvedValue({
      candidates: [repo("hw/a"), repo("hw/b", { importedCount: 1 }), repo("hw/c")],
      hiddenCount: 0,
    });
  });

  it("lists what is left to import and says when no host is connected", async () => {
    open();
    await screen.findByText("hw/a");
    expect(screen.getByText("hw/c")).toBeInTheDocument();
    // Fully imported, so hidden until asked for.
    expect(screen.queryByText("hw/b")).toBeNull();
    fireEvent.click(screen.getByLabelText("Already imported"));
    expect(screen.getByText("hw/b")).toBeInTheDocument();
  });

  it("explains that nothing is connected", async () => {
    discovery.loadDiscoverySources.mockResolvedValue([]);
    open();
    expect(await screen.findByText(/No connected host supports discovery/)).toBeInTheDocument();
  });

  it("opens the import dialog on the repository's clone URL, then goes on to the next one", async () => {
    open();
    await screen.findByText("hw/a");
    fireEvent.click(screen.getAllByRole("button", { name: "Import" })[0]);
    expect(await screen.findByText("importing git@git.example.com:hw/a.git")).toBeInTheDocument();

    // The next one with something to import: hw/b is already imported, so hw/c.
    fireEvent.click(screen.getByText("next"));
    expect(await screen.findByText("importing git@git.example.com:hw/c.git")).toBeInTheDocument();
  });

  it("offers no next repository after the last one", async () => {
    open();
    await screen.findByText("hw/a");
    fireEvent.click(screen.getAllByRole("button", { name: "Import" })[1]);
    await screen.findByText("importing git@git.example.com:hw/c.git");
    expect(screen.queryByText("next")).toBeNull();
  });

  it("refreshes the workspace and the list after an import, and returns to the list on close", async () => {
    const onImported = open();
    await screen.findByText("hw/a");
    fireEvent.click(screen.getAllByRole("button", { name: "Import" })[0]);
    await screen.findByText(/importing/);
    discovery.loadDiscoveredRepositories.mockClear();

    fireEvent.click(screen.getByText("finish"));
    expect(onImported).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(discovery.loadDiscoveredRepositories).toHaveBeenCalledWith("cn_gl"));

    fireEvent.click(screen.getByText("close import"));
    expect(await screen.findByText("Discover repositories")).toBeInTheDocument();
  });

  it("scans the host and shows what it found", async () => {
    discovery.loadDiscoveredRepositories.mockResolvedValueOnce({ candidates: [], hiddenCount: 0 });
    discovery.startDiscoveryScan.mockResolvedValue({ job_id: "job-1" });
    jobs.watchPrismJob.mockResolvedValue({ status: "completed" });
    open();
    fireEvent.click(await screen.findByRole("button", { name: "Scan host" }));

    expect(await screen.findByText("hw/a")).toBeInTheDocument();
    expect(discovery.startDiscoveryScan).toHaveBeenCalledWith("cn_gl");
  });

  it("shows why a scan failed", async () => {
    discovery.startDiscoveryScan.mockResolvedValue({ job_id: "job-1" });
    jobs.watchPrismJob.mockResolvedValue({ status: "failed", error_message: "Connector has no credentials" });
    open();
    fireEvent.click(await screen.findByRole("button", { name: "Rescan" }));
    expect(await screen.findByText("Connector has no credentials")).toBeInTheDocument();
  });

  it("hides a repository from the list when dismissed", async () => {
    discovery.setRepositoryDismissed.mockResolvedValue({ id: "id-hw/a", dismissed: true });
    open();
    await screen.findByText("hw/a");
    fireEvent.click(screen.getByRole("button", { name: "Hide hw/a" }));
    await waitFor(() => expect(screen.queryByText("hw/a")).toBeNull());
    expect(discovery.setRepositoryDismissed).toHaveBeenCalledWith("id-hw/a", true);
  });
});
