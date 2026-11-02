import { expect, it } from "vitest";

import type { KicadLibrary } from "@/types/kicad-libraries";

import { describeLibrary, formatBytes, isFetching, parseVariables, sourceLine } from "./library-status";

const base: KicadLibrary = {
    name: "lsf", variables: ["LSF_KICAD_LIB"], git: "https://example.org/lsf.git", ref: "v1", subdir: "", path: "",
    state: "pending", error: null, progress: null, sizeBytes: null, fetchedAt: null, updatedBy: "", ready: false, locked: false,
};

it("says ready only when the server says the library resolves", () => {
    expect(describeLibrary({ ...base, ready: true, state: "ready" }).label).toBe("Ready");
    expect(describeLibrary({ ...base, state: "ready" })).toEqual({ label: "Missing from disk", variant: "warning" });
});

it("describes each stage of a fetch", () => {
    expect(describeLibrary(base).label).toBe("Waiting to fetch");
    expect(describeLibrary({ ...base, state: "fetching" }).label).toBe("Fetching");
    expect(describeLibrary({ ...base, state: "fetching", progress: 42 }).label).toBe("Fetching 42%");
    expect(describeLibrary({ ...base, state: "failed" })).toEqual({ label: "Fetch failed", variant: "destructive" });
});

it("tells a missing folder from a pending fetch", () => {
    expect(describeLibrary({ ...base, git: "", ref: "", path: "lsf" }).label).toBe("Folder not found");
});

it("polls only for git libraries still being fetched", () => {
    expect(isFetching(base)).toBe(true);
    expect(isFetching({ ...base, state: "fetching" })).toBe(true);
    expect(isFetching({ ...base, ready: true, state: "ready" })).toBe(false);
    expect(isFetching({ ...base, state: "failed" })).toBe(false);
    expect(isFetching({ ...base, git: "", path: "lsf" })).toBe(false);
});

it("formats sizes", () => {
    expect(formatBytes(null)).toBe("");
    expect(formatBytes(10)).toBe("1 KB");
    expect(formatBytes(5 * 1024 * 1024)).toBe("5.0 MB");
    expect(formatBytes(4.2 * 1024 ** 3)).toBe("4.2 GB");
});

it("reads variable names from free text", () => {
    expect(parseVariables("LSF_KICAD_LIB, KICAD9_3DMODEL_DIR\nLSF_KICAD_LIB")).toEqual(["LSF_KICAD_LIB", "KICAD9_3DMODEL_DIR"]);
    expect(parseVariables("${LSF_KICAD_LIB}  ${OTHER}")).toEqual(["LSF_KICAD_LIB", "OTHER"]);
    expect(parseVariables(" , ")).toEqual([]);
});

it("names the source", () => {
    expect(sourceLine(base)).toBe("https://example.org/lsf.git @ v1");
    expect(sourceLine({ ...base, subdir: "lib" })).toBe("https://example.org/lsf.git @ v1 (lib)");
    expect(sourceLine({ ...base, git: "", ref: "", path: "lsf" })).toBe("Folder lsf");
});
