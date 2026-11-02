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

function list(libraries: KicadLibrary[], pathLibrariesEnabled = false) {
    mocks.listLibraries.mockResolvedValue({ libraries, pathLibrariesEnabled });
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

it("adds a library from a repository and a tag", async () => {
    mocks.createLibrary.mockResolvedValue(lsf);
    render(<KicadLibrariesSettings />);
    fireEvent.click(await screen.findByRole("button", { name: /Add library/ }));

    const submit = screen.getByRole("button", { name: "Add library" }) as HTMLButtonElement;
    expect(submit.disabled).toBe(true);
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "lsf2" } });
    fireEvent.change(screen.getByLabelText("Path variables"), { target: { value: "${LSF_TWO}, OTHER" } });
    fireEvent.change(screen.getByLabelText("Repository"), { target: { value: "https://example.org/two.git" } });
    fireEvent.change(screen.getByLabelText("Tag or branch"), { target: { value: "v2" } });
    expect(submit.disabled).toBe(false);
    fireEvent.click(submit);

    await waitFor(() =>
        expect(mocks.createLibrary).toHaveBeenCalledWith({
            name: "lsf2", variables: ["LSF_TWO", "OTHER"], git: "https://example.org/two.git", ref: "v2", subdir: "",
        }),
    );
    expect(await screen.findByText("KiCad libraries")).toBeTruthy();
});

it("keeps the form open and shows the server's reason when adding fails", async () => {
    mocks.createLibrary.mockRejectedValue(new Error("LSF_KICAD_LIB is already bound by the library lsf"));
    render(<KicadLibrariesSettings />);
    fireEvent.click(await screen.findByRole("button", { name: /Add library/ }));
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "dup" } });
    fireEvent.change(screen.getByLabelText("Path variables"), { target: { value: "LSF_KICAD_LIB" } });
    fireEvent.change(screen.getByLabelText("Repository"), { target: { value: "https://example.org/x.git" } });
    fireEvent.change(screen.getByLabelText("Tag or branch"), { target: { value: "v1" } });
    fireEvent.click(screen.getByRole("button", { name: "Add library" }));

    expect((await screen.findByRole("alert")).textContent).toContain("already bound");
    expect(screen.getByLabelText("Name")).toBeTruthy();
});

it("offers the folder source only when the server has a mount root", async () => {
    render(<KicadLibrariesSettings />);
    fireEvent.click(await screen.findByRole("button", { name: /Add library/ }));
    expect(screen.queryByRole("radio", { name: "Folder on the server" })).toBeNull();
    cleanup();

    list([lsf], true);
    render(<KicadLibrariesSettings />);
    fireEvent.click(await screen.findByRole("button", { name: /Add library/ }));
    fireEvent.click(screen.getByRole("radio", { name: "Folder on the server" }));
    expect(screen.getByLabelText("Folder")).toBeTruthy();
    expect(screen.queryByLabelText("Repository")).toBeNull();
});

it("checks the repository and fills the ref from a tag it offers", async () => {
    mocks.checkRemote.mockResolvedValue({ reachable: true, error: null, tags: ["v1", "v2"], branches: ["main"], refFound: false });
    render(<KicadLibrariesSettings />);
    fireEvent.click(await screen.findByRole("button", { name: /Add library/ }));
    fireEvent.change(screen.getByLabelText("Repository"), { target: { value: "https://example.org/x.git" } });
    fireEvent.change(screen.getByLabelText("Tag or branch"), { target: { value: "v9" } });
    fireEvent.click(screen.getByRole("button", { name: "Check repository" }));

    expect(await screen.findByText("No tag or branch named v9.")).toBeTruthy();
    expect(mocks.checkRemote).toHaveBeenCalledWith("https://example.org/x.git", "v9");
    fireEvent.click(screen.getByRole("button", { name: "v2" }));
    expect((screen.getByLabelText("Tag or branch") as HTMLInputElement).value).toBe("v2");
});

it("edits the ref and variables but not the name or repository", async () => {
    mocks.updateLibrary.mockResolvedValue({ ...lsf, ref: "v2" });
    render(<KicadLibrariesSettings />);
    fireEvent.click(await screen.findByRole("button", { name: "Edit" }));

    expect((screen.getByLabelText("Name") as HTMLInputElement).disabled).toBe(true);
    expect((screen.getByLabelText("Repository") as HTMLInputElement).disabled).toBe(true);
    fireEvent.change(screen.getByLabelText("Tag or branch"), { target: { value: "v2" } });
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
