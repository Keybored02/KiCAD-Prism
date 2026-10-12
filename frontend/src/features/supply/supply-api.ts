/** Typed client for `/api/supply`. Errors are `ApiHttpError` with the server's code. */

import { ApiHttpError, fetchApi, fetchJson, readApiError } from "@/lib/api";
import type {
  AddWatchInput,
  BomLineInput,
  ConfirmAliasInput,
  CreateSupplyConnectorInput,
  PartsScope,
  SupplyConnector,
  SupplyCsvResult,
  SupplyCsvRowError,
  AssessmentSettings,
  AssessmentSettingsView,
  SupplyAlert,
  SupplyAssessment,
  SupplyBomLookup,
  SupplyBomWatchResult,
  SupplyCapacity,
  SupplyConnectorCheck,
  SupplyManufacturer,
  SupplyOverview,
  SupplyPartDetail,
  SupplyPartsPage,
  SupplyProvider,
  SupplyReviewQueue,
  SupplySource,
  SupplyWatch,
  UpdateSupplyConnectorInput,
  UpdateWatchInput,
} from "@/types/supply";

const BASE = "/api/supply";

function connectorPath(id: string, ...rest: string[]): string {
  return [BASE, "connectors", encodeURIComponent(id), ...rest].join("/");
}

function post<T>(url: string, body: unknown, fallback: string): Promise<T> {
  return fetchJson<T>(url, { method: "POST", body: body === undefined ? undefined : JSON.stringify(body) }, fallback);
}

export function listSupplyProviders(signal?: AbortSignal): Promise<SupplyProvider[]> {
  return fetchJson<SupplyProvider[]>(`${BASE}/providers`, { signal }, "Could not load providers");
}

export function listSupplyConnectors(signal?: AbortSignal): Promise<SupplyConnector[]> {
  return fetchJson<SupplyConnector[]>(`${BASE}/connectors`, { signal }, "Could not load connectors");
}

export function createSupplyConnector(input: CreateSupplyConnectorInput): Promise<SupplyConnector> {
  return post(`${BASE}/connectors`, input, "Could not create the connector");
}

export function updateSupplyConnector(id: string, changes: UpdateSupplyConnectorInput): Promise<SupplyConnector> {
  return fetchJson<SupplyConnector>(
    connectorPath(id),
    { method: "PATCH", body: JSON.stringify(changes) },
    "Could not save the connector",
  );
}

export function setSupplyConnectorCredentials(id: string, credentials: Record<string, string>): Promise<SupplyConnector> {
  return fetchJson<SupplyConnector>(
    connectorPath(id, "credentials"),
    { method: "PUT", body: JSON.stringify({ credentials }) },
    "Could not save the credentials",
  );
}

export function pauseSupplyConnector(id: string, reason: string): Promise<SupplyConnector> {
  return post(connectorPath(id, "pause"), { reason }, "Could not pause the connector");
}

export function resumeSupplyConnector(id: string): Promise<SupplyConnector> {
  return post(connectorPath(id, "resume"), undefined, "Could not resume the connector");
}

export interface SupplyUsageRefresh {
  updated: number;
  unchanged: number;
  without_index: number;
  removed: number;
}

/** Read where parts are used from the projects' existing indexes. Cheap: it builds none. */
export function refreshSupplyUsage(): Promise<SupplyUsageRefresh> {
  return post(`${BASE}/bom/usage/refresh`, undefined, "Could not read where parts are used");
}

export interface SupplyIndexBuild {
  projects: number;
  missing: number;
  queued: number;
}

/** Queue the BOM reading of projects that have none yet. The worker does them in the background. */
export function buildSupplyUsageIndexes(): Promise<SupplyIndexBuild> {
  return post(`${BASE}/bom/usage/build`, undefined, "Could not queue the project BOMs");
}

export function lookupSupplyBom(
  lines: BomLineInput[],
  buildQuantity: number,
  options: { signal?: AbortSignal; attritionPercent?: number } = {},
): Promise<SupplyBomLookup> {
  return fetchJson<SupplyBomLookup>(
    `${BASE}/bom/lookup`,
    {
      method: "POST",
      body: JSON.stringify({ build_quantity: buildQuantity, attrition_percent: options.attritionPercent ?? 0, lines }),
      signal: options.signal,
    },
    "Could not look the BOM up",
  );
}

export function watchSupplyBomLines(lines: BomLineInput[]): Promise<SupplyBomWatchResult> {
  return post(`${BASE}/bom/watch`, { lines }, "Could not watch the BOM's parts");
}

export function testSupplyConnector(id: string): Promise<SupplyConnectorCheck> {
  return post(connectorPath(id, "test"), undefined, "Could not test the connector");
}

export function listSupplyCapacity(signal?: AbortSignal): Promise<SupplyCapacity[]> {
  return fetchJson<SupplyCapacity[]>(`${BASE}/capacity`, { signal }, "Could not load capacity");
}

export function confirmSupplyTermsReview(id: string): Promise<SupplyConnector> {
  return post(connectorPath(id, "terms-review"), undefined, "Could not record the review");
}

export async function deleteSupplyConnector(id: string): Promise<void> {
  const response = await fetchApi(connectorPath(id), { method: "DELETE" });
  if (!response.ok) {
    throw new ApiHttpError(response.status, await readApiError(response, "Could not delete the connector"));
  }
}

export const SUPPLY_CSV_TEMPLATE_URL = `${BASE}/csv-template`;

/** The server refused the file. Nothing was imported; `errors` says where to look. */
export class CsvRejectedError extends ApiHttpError {
  errors: SupplyCsvRowError[];
  errorCount: number;

  constructor(message: string, errors: SupplyCsvRowError[], errorCount: number) {
    super(400, message, "csv_rejected");
    this.name = "CsvRejectedError";
    this.errors = errors;
    this.errorCount = errorCount;
  }
}

export async function uploadSupplyCsv(id: string, file: File): Promise<SupplyCsvResult> {
  const query = new URLSearchParams({ filename: file.name });
  const response = await fetchApi(`${connectorPath(id, "csv")}?${query}`, {
    method: "POST",
    headers: { "Content-Type": "text/csv" },
    body: file,
  });
  if (response.ok) return (await response.json()) as SupplyCsvResult;
  if (response.status === 413) throw new ApiHttpError(413, "The file is larger than 5 MB.");
  const payload = (await response.clone().json().catch(() => null)) as { detail?: unknown } | null;
  const detail = payload?.detail;
  if (detail && typeof detail === "object" && (detail as { code?: string }).code === "csv_rejected") {
    const rejected = detail as { message?: string; errors?: SupplyCsvRowError[]; error_count?: number };
    throw new CsvRejectedError(
      rejected.message ?? "The file was not imported.",
      rejected.errors ?? [],
      rejected.error_count ?? rejected.errors?.length ?? 0,
    );
  }
  throw new ApiHttpError(response.status, await readApiError(response, "Could not upload the file"));
}

export async function clearSupplyCsv(id: string): Promise<void> {
  const response = await fetchApi(connectorPath(id, "csv"), { method: "DELETE" });
  if (!response.ok) {
    throw new ApiHttpError(response.status, await readApiError(response, "Could not remove the data"));
  }
}

export function getSupplyReviewQueue(signal?: AbortSignal): Promise<SupplyReviewQueue> {
  return fetchJson<SupplyReviewQueue>(`${BASE}/review`, { signal }, "Could not load the review queue");
}

export function confirmSupplyAlias(input: ConfirmAliasInput): Promise<{ listings_updated: number }> {
  return post(`${BASE}/review/aliases/confirm`, input, "Could not map the spelling");
}

async function decide(listingId: string, decision: "pin" | "reject", fallback: string): Promise<void> {
  const response = await fetchApi(`${BASE}/review/listings/${encodeURIComponent(listingId)}/${decision}`, { method: "POST" });
  if (!response.ok) {
    throw new ApiHttpError(response.status, await readApiError(response, fallback));
  }
}

export function pinSupplyListing(listingId: string): Promise<void> {
  return decide(listingId, "pin", "Could not confirm the listing");
}

export function rejectSupplyListing(listingId: string): Promise<void> {
  return decide(listingId, "reject", "Could not reject the listing");
}

export function listSupplyParts(scope: PartsScope, query: string, signal?: AbortSignal): Promise<SupplyPartsPage> {
  const params = new URLSearchParams({ scope });
  if (query.trim()) params.set("q", query.trim());
  return fetchJson<SupplyPartsPage>(`${BASE}/parts?${params}`, { signal }, "Could not load parts");
}

export function getSupplyOverview(signal?: AbortSignal): Promise<SupplyOverview> {
  return fetchJson<SupplyOverview>(`${BASE}/overview`, { signal }, "Could not load the overview");
}

export function listSupplyAlerts(includeResolved: boolean, signal?: AbortSignal): Promise<{ items: SupplyAlert[] }> {
  const query = includeResolved ? "?include_resolved=true" : "";
  return fetchJson<{ items: SupplyAlert[] }>(`${BASE}/alerts${query}`, { signal }, "Could not load alerts");
}

async function alertAction(alertId: number, action: string, body: unknown, fallback: string): Promise<void> {
  const response = await fetchApi(`${BASE}/alerts/${alertId}/${action}`, {
    method: "POST",
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!response.ok) {
    throw new ApiHttpError(response.status, await readApiError(response, fallback));
  }
}

export function acknowledgeSupplyAlert(alertId: number): Promise<void> {
  return alertAction(alertId, "acknowledge", undefined, "Could not acknowledge the alert");
}

export function snoozeSupplyAlert(alertId: number, hours: number): Promise<void> {
  return alertAction(alertId, "snooze", { hours }, "Could not snooze the alert");
}

export function listSupplyManufacturers(signal?: AbortSignal): Promise<{ items: SupplyManufacturer[] }> {
  return fetchJson<{ items: SupplyManufacturer[] }>(`${BASE}/manufacturers`, { signal }, "Could not load manufacturers");
}

export function getSupplyPart(partId: string, signal?: AbortSignal): Promise<SupplyPartDetail> {
  return fetchJson<SupplyPartDetail>(`${BASE}/parts/${encodeURIComponent(partId)}`, { signal }, "Could not load the part");
}

/** The part Prism tracks for a manufacturer and number, or null. Creates nothing. */
export async function findSupplyPart(manufacturer: string, mpn: string, signal?: AbortSignal): Promise<string | null> {
  const query = new URLSearchParams({ manufacturer, mpn });
  const found = await fetchJson<{ part_id: string | null }>(`${BASE}/part-lookup?${query}`, { signal }, "Could not look the part up");
  return found.part_id;
}

export function addSupplyWatch(input: AddWatchInput): Promise<SupplyWatch> {
  return post(`${BASE}/watches`, input, "Could not watch the part");
}

export function updateSupplyWatch(watchId: string, changes: UpdateWatchInput): Promise<SupplyWatch> {
  return fetchJson<SupplyWatch>(
    `${BASE}/watches/${encodeURIComponent(watchId)}`,
    { method: "PATCH", body: JSON.stringify(changes) },
    "Could not save the watch",
  );
}

export async function removeSupplyWatch(watchId: string): Promise<void> {
  const response = await fetchApi(`${BASE}/watches/${encodeURIComponent(watchId)}`, { method: "DELETE" });
  if (!response.ok) {
    throw new ApiHttpError(response.status, await readApiError(response, "Could not stop watching the part"));
  }
}

function sourcePath(id: string): string {
  return `${BASE}/sources/${encodeURIComponent(id)}`;
}

async function send(url: string, method: string, body: unknown, fallback: string): Promise<void> {
  const response = await fetchApi(url, { method, body: body === undefined ? undefined : JSON.stringify(body) });
  if (!response.ok) throw new ApiHttpError(response.status, await readApiError(response, fallback));
}

export async function listComponentSources(componentId: string, signal?: AbortSignal): Promise<SupplySource[]> {
  const url = `${BASE}/components/${encodeURIComponent(componentId)}/sources`;
  return (await fetchJson<{ items: SupplySource[] }>(url, { signal }, "Could not load the approved parts")).items;
}

export function addComponentSource(componentId: string, manufacturer: string, mpn: string): Promise<{ id: string; approval: string }> {
  return post(`${BASE}/components/${encodeURIComponent(componentId)}/sources`, { manufacturer, mpn }, "Could not add the part");
}

export function decideSource(id: string, approve: boolean): Promise<void> {
  return send(`${sourcePath(id)}/${approve ? "approve" : "reject"}`, "POST", undefined, "Could not save the decision");
}

export function rankSource(id: string, rank: number): Promise<void> {
  return send(sourcePath(id), "PATCH", { rank }, "Could not change the rank");
}

export function removeSource(id: string): Promise<void> {
  return send(sourcePath(id), "DELETE", undefined, "Could not remove the part");
}

export interface SupplySeedResult {
  considered: number;
  added: number;
  already: number;
  no_connector: number;
  unknown_manufacturer: number;
}

/** Add listings for catalog components that name a connected vendor and its part number. */
export function seedSupplyFromCatalog(): Promise<SupplySeedResult> {
  return post(`${BASE}/seed/catalog`, undefined, "Could not read the catalog vendors");
}

export function getSupplyAssessment(partId: string, quantity?: number, signal?: AbortSignal): Promise<SupplyAssessment> {
  const query = quantity ? `?quantity=${quantity}` : "";
  return fetchJson<SupplyAssessment>(`${BASE}/parts/${encodeURIComponent(partId)}/assessment${query}`, { signal }, "Could not load the assessment");
}

export function proposeWaiver(partId: string, check: string, reason: string): Promise<{ id: string; state: string }> {
  return post(`${BASE}/parts/${encodeURIComponent(partId)}/waivers`, { check, reason }, "Could not propose the waiver");
}

export function decideWaiver(id: string, approve: boolean): Promise<void> {
  return send(`${BASE}/waivers/${encodeURIComponent(id)}/${approve ? "approve" : "reject"}`, "POST", undefined, "Could not save the decision");
}

export function revokeWaiver(id: string): Promise<void> {
  return send(`${BASE}/waivers/${encodeURIComponent(id)}`, "DELETE", undefined, "Could not revoke the waiver");
}

export function getAssessmentSettings(signal?: AbortSignal): Promise<AssessmentSettingsView> {
  return fetchJson<AssessmentSettingsView>(`${BASE}/settings/assessment`, { signal }, "Could not load the settings");
}

export function saveAssessmentSettings(settings: AssessmentSettings): Promise<AssessmentSettingsView> {
  return fetchJson<AssessmentSettingsView>(
    `${BASE}/settings/assessment`,
    { method: "PUT", body: JSON.stringify(settings) },
    "Could not save the settings",
  );
}

export function resetAssessmentSettings(): Promise<AssessmentSettingsView> {
  return fetchJson<AssessmentSettingsView>(`${BASE}/settings/assessment`, { method: "DELETE" }, "Could not reset the settings");
}

export interface SupplyReadNow {
  read: number;
  connectors: number;
  problems: Array<{ connector: string; reason: string }>;
}

/** Read one part from its distributors now. Spends the interactive reserve; once per 15 minutes per person and part. */
export function readSupplyPartNow(partId: string): Promise<SupplyReadNow> {
  return post(`${BASE}/parts/${encodeURIComponent(partId)}/refresh`, undefined, "Could not read the part");
}
