import { fetchJson } from "@/lib/api";
import type { TrackLine } from "./track-lines-step";
import type {
  AlertRules, BudgetConnector, CheckProgress, SupplyChoice, PartTracking, ProjectTrackingState, ScheduleSettings, TrackProgress, TrackingPreview, TrackingRoom,
} from "@/types/supply";

const BASE = "/api/supply/tracking";
const json = (body: unknown): RequestInit => ({ method: "POST", body: JSON.stringify(body) });
const put = (body: unknown): RequestInit => ({ method: "PUT", body: JSON.stringify(body) });

export interface ProjectChoice {
  variants: string[];
  /** Follow every design the project has, also those it gets later. */
  all_variants?: boolean;
  /** What the project buys for: sets the packaging that is followed. */
  packaging?: "cut_tape" | "custom_reel" | "tape_reel" | "tube_tray" | "smallest";
  /** The distributors the project is bought from; null is all but the assembly-only ones. */
  connector_ids: string[] | null;
}

/** Say which of several parts a BOM line's maker spelling names. */
export async function chooseTrackLine(projectId: string, partId: string, manufacturer: string): Promise<void> {
  await fetchJson(
    `${BASE}/projects/${encodeURIComponent(projectId)}/lines/choose`,
    { method: "POST", body: JSON.stringify({ part_id: partId, manufacturer }) },
    "Could not record the choice",
  );
}

/** What the project waits on a person for: parts whose maker is not settled, and lines several makers share. */
export function getProjectOpen(projectId: string, signal?: AbortSignal): Promise<{ choices: SupplyChoice[]; lines: TrackLine[] }> {
  return fetchJson(`${BASE}/projects/${encodeURIComponent(projectId)}/open`, { signal }, "Could not read what is open");
}

export function getTrackProgress(projectId: string, signal?: AbortSignal): Promise<TrackProgress> {
  return fetchJson(`${BASE}/projects/${encodeURIComponent(projectId)}/progress`, { signal }, "Could not read the progress");
}

/** Read the project's BOM now; "reading" when its newest revision is still being indexed. */
export function readProjectBom(projectId: string): Promise<{ status: "updated" | "unchanged" | "reading" }> {
  return fetchJson(`${BASE}/projects/${encodeURIComponent(projectId)}/read`, { method: "POST" }, "Could not read the project's BOM");
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

export function getTrackingRoom(signal?: AbortSignal): Promise<TrackingRoom> {
  return fetchJson("/api/supply/room", { signal }, "Could not work out the room for tracking");
}

export function startCheck(
  kind: "bom" | "component", projectId: string, lines: ReadonlyArray<{ manufacturer: string; mpn: string }>,
): Promise<{ id: string; parts: number; already_tracked: number; skipped: Array<{ mpn: string; reason: string }>; progress: CheckProgress }> {
  return fetchJson("/api/supply/checks", { method: "POST", body: JSON.stringify({ kind, project_id: projectId, lines }) }, "Could not start the check");
}

export function getCheck(id: string, signal?: AbortSignal): Promise<CheckProgress> {
  return fetchJson(`/api/supply/checks/${encodeURIComponent(id)}`, { signal }, "Could not read the check");
}

export function getSchedule(signal?: AbortSignal): Promise<ScheduleSettings> {
  return fetchJson("/api/supply/schedule", { signal }, "Could not load the schedule");
}

export function saveSchedule(settings: ScheduleSettings): Promise<ScheduleSettings> {
  return fetchJson("/api/supply/schedule", put(settings), "Could not save the schedule");
}

export function getAlertRules(partId: string, signal?: AbortSignal): Promise<AlertRules & { mutable: string[] }> {
  return fetchJson(`/api/supply/parts/${encodeURIComponent(partId)}/alert-rules`, { signal }, "Could not load the alert rules");
}

export function saveAlertRules(partId: string, rules: AlertRules): Promise<AlertRules> {
  const { muted, price_rise_percent, target_price, target_currency } = rules;
  return fetchJson(`/api/supply/parts/${encodeURIComponent(partId)}/alert-rules`, put({ muted, price_rise_percent, target_price, target_currency }), "Could not save the alert rules");
}
