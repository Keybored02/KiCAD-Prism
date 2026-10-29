/** Typed client for `/api/supply/inventory-sources`: local inventory servers. */

import { ApiHttpError, fetchApi, fetchJson, readApiError } from "@/lib/api";
import type { InventoryServerCheck, InventorySource, InventorySourceInput, InventorySyncResult, InventoryUnmatchedPart } from "@/types/supply";

const BASE = "/api/supply/inventory-sources";

const path = (id: string, ...rest: string[]) => [BASE, encodeURIComponent(id), ...rest].join("/");

export function listInventorySources(signal?: AbortSignal): Promise<InventorySource[]> {
  return fetchJson<InventorySource[]>(BASE, { signal }, "Could not load inventory sources");
}

export function createInventorySource(input: InventorySourceInput): Promise<InventorySource> {
  return fetchJson<InventorySource>(BASE, { method: "POST", body: JSON.stringify(input) }, "Could not add the source");
}

export function updateInventorySource(id: string, input: InventorySourceInput): Promise<InventorySource> {
  return fetchJson<InventorySource>(path(id), { method: "PATCH", body: JSON.stringify(input) }, "Could not save the source");
}

export async function deleteInventorySource(id: string): Promise<void> {
  const response = await fetchApi(path(id), { method: "DELETE" });
  if (!response.ok) throw new ApiHttpError(response.status, await readApiError(response, "Could not delete the source"));
}

export function checkInventorySource(id: string): Promise<InventoryServerCheck> {
  return fetchJson<InventoryServerCheck>(path(id, "check"), { method: "POST" }, "Could not reach the server");
}

export function syncInventorySource(id: string): Promise<InventorySyncResult> {
  return fetchJson<InventorySyncResult>(path(id, "sync"), { method: "POST" }, "Could not read the server");
}

export function listUnmatchedParts(
  id: string, signal?: AbortSignal, page: { q?: string; limit?: number; offset?: number } = {},
): Promise<InventoryUnmatchedPart[]> {
  const query = new URLSearchParams();
  if (page.q) query.set("q", page.q);
  if (page.limit !== undefined) query.set("limit", String(page.limit));
  if (page.offset) query.set("offset", String(page.offset));
  const suffix = query.toString() ? `?${query}` : "";
  return fetchJson<InventoryUnmatchedPart[]>(`${path(id, "unmatched")}${suffix}`, { signal }, "Could not load the unmatched stock");
}

/** Says which component a server part is; the source is read again, so its stock lands at once. */
export function linkUnmatchedPart(id: string, remotePart: string, componentId: string): Promise<InventorySyncResult> {
  return fetchJson<InventorySyncResult>(path(id, "unmatched", encodeURIComponent(remotePart), "link"), { method: "POST", body: JSON.stringify({ component_id: componentId }) }, "Could not link the part");
}
