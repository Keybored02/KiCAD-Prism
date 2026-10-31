import { describe, expect, it } from "vitest";

import {
  classifyImportUrl,
  DEFAULT_DISCOVERY_FILTERS,
  formatBytes,
  importedSummary,
  importStatus,
  inScope,
  isSelectable,
  unreadableCount,
  visibleRepositories,
  type DiscoveredRepository,
  type DiscoverySource,
  type DiscoveryFilters,
} from "./repo-discovery";

function repo(name: string, overrides: Partial<DiscoveredRepository> = {}): DiscoveredRepository {
  const projects = overrides.projects ?? [
    { name: "psu", relative_path: ".", project_key: ".::psu.kicad_pro", has_schematic: true, has_pcb: true, imported: false },
  ];
  return {
    id: `id-${name}`,
    fullName: name,
    webUrl: "",
    cloneUrl: `https://git.example.com/${name}.git`,
    defaultBranch: "main",
    archived: false,
    sizeBytes: 1024,
    branches: ["main"],
    state: "kicad",
    importedCount: 0,
    repositoryImported: false,
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
    { name: "a", relative_path: "a", project_key: "a::a.kicad_pro", has_schematic: true, has_pcb: true, imported: false },
    { name: "b", relative_path: "b", project_key: "b::b.kicad_pro", has_schematic: true, has_pcb: true, imported: false },
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

  it("lets a repository be picked only while it has KiCad projects left to import", () => {
    expect(isSelectable(repo("x", { projects: two, importedCount: 1 }))).toBe(true);
    expect(isSelectable(repo("x", { projects: two, importedCount: 2 }))).toBe(false);
    expect(isSelectable(repo("x", { state: "no_access", projects: [] }))).toBe(false);
    expect(isSelectable(repo("x", { state: "empty", projects: [] }))).toBe(false);
  });
});

describe("the list's filters", () => {
  const all = [
    repo("hw/new"),
    repo("hw/done", { importedCount: 1 }),
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
    expect(names(visibleRepositories(all, only({ showArchived: true })))).toEqual(["hw/new", "hw/archived"]);
    expect(names(visibleRepositories(all, only({ showNoKicad: true })))).toEqual(["hw/new", "hw/docs"]);
    expect(names(visibleRepositories(all, only({ showUnreadable: true })))).toEqual([
      "hw/new",
      "hw/private",
      "hw/unscanned",
    ]);
  });

  it("counts the repositories Prism could not read, not the ones without KiCad files", () => {
    const list = [
      repo("a"),
      repo("b", { state: "no_access", projects: [] }),
      repo("c", { state: "error", projects: [] }),
      repo("d", { state: "blocked", projects: [] }),
      repo("e", { state: "empty", projects: [] }),
      repo("f", { state: "pending", projects: [] }),
    ];
    expect(unreadableCount(list)).toBe(3);
  });
});

describe("limiting to an organisation", () => {
  const list = [repo("Team-Italia/psu"), repo("team-italia/amp"), repo("Other/psu"), repo("Team-Italia-2/x")];

  it("keeps the repositories under it, ignoring case and not matching a longer name", () => {
    expect(names(inScope(list, "Team-Italia"))).toEqual(["Team-Italia/psu", "team-italia/amp"]);
  });

  it("keeps everything when there is no scope", () => {
    expect(inScope(list, "")).toBe(list);
  });
});

describe("sizes", () => {
  it.each([
    [0, "0 B"],
    [812, "812 B"],
    [1024, "1.0 KiB"],
    [14 * 1024 * 1024, "14 MiB"],
    [1.25 * 1024 ** 3, "1.3 GiB"],
    [null, "Unknown size"],
    [undefined, "Unknown size"],
    [-5, "Unknown size"],
  ])("formats %s as %s", (bytes, expected) => {
    expect(formatBytes(bytes)).toBe(expected);
  });
});

describe("telling a repository address from a host address", () => {
  const gitea: DiscoverySource = { id: "cn_g", provider: "gitea", displayName: "Gitea", host: "192.168.1.15" };
  const gitlab: DiscoverySource = { id: "cn_l", provider: "gitlab", displayName: "GitLab", host: "gitlab.acme.io" };
  const sources = [gitea, gitlab];

  it("treats a host address as a request to list its repositories", () => {
    expect(classifyImportUrl("http://192.168.1.15:38417", sources)).toEqual({ kind: "discover", source: gitea, scope: "" });
    expect(classifyImportUrl("https://gitlab.acme.io/", sources)).toEqual({ kind: "discover", source: gitlab, scope: "" });
    expect(classifyImportUrl("  https://GITLAB.acme.io  ", sources)).toMatchObject({ kind: "discover", source: gitlab });
  });

  it("treats an organisation address as the host, limited to that organisation", () => {
    expect(classifyImportUrl("http://192.168.1.15:38417/Team-Italia", sources)).toEqual({
      kind: "discover",
      source: gitea,
      scope: "Team-Italia",
    });
  });

  it("treats anything with an owner and a name as one repository", () => {
    expect(classifyImportUrl("http://192.168.1.15:38417/Team-Italia/Jogger", sources)).toEqual({ kind: "repository" });
    expect(classifyImportUrl("https://gitlab.acme.io/group/sub/project.git", sources)).toEqual({ kind: "repository" });
    expect(classifyImportUrl("https://github.com/org/repo", sources)).toEqual({ kind: "repository" });
  });

  it("treats a single name ending in .git as a repository", () => {
    expect(classifyImportUrl("https://git.example.com/board.git", sources)).toEqual({ kind: "repository" });
  });

  it("treats ssh and scp-style addresses as repositories, whatever they look like", () => {
    expect(classifyImportUrl("ssh://git@192.168.1.15:38422", sources)).toEqual({ kind: "repository" });
    expect(classifyImportUrl("git@192.168.1.15:Team-Italia/Jogger.git", sources)).toEqual({ kind: "repository" });
  });

  it("says when a host address has no connected host", () => {
    expect(classifyImportUrl("https://github.com", sources)).toEqual({ kind: "unknown-host", host: "github.com" });
    expect(classifyImportUrl("https://github.com/org", [])).toEqual({ kind: "unknown-host", host: "github.com" });
  });

  it("has nothing to say about an empty box", () => {
    expect(classifyImportUrl("   ", sources)).toEqual({ kind: "empty" });
  });
});
