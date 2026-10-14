import { fetchJson } from "@/lib/api";
import type { SupplyComponentStanding } from "@/types/supply";

/** Kept out of supply-api so the catalog table pulls in only this call, not the whole supply client. */
export async function getComponentsStatus(
  components: Array<{ id: string; manufacturer: string; mpn: string }>,
  signal?: AbortSignal,
): Promise<Record<string, SupplyComponentStanding>> {
  const body = JSON.stringify({ components: components.map(({ id, manufacturer, mpn }) => ({ key: id, manufacturer, mpn })) });
  const url = "/api/supply/bom/components-status";
  return (await fetchJson<{ items: Record<string, SupplyComponentStanding> }>(url, { method: "POST", body, signal }, "Could not load supply status")).items;
}

const WATCH_BATCH = 200;

/** Watch these components' parts. Returns how many were newly watched and how many were left out. Each part is on one row, so the batches can go together. */
export async function watchCatalogComponents(components: Array<{ id: string; manufacturer: string; mpn: string }>): Promise<{ watched: number; skipped: number }> {
  const batches: Array<typeof components> = [];
  for (let start = 0; start < components.length; start += WATCH_BATCH) batches.push(components.slice(start, start + WATCH_BATCH));
  const results = await Promise.all(batches.map((batch) => fetchJson<{ watched: number; skipped?: unknown[] }>(
    "/api/supply/bom/watch",
    { method: "POST", body: JSON.stringify({ lines: batch.map(({ id, manufacturer, mpn }) => ({ key: id, manufacturer, mpn, quantity: 1 })) }) },
    "Could not watch the parts",
  )));
  return {
    watched: results.reduce((sum, result) => sum + result.watched, 0),
    skipped: results.reduce((sum, result) => sum + (result.skipped?.length ?? 0), 0),
  };
}
