/** Typed client for `/api/supply`. Errors are `ApiHttpError` with the server's code. */

import { ApiHttpError, fetchApi, fetchJson, readApiError } from "@/lib/api";
import type {
  ConfirmAliasInput,
  CreateSupplyConnectorInput,
  SupplyConnector,
  SupplyCsvResult,
  SupplyCsvRowError,
  SupplyProvider,
  SupplyReviewQueue,
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
