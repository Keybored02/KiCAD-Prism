import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";

import type { KicadLibrary } from "@/types/kicad-libraries";

const mocks = vi.hoisted(() => ({
    listLibraries: vi.fn(),
    createLibrary: vi.fn(),
    updateLibrary: vi.fn(),
    fetchLibraryAgain: vi.fn(),
    deleteLibrary: vi.fn(),
    checkRemote: vi.fn(),
}));

vi.mock("@/lib/kicad-libraries-client", () => mocks);
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import { KicadLibrariesSettings } from "./kicad-libraries-settings";

const lsf: KicadLibrary = {
    name: "lsf", variables: ["LSF_KICAD_LIB"], git: "https://example.org/lsf.git", ref: "v1", subdir: "", path: "",
    state: "ready", error: null, progress: 100, sizeBytes: 5 * 1024 * 1024, fetchedAt: "2026-11-02T10:00:00Z",
    updatedBy: "a@example.org", ready: true, locked: false,
};
const stock: KicadLibrary = {
    ...lsf, name: "kicad-packages3d", variables: ["KICAD9_3DMODEL_DIR", "KICAD10_3DMODEL_DIR"], ref: "10.0.4",
    sizeBytes: null, fetchedAt: null, updatedBy: "", locked: true,
};
const REFS = { reachable: true, error: null, defaultBranch: "main", tags: ["v2", "v1.5"], branches: ["main", "dev"], refFound: null };
// The repository is read after a short pause in typing.
const LOADED = { timeout: 3000 };

function list(libraries: KicadLibrary[], pathLibrariesEnabled = false) {
    mocks.listLibraries.mockResolvedValue({ libraries, pathLibrariesEnabled });
}

/** Types a repository address and waits for the branch and tag list to load behind it. */
async function enterRepository(url: string) {
    fireEvent.change(screen.getByLabelText("Repository"), { target: { value: url } });
    const trigger = screen.getByRole("combobox", { name: "Tag or branch" }) as HTMLButtonElement;
    await waitFor(() => expect(trigger.disabled).toBe(false), LOADED);
    return trigger;
}

async function choose(trigger: HTMLElement, name: string) {
    fireEvent.keyDown(trigger, { key: "ArrowDown" });
    fireEvent.click(await screen.findByRole("option", { name }));
}

async function openAddForm() {
    fireEvent.click(await screen.findByRole("button", { name: /Add library/ }));
}

beforeEach(() => list([lsf]));
afterEach(() => {
    cleanup();
    vi.clearAllMocks();
});

it("lists each library with its variables, source and status", async () => {
    render(<KicadLibrariesSettings />);
    expect(await screen.findByText("lsf")).toBeTruthy();
    expect(screen.getByText("${LSF_KICAD_LIB}")).toBeTruthy();
    expect(screen.getByText("https://example.org/lsf.git @ v1")).toBeTruthy();
    expect(screen.getByText("Ready")).toBeTruthy();
    expect(screen.getByText(/5\.0 MB/)).toBeTruthy();
});

it("says so when there are no libraries", async () => {
    list([]);
    render(<KicadLibrariesSettings />);
    expect(await screen.findByText(/No libraries yet/)).toBeTruthy();
});

it("shows the stock library as set by the server, with no actions", async () => {
    list([stock]);
    render(<KicadLibrariesSettings />);
    expect(await screen.findByText("Set by the server")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Edit" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Remove" })).toBeNull();
});

it("shows fetch progress and the failure of a library that did not fetch", async () => {
    list([
        { ...lsf, name: "busy", variables: ["BUSY"], ready: false, state: "fetching", progress: 40 },
        { ...lsf, name: "broken", variables: ["BROKEN"], ready: false, state: "failed", error: "git clone failed: repository not found" },
    ]);
    render(<KicadLibrariesSettings />);
    expect(await screen.findByText("Fetching 40%")).toBeTruthy();
    expect(screen.getByRole("progressbar", { name: "Fetching busy" }).getAttribute("aria-valuenow")).toBe("40");
    expect(screen.getByText("git clone failed: repository not found")).toBeTruthy();
    // A running fetch cannot be started again; a failed one can.
    expect(screen.getAllByRole("button", { name: "Fetch again" })).toHaveLength(1);
});

it("reads the repository once its address is entered, then offers its branches and tags", async () => {
    mocks.checkRemote.mockResolvedValue(REFS);
    render(<KicadLibrariesSettings />);
    await openAddForm();

    const trigger = screen.getByRole("combobox", { name: "Tag or branch" }) as HTMLButtonElement;
    expect(trigger.disabled).toBe(true);
    expect(screen.getByText(/Its branches and tags load here/)).toBeTruthy();

    await enterRepository("https://example.org/x.git");
    expect(mocks.checkRemote).toHaveBeenCalledTimes(1);
    expect(mocks.checkRemote.mock.calls[0][0]).toBe("https://example.org/x.git");
    // The default branch is the choice until another is picked.
    expect(trigger.textContent).toContain("main (default)");
    fireEvent.keyDown(trigger, { key: "ArrowDown" });
    expect(await screen.findByRole("option", { name: "dev" })).toBeTruthy();
    expect(screen.getByRole("option", { name: "v2" })).toBeTruthy();
    expect(screen.getByRole("option", { name: "v1.5" })).toBeTruthy();
});

it("does not ask the server about an address that is not finished", async () => {
    render(<KicadLibrariesSettings />);
    await openAddForm();
    for (const typed of ["h", "https://", "https://example.org", "http://example.org/x.git", "example.org/x.git"]) {
        fireEvent.change(screen.getByLabelText("Repository"), { target: { value: typed } });
    }
    await new Promise((resolve) => setTimeout(resolve, 900));
    expect(mocks.checkRemote).not.toHaveBeenCalled();
});

it("reads the repository once for an address typed in several keystrokes", async () => {
    mocks.checkRemote.mockResolvedValue(REFS);
    render(<KicadLibrariesSettings />);
    await openAddForm();
    for (const typed of ["https://example.org/x", "https://example.org/x.", "https://example.org/x.git"]) {
        fireEvent.change(screen.getByLabelText("Repository"), { target: { value: typed } });
    }
    await waitFor(() => expect(mocks.checkRemote).toHaveBeenCalledTimes(1), LOADED);
    expect(mocks.checkRemote.mock.calls[0][0]).toBe("https://example.org/x.git");
});

it("adds a library with a tag picked from the list", async () => {
    mocks.checkRemote.mockResolvedValue(REFS);
    mocks.createLibrary.mockResolvedValue(lsf);
    render(<KicadLibrariesSettings />);
    await openAddForm();

    const submit = screen.getByRole("button", { name: "Add library" }) as HTMLButtonElement;
    expect(submit.disabled).toBe(true);
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "lsf2" } });
    fireEvent.change(screen.getByLabelText("Path variables"), { target: { value: "${LSF_TWO}, OTHER" } });
    const trigger = await enterRepository("https://example.org/two.git");
    await choose(trigger, "v2");
    expect(submit.disabled).toBe(false);
    fireEvent.click(submit);

    await waitFor(() =>
        expect(mocks.createLibrary).toHaveBeenCalledWith({
            name: "lsf2", variables: ["LSF_TWO", "OTHER"], git: "https://example.org/two.git", ref: "v2", subdir: "",
        }),
    );
    expect(await screen.findByText("KiCad libraries")).toBeTruthy();
});

it("sends the default branch when none was picked", async () => {
    mocks.checkRemote.mockResolvedValue(REFS);
    mocks.createLibrary.mockResolvedValue(lsf);
    render(<KicadLibrariesSettings />);
    await openAddForm();
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "lsf3" } });
    fireEvent.change(screen.getByLabelText("Path variables"), { target: { value: "LSF_THREE" } });
    await enterRepository("https://example.org/three.git");
    fireEvent.click(screen.getByRole("button", { name: "Add library" }));
    await waitFor(() => expect(mocks.createLibrary.mock.calls[0][0].ref).toBe("main"));
});

it("says why a repository cannot be used and does not allow saving", async () => {
    mocks.checkRemote.mockResolvedValue({ ...REFS, reachable: false, error: "fatal: repository not found", tags: [], branches: [], defaultBranch: null });
    render(<KicadLibrariesSettings />);
    await openAddForm();
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "nope" } });
    fireEvent.change(screen.getByLabelText("Path variables"), { target: { value: "NOPE" } });
    fireEvent.change(screen.getByLabelText("Repository"), { target: { value: "https://example.org/missing.git" } });

    expect((await screen.findByRole("alert", {}, LOADED)).textContent).toBe("fatal: repository not found");
    expect((screen.getByRole("combobox", { name: "Tag or branch" }) as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByRole("button", { name: "Add library" }) as HTMLButtonElement).disabled).toBe(true);
});

it("shows a request failure from the check too", async () => {
    mocks.checkRemote.mockRejectedValue(new Error("Forbidden"));
    render(<KicadLibrariesSettings />);
    await openAddForm();
    fireEvent.change(screen.getByLabelText("Repository"), { target: { value: "https://example.org/x.git" } });
    expect((await screen.findByRole("alert", {}, LOADED)).textContent).toBe("Forbidden");
});

it("chooses the new repository's default branch when the address changes", async () => {
    mocks.checkRemote.mockResolvedValue(REFS);
    render(<KicadLibrariesSettings />);
    await openAddForm();
    const trigger = await enterRepository("https://example.org/one.git");
    await choose(trigger, "v2");
    expect(trigger.textContent).toContain("v2");

    mocks.checkRemote.mockResolvedValue({ ...REFS, defaultBranch: "trunk", branches: ["trunk"], tags: [] });
    fireEvent.change(screen.getByLabelText("Repository"), { target: { value: "https://example.org/two.git" } });
    await waitFor(() => expect(trigger.textContent).toContain("trunk (default)"), LOADED);
});

it("keeps the form open and shows the server's reason when adding fails", async () => {
    mocks.checkRemote.mockResolvedValue(REFS);
    mocks.createLibrary.mockRejectedValue(new Error("LSF_KICAD_LIB is already bound by the library lsf"));
    render(<KicadLibrariesSettings />);
    await openAddForm();
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "dup" } });
    fireEvent.change(screen.getByLabelText("Path variables"), { target: { value: "LSF_KICAD_LIB" } });
    await enterRepository("https://example.org/x.git");
    fireEvent.click(screen.getByRole("button", { name: "Add library" }));

    expect((await screen.findByRole("alert")).textContent).toContain("already bound");
    expect(screen.getByLabelText("Name")).toBeTruthy();
});

it("offers the folder source only when the server has a mount root", async () => {
    render(<KicadLibrariesSettings />);
    await openAddForm();
    expect(screen.queryByRole("radio", { name: "Folder on the server" })).toBeNull();
    cleanup();

    list([lsf], true);
    render(<KicadLibrariesSettings />);
    await openAddForm();
    fireEvent.click(screen.getByRole("radio", { name: "Folder on the server" }));
    expect(screen.getByLabelText("Folder")).toBeTruthy();
    expect(screen.queryByLabelText("Repository")).toBeNull();
    expect(mocks.checkRemote).not.toHaveBeenCalled();
});

it("edits the ref from the repository's list, but not the name or address", async () => {
    mocks.checkRemote.mockResolvedValue(REFS);
    mocks.updateLibrary.mockResolvedValue({ ...lsf, ref: "v2" });
    render(<KicadLibrariesSettings />);
    fireEvent.click(await screen.findByRole("button", { name: "Edit" }));

    expect((screen.getByLabelText("Name") as HTMLInputElement).disabled).toBe(true);
    expect((screen.getByLabelText("Repository") as HTMLInputElement).disabled).toBe(true);
    const trigger = screen.getByRole("combobox", { name: "Tag or branch" }) as HTMLButtonElement;
    await waitFor(() => expect(trigger.disabled).toBe(false), LOADED);
    // v1 is no longer in the repository's list: it stays selected and is marked.
    expect(trigger.textContent).toContain("v1 (not in the repository)");
    await choose(trigger, "v2");
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() =>
        expect(mocks.updateLibrary).toHaveBeenCalledWith("lsf", { variables: ["LSF_KICAD_LIB"], ref: "v2", subdir: "" }),
    );
});

it("fetches a failed library again", async () => {
    list([{ ...lsf, ready: false, state: "failed", error: "boom" }]);
    mocks.fetchLibraryAgain.mockResolvedValue(lsf);
    render(<KicadLibrariesSettings />);
    fireEvent.click(await screen.findByRole("button", { name: "Fetch again" }));
    await waitFor(() => expect(mocks.fetchLibraryAgain).toHaveBeenCalledWith("lsf"));
});

it("asks before removing a library, then removes it", async () => {
    mocks.deleteLibrary.mockResolvedValue(undefined);
    render(<KicadLibrariesSettings />);
    fireEvent.click(await screen.findByRole("button", { name: "Remove" }));

    expect(await screen.findByText(/render without those models/)).toBeTruthy();
    expect(mocks.deleteLibrary).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Remove library" }));
    await waitFor(() => expect(mocks.deleteLibrary).toHaveBeenCalledWith("lsf"));
});

it("shows a load failure", async () => {
    mocks.listLibraries.mockRejectedValue(new Error("Forbidden"));
    render(<KicadLibrariesSettings />);
    expect((await screen.findByRole("alert")).textContent).toBe("Forbidden");
});
