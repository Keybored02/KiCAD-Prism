/** Typed client for `/api/supply`. Errors are `ApiHttpError` with the server's code. */

import { ApiHttpError, fetchApi, fetchJson, readApiError } from "@/lib/api";
import type {
  CreateSupplyConnectorInput,
  SupplyConnector,
  SupplyProvider,
  UpdateSupplyConnectorInput,
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

export function confirmSupplyTermsReview(id: string): Promise<SupplyConnector> {
  return post(connectorPath(id, "terms-review"), undefined, "Could not record the review");
}

export async function deleteSupplyConnector(id: string): Promise<void> {
  const response = await fetchApi(connectorPath(id), { method: "DELETE" });
  if (!response.ok) {
    throw new ApiHttpError(response.status, await readApiError(response, "Could not delete the connector"));
  }
}
