import { describe, expect, it } from "vitest";

import type { DiscoveredProjectView, DiscoveredRepository } from "./repo-discovery";
import {
  canImport,
  importRequestOf,
  projectsFromAnalysis,
  reviewReducer,
  seedRows,
  selectedProjectCount,
  totalSizeBytes,
} from "./repo-review";

function project(name: string, path = ".", imported = false): DiscoveredProjectView {
  return {
    name,
    relative_path: path,
    project_key: `${path}::${name}.kicad_pro`,
    has_schematic: true,
    has_pcb: true,
    imported,
  };
}

function repo(name: string, projects: DiscoveredProjectView[], extra: Partial<DiscoveredRepository> = {}): DiscoveredRepository {
  return {
    id: `id-${name}`,
    fullName: name,
    webUrl: "",
    cloneUrl: `ssh://git@git.example.com:38422/${name}.git`,
    defaultBranch: "main",
    archived: false,
    sizeBytes: 1024,
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

const three = [project("a", "a"), project("b", "b", true), project("c", "c")];

describe("seeding the review rows", () => {
  it("starts on the default branch with every project not yet imported ticked", () => {
    const [row] = seedRows([repo("hw/boards", three)]);
    expect(row.branch).toBe("main");
    expect(row.selected).toEqual(["a::a.kicad_pro", "c::c.kicad_pro"]);
    expect(row.status).toBe("ready");
  });

  it("falls back to the first branch when the host reports no default", () => {
    const [row] = seedRows([repo("hw/boards", three, { defaultBranch: "", branches: ["dev"] })]);
    expect(row.branch).toBe("dev");
  });
});

describe("ticking projects", () => {
  const rows = seedRows([repo("hw/boards", three), repo("hw/psu", [project("psu")])]);

  it("toggles one project in one repository only", () => {
    const next = reviewReducer(rows, { type: "toggle", id: "id-hw/boards", key: "a::a.kicad_pro" });
    expect(next[0].selected).toEqual(["c::c.kicad_pro"]);
    expect(next[1]).toBe(rows[1]);
  });

  it("cannot tick a project that is already imported", () => {
    const next = reviewReducer(rows, { type: "toggle", id: "id-hw/boards", key: "b::b.kicad_pro" });
    expect(next[0].selected).toEqual(rows[0].selected);
  });

  it("selects or clears all importable projects of a repository", () => {
    const cleared = reviewReducer(rows, { type: "all", id: "id-hw/boards", on: false });
    expect(cleared[0].selected).toEqual([]);
    expect(reviewReducer(cleared, { type: "all", id: "id-hw/boards", on: true })[0].selected).toEqual([
      "a::a.kicad_pro",
      "c::c.kicad_pro",
    ]);
  });

  it("counts what is ticked across repositories", () => {
    expect(selectedProjectCount(rows)).toBe(3);
  });
});

describe("changing a branch", () => {
  const start = seedRows([repo("hw/boards", three)]);

  it("shows the row as loading, then takes the new branch's projects", () => {
    const loading = reviewReducer(start, { type: "branch-start", id: "id-hw/boards", branch: "dev" });
    expect(loading[0]).toMatchObject({ branch: "dev", status: "loading" });
    expect(canImport(loading)).toBe(false);

    const loaded = reviewReducer(loading, {
      type: "branch-loaded",
      id: "id-hw/boards",
      branch: "dev",
      projects: [project("only")],
    });
    expect(loaded[0]).toMatchObject({ status: "ready", selected: [".::only.kicad_pro"] });
  });

  it("drops an answer for a branch the user has since left", () => {
    const first = reviewReducer(start, { type: "branch-start", id: "id-hw/boards", branch: "dev" });
    const second = reviewReducer(first, { type: "branch-start", id: "id-hw/boards", branch: "main" });
    const stale = reviewReducer(second, {
      type: "branch-loaded",
      id: "id-hw/boards",
      branch: "dev",
      projects: [project("stale")],
    });
    expect(stale[0].projects).toBe(start[0].projects);
    expect(stale[0].status).toBe("loading");
  });

  it("keeps the failure on the row so it can be shown", () => {
    const loading = reviewReducer(start, { type: "branch-start", id: "id-hw/boards", branch: "dev" });
    const failed = reviewReducer(loading, { type: "branch-failed", id: "id-hw/boards", branch: "dev", error: "no such branch" });
    expect(failed[0]).toMatchObject({ status: "failed", error: "no such branch" });
    expect(canImport(failed)).toBe(false);
  });
});

describe("projects from an analysis", () => {
  it("marks the ones already imported, by key or by their only directory", () => {
    const projects = projectsFromAnalysis({
      repo_name: "boards",
      repo_url: "x",
      import_type: "type2",
      imported_paths: ["a::a.kicad_pro", "c"],
      projects: [
        { name: "a", relative_path: "a", project_key: "a::a.kicad_pro", has_schematic: true, has_pcb: true },
        { name: "b", relative_path: "b", project_key: "b::b.kicad_pro", has_schematic: true, has_pcb: false },
        { name: "c", relative_path: "c", has_schematic: true, has_pcb: true },
      ],
    });
    expect(projects.map((item) => item.imported)).toEqual([true, false, true]);
    expect(projects[2].project_key).toBe("c");
  });
});

describe("totals and requests", () => {
  it("adds the sizes that are known and says nothing when none is", () => {
    const rows = seedRows([repo("a", three, { sizeBytes: 100 }), repo("b", three, { sizeBytes: null }), repo("c", three, { sizeBytes: 50 })]);
    expect(totalSizeBytes(rows)).toBe(150);
    expect(totalSizeBytes(seedRows([repo("a", three, { sizeBytes: null })]))).toBeNull();
  });

  it("asks for a single root project as type1 without a path list", () => {
    const [row] = seedRows([repo("hw/psu", [project("psu")])]);
    expect(importRequestOf(row)).toEqual({
      url: "ssh://git@git.example.com:38422/hw/psu.git",
      import_type: "type1",
      selected_paths: undefined,
      ref: "main",
    });
  });

  it("asks for several projects as type2 with the ticked keys and the chosen branch", () => {
    const [row] = seedRows([repo("hw/boards", three)]);
    const switched = reviewReducer([row], { type: "branch-start", id: "id-hw/boards", branch: "dev" })[0];
    expect(importRequestOf(switched)).toMatchObject({
      import_type: "type2",
      selected_paths: ["a::a.kicad_pro", "c::c.kicad_pro"],
      ref: "dev",
    });
  });

  it("sends nothing for a repository with nothing ticked", () => {
    const [row] = seedRows([repo("hw/boards", three)]);
    const cleared = reviewReducer([row], { type: "all", id: "id-hw/boards", on: false })[0];
    expect(importRequestOf(cleared)).toBeNull();
  });
});
