/**
 * Typed client for `/api/systems` (docs/system-builder/CONTRACTS.md §8).
 *
 * Every engineering change is guarded by the whole-system ETag: mutations
 * take the ETag the caller last read and return the new one. A stale ETag
 * is a 412 `StaleSystemError` carrying the current ETag, so a caller can
 * reload and retry deliberately rather than overwrite someone's work.
 */

import { ApiHttpError, fetchApi, fetchJson, readApiError } from "@/lib/api";
import type { PaginatedComponents } from "@/types/catalog";
import type { PrismSemanticIndex } from "@/types/prism-selection";
import type {
  Decision,
  GeneratorKind,
  GeneratorResult,
  GitLink,
  HistoryPage,
  ImportCommitReport,
  ImportPreview,
  ImportTarget,
  ImportUpload,
  InstanceInterface,
  HarnessWire,
  InstanceMating,
  LinkMate,
  SystemPlacement,
  LinkType,
  MatingAxis,
  OptionalRule,
  PortMating,
  Review,
  ReviewStatus,
  RowSource,
  SnapshotDiff,
  SnapshotMeta,
  SnapshotPublication,
  StoredPose,
  SystemDocument,
  SystemExport,
  SystemHarness,
  HarnessNodeInput,
  SystemHierarchy,
  SystemInstance,
  SystemLink,
  SystemNetDetail,
  SystemNetList,
  SystemPort,
  SystemScene,
  SystemSummary,
  FindingWaiver,
} from "@/types/system";

const BASE = "/api/systems";

export interface Versioned<T> {
  body: T;
  /** The system ETag after the call; null for calls that carry none (layout). */
  etag: string | null;
}

export class StaleSystemError extends ApiHttpError {
  currentEtag: string | null;

  constructor(message: string, currentEtag: string | null) {
    super(412, message, "stale_version");
    this.name = "StaleSystemError";
    this.currentEtag = currentEtag;
  }
}

function path(...parts: string[]): string {
  return [BASE, ...parts.map((part) => encodeURIComponent(part))].join("/");
}

async function send<T>(
  url: string,
  init: RequestInit & { etag?: string } = {},
  fallback = "System request failed",
): Promise<{ status: number; body: T; etag: string | null }> {
  const { etag, ...rest } = init;
  const headers = new Headers(rest.headers);
  if (etag) {
    headers.set("If-Match", etag);
  }
  const response = await fetchApi(url, { ...rest, headers });
  const nextEtag = response.headers.get("ETag");
  if (response.status === 412) {
    throw new StaleSystemError(await readApiError(response, "This system changed; reload it"), nextEtag);
  }
  if (!response.ok) {
    let code: string | undefined;
    const message = await readApiError(response.clone(), fallback);
    if (response.status === 409 && message.startsWith("interface_not_ready")) {
      code = "interface_not_ready";
    }
    throw new ApiHttpError(response.status, message, code);
  }
  const body = response.status === 204 ? (undefined as T) : ((await response.json()) as T);
  return { status: response.status, body, etag: nextEtag };
}

async function versioned<T>(url: string, init: RequestInit & { etag?: string } = {}, fallback?: string): Promise<Versioned<T>> {
  const { body, etag } = await send<T>(url, init, fallback);
  return { body, etag };
}

const json = (value: unknown) => JSON.stringify(value);

/** A queued background job (`202`): extraction, detection or rebase. */
export interface QueuedJob {
  job_id: string;
  status: string;
}

// ---------------------------------------------------------------------------
// Systems

export function createSystem(input: { name: string; description?: string; folderId?: string | null }) {
  return versioned<SystemSummary>(BASE, { method: "POST", body: json(input) }, "Could not create the system");
}

/** `PATCH /systems/{id}`; `optionalRules` replaces the stored list (CONTRACTS_P2 §8.4). */
export function updateSystem(
  systemId: string, etag: string,
  fields: { name?: string; description?: string; folderId?: string | null; optionalRules?: OptionalRule[] },
) {
  return versioned<SystemSummary>(path(systemId), { method: "PATCH", etag, body: json(fields) }, "Could not update the system");
}

/** SB2-101: every system the reader may see, with board totals, last snapshot, git and counts. */
export async function listSystems(init?: RequestInit): Promise<SystemSummary[]> {
  return (await versioned<SystemSummary[]>(BASE, init ?? {}, "Could not load the systems")).body;
}

export function getSystem(systemId: string, init?: RequestInit) {
  // SB2-98: the findings come with the document, so an edit is one re-read, not two.
  return versioned<SystemDocument>(`${path(systemId)}?include=validation`, init, "Could not load the system");
}

// ---------------------------------------------------------------------------
// Instances

export interface InstanceInput {
  projectId: string;
  label: string;
  baselineCommit?: string | null;
  trackedRef?: string | null;
  pinned?: boolean;
}

export type InstanceRow = Pick<
  SystemInstance,
  "id" | "label" | "projectId" | "baselineCommit" | "trackedRef" | "pinned" | "resolution" | "tipCommit" | "tipCheckedAt"
>;

export function addInstance(systemId: string, etag: string, input: InstanceInput) {
  return versioned<InstanceRow>(path(systemId, "instances"), { method: "POST", etag, body: json(input) },
    "Could not add the board");
}

/**
 * P2 §5.1, §5.6: an assembly or module instance pinning a catalog revision (the released one when
 * `revisionId` is omitted).
 */
export function addCatalogInstance(
  systemId: string, etag: string, kind: "assembly" | "module",
  input: { label: string; componentId: string; revisionId?: string; follow: "pinned" | "latest_released" },
) {
  return versioned<InstanceRow>(path(systemId, "instances"), { method: "POST", etag, body: json({ kind, ...input }) },
    kind === "module" ? "Could not add the module" : "Could not add the subsystem");
}

export function getHierarchy(systemId: string) {
  return send<SystemHierarchy>(path(systemId, "hierarchy")).then((r) => r.body);
}

export function getScene(systemId: string) {
  return send<SystemScene>(path(systemId, "scene")).then((r) => r.body);
}

export function updateInstance(
  systemId: string, etag: string, instanceId: string,
  fields: { label?: string; pinned?: boolean; trackedRef?: string | null; follow?: "pinned" | "latest_released" },
) {
  return versioned<InstanceRow>(path(systemId, "instances", instanceId), { method: "PATCH", etag, body: json(fields) });
}

export function removeInstance(systemId: string, etag: string, instanceId: string, cascadeLinks = false) {
  const query = cascadeLinks ? "?cascade=links" : "";
  return versioned<void>(`${path(systemId, "instances", instanceId)}${query}`, { method: "DELETE", etag });
}

export async function getInstanceInterface(
  systemId: string, instanceId: string, commit?: string,
): Promise<{ state: "ready"; body: InstanceInterface } | { state: "queued"; job: QueuedJob }> {
  const query = commit ? `?commit=${encodeURIComponent(commit)}` : "";
  const { status, body } = await send<InstanceInterface | QueuedJob>(
    `${path(systemId, "instances", instanceId, "interface")}${query}`,
  );
  return status === 202 ? { state: "queued", job: body as QueuedJob } : { state: "ready", body: body as InstanceInterface };
}

export function checkNow(systemId: string, instanceId: string) {
  return send<QueuedJob>(path(systemId, "instances", instanceId, "check"), { method: "POST" }).then((r) => r.body);
}

export function setPortOverride(
  systemId: string, etag: string, instanceId: string, portKey: string, state: "hidden" | "promoted" | null,
) {
  return versioned<SystemPort>(path(systemId, "instances", instanceId, "ports", portKey, "override"),
    { method: "PUT", etag, body: json({ state }) });
}

// ---------------------------------------------------------------------------
// Links and layout

export interface LinkEndInput {
  instanceId: string;
  portKey: string;
}

export function createLink(
  systemId: string, etag: string,
  input: { a: LinkEndInput; b: LinkEndInput; name?: string; harness?: string | null; type?: LinkType },
) {
  return versioned<SystemLink>(path(systemId, "links"), { method: "POST", etag, body: json(input) },
    "Could not create the link");
}

export function updateLink(
  systemId: string, etag: string, linkId: string,
  fields: { name?: string; harness?: string | null; type?: LinkType; stackHeightMm?: number | null },
) {
  return versioned<SystemLink>(path(systemId, "links", linkId), { method: "PATCH", etag, body: json(fields) });
}

export function deleteLink(systemId: string, etag: string, linkId: string) {
  return versioned<void>(path(systemId, "links", linkId), { method: "DELETE", etag });
}

// ---------------------------------------------------------------------------
// Exports (CONTRACTS_P2 §4)

export function createExport(
  systemId: string, etag: string, input: { name: string; description?: string; instanceId: string; portKey: string },
) {
  return versioned<SystemExport>(path(systemId, "exports"), { method: "POST", etag, body: json(input) },
    "Could not export the port");
}

export function updateExport(
  systemId: string, etag: string, exportId: string,
  fields: { name?: string; description?: string; instanceId?: string; portKey?: string },
) {
  return versioned<SystemExport>(path(systemId, "exports", exportId), { method: "PATCH", etag, body: json(fields) },
    "Could not update the export");
}

export function deleteExport(systemId: string, etag: string, exportId: string) {
  return versioned<void>(path(systemId, "exports", exportId), { method: "DELETE", etag });
}

export interface RowInput {
  id?: string;
  pinA: string;
  pinB: string;
  signal: string;
  source: RowSource;
}

/** `PUT …/rows` replaces **all** of a link's rows; send the ones to keep too. */
export function replaceRows(systemId: string, etag: string, linkId: string, rows: RowInput[]) {
  return versioned<SystemLink>(path(systemId, "links", linkId, "rows"), { method: "PUT", etag, body: json(rows) },
    "Could not save the rows");
}

export function generateRows(
  systemId: string, linkId: string, generator: GeneratorKind, options: Record<string, unknown> = {},
) {
  return versioned<GeneratorResult>(path(systemId, "links", linkId, "generate"),
    { method: "POST", body: json({ generator, options }) });
}

/** SB2-100: waive one warning or info finding with a note (a versioned edit). */
export function waiveFinding(systemId: string, etag: string, findingKey: string, note: string) {
  return versioned<FindingWaiver>(path(systemId, "waivers"), { method: "POST", etag, body: json({ findingKey, note }) });
}

export function unwaiveFinding(systemId: string, etag: string, waiverId: string) {
  return versioned<void>(path(systemId, "waivers", waiverId), { method: "DELETE", etag });
}

/** P2 §7.1: move an assembly instance to a catalog revision (auto-advance or a child review). */
export function rebaseSubsystem(systemId: string, etag: string, instanceId: string, revisionId: string) {
  return versioned<{ outcome: string; reviewId: string | null; instance: InstanceRow }>(
    path(systemId, "instances", instanceId, "rebase"), { method: "POST", etag, body: json({ revisionId }) },
    "Could not move the subsystem");
}

export async function rebaseInstance(systemId: string, etag: string, instanceId: string, commit: string) {
  const result = await send<
    QueuedJob | { outcome: "auto_advanced" | "review_opened" | string; reviewId: string | null; instance: InstanceRow }
  >(path(systemId, "instances", instanceId, "rebase"), { method: "POST", etag, body: json({ commit }) });
  return result.status === 202
    ? { state: "queued" as const, job: result.body as QueuedJob }
    : { state: "done" as const, etag: result.etag, body: result.body as { outcome: string; reviewId: string | null; instance: InstanceRow } };
}

export function listReviews(systemId: string, status?: ReviewStatus) {
  const query = status ? `?status=${status}` : "";
  return send<Review[]>(`${path(systemId, "reviews")}${query}`).then((r) => r.body);
}

export function decideReviewItem(
  systemId: string, etag: string, reviewId: string, itemId: string, decision: Decision,
  payload?: Record<string, unknown>,
) {
  return versioned<Review>(path(systemId, "reviews", reviewId, "items", itemId, "decision"),
    { method: "POST", etag, body: json({ decision, payload: payload ?? null }) }, "Could not record the decision");
}

export function keepPinned(systemId: string, etag: string, reviewId: string) {
  return versioned<Review>(path(systemId, "reviews", reviewId, "keep-pinned"), { method: "POST", etag });
}

export function getHistory(systemId: string, cursor?: number | null, limit = 100) {
  const query = new URLSearchParams({ limit: String(limit) });
  if (cursor) {
    query.set("cursor", String(cursor));
  }
  return send<HistoryPage>(`${path(systemId, "history")}?${query}`).then((r) => r.body);
}

export type LayoutPositions = Record<string, { x: number; y: number }>;

export function getLayout(systemId: string) {
  return send<{ positions: LayoutPositions }>(path(systemId, "layout")).then((r) => r.body.positions);
}

export function putLayout(systemId: string, positions: LayoutPositions) {
  return send<{ positions: LayoutPositions }>(path(systemId, "layout"),
    { method: "PUT", body: json({ positions }) }).then((r) => r.body.positions);
}

// ---------------------------------------------------------------------------
// Snapshots and ICD (§9)

export function createSnapshot(systemId: string, etag: string, input: { name: string; note?: string }) {
  return versioned<SnapshotMeta>(path(systemId, "snapshots"), { method: "POST", etag, body: json(input) },
    "Could not create the snapshot");
}

export function listSnapshots(systemId: string) {
  return send<SnapshotMeta[]>(path(systemId, "snapshots")).then((r) => r.body);
}

export function diffSnapshot(systemId: string, snapshotId: string, against: "live" | string = "live") {
  return send<SnapshotDiff>(`${path(systemId, "snapshots", snapshotId, "diff")}?against=${encodeURIComponent(against)}`)
    .then((r) => r.body);
}

/** Where the browser opens an ICD: live, or a snapshot's. */
export async function publishSnapshot(
  systemId: string, snapshotId: string,
  fields: { ipn?: string; name?: string; description?: string; manufacturer?: string },
): Promise<SnapshotPublication> {
  const { body } = await send<SnapshotPublication>(`${path(systemId, "snapshots", snapshotId)}/publish`,
    { method: "POST", body: json(fields) }, "Could not publish the snapshot");
  return body;
}

export function retrySnapshotGit(systemId: string, snapshotId: string) {
  return send<{ jobId: string }>(`${path(systemId, "snapshots", snapshotId)}/git-retry`, { method: "POST" },
    "Could not queue the commit").then((r) => r.body);
}

// ---------------------------------------------------------------------------
// Git tracking (P2 §21)

export function getGitLink(systemId: string) {
  return send<GitLink | null>(path(systemId, "git")).then((r) => r.body);
}

export function putGitLink(systemId: string, etag: string, input: { url: string; branch?: string }) {
  return versioned<GitLink>(path(systemId, "git"), { method: "PUT", etag, body: json(input) },
    "Could not link the repository");
}

export function deleteGitLink(systemId: string, etag: string) {
  return versioned<null>(path(systemId, "git"), { method: "DELETE", etag }, "Could not unlink the repository");
}

export function decideManifestImport(systemId: string, etag: string, reviewId: string, decision: "accept" | "reject") {
  return versioned<Review>(`${path(systemId, "reviews", reviewId)}/manifest-import`,
    { method: "POST", etag, body: json({ decision }) }, "Could not decide the import");
}

export function fetchGitLink(systemId: string) {
  return send<{ jobId: string }>(`${path(systemId, "git")}/fetch`, { method: "POST" }, "Could not fetch")
    .then((r) => r.body);
}

export function manifestUrl(systemId: string, snapshotId: string): string {
  return `${path(systemId, "snapshots", snapshotId)}/manifest`;
}

export function icdUrl(systemId: string, format: "csv" | "html", snapshotId?: string, depth: "own" | "all" = "own"): string {
  const base = snapshotId ? `${path(systemId, "snapshots", snapshotId)}/icd.${format}` : `${path(systemId)}/icd.${format}`;
  return depth === "all" ? `${base}?depth=all` : base;
}

// ---------------------------------------------------------------------------
// CSV import (§9.3)

export interface ImportMaps {
  columnMap: Partial<Record<ImportTarget, string>>;
  boardMap: Record<string, string>;
  delimiter?: string | null;
}

export async function uploadImport(systemId: string, file: File, delimiter?: string) {
  const form = new FormData();
  form.append("file", file);
  if (delimiter) {
    form.append("delimiter", delimiter);
  }
  const { body } = await send<ImportUpload>(path(systemId, "imports"), { method: "POST", body: form },
    "Could not read the CSV");
  return body;
}

export function previewImport(systemId: string, importId: string, maps: ImportMaps) {
  return versioned<ImportPreview>(path(systemId, "imports", importId, "preview"), { method: "POST", body: json(maps) },
    "Could not preview the import");
}

export function commitImport(systemId: string, etag: string, importId: string, maps: ImportMaps) {
  return versioned<ImportCommitReport>(path(systemId, "imports", importId, "commit"),
    { method: "POST", etag, body: json(maps) }, "Could not commit the import");
}

// ---------------------------------------------------------------------------
// Mating frames (CONTRACTS_P2 §15.3)

/** The root level's mate solve (CONTRACTS_P2 §14.10). */
export async function getPlacement(systemId: string): Promise<SystemPlacement> {
  const { body } = await send<SystemPlacement>(path(systemId, "placement"), {}, "Could not load the placement");
  return body;
}

/** Both connectors of a B2B link, for the mate preview. */
export async function getLinkMate(systemId: string, linkId: string): Promise<LinkMate> {
  const { body } = await send<LinkMate>(path(systemId, "links", linkId, "mate"), {}, "Could not load the mated pair");
  return body;
}

/** Choose the B2B link that places an instance (CONTRACTS_P2 §14.10). */
export function setDrivingMate(systemId: string, etag: string, instanceId: string, linkId: string) {
  return versioned<{ instanceId: string; linkId: string | null }>(path(systemId, "driving-mates", instanceId),
    { method: "PUT", etag, body: json({ linkId }) }, "Could not choose the driving mate");
}

/** Back to the solve's choice (most rows, then the lower reference). */
export function clearDrivingMate(systemId: string, etag: string, instanceId: string) {
  return versioned<{ instanceId: string; linkId: string | null }>(path(systemId, "driving-mates", instanceId),
    { method: "DELETE", etag }, "Could not reset the driving mate");
}

export async function getMating(systemId: string, instanceId: string): Promise<InstanceMating> {
  const { body } = await send<InstanceMating>(path(systemId, "instances", instanceId, "mating"), {}, "Could not load mating frames");
  return body;
}

export function setMating(
  systemId: string, etag: string, instanceId: string, portKey: string,
  frame: { mode: "confirmed" } | { mode: "override"; axis: MatingAxis; quarterTurns: number },
) {
  return versioned<PortMating>(path(systemId, "instances", instanceId, "mating", portKey),
    { method: "PUT", etag, body: json(frame) }, "Could not save the mating frame");
}

export function clearMating(systemId: string, etag: string, instanceId: string, portKey: string) {
  return versioned<PortMating>(path(systemId, "instances", instanceId, "mating", portKey),
    { method: "DELETE", etag }, "Could not clear the mating frame");
}

// ---------------------------------------------------------------------------
// Poses (CONTRACTS_P2 §14.3)

/** Store a manual pose; the server canonicalises the rotation. */
export function setPose(
  systemId: string, etag: string, instanceId: string,
  pose: { translationMm: [number, number, number]; rotation: [number, number, number, number] },
) {
  return versioned<StoredPose>(path(systemId, "poses", instanceId),
    { method: "PUT", etag, body: json(pose) }, "Could not save the position");
}

/** Back to the default pose. */
export function clearPose(systemId: string, etag: string, instanceId: string) {
  return versioned<Pick<StoredPose, "instanceId" | "source">>(path(systemId, "poses", instanceId),
    { method: "DELETE", etag }, "Could not reset the position");
}

/** Several poses stored and others cleared in one version (SB2-38: a stack moved together). */
export function setPoses(
  systemId: string, etag: string,
  change: { poses?: { instanceId: string; translationMm: number[]; rotation: number[] }[]; clear?: string[] },
) {
  return versioned<{ poses: Pick<StoredPose, "instanceId" | "source">[] }>(path(systemId, "poses"),
    { method: "PATCH", etag, body: json({ poses: change.poses ?? [], clear: change.clear ?? [] }) },
    "Could not save the positions");
}

/** Every manual pose back to its default (D-P2-14). */
export function resetPoses(systemId: string, etag: string) {
  return versioned<{ reset: string[] }>(path(systemId, "poses"), { method: "DELETE", etag },
    "Could not reset positions");
}

// ---------------------------------------------------------------------------
// Harnesses (CONTRACTS_P2 §17.3)

export type HarnessEndInput = { instanceId: string; portKey: string } | { pinCount: number };
export type WireInput = Pick<HarnessWire, "from" | "to"> & Partial<Pick<HarnessWire, "id" | "signal" | "gaugeAwg" | "colour" | "label">>;

export function createHarness(
  systemId: string, etag: string, input: { name?: string; label?: string | null; ends: HarnessEndInput[]; identity?: boolean },
) {
  return versioned<SystemHarness>(path(systemId, "harnesses"), { method: "POST", etag, body: json(input) },
    "Could not create the harness");
}

export function updateHarness(
  systemId: string, etag: string, harnessId: string,
  fields: { name?: string; label?: string | null; cutLengthMm?: number | null; serviceAllowancePct?: number | null },
) {
  return versioned<SystemHarness>(path(systemId, "harnesses", harnessId), { method: "PATCH", etag, body: json(fields) },
    "Could not update the harness");
}

export function deleteHarness(systemId: string, etag: string, harnessId: string) {
  return versioned<void>(path(systemId, "harnesses", harnessId), { method: "DELETE", etag }, "Could not delete the harness");
}

export function addHarnessEnd(systemId: string, etag: string, harnessId: string, end: HarnessEndInput) {
  return versioned<SystemHarness>(path(systemId, "harnesses", harnessId, "ends"), { method: "POST", etag, body: json(end) },
    "Could not add the end");
}

export function updateHarnessEnd(
  systemId: string, etag: string, harnessId: string, endId: string,
  fields: {
    mates?: { instanceId: string; portKey: string } | null; pinMap?: Record<string, string> | null; bootMm?: number | null;
    /** A catalog part for the mating block, or null for Generic (CONTRACTS_P2 §17.2). */
    part?: { componentId: string } | null;
  },
) {
  return versioned<SystemHarness>(path(systemId, "harnesses", harnessId, "ends", endId),
    { method: "PATCH", etag, body: json(fields) }, "Could not update the end");
}

export function deleteHarnessEnd(systemId: string, etag: string, harnessId: string, endId: string) {
  return versioned<SystemHarness>(path(systemId, "harnesses", harnessId, "ends", endId), { method: "DELETE", etag },
    "Could not remove the end");
}

/** SB2-45 (§17.9): a harness's breakouts and waypoints, replaced as one list in order. */
export function setHarnessNodes(systemId: string, etag: string, harnessId: string, nodes: HarnessNodeInput[]) {
  return versioned<SystemHarness>(path(systemId, "harnesses", harnessId, "nodes"), { method: "PUT", etag, body: json(nodes) },
    "Could not save the harness route");
}

export function replaceWires(systemId: string, etag: string, harnessId: string, wires: WireInput[]) {
  return versioned<SystemHarness>(path(systemId, "harnesses", harnessId, "wires"), { method: "PUT", etag, body: json(wires) },
    "Could not save the wires");
}

export interface WireProposal {
  wires: (WireInput & { netFrom: string[]; netTo: string[] })[];
  skipped: { fromPin: string; toPin: string; reason: "existing" | "unconnected" }[];
}

export async function generateWires(
  systemId: string, harnessId: string,
  input: { fromEnd: string; toEnd: string; generator: GeneratorKind; options?: Record<string, unknown> },
): Promise<WireProposal> {
  const { body } = await send<WireProposal>(path(systemId, "harnesses", harnessId, "generate"),
    { method: "POST", body: json(input) }, "Could not generate wires");
  return body;
}

export function linkToHarness(systemId: string, etag: string, linkId: string) {
  return versioned<SystemHarness>(path(systemId, "links", linkId, "to-harness"), { method: "POST", etag },
    "Could not convert the link");
}

export function harnessFromLabel(systemId: string, etag: string, label: string) {
  return versioned<SystemHarness>(path(systemId, "harnesses", "from-label"), { method: "POST", etag, body: json({ label }) },
    "Could not convert the harness label");
}

export function harnessToLink(systemId: string, etag: string, harnessId: string) {
  return versioned<SystemLink>(path(systemId, "harnesses", harnessId, "to-link"), { method: "POST", etag },
    "Could not convert the harness");
}

export interface CatalogPartSummary {
  componentId: string;
  name: string;
  mpn: string;
  manufacturer: string;
}

/** `GET …/harnesses/{hid}/ends/{eid}/suggestions` (CONTRACTS_P2 §18): suggestions only; nothing is assigned. */
export interface EndSuggestions {
  endId: string;
  connectorMpn: string | null;
  connectorPart: CatalogPartSummary | null;
  suggestions: CatalogPartSummary[];
}

export async function getEndSuggestions(systemId: string, harnessId: string, endId: string): Promise<EndSuggestions> {
  const { body } = await send<EndSuggestions>(path(systemId, "harnesses", harnessId, "ends", endId, "suggestions"), {},
    "Could not load suggestions");
  return body;
}

/** Catalog parts matching `query` by MPN or name, for a harness end's mating block. */
export async function searchCatalogParts(query: string, signal?: AbortSignal): Promise<CatalogPartSummary[]> {
  const params = new URLSearchParams({ q: query, page: "1", page_size: "8", lightweight: "true", kind: "part" });
  const body = await fetchJson<PaginatedComponents>(`/api/catalog/components?${params.toString()}`, { signal });
  return body.items.map((item) => ({ componentId: item.id, name: item.value || item.description || item.mpn, mpn: item.mpn, manufacturer: item.manufacturer }));
}

/** System nets matching `search` (aliases, fuzzy), optionally only those on one occurrence (§8.2). */
export async function listSystemNets(systemId: string, search: string, occurrence?: string): Promise<SystemNetList> {
  const query = new URLSearchParams({ search });
  if (occurrence) query.set("occurrence", occurrence);
  const { body } = await send<SystemNetList>(`${path(systemId, "nets")}?${query}`, {}, "Could not search the system's nets");
  return body;
}

const NET_PAGE = 500;

/** SB2-33: every system net with its visible board nets, for the System 3D tab's search, read a page at a time. */
export async function listSystemNetMembers(systemId: string, signal?: AbortSignal): Promise<SystemNetList> {
  const groups: SystemNetList["groups"] = [];
  let total = 0;
  for (let offset = 0; ; offset += NET_PAGE) {
    const query = new URLSearchParams({ members: "true", limit: String(NET_PAGE), offset: String(offset) });
    const { body } = await send<SystemNetList>(`${path(systemId, "nets")}?${query}`, { signal }, "Could not read the system's nets");
    groups.push(...body.groups);
    total = body.total;
    // A server without paging (no `offset` echoed) returns its first page only.
    if (!body.groups.length || groups.length >= total || body.offset !== offset) break;
  }
  return { systemId, groups, total };
}

/**
 * SB2-32: the system net a board net belongs to, with its members and hops, or
 * null when the net stays on its board (no link carries it).
 */
export async function traceSystemNet(systemId: string, occurrence: string, net: string, signal?: AbortSignal): Promise<SystemNetDetail | null> {
  const query = new URLSearchParams({ occurrence, net, limit: "1" });
  const { body } = await send<SystemNetList>(`${path(systemId, "nets")}?${query}`, { signal }, "Could not trace the net");
  const [found] = body.groups;
  if (!found) return null;
  const detail = await send<SystemNetDetail>(path(systemId, "nets", found.groupId), { signal }, "Could not load the net");
  return detail.body;
}

/** One system net with its members and hops; its group id is valid for the system version that listed it. */
export async function getSystemNet(systemId: string, groupId: string): Promise<SystemNetDetail> {
  const { body } = await send<SystemNetDetail>(path(systemId, "nets", groupId), {}, "Could not load the net");
  return body;
}

/**
 * A board's semantic design index at the commit the system pins (SB2-31e.2): the
 * same identity artifact its own visualizer reads, for the System 3D tab's
 * inspector and search.
 */
export async function getSemanticIndex(projectId: string, commit: string, signal?: AbortSignal): Promise<PrismSemanticIndex> {
  const url = `/api/projects/${encodeURIComponent(projectId)}/semantic-index/identity?commit=${encodeURIComponent(commit)}`;
  return fetchJson<PrismSemanticIndex>(url, { signal }, "The board's design index is unavailable");
}
