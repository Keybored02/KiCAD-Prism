import { fetchJson } from "@/lib/api";
import type { EndingParts, RestrictionLevel } from "@/types/supply";

const BASE = "/api/supply/ending";

/** Library components whose part is ending, with the reason and what a person needs to decide. */
export function getEndingParts(signal?: AbortSignal): Promise<EndingParts> {
  return fetchJson<EndingParts>(BASE, { signal }, "Could not load the ending parts");
}

/** Mark a component "not for new designs", or record that it was retired. */
export async function setRestriction(componentId: string, level: RestrictionLevel, reason: string): Promise<void> {
  await fetchJson(`${BASE}/${encodeURIComponent(componentId)}/restriction`, { method: "PUT", body: JSON.stringify({ level, reason }) }, "Could not save the decision");
}

export async function clearRestriction(componentId: string): Promise<void> {
  await fetchJson(`${BASE}/${encodeURIComponent(componentId)}/restriction`, { method: "DELETE" }, "Could not clear the decision");
}

/** Retire a component through the catalog's own workflow (the archive step), then record it here. */
export async function retireComponent(componentId: string, reason: string): Promise<void> {
  await fetchJson(
    `/api/catalog/components/${encodeURIComponent(componentId)}/release`,
    { method: "POST", body: JSON.stringify({ workflow_stage: "archived", review_note: reason }) },
    "Could not archive the component",
  );
  await setRestriction(componentId, "retired", reason);
}
