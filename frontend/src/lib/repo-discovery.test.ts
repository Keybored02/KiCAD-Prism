import { describe, expect, it } from "vitest";

import {
  DEFAULT_DISCOVERY_FILTERS,
  importedSummary,
  importStatus,
  nextToImport,
  visibleRepositories,
  type DiscoveredRepository,
  type DiscoveryFilters,
} from "./repo-discovery";

function repo(name: string, overrides: Partial<DiscoveredRepository> = {}): DiscoveredRepository {
  const projects = overrides.projects ?? [
    { name: "psu", relative_path: ".", project_key: ".::psu.kicad_pro", has_schematic: true, has_pcb: true },
  ];
  return {
    id: `id-${name}`,
    fullName: name,
    webUrl: "",
    cloneUrl: `https://git.example.com/${name}.git`,
    defaultBranch: "main",
    archived: false,
    state: "kicad",
    importedCount: 0,
    repositoryImported: false,
    dismissed: false,
    error: "",
    scannedAt: null,
    ...overrides,
    projects,
  };
}

const names = (list: DiscoveredRepository[]) => list.map((item) => item.fullName);
const only = (extra: Partial<DiscoveryFilters>): DiscoveryFilters => ({ ...DEFAULT_DISCOVERY_FILTERS, ...extra });

describe("import status", () => {
  const two = [
    { name: "a", relative_path: "a", project_key: "a::a.kicad_pro", has_schematic: true, has_pcb: true },
    { name: "b", relative_path: "b", project_key: "b::b.kicad_pro", has_schematic: true, has_pcb: true },
  ];

  it("is none, partial or all by how many projects are imported", () => {
    expect(importStatus(repo("x", { projects: two, importedCount: 0 }))).toBe("none");
    expect(importStatus(repo("x", { projects: two, importedCount: 1 }))).toBe("partial");
    expect(importStatus(repo("x", { projects: two, importedCount: 2 }))).toBe("all");
    expect(importStatus(repo("x", { projects: [] }))).toBe("none");
  });

  it("says how much is imported only when something is", () => {
    expect(importedSummary(repo("x", { projects: two, importedCount: 0 }))).toBe("");
    expect(importedSummary(repo("x", { projects: two, importedCount: 1 }))).toBe("1 of 2 imported");
  });
});

describe("the list's filters", () => {
  const all = [
    repo("hw/new"),
    repo("hw/done", { importedCount: 1 }),
    repo("hw/dismissed", { dismissed: true }),
    repo("hw/archived", { archived: true }),
    repo("hw/docs", { state: "empty", projects: [] }),
    repo("hw/private", { state: "no_access", projects: [] }),
    repo("hw/unscanned", { state: "pending", projects: [] }),
  ];

  it("starts on repositories with KiCad projects that still have something to import", () => {
    expect(names(visibleRepositories(all, DEFAULT_DISCOVERY_FILTERS))).toEqual(["hw/new"]);
  });

  it("each toggle brings back its own group", () => {
    expect(names(visibleRepositories(all, only({ showImported: true })))).toEqual(["hw/new", "hw/done"]);
    expect(names(visibleRepositories(all, only({ showDismissed: true })))).toEqual(["hw/new", "hw/dismissed"]);
    expect(names(visibleRepositories(all, only({ showArchived: true })))).toEqual(["hw/new", "hw/archived"]);
    expect(names(visibleRepositories(all, only({ showNoKicad: true })))).toEqual(["hw/new", "hw/docs"]);
    expect(names(visibleRepositories(all, only({ showUnreadable: true })))).toEqual([
      "hw/new",
      "hw/private",
      "hw/unscanned",
    ]);
  });

  it("a dismissed repository stays hidden until dismissed ones are shown, whatever else is on", () => {
    const hidden = repo("hw/d", { dismissed: true, state: "empty", projects: [] });
    expect(visibleRepositories([hidden], only({ showNoKicad: true }))).toEqual([]);
    expect(visibleRepositories([hidden], only({ showNoKicad: true, showDismissed: true }))).toEqual([hidden]);
  });
});

describe("the next repository to import", () => {
  const list = [repo("a"), repo("b", { importedCount: 1 }), repo("c"), repo("d")];

  it("is the next visible one with something left to import", () => {
    expect(nextToImport(list, DEFAULT_DISCOVERY_FILTERS, "id-a")?.fullName).toBe("c");
    expect(nextToImport(list, DEFAULT_DISCOVERY_FILTERS, "id-c")?.fullName).toBe("d");
  });

  it("skips what was imported, even when imported ones are shown", () => {
    expect(nextToImport(list, only({ showImported: true }), "id-a")?.fullName).toBe("c");
  });

  it("is nothing after the last one", () => {
    expect(nextToImport(list, DEFAULT_DISCOVERY_FILTERS, "id-d")).toBeUndefined();
  });

  it("is nothing when the current repository is not in the list, so skipped ones never come back", () => {
    expect(nextToImport([repo("a"), repo("c")], DEFAULT_DISCOVERY_FILTERS, "id-gone")).toBeUndefined();
  });
});
