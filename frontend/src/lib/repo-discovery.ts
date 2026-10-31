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
  /** Already registered in Prism, so it cannot be imported again. */
  imported: boolean;
}

export type DiscoveredState = "pending" | "kicad" | "empty" | "no_access" | "blocked" | "error";

export interface DiscoveredRepository {
  id: string;
  fullName: string;
  webUrl: string;
  cloneUrl: string;
  defaultBranch: string;
  archived: boolean;
  /** Repository size in bytes as the host reports it; `null` when it does not. */
  sizeBytes: number | null;
  branches: string[];
  state: DiscoveredState;
  projects: DiscoveredProjectView[];
  importedCount: number;
  repositoryImported: boolean;
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
  showArchived: boolean;
  /** Repositories with no KiCad files on the default branch. */
  showNoKicad: boolean;
  /** Repositories Prism could not read, or has not scanned yet. */
  showUnreadable: boolean;
}

export const DEFAULT_DISCOVERY_FILTERS: DiscoveryFilters = {
  showImported: false,
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

/** Whether a repository can be picked for import: Prism read it and it holds KiCad projects. */
export function isSelectable(repository: DiscoveredRepository): boolean {
  return repository.state === "kicad" && importStatus(repository) !== "all";
}

export function isVisible(repository: DiscoveredRepository, filters: DiscoveryFilters): boolean {
  if (repository.archived && !filters.showArchived) return false;
  if (repository.state === "empty") return filters.showNoKicad;
  if (repository.state !== "kicad") return filters.showUnreadable;
  return filters.showImported || importStatus(repository) !== "all";
}

export function visibleRepositories(
  repositories: DiscoveredRepository[],
  filters: DiscoveryFilters,
): DiscoveredRepository[] {
  return repositories.filter((repository) => isVisible(repository, filters));
}

/** Repositories under `scope` (an organisation or group); everything when `scope` is empty. */
export function inScope(repositories: DiscoveredRepository[], scope: string): DiscoveredRepository[] {
  const prefix = scope.trim().toLowerCase();
  if (!prefix) return repositories;
  return repositories.filter((repository) => repository.fullName.toLowerCase().startsWith(`${prefix}/`));
}

const ADMIN_STATES = new Set<DiscoveredState>(["no_access", "blocked", "error"]);

/** How many repositories Prism could not read (no access, blocked, or a failed scan). */
export function unreadableCount(repositories: DiscoveredRepository[]): number {
  return repositories.filter((repository) => ADMIN_STATES.has(repository.state)).length;
}

/** "2 of 3 imported", or nothing when none are. */
export function importedSummary(repository: DiscoveredRepository): string {
  const status = importStatus(repository);
  if (status === "none") return "";
  return `${repository.importedCount} of ${repository.projects.length} imported`;
}

const UNITS = ["B", "KiB", "MiB", "GiB", "TiB"];

/** A byte count as people read it: "812 KiB", "14 MiB", "1.2 GiB". */
export function formatBytes(bytes: number | null | undefined): string {
  if (bytes === null || bytes === undefined || !Number.isFinite(bytes) || bytes < 0) return "Unknown size";
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < UNITS.length - 1) {
    value /= 1024;
    unit += 1;
  }
  const digits = unit === 0 || value >= 10 ? 0 : 1;
  return `${value.toFixed(digits)} ${UNITS[unit]}`;
}

/** What a pasted address asks for. */
export type ImportTarget =
  | { kind: "empty" }
  /** One repository: the usual single import. */
  | { kind: "repository" }
  /** A connected host, or an organisation on it: list its repositories. */
  | { kind: "discover"; source: DiscoverySource; scope: string }
  /** A host or organisation address, but no connected host has it. */
  | { kind: "unknown-host"; host: string };

/**
 * Tells a repository address from a host address.
 *
 * A repository needs an owner and a name (`https://host/org/repo`), or a single
 * name ending in `.git`. Anything shorter names a host (`https://host`) or an
 * organisation on it (`https://host/org`), so it is looked up among the
 * connected hosts. SSH and scp-style addresses are always repositories.
 */
export function classifyImportUrl(raw: string, sources: DiscoverySource[]): ImportTarget {
  const value = raw.trim();
  if (!value) return { kind: "empty" };
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return { kind: "repository" };
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return { kind: "repository" };
  const segments = url.pathname.split("/").filter(Boolean);
  if (segments.length >= 2) return { kind: "repository" };
  if (segments.length === 1 && segments[0].toLowerCase().endsWith(".git")) return { kind: "repository" };
  const source = sources.find((item) => item.host.toLowerCase() === url.hostname.toLowerCase());
  if (!source) return { kind: "unknown-host", host: url.hostname };
  return { kind: "discover", source, scope: segments[0] ?? "" };
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
