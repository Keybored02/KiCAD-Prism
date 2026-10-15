import { fetchJson } from "@/lib/api";
import type { BudgetConnector, PartTracking, ProjectTrackingState, TrackingPreview } from "@/types/supply";

const BASE = "/api/supply/tracking";
const json = (body: unknown): RequestInit => ({ method: "POST", body: JSON.stringify(body) });
const put = (body: unknown): RequestInit => ({ method: "PUT", body: JSON.stringify(body) });

export interface ProjectChoice {
  variants: string[];
  /** The distributors the project is bought from; null is all but the assembly-only ones. */
  connector_ids: string[] | null;
}

export function getProjectTracking(projectId: string, signal?: AbortSignal): Promise<ProjectTrackingState> {
  return fetchJson(`${BASE}/projects/${encodeURIComponent(projectId)}`, { signal }, "Could not read the project's tracking");
}

export function previewTrackProject(projectId: string, choice: ProjectChoice, signal?: AbortSignal): Promise<TrackingPreview> {
  return fetchJson(`${BASE}/projects/${encodeURIComponent(projectId)}/preview`, { ...json(choice), signal }, "Could not work out the cost");
}

export function trackProject(projectId: string, choice: ProjectChoice): Promise<TrackingPreview> {
  return fetchJson(`${BASE}/projects/${encodeURIComponent(projectId)}`, put(choice), "Could not track the project");
}

export async function untrackProject(projectId: string): Promise<void> {
  await fetchJson(`${BASE}/projects/${encodeURIComponent(projectId)}`, { method: "DELETE" }, "Could not stop tracking the project");
}

export function getPartTracking(partId: string, signal?: AbortSignal): Promise<{ tier: PartTracking | null; waiting_at: string[] }> {
  return fetchJson(`${BASE}/parts/${encodeURIComponent(partId)}`, { signal }, "Could not read the part's tracking");
}

export interface TierChoice {
  tier: 1 | 2;
  rate: "weekly" | "monthly";
}

export function previewPartTier(partId: string, choice: TierChoice, signal?: AbortSignal): Promise<TrackingPreview> {
  return fetchJson(`${BASE}/parts/${encodeURIComponent(partId)}/preview`, { ...json(choice), signal }, "Could not work out the cost");
}

export function setPartTier(partId: string, choice: TierChoice): Promise<TrackingPreview & { tier: PartTracking | null }> {
  return fetchJson(`${BASE}/parts/${encodeURIComponent(partId)}`, put(choice), "Could not set the tier");
}

export async function stopTrackingPart(partId: string): Promise<void> {
  await fetchJson(`${BASE}/parts/${encodeURIComponent(partId)}`, { method: "DELETE" }, "Could not stop tracking the part");
}

export function getBudget(signal?: AbortSignal): Promise<BudgetConnector[]> {
  return fetchJson("/api/supply/budget", { signal }, "Could not load the call budget");
}
