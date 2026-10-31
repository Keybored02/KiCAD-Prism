import {
  isProjectAlreadyImported,
  projectKeyOf,
  projectsPerDirectory,
  type AnalysisResult,
} from "@/lib/import-analysis";
import type { DiscoveredProjectView, DiscoveredRepository } from "@/lib/repo-discovery";

/** One repository on the review screen: the branch chosen and the projects ticked. */
export interface ReviewRow {
  repository: DiscoveredRepository;
  branch: string;
  projects: DiscoveredProjectView[];
  /** Keys of the projects to import. */
  selected: string[];
  /** `loading` while the projects of a newly chosen branch are being read. */
  status: "ready" | "loading" | "failed";
  error: string;
}

export type ReviewAction =
  | { type: "toggle"; id: string; key: string }
  | { type: "all"; id: string; on: boolean }
  | { type: "branch-start"; id: string; branch: string }
  | { type: "branch-loaded"; id: string; branch: string; projects: DiscoveredProjectView[] }
  | { type: "branch-failed"; id: string; branch: string; error: string };

const importableKeys = (projects: DiscoveredProjectView[]): string[] =>
  projects.flatMap((project) => (project.imported ? [] : [project.project_key]));

/** Rows for the picked repositories, on their default branch with everything not yet imported ticked. */
export function seedRows(repositories: DiscoveredRepository[]): ReviewRow[] {
  return repositories.map((repository) => ({
    repository,
    branch: repository.defaultBranch || repository.branches[0] || "",
    projects: repository.projects,
    selected: importableKeys(repository.projects),
    status: "ready",
    error: "",
  }));
}

function update(rows: ReviewRow[], id: string, change: (row: ReviewRow) => ReviewRow): ReviewRow[] {
  return rows.map((row) => (row.repository.id === id ? change(row) : row));
}

export function reviewReducer(rows: ReviewRow[], action: ReviewAction): ReviewRow[] {
  switch (action.type) {
    case "toggle":
      return update(rows, action.id, (row) => {
        const project = row.projects.find((item) => item.project_key === action.key);
        if (!project || project.imported) return row;
        const selected = row.selected.includes(action.key)
          ? row.selected.filter((key) => key !== action.key)
          : [...row.selected, action.key];
        return { ...row, selected };
      });
    case "all":
      return update(rows, action.id, (row) => ({
        ...row,
        selected: action.on ? importableKeys(row.projects) : [],
      }));
    case "branch-start":
      return update(rows, action.id, (row) => ({ ...row, branch: action.branch, status: "loading", error: "" }));
    case "branch-loaded":
      // A late answer for a branch the user has since left is dropped.
      return update(rows, action.id, (row) =>
        row.branch !== action.branch
          ? row
          : {
              ...row,
              projects: action.projects,
              selected: importableKeys(action.projects),
              status: "ready",
              error: "",
            },
      );
    case "branch-failed":
      return update(rows, action.id, (row) =>
        row.branch !== action.branch ? row : { ...row, status: "failed", error: action.error },
      );
  }
}

/** The projects an analysis found, marked with which are already imported. */
export function projectsFromAnalysis(result: AnalysisResult): DiscoveredProjectView[] {
  const imported = new Set(result.imported_paths ?? []);
  const perDirectory = projectsPerDirectory(result.projects);
  return result.projects.map((project) => ({
    name: project.name,
    relative_path: project.relative_path,
    project_key: projectKeyOf(project),
    has_schematic: project.has_schematic,
    has_pcb: project.has_pcb,
    imported: isProjectAlreadyImported(project, imported, perDirectory),
  }));
}

export const selectedProjectCount = (rows: ReviewRow[]): number =>
  rows.reduce((total, row) => total + row.selected.length, 0);

/** Total size of the rows' repositories; `null` when none of them reports one. */
export function totalSizeBytes(rows: ReviewRow[]): number | null {
  const sizes = rows.map((row) => row.repository.sizeBytes).filter((size): size is number => size !== null);
  return sizes.length ? sizes.reduce((total, size) => total + size, 0) : null;
}

/** Whether every row is settled and at least one project is ticked. */
export const canImport = (rows: ReviewRow[]): boolean =>
  rows.every((row) => row.status === "ready") && selectedProjectCount(rows) > 0;

export interface ImportRequest {
  url: string;
  import_type: "type1" | "type2";
  selected_paths?: string[];
  ref: string | null;
}

/**
 * The import request for one row, or `null` when nothing is ticked.
 *
 * The server works out the import type and projects again from the repository;
 * these are the hints the single import sends too.
 */
export function importRequestOf(row: ReviewRow): ImportRequest | null {
  if (row.selected.length === 0) return null;
  const single = row.projects.length === 1 && row.projects[0].relative_path === ".";
  return {
    url: row.repository.cloneUrl,
    import_type: single ? "type1" : "type2",
    selected_paths: single ? undefined : row.selected,
    ref: row.branch || null,
  };
}
