/** Typed client for `/api/supply`. Errors are `ApiHttpError` with the server's code. */

import { ApiHttpError, fetchApi, fetchJson, readApiError } from "@/lib/api";
import type {
  BomSuggestions,
  AddWatchInput,
  BomLineInput,
  ConfirmAliasInput,
  CreateSupplyConnectorInput,
  PartsFilter,
  PartsScope,
  SupplyConnector,
  SupplyCsvResult,
  SupplyCsvRowError,
  AssessmentSettings,
  AssessmentSettingsView,
  SupplyAlert,
  SupplyAssessment,
  ComponentCoverage,
  CrossReference,
  TradeReport,
  ProjectSupply,
  SupplyBomLookup,
  SupplyBomWatchResult,
  SupplyCapacity,
  SupplyConnectorCheck,
  SupplyManufacturer,
  SupplyDashboard,
  SupplyInsightsPage,
  SupplyOverview,
  SupplyPartGroups,
  PartHistory,
  SupplyPartDetail,
  SupplyPartsPage,
  SupplyProvider,
  SupplyMakerGroup,
  SupplyPartNumber,
  SupplyReviewQueue,
  SupplyBomRollup,
  SupplyCompliance,
  SupplyBomComment,
  SupplyComponentCheck,
  SupplyComponentWatch,
  SupplyMarket,
  SupplyMarketHistory,
  SupplyNotice,
  SupplyNoticeKind,
  SupplySignin,
  SupplySvhcList,
  SupplySource,
  SupplyWatch,
  UpdateSupplyConnectorInput,
  UpdateWatchInput,
  WatchPackaging,
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
  options: { signal?: AbortSignal; attritionPercent?: number | null } = {},
): Promise<SupplyBomLookup> {
  return fetchJson<SupplyBomLookup>(
    `${BASE}/bom/lookup`,
    {
      method: "POST",
      body: JSON.stringify({ build_quantity: buildQuantity, attrition_percent: options.attritionPercent === undefined ? 0 : options.attritionPercent, lines }),
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


export async function deleteSupplyConnector(id: string): Promise<void> {
  const response = await fetchApi(connectorPath(id), { method: "DELETE" });
  if (!response.ok) {
    throw new ApiHttpError(response.status, await readApiError(response, "Could not delete the connector"));
  }
}

export function getSupplySignin(id: string, signal?: AbortSignal): Promise<SupplySignin> {
  return fetchJson<SupplySignin>(connectorPath(id, "signin"), { signal }, "Could not load the sign-in");
}

/** Where to send the browser to sign in at DigiKey. */
export async function startSupplySignin(id: string): Promise<string> {
  return (await post<{ url: string }>(connectorPath(id, "signin"), undefined, "Could not start the sign-in")).url;
}

export async function forgetSupplySignin(id: string): Promise<void> {
  const response = await fetchApi(connectorPath(id, "signin"), { method: "DELETE" });
  if (!response.ok) {
    throw new ApiHttpError(response.status, await readApiError(response, "Could not sign out"));
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

export async function pinSupplyListing(listingId: string, addNumber = false): Promise<void> {
  const response = await fetchApi(`${BASE}/review/listings/${encodeURIComponent(listingId)}/pin`, {
    method: "POST",
    body: JSON.stringify({ add_number: addNumber }),
  });
  if (!response.ok) throw new ApiHttpError(response.status, await readApiError(response, "Could not confirm the listing"));
}

export function rejectSupplyListing(listingId: string): Promise<void> {
  return decide(listingId, "reject", "Could not reject the listing");
}

export function markPartNumbers(partId: string, keys: string[]): Promise<{ counted: number }> {
  return post(`${BASE}/review/choices/${encodeURIComponent(partId)}/numbers`, { keys }, "Could not record the numbers");
}

export function addPartNumber(partId: string, mpn: string): Promise<{ added: boolean; numbers: SupplyPartNumber[] }> {
  return post(`${BASE}/parts/${encodeURIComponent(partId)}/numbers`, { mpn }, "Could not add the number");
}

export async function removePartNumber(partId: string, key: string): Promise<void> {
  const response = await fetchApi(`${BASE}/parts/${encodeURIComponent(partId)}/numbers/${encodeURIComponent(key)}`, { method: "DELETE" });
  if (!response.ok) throw new ApiHttpError(response.status, await readApiError(response, "Could not remove the number"));
}

export function chooseSupplyMaker(partId: string, key: string): Promise<{ result: string }> {
  return post(`${BASE}/review/choices/${encodeURIComponent(partId)}/choose`, { key }, "Could not record the choice");
}

export function otherSupplyMaker(partId: string, key: string): Promise<{ rejected: number }> {
  return post(`${BASE}/review/choices/${encodeURIComponent(partId)}/other`, { key }, "Could not record the choice");
}

export interface SupplyFxRates {
  day: string | null;
  currencies: string[];
  stale: boolean;
}

export function getFxRates(signal?: AbortSignal): Promise<SupplyFxRates> {
  return fetchJson(`${BASE}/fx`, { signal }, "Could not load the exchange rates");
}

export function refreshFxRates(): Promise<SupplyFxRates> {
  return post(`${BASE}/fx/refresh`, undefined, "Could not fetch the exchange rates");
}

export function enterFxRates(day: string, rates: Record<string, number>): Promise<SupplyFxRates> {
  return post(`${BASE}/fx/rates`, { day, rates }, "Could not save the exchange rates");
}

export interface SupplyNumberEnding {
  suffix_key: string;
  suffix_text: string;
  kind: "packaging" | "grade";
  source: string;
}

export function listNumberEndings(signal?: AbortSignal): Promise<{ endings: SupplyNumberEnding[] }> {
  return fetchJson(`${BASE}/settings/number-endings`, { signal }, "Could not load the endings");
}

export function addNumberEnding(ending: string, kind: "packaging" | "grade"): Promise<{ endings: SupplyNumberEnding[] }> {
  return post(`${BASE}/settings/number-endings`, { ending, kind }, "Could not add the ending");
}

export function removeNumberEnding(key: string): Promise<void> {
  return send(`${BASE}/settings/number-endings/${encodeURIComponent(key)}`, "DELETE", undefined, "Could not remove the ending");
}

export function listMakerSpellings(signal?: AbortSignal): Promise<{ groups: SupplyMakerGroup[] }> {
  return fetchJson(`${BASE}/settings/makers`, { signal }, "Could not load the spellings");
}

export function addMakerSpelling(spelling: string, groupKey: string | null): Promise<{ groups: SupplyMakerGroup[] }> {
  return post(`${BASE}/settings/makers`, { spelling, group_key: groupKey }, "Could not add the spelling");
}

export function removeMakerSpelling(key: string): Promise<void> {
  return send(`${BASE}/settings/makers/${encodeURIComponent(key)}`, "DELETE", undefined, "Could not remove the spelling");
}

export function undoSettledPart(partId: string): Promise<{ undone: boolean }> {
  return post(`${BASE}/review/parts/${encodeURIComponent(partId)}/undo`, {}, "Could not take the maker back");
}

export function undoLearnedAlias(key: string): Promise<{ listings: number }> {
  return post(`${BASE}/review/aliases/${encodeURIComponent(key)}/undo`, {}, "Could not undo the spelling");
}

export function rejectSupplyListings(listingIds: string[]): Promise<{ rejected: number }> {
  return post(`${BASE}/review/listings/reject-many`, { listing_ids: listingIds }, "Could not take the listings off");
}

export function listSupplyPartGroups(scope: PartsScope, query: string, signal?: AbortSignal, only: PartsFilter = ""): Promise<SupplyPartGroups> {
  const params = new URLSearchParams({ scope });
  if (only) params.set("only", only);
  if (query.trim()) params.set("q", query.trim());
  return fetchJson<SupplyPartGroups>(`${BASE}/part-groups?${params}`, { signal }, "Could not load the parts");
}

export function listSupplyParts(scope: PartsScope, query: string, signal?: AbortSignal, only: PartsFilter = "", offset = 0, limit = 0, projectId = ""): Promise<SupplyPartsPage> {
  const params = new URLSearchParams({ scope });
  if (projectId) params.set("project_id", projectId);
  if (offset > 0) params.set("offset", String(offset));
  if (limit > 0) params.set("limit", String(limit));
  if (only) params.set("only", only);
  if (query.trim()) params.set("q", query.trim());
  return fetchJson<SupplyPartsPage>(`${BASE}/parts?${params}`, { signal }, "Could not load parts");
}

export function getSupplyDashboard(signal?: AbortSignal): Promise<SupplyDashboard> {
  return fetchJson<SupplyDashboard>(`${BASE}/dashboard`, { signal }, "Could not load the dashboard");
}

export function getSupplyInsights(signal?: AbortSignal): Promise<SupplyInsightsPage> {
  return fetchJson<SupplyInsightsPage>(`${BASE}/insights`, { signal }, "Could not load the insights");
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

/** Make one distributor the part's preferred one: shown first. */
export async function setPreferredDistributor(partId: string, connectorId: string): Promise<void> {
  await fetchJson(`${BASE}/parts/${encodeURIComponent(partId)}/preferred`, { method: "PUT", body: JSON.stringify({ connector_id: connectorId }) }, "Could not set the preferred distributor");
}

export async function clearPreferredDistributor(partId: string): Promise<void> {
  await fetchJson(`${BASE}/parts/${encodeURIComponent(partId)}/preferred`, { method: "DELETE" }, "Could not clear the preferred distributor");
}

/** Price a part at its own quantity in lists and its price history; null goes back to the workspace default. */
export async function setPriceQuantity(partId: string, quantity: number | null): Promise<void> {
  await fetchJson(`${BASE}/parts/${encodeURIComponent(partId)}/price-quantity`, { method: "PUT", body: JSON.stringify({ quantity }) }, "Could not set the price quantity");
}

/** Mark a part export controlled (with its class) or not; it wins over what distributors state. */
export async function setTradeMark(partId: string, control: "controlled" | "none", eccn: string): Promise<void> {
  await fetchJson(`${BASE}/parts/${encodeURIComponent(partId)}/trade-mark`, { method: "PUT", body: JSON.stringify({ control, eccn }) }, "Could not set the export control");
}

export async function clearTradeMark(partId: string): Promise<void> {
  await fetchJson(`${BASE}/parts/${encodeURIComponent(partId)}/trade-mark`, { method: "DELETE" }, "Could not clear the export control");
}

/** A part's stock and price per distributor over the last `days` days. */
export function getPartHistory(partId: string, days: number, signal?: AbortSignal): Promise<PartHistory> {
  return fetchJson<PartHistory>(`${BASE}/parts/${encodeURIComponent(partId)}/history?days=${days}`, { signal }, "Could not load the history");
}

/** The part Prism tracks for a manufacturer and number, or null. Creates nothing. */
export async function findSupplyPart(manufacturer: string, mpn: string, signal?: AbortSignal): Promise<string | null> {
  const query = new URLSearchParams({ manufacturer, mpn });
  const found = await fetchJson<{ part_id: string | null }>(`${BASE}/part-lookup?${query}`, { signal }, "Could not look the part up");
  return found.part_id;
}

/** Ask DigiKey for parts it offers in place of this one. One call, from the interactive reserve; once an hour for a part. */
export async function askSubstitutes(partId: string): Promise<{ asked: number; found: number; resolved?: number; problems: Array<{ connector: string; reason: string }> }> {
  return post(`${BASE}/parts/${encodeURIComponent(partId)}/ask-substitutes`, {}, "Could not ask for substitutes");
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

/** What a component's own part and its approved alternates hold together. */
export function getComponentCoverage(componentId: string, signal?: AbortSignal): Promise<ComponentCoverage> {
  return fetchJson<ComponentCoverage>(`${BASE}/components/${encodeURIComponent(componentId)}/coverage`, { signal }, "Could not load the component's coverage");
}

/** What is wrong with a component taken with its approved alternates; empty when nothing is. */
export function getComponentFindings(componentId: string, signal?: AbortSignal): Promise<SupplyComponentCheck> {
  const url = `${BASE}/components/${encodeURIComponent(componentId)}/assessment`;
  return fetchJson<SupplyComponentCheck>(url, { signal }, "Could not load the component check");
}

export function watchComponentAlternates(componentId: string): Promise<{ watched: number; already_watched: number }> {
  return post(`${BASE}/components/${encodeURIComponent(componentId)}/watch-alternates`, undefined, "Could not watch the alternates");
}

export async function getComponentWatch(componentId: string, signal?: AbortSignal): Promise<SupplyComponentWatch | null> {
  const url = `${BASE}/components/${encodeURIComponent(componentId)}/watch`;
  return (await fetchJson<{ watch: SupplyComponentWatch | null }>(url, { signal }, "Could not load the component watch")).watch;
}

export async function setComponentWatch(componentId: string, includeAlternates: boolean, packaging: WatchPackaging): Promise<SupplyComponentWatch> {
  const url = `${BASE}/components/${encodeURIComponent(componentId)}/watch`;
  const body = JSON.stringify({ include_alternates: includeAlternates, packaging });
  return (await fetchJson<{ watch: SupplyComponentWatch }>(url, { method: "PUT", body }, "Could not watch the component")).watch;
}

export function removeComponentWatch(componentId: string): Promise<void> {
  return send(`${BASE}/components/${encodeURIComponent(componentId)}/watch`, "DELETE", undefined, "Could not stop watching the component");
}

function commentsPath(projectId: string): string {
  return `${BASE}/projects/${encodeURIComponent(projectId)}/bom-comments`;
}

export async function listBomComments(projectId: string, signal?: AbortSignal): Promise<SupplyBomComment[]> {
  return (await fetchJson<{ items: SupplyBomComment[] }>(commentsPath(projectId), { signal }, "Could not load the comments")).items;
}

export function addBomComment(projectId: string, lineKey: string, body: string): Promise<SupplyBomComment> {
  return post(commentsPath(projectId), { line_key: lineKey, body }, "Could not add the comment");
}

export function removeBomComment(projectId: string, commentId: string): Promise<void> {
  return send(`${commentsPath(projectId)}/${encodeURIComponent(commentId)}`, "DELETE", undefined, "Could not remove the comment");
}

export function getCrossReference(partId: string, signal?: AbortSignal): Promise<CrossReference> {
  return fetchJson(`${BASE}/parts/${encodeURIComponent(partId)}/cross-reference`, { signal }, "Could not look for alternatives");
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

export function proposeWaiver(partId: string, check: string, reason: string, componentId?: string): Promise<{ id: string; state: string }> {
  const body = componentId ? { check, reason, component_id: componentId } : { check, reason };
  return post(`${BASE}/parts/${encodeURIComponent(partId)}/waivers`, body, "Could not propose the waiver");
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

/** A project's BOM rolled up from the lines stored when it was read. `available` is false until it has been. */
export function getProjectSupply(projectId: string, variant = "", signal?: AbortSignal): Promise<ProjectSupply> {
  const query = variant ? `?variant=${encodeURIComponent(variant)}` : "";
  return fetchJson(`${BASE}/projects/${encodeURIComponent(projectId)}/supply${query}`, { signal }, "Could not load the project's supply");
}

export function getProjectTrade(projectId: string, variant = "", signal?: AbortSignal): Promise<{ available: boolean; report: TradeReport | null }> {
  const query = variant ? `?variant=${encodeURIComponent(variant)}` : "";
  return fetchJson(`${BASE}/projects/${encodeURIComponent(projectId)}/trade${query}`, { signal }, "Could not load the trade classification");
}

export function getBomSuggestions(projectId: string, variant = "", signal?: AbortSignal): Promise<BomSuggestions> {
  const query = variant ? `?variant=${encodeURIComponent(variant)}` : "";
  return fetchJson(`${BASE}/projects/${encodeURIComponent(projectId)}/suggestions${query}`, { signal }, "Could not load the suggestions");
}

export function getProjectBomHealth(
  projectId: string,
  signal?: AbortSignal,
  variant = "",
): Promise<{ available: boolean; rollup?: SupplyBomRollup; variants?: string[] }> {
  const query = variant ? `?variant=${encodeURIComponent(variant)}` : "";
  return fetchJson(`${BASE}/projects/${encodeURIComponent(projectId)}/bom-health${query}`, { signal }, "Could not load the supply health");
}

export function getPartDatasheet(partId: string, signal?: AbortSignal): Promise<{ url: string }> {
  return fetchJson(`${BASE}/parts/${encodeURIComponent(partId)}/datasheet`, { signal }, "Could not load the datasheet address");
}

export async function setDatasheetUrl(partId: string, url: string): Promise<void> {
  const response = await fetchApi(`${BASE}/parts/${encodeURIComponent(partId)}/datasheet-url`, {
    method: "PUT",
    body: JSON.stringify({ url }),
  });
  if (!response.ok) {
    throw new ApiHttpError(response.status, await readApiError(response, "Could not save the datasheet address"));
  }
}

export function getPartCompliance(partId: string, signal?: AbortSignal): Promise<SupplyCompliance> {
  return fetchJson(`${BASE}/parts/${encodeURIComponent(partId)}/compliance`, { signal }, "Could not load the compliance");
}

export function declareSubstance(partId: string, cas: string, note: string): Promise<void> {
  return send(`${BASE}/parts/${encodeURIComponent(partId)}/substances`, "POST", { cas, note }, "Could not declare the substance");
}

export function addRohsExemption(partId: string, code: string, note: string): Promise<void> {
  return send(`${BASE}/parts/${encodeURIComponent(partId)}/exemptions`, "POST", { code, note }, "Could not record the exemption");
}

export function removeRohsExemption(partId: string, code: string): Promise<void> {
  return send(`${BASE}/parts/${encodeURIComponent(partId)}/exemptions/${encodeURIComponent(code)}`, "DELETE", undefined, "Could not remove the exemption");
}

export function undeclareSubstance(partId: string, cas: string): Promise<void> {
  return send(`${BASE}/parts/${encodeURIComponent(partId)}/substances/${encodeURIComponent(cas)}`, "DELETE", undefined, "Could not remove the substance");
}

export function getSvhcList(signal?: AbortSignal): Promise<SupplySvhcList> {
  return fetchJson(`${BASE}/compliance/svhc`, { signal }, "Could not load the Candidate List");
}

export function loadSvhcList(csv: string, sourceName: string): Promise<SupplySvhcList> {
  return post(`${BASE}/compliance/svhc`, { csv, source_name: sourceName }, "Could not load the Candidate List");
}

/** The same list as an Excel file, sent as base64. */
export function loadSvhcListXlsx(xlsxBase64: string, sourceName: string): Promise<SupplySvhcList> {
  return post(`${BASE}/compliance/svhc`, { xlsx_base64: xlsxBase64, source_name: sourceName }, "Could not load the Candidate List");
}

export function getSupplyMarket(signal?: AbortSignal): Promise<SupplyMarket> {
  return fetchJson(`${BASE}/market`, { signal }, "Could not load the market figures");
}

export function getSupplyMarketHistory(metric: string, signal?: AbortSignal): Promise<SupplyMarketHistory> {
  return fetchJson(`${BASE}/market/history?metric=${encodeURIComponent(metric)}`, { signal }, "Could not load the market history");
}

export async function listPartNotices(partId: string, signal?: AbortSignal): Promise<SupplyNotice[]> {
  const url = `${BASE}/parts/${encodeURIComponent(partId)}/notices`;
  return (await fetchJson<{ items: SupplyNotice[] }>(url, { signal }, "Could not load the notices")).items;
}

export function addNotice(notice: {
  title: string;
  kind: SupplyNoticeKind;
  parts: Array<{ manufacturer: string; mpn: string }>;
  notice_url: string;
  last_time_buy: string | null;
  last_time_ship: string | null;
  notes: string;
}): Promise<{ id: string }> {
  return post(`${BASE}/notices`, notice, "Could not add the notice");
}

export function closeNotice(noticeId: string): Promise<void> {
  return send(`${BASE}/notices/${encodeURIComponent(noticeId)}/close`, "POST", undefined, "Could not close the notice");
}

export interface SupplyReadNow {
  read: number;
  connectors: number;
  problems: Array<{ connector: string; reason: string }>;
}

/** Read one part from its distributors now. Spends the interactive reserve; once per 15 minutes per person and part. */
/** What reading a part's notices now found. */
export interface SupplyNoticeCheck {
  read: number;
  new: number;
  connectors: number;
  problems: Array<{ connector: string; reason: string }>;
}

/** Read this part's change notices from the distributors that list them, now. Once an hour per person and part. */
export function checkPartNotices(partId: string): Promise<SupplyNoticeCheck> {
  return post(`${BASE}/parts/${encodeURIComponent(partId)}/check-notices`, undefined, "Could not check the notices");
}

export function readSupplyPartNow(partId: string): Promise<SupplyReadNow> {
  return post(`${BASE}/parts/${encodeURIComponent(partId)}/refresh`, undefined, "Could not read the part");
}
