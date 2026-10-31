import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import type { DiscoveredProjectView, DiscoveredRepository, DiscoverySource } from "@/lib/repo-discovery";

const discovery = vi.hoisted(() => ({
  loadDiscoveredRepositories: vi.fn(),
  startDiscoveryScan: vi.fn(),
}));
const reviewApi = vi.hoisted(() => ({ analyzeBranch: vi.fn(), importRepository: vi.fn() }));
const jobs = vi.hoisted(() => ({ watchPrismJob: vi.fn(), isAbortError: () => false }));

vi.mock("@/lib/repo-discovery", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/repo-discovery")>()),
  ...discovery,
}));
vi.mock("@/lib/repo-review-api", () => reviewApi);
vi.mock("@/lib/jobs", () => jobs);

import { RepoDiscoveryFlow } from "./repo-discovery-flow";

const SOURCE: DiscoverySource = { id: "cn_g", provider: "gitea", displayName: "Gitea", host: "192.168.1.15" };
const KB = 1024;

function project(name: string, path = ".", imported = false): DiscoveredProjectView {
  return {
    name,
    relative_path: path,
    project_key: `${path}::${name}.kicad_pro`,
    has_schematic: true,
    has_pcb: path !== "sch",
    imported,
  };
}

function repo(name: string, projects: DiscoveredProjectView[], extra: Partial<DiscoveredRepository> = {}): DiscoveredRepository {
  return {
    id: `id-${name}`,
    fullName: name,
    webUrl: `http://192.168.1.15:38417/${name}`,
    cloneUrl: `ssh://git@192.168.1.15:38422/${name}.git`,
    defaultBranch: "main",
    archived: false,
    sizeBytes: 5 * 1024 * KB,
    branches: ["main", "dev"],
    state: "kicad",
    projects,
    importedCount: projects.filter((item) => item.imported).length,
    repositoryImported: false,
    error: "",
    scannedAt: null,
    ...extra,
  };
}

const LIST = {
  candidates: [
    repo("Team-Italia/Jogger", [project("TT241000")], { sizeBytes: 812 * KB }),
    repo("Team-Italia/MagicPlex", [project("Breakout", "a"), project("Vertical", "b", true), project("Base", "c")]),
    repo("Other/Board", [project("board")]),
    repo("Team-Italia/Docs", [], { state: "empty" }),
  ],
  hiddenCount: 0,
};

function open(props: { scope?: string; onImported?: () => void } = {}) {
  const onImported = props.onImported ?? vi.fn();
  const onBack = vi.fn();
  const onClose = vi.fn();
  render(
    <Dialog open>
      <DialogContent>
        <RepoDiscoveryFlow source={SOURCE} scope={props.scope ?? ""} onBack={onBack} onClose={onClose} onImported={onImported} />
      </DialogContent>
    </Dialog>,
  );
  return { onImported, onBack, onClose };
}

const tick = (name: string) => fireEvent.click(screen.getByRole("checkbox", { name: `Select ${name}` }));

describe("importing from a host", () => {
  beforeEach(() => {
    Object.values(discovery).forEach((mock) => mock.mockReset());
    Object.values(reviewApi).forEach((mock) => mock.mockReset());
    jobs.watchPrismJob.mockReset();
    discovery.loadDiscoveredRepositories.mockResolvedValue(LIST);
  });

  it("lists the repositories with a checkbox on each importable one", async () => {
    open();
    await screen.findByText("Team-Italia/Jogger");
    expect(screen.getByRole("checkbox", { name: "Select Team-Italia/MagicPlex" })).toBeInTheDocument();
    expect(screen.getByText("1 of 3 imported")).toBeInTheDocument();
    // Without KiCad files it is not shown until asked for, and could not be picked anyway.
    expect(screen.queryByText("Team-Italia/Docs")).toBeNull();
    expect(discovery.startDiscoveryScan).not.toHaveBeenCalled();
  });

  it("limits the list to the organisation in the address", async () => {
    open({ scope: "Team-Italia" });
    await screen.findByText("Team-Italia/Jogger");
    expect(screen.queryByText("Other/Board")).toBeNull();
    expect(screen.getByText(/Showing Team-Italia/)).toBeInTheDocument();
  });

  it("cannot review until something is ticked, and selects every shown repository at once", async () => {
    open();
    await screen.findByText("Team-Italia/Jogger");
    const review = screen.getByRole("button", { name: /^Review 0 repositories/ });
    expect((review as HTMLButtonElement).disabled).toBe(true);

    fireEvent.click(screen.getByLabelText(/Select all/));
    expect(screen.getByRole("button", { name: "Review 3 repositories" })).toBeEnabled();
    fireEvent.click(screen.getByLabelText(/Select all/));
    expect((screen.getByRole("button", { name: /^Review 0/ }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("shows the size, the branch and the projects of each picked repository on a review screen", async () => {
    open();
    await screen.findByText("Team-Italia/Jogger");
    tick("Team-Italia/Jogger");
    tick("Team-Italia/MagicPlex");
    fireEvent.click(screen.getByRole("button", { name: "Review 2 repositories" }));

    expect(await screen.findByText("Review 2 repositories")).toBeInTheDocument();
    expect(screen.getByText(/5\.8 MiB in total/)).toBeInTheDocument();
    expect(screen.getByText("812 KiB")).toBeInTheDocument();
    expect(screen.getByText("5.0 MiB")).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Branch of Team-Italia/MagicPlex" })).toHaveValue("main");
    // The project already in Prism is shown and locked; the other two start ticked.
    expect(screen.getByText("Already imported")).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "Import Vertical from Team-Italia/MagicPlex" })).toBeDisabled();
    expect(screen.getByRole("checkbox", { name: "Import Breakout from Team-Italia/MagicPlex" })).toBeChecked();
    expect(screen.getByRole("button", { name: "Import 3 projects" })).toBeEnabled();
  });

  it("goes back to the list with the ticks kept", async () => {
    open();
    await screen.findByText("Team-Italia/Jogger");
    tick("Other/Board");
    fireEvent.click(screen.getByRole("button", { name: "Review 1 repository" }));
    fireEvent.click(await screen.findByRole("button", { name: "Back" }));
    expect(await screen.findByRole("checkbox", { name: "Select Other/Board" })).toBeChecked();
  });

  it("reads the projects of another branch when it is chosen", async () => {
    reviewApi.analyzeBranch.mockResolvedValue([project("OnlyOnDev")]);
    open();
    await screen.findByText("Team-Italia/Jogger");
    tick("Team-Italia/MagicPlex");
    fireEvent.click(screen.getByRole("button", { name: "Review 1 repository" }));

    fireEvent.change(await screen.findByRole("combobox", { name: "Branch of Team-Italia/MagicPlex" }), {
      target: { value: "dev" },
    });
    expect(await screen.findByText("OnlyOnDev")).toBeInTheDocument();
    expect(reviewApi.analyzeBranch).toHaveBeenCalledWith(
      "ssh://git@192.168.1.15:38422/Team-Italia/MagicPlex.git",
      "dev",
      expect.any(AbortSignal),
    );
    expect(screen.queryByText("Breakout")).toBeNull();
    expect(screen.getByRole("button", { name: "Import 1 project" })).toBeEnabled();
  });

  it("shows why a branch could not be read and holds the import back", async () => {
    reviewApi.analyzeBranch.mockRejectedValue(new Error("Branch 'dev' does not exist on this remote"));
    open();
    await screen.findByText("Team-Italia/Jogger");
    tick("Team-Italia/MagicPlex");
    fireEvent.click(screen.getByRole("button", { name: "Review 1 repository" }));
    fireEvent.change(await screen.findByRole("combobox", { name: /Branch of/ }), { target: { value: "dev" } });
    expect(await screen.findByText("Branch 'dev' does not exist on this remote")).toBeInTheDocument();
    expect((screen.getByRole("button", { name: /^Import/ }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("imports each repository with its branch and ticked projects, then tells the workspace once", async () => {
    reviewApi.importRepository.mockImplementation(async (request: { url: string }) =>
      request.url.includes("Jogger") ? 1 : 2,
    );
    const { onImported, onClose } = open();
    await screen.findByText("Team-Italia/Jogger");
    tick("Team-Italia/Jogger");
    tick("Team-Italia/MagicPlex");
    fireEvent.click(screen.getByRole("button", { name: "Review 2 repositories" }));
    await screen.findByText("Review 2 repositories");
    fireEvent.click(screen.getByRole("checkbox", { name: "Import Base from Team-Italia/MagicPlex" }));
    fireEvent.click(screen.getByRole("button", { name: "Import 2 projects" }));

    expect(await screen.findByText("Import finished")).toBeInTheDocument();
    expect(reviewApi.importRepository).toHaveBeenCalledTimes(2);
    const requests = reviewApi.importRepository.mock.calls.map((call) => call[0]);
    expect(requests).toContainEqual({
      url: "ssh://git@192.168.1.15:38422/Team-Italia/Jogger.git",
      import_type: "type1",
      ref: "main",
    });
    expect(requests).toContainEqual({
      url: "ssh://git@192.168.1.15:38422/Team-Italia/MagicPlex.git",
      import_type: "type2",
      selected_paths: ["a::Breakout.kicad_pro"],
      ref: "main",
    });
    expect(screen.getByText("Every selected repository was imported.")).toBeInTheDocument();
    expect(onImported).toHaveBeenCalledTimes(1);

    // The dialog's own X is also called Close; the footer button comes first.
    fireEvent.click(screen.getAllByRole("button", { name: "Close" })[0]);
    expect(onClose).toHaveBeenCalled();
  });

  it("keeps going when one repository fails and says which", async () => {
    reviewApi.importRepository.mockImplementation(async (request: { url: string }) => {
      if (request.url.includes("Jogger")) throw new Error("Repository not found");
      return 1;
    });
    open();
    await screen.findByText("Team-Italia/Jogger");
    tick("Team-Italia/Jogger");
    tick("Other/Board");
    fireEvent.click(screen.getByRole("button", { name: "Review 2 repositories" }));
    await screen.findByText("Review 2 repositories");
    fireEvent.click(screen.getByRole("button", { name: "Import 2 projects" }));

    expect(await screen.findByText("1 of 2 repositories could not be imported.")).toBeInTheDocument();
    expect(screen.getByText("Repository not found")).toBeInTheDocument();
    const other = screen.getByText("Other/Board").closest("li") as HTMLElement;
    expect(within(other).getByText("1 imported")).toBeInTheDocument();
  });

  it("scans a host nobody has scanned yet, then lists what it found", async () => {
    discovery.loadDiscoveredRepositories.mockResolvedValueOnce({ candidates: [], hiddenCount: 0 }).mockResolvedValue(LIST);
    discovery.startDiscoveryScan.mockResolvedValue({ job_id: "job-1" });
    jobs.watchPrismJob.mockResolvedValue({ status: "completed" });
    open();
    expect(await screen.findByText("Team-Italia/Jogger")).toBeInTheDocument();
    expect(discovery.startDiscoveryScan).toHaveBeenCalledWith("cn_g");
  });

  it("shows why a scan failed", async () => {
    discovery.loadDiscoveredRepositories.mockResolvedValue({ candidates: [], hiddenCount: 0 });
    discovery.startDiscoveryScan.mockResolvedValue({ job_id: "job-1" });
    jobs.watchPrismJob.mockResolvedValue({ status: "failed", error_message: "Connector has no credentials" });
    open();
    expect(await screen.findByText("Connector has no credentials")).toBeInTheDocument();
  });

  it("says when Prism found repositories but could not read any, instead of claiming nothing is left", async () => {
    discovery.loadDiscoveredRepositories.mockResolvedValue({
      candidates: [
        repo("hw/a", [], { state: "no_access", error: "needs credentials" }),
        repo("hw/b", [], { state: "no_access", error: "needs credentials" }),
      ],
      hiddenCount: 0,
    });
    open();
    expect(await screen.findByText(/could not read 2 of the 2 repositories/)).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText("Unreadable"));
    expect(screen.getAllByText("needs credentials")).toHaveLength(2);
  });

  it("tells a designer the repositories exist but cannot be read", async () => {
    discovery.loadDiscoveredRepositories.mockResolvedValue({ candidates: [], hiddenCount: 12 });
    open();
    expect(await screen.findByText(/found 12 repositories on 192.168.1.15 but could not read them/)).toBeInTheDocument();
  });

  it("goes back to the address box", async () => {
    const { onBack } = open();
    await screen.findByText("Team-Italia/Jogger");
    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(onBack).toHaveBeenCalled();
    await waitFor(() => expect(discovery.loadDiscoveredRepositories).toHaveBeenCalled());
  });
});
