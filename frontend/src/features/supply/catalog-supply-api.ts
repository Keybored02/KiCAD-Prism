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
