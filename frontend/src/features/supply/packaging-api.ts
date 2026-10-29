import { fetchJson } from "@/lib/api";
import type { PackagingOptions, PackagingProposal, PackagingSeveral, PackagingSimilar, PackagingWaiting } from "@/types/supply";
import { changesSupply } from "./supply-writes";

const BASE = "/api/supply/packaging";
const path = (partId: string, connectorId: string) => `${BASE}/${encodeURIComponent(partId)}/${encodeURIComponent(connectorId)}`;

export function listPackagingWaiting(signal?: AbortSignal): Promise<{ items: PackagingWaiting[]; saves_calls_a_day: number }> {
  return fetchJson(`${BASE}/waiting`, { signal }, "Could not load the packaging picks");
}

export function getPackagingOptions(partId: string, connectorId: string, signal?: AbortSignal): Promise<PackagingOptions> {
  return fetchJson(path(partId, connectorId), { signal }, "Could not load the listings");
}

function pickPackagingRequest(partId: string, connectorId: string, listingId: string): Promise<{ picked: string; packaging: string; similar: PackagingSimilar[] }> {
  return fetchJson(path(partId, connectorId), { method: "PUT", body: JSON.stringify({ listing_id: listingId }) }, "Could not pick the packaging");
}

async function clearPackagingPickRequest(partId: string, connectorId: string): Promise<void> {
  await fetchJson(path(partId, connectorId), { method: "DELETE" }, "Could not clear the pick");
}

function applySimilarPicksRequest(connectorId: string, packaging: string, partIds: string[]): Promise<{ picked: number }> {
  return fetchJson(
    `${BASE}/similar`,
    { method: "POST", body: JSON.stringify({ connector_id: connectorId, packaging, part_ids: partIds }) },
    "Could not apply the picks",
  );
}

export function listPackagingSeveral(signal?: AbortSignal): Promise<{ items: PackagingSeveral[] }> {
  return fetchJson(`${BASE}/several`, { signal }, "Could not load the listings");
}

export function getAutoProposals(partId: string, signal?: AbortSignal): Promise<{ items: PackagingProposal[]; saves_calls_a_day: number }> {
  return fetchJson(`${BASE}/auto/${encodeURIComponent(partId)}`, { signal }, "Could not work out the picks");
}

function applyAutoProposalsRequest(partId: string): Promise<{ picked: number }> {
  return fetchJson(`${BASE}/auto/${encodeURIComponent(partId)}`, { method: "POST" }, "Could not pick the listings");
}

export const pickPackaging = changesSupply(pickPackagingRequest);
export const clearPackagingPick = changesSupply(clearPackagingPickRequest);
export const applySimilarPicks = changesSupply(applySimilarPicksRequest);
export const applyAutoProposals = changesSupply(applyAutoProposalsRequest);
