import type { PrismJobStatus } from "@/lib/jobs";

// What an analyse job found in a repository, and the rules for telling which of its projects are
// already imported. Shared by the single-repository import and by multi-repository discovery.

export interface DiscoveredProject {
  name: string;
  relative_path: string;
  /**
   * Identifies one project. A directory can hold several KiCad projects, so the
   * directory alone cannot: selecting by `relative_path` used to tick every
   * project sharing a directory at once. Older backends do not send this.
   */
  project_key?: string;
  /** The project's own .kicad_pro (or board) file within `relative_path`. */
  project_file?: string;
  has_schematic: boolean;
  has_pcb: boolean;
  has_project_file?: boolean;
}

/** The key a project is selected by, falling back to pre-`project_key` behaviour. */
export const projectKeyOf = (project: DiscoveredProject): string =>
  project.project_key ?? project.relative_path;

/** How many discovered projects share each directory. */
export function projectsPerDirectory(
  projects: DiscoveredProject[],
): Map<string, number> {
  const counts = new Map<string, number>();
  for (const project of projects) {
    counts.set(project.relative_path, (counts.get(project.relative_path) ?? 0) + 1);
  }
  return counts;
}

export function isProjectAlreadyImported(
  project: DiscoveredProject,
  importedPaths: Set<string>,
  perDirectory: Map<string, number>,
): boolean {
  if (importedPaths.has(projectKeyOf(project))) {
    return true;
  }
  // A project registered before Prism recorded project files reports its bare
  // directory. It stands for that directory's one project, so it must not mark
  // a sibling that shares the directory as imported.
  return (
    importedPaths.has(project.relative_path) &&
    perDirectory.get(project.relative_path) === 1
  );
}

/** The keys of the projects the user can still choose to import. */
export function selectableProjectKeys(
  projects: DiscoveredProject[],
  importedPaths: Set<string>,
): string[] {
  const perDirectory = projectsPerDirectory(projects);
  return projects.flatMap((project) =>
    isProjectAlreadyImported(project, importedPaths, perDirectory)
      ? []
      : [projectKeyOf(project)],
  );
}

export interface AnalysisResult {
  repo_name: string;
  repo_url: string;
  import_type: "type1" | "type2";
  projects: DiscoveredProject[];
  /** Present only when nothing was found, explaining what was looked for. */
  empty_reason?: string;
  branches?: string[];
  default_branch?: string | null;
  ref?: string | null;
  already_imported?: boolean;
  /** Project keys already registered, so they can be shown as done. */
  imported_paths?: string[];
}

/** The analysis a completed analyse job left in its result metadata. */
export function analysisResultOf(job: PrismJobStatus): AnalysisResult | undefined {
  return job.result_metadata?.result as AnalysisResult | undefined;
}

/** Project ids a completed import job registered. */
export function importedProjectIdsOf(job: PrismJobStatus): string[] {
  const ids = job.result_metadata?.project_ids;
  return Array.isArray(ids) ? ids.map(String) : [];
}
