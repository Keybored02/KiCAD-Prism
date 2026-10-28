/** Typed client for `/api/supply/components/{id}`: a component's parts (main and alternates) and its local stock. */

import { ApiHttpError, fetchApi, fetchJson, readApiError } from "@/lib/api";
import type { ComponentParts, LocalStock } from "@/types/supply";

const path = (componentId: string, ...rest: string[]) => ["/api/supply/components", encodeURIComponent(componentId), ...rest.map(encodeURIComponent)].join("/");

export function getComponentParts(componentId: string, signal?: AbortSignal): Promise<ComponentParts> {
  return fetchJson<ComponentParts>(path(componentId, "parts"), { signal }, "Could not load the component's parts");
}

export function proposeAlternate(componentId: string, manufacturer: string, mpn: string): Promise<ComponentParts> {
  return fetchJson<ComponentParts>(path(componentId, "alternates"), { method: "POST", body: JSON.stringify({ manufacturer, mpn }) }, "Could not propose the alternate");
}

export function decideAlternate(componentId: string, partId: string, approve: boolean): Promise<ComponentParts> {
  return fetchJson<ComponentParts>(path(componentId, "alternates", partId, "decision"), { method: "POST", body: JSON.stringify({ approve }) }, "Could not record the decision");
}

export async function removeAlternate(componentId: string, partId: string): Promise<void> {
  const response = await fetchApi(path(componentId, "alternates", partId), { method: "DELETE" });
  if (!response.ok) throw new ApiHttpError(response.status, await readApiError(response, "Could not remove the alternate"));
}

export function getLocalStock(componentId: string, signal?: AbortSignal): Promise<LocalStock> {
  return fetchJson<LocalStock>(path(componentId, "local-stock"), { signal }, "Could not load the local stock");
}
