import { fetchJson } from "@/lib/api";

/** A connected host repositories can be discovered on. */
export interface DiscoverySource {
  id: string;
  provider: string;
  displayName: string;
  host: string;
}

export interface DiscoveredProjectView {
  name: string;
  relative_path: string;
  project_key: string;
  has_schematic: boolean;
  has_pcb: boolean;
}

export type DiscoveredState = "pending" | "kicad" | "empty" | "no_access" | "blocked" | "error";

export interface DiscoveredRepository {
  id: string;
  fullName: string;
  webUrl: string;
  cloneUrl: string;
  defaultBranch: string;
  archived: boolean;
  state: DiscoveredState;
  projects: DiscoveredProjectView[];
  importedCount: number;
  repositoryImported: boolean;
  dismissed: boolean;
  error: string;
  scannedAt: string | null;
}

export interface DiscoveredRepositoryList {
  candidates: DiscoveredRepository[];
  /** Repositories left out because only an administrator sees them. */
  hiddenCount: number;
}

export interface DiscoveryFilters {
  showImported: boolean;
  showDismissed: boolean;
  showArchived: boolean;
  /** Repositories with no KiCad files on the default branch. */
  showNoKicad: boolean;
  /** Repositories Prism could not read, or has not scanned yet. */
  showUnreadable: boolean;
}

export const DEFAULT_DISCOVERY_FILTERS: DiscoveryFilters = {
  showImported: false,
  showDismissed: false,
  showArchived: false,
  showNoKicad: false,
  showUnreadable: false,
};

export type ImportStatus = "none" | "partial" | "all";

export function importStatus(repository: DiscoveredRepository): ImportStatus {
  const total = repository.projects.length;
  if (total === 0 || repository.importedCount === 0) return "none";
  return repository.importedCount >= total ? "all" : "partial";
}

/** Whether a repository belongs to the "has KiCad projects" group, the one the list starts on. */
function isKicad(repository: DiscoveredRepository): boolean {
  return repository.state === "kicad";
}

export function isVisible(repository: DiscoveredRepository, filters: DiscoveryFilters): boolean {
  if (repository.dismissed && !filters.showDismissed) return false;
  if (repository.archived && !filters.showArchived) return false;
  if (repository.state === "empty") return filters.showNoKicad;
  if (!isKicad(repository)) return filters.showUnreadable;
  return filters.showImported || importStatus(repository) !== "all";
}

export function visibleRepositories(
  repositories: DiscoveredRepository[],
  filters: DiscoveryFilters,
): DiscoveredRepository[] {
  return repositories.filter((repository) => isVisible(repository, filters));
}

/**
 * The repository after `currentId` in the visible list that still has something
 * to import; nothing when `currentId` is not in the list.
 */
export function nextToImport(
  repositories: DiscoveredRepository[],
  filters: DiscoveryFilters,
  currentId: string,
): DiscoveredRepository | undefined {
  const visible = visibleRepositories(repositories, filters);
  const index = visible.findIndex((repository) => repository.id === currentId);
  if (index < 0) return undefined;
  return visible
    .slice(index + 1)
    .find((repository) => isKicad(repository) && importStatus(repository) !== "all");
}

/** How many repositories Prism could not read (no access, blocked, or a failed scan). */
export function unreadableCount(repositories: DiscoveredRepository[]): number {
  return repositories.filter((repository) => ADMIN_STATES.has(repository.state)).length;
}

const ADMIN_STATES = new Set<DiscoveredState>(["no_access", "blocked", "error"]);

/** "2 of 3 imported", or nothing when none are. */
export function importedSummary(repository: DiscoveredRepository): string {
  const status = importStatus(repository);
  if (status === "none") return "";
  return `${repository.importedCount} of ${repository.projects.length} imported`;
}

export const loadDiscoverySources = () =>
  fetchJson<DiscoverySource[]>(
    "/api/repo-discovery/sources",
    undefined,
    "Failed to load connected hosts",
  );

export const loadDiscoveredRepositories = (sourceId: string) =>
  fetchJson<DiscoveredRepositoryList>(
    `/api/repo-discovery/sources/${encodeURIComponent(sourceId)}/candidates`,
    undefined,
    "Failed to load discovered repositories",
  );

export const startDiscoveryScan = (sourceId: string) =>
  fetchJson<{ job_id: string }>(
    `/api/repo-discovery/sources/${encodeURIComponent(sourceId)}/scan`,
    { method: "POST" },
    "Failed to start the scan",
  );

export const setRepositoryDismissed = (repositoryId: string, dismissed: boolean) =>
  fetchJson<{ id: string; dismissed: boolean }>(
    `/api/repo-discovery/candidates/${encodeURIComponent(repositoryId)}/${dismissed ? "dismiss" : "restore"}`,
    { method: "POST" },
    dismissed ? "Failed to hide the repository" : "Failed to show the repository",
  );
