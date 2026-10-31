import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const api = vi.hoisted(() => ({ fetchJson: vi.fn() }));
const discovery = vi.hoisted(() => ({ loadDiscoverySources: vi.fn() }));
const jobs = vi.hoisted(() => ({
  watchPrismJob: vi.fn(() => new Promise(() => {})),
  cancelPrismJob: vi.fn(),
  isAbortError: () => false,
}));

vi.mock("@/lib/api", () => api);
vi.mock("@/lib/jobs", () => jobs);
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/lib/repo-discovery", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/repo-discovery")>()),
  ...discovery,
}));
// The multi-repository screens have their own tests; here the flow only shows what it was handed.
vi.mock("@/components/repo-discovery/repo-discovery-flow", () => ({
  RepoDiscoveryFlow: (props: { source: { host: string }; scope: string; onBack: () => void }) => (
    <div>
      <span>discovering {props.source.host}</span>
      <span>scope [{props.scope}]</span>
      <button onClick={props.onBack}>flow back</button>
    </div>
  ),
}));

import { ImportDialog } from "./import-dialog";

const GITEA = { id: "cn_g", provider: "gitea", displayName: "Taverna Gitea", host: "192.168.1.15" };

function open() {
  render(<ImportDialog open onOpenChange={vi.fn()} onImportComplete={vi.fn()} />);
  return screen.getByLabelText("Repository") as HTMLInputElement;
}

const type = (input: HTMLElement, value: string) => fireEvent.change(input, { target: { value } });

describe("one box for one repository or a whole host", () => {
  beforeEach(() => {
    api.fetchJson.mockReset();
    api.fetchJson.mockReturnValue(new Promise(() => {}));
    discovery.loadDiscoverySources.mockReset();
    discovery.loadDiscoverySources.mockResolvedValue([GITEA]);
  });

  it("analyses a repository address the way it always did", async () => {
    const input = open();
    await waitFor(() => expect(discovery.loadDiscoverySources).toHaveBeenCalled());
    type(input, "http://192.168.1.15:38417/Team-Italia/Jogger");
    fireEvent.click(screen.getByRole("button", { name: "Analyze" }));

    expect(api.fetchJson).toHaveBeenCalledWith(
      "/api/projects/analyze",
      expect.objectContaining({ method: "POST" }),
      "Analysis failed",
    );
    expect(screen.queryByText(/discovering/)).toBeNull();
  });

  it("lists a connected host's repositories when its address is pasted", async () => {
    const input = open();
    type(input, "http://192.168.1.15:38417");
    expect(await screen.findByText(/Taverna Gitea is a connected host/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Find repositories" }));

    expect(screen.getByText("discovering 192.168.1.15")).toBeInTheDocument();
    expect(screen.getByText("scope []")).toBeInTheDocument();
    expect(api.fetchJson).not.toHaveBeenCalled();
  });

  it("limits the list to the organisation in the address", async () => {
    const input = open();
    type(input, "http://192.168.1.15:38417/Team-Italia");
    expect(await screen.findByText(/repositories under Team-Italia/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Find repositories" }));
    expect(screen.getByText("scope [Team-Italia]")).toBeInTheDocument();
  });

  it("starts from the keyboard too", async () => {
    const input = open();
    type(input, "http://192.168.1.15:38417");
    await screen.findByText(/is a connected host/);
    fireEvent.keyDown(input, { key: "Enter" });
    expect(screen.getByText("discovering 192.168.1.15")).toBeInTheDocument();
  });

  it("refuses a host address nobody has connected, and says what to do", async () => {
    const input = open();
    await waitFor(() => expect(discovery.loadDiscoverySources).toHaveBeenCalled());
    type(input, "https://github.com");
    expect(await screen.findByText(/github.com is not a connected host/)).toBeInTheDocument();
    expect((screen.getByRole("button", { name: "Analyze" }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.keyDown(input, { key: "Enter" });
    expect(api.fetchJson).not.toHaveBeenCalled();
  });

  it("treats every address as a repository when the hosts cannot be read", async () => {
    discovery.loadDiscoverySources.mockRejectedValue(new Error("403"));
    const input = open();
    await waitFor(() => expect(discovery.loadDiscoverySources).toHaveBeenCalled());
    type(input, "git@192.168.1.15:Team-Italia/Jogger.git");
    fireEvent.click(screen.getByRole("button", { name: "Analyze" }));
    expect(api.fetchJson).toHaveBeenCalled();
  });

  it("returns to the address box from the host list", async () => {
    const input = open();
    type(input, "http://192.168.1.15:38417");
    await screen.findByText(/is a connected host/);
    fireEvent.click(screen.getByRole("button", { name: "Find repositories" }));
    fireEvent.click(screen.getByRole("button", { name: "flow back" }));
    expect(screen.getByLabelText("Repository")).toHaveValue("http://192.168.1.15:38417");
  });
});
