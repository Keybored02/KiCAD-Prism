/** Typed client for `/api/supply/work-items`: engineering decisions about a component or a part. */

import { fetchJson } from "@/lib/api";
import type { SupplyWorkItem, WorkItemAction, WorkItemState } from "@/types/supply";
import { changesSupply } from "./supply-writes";

const BASE = "/api/supply/work-items";

export type WorkItemList = "live" | "mine" | "due" | WorkItemState;

export function listWorkItems(list: WorkItemList, signal?: AbortSignal, subject?: { kind: "component" | "part"; id: string }): Promise<SupplyWorkItem[]> {
  const query = new URLSearchParams({ state: list });
  if (subject) {
    query.set("subject_kind", subject.kind);
    query.set("subject_id", subject.id);
  }
  return fetchJson<SupplyWorkItem[]>(`${BASE}?${query}`, { signal }, "Could not load the work items");
}

export interface NewWorkItem {
  subject_kind: "component" | "part";
  subject_id: string;
  title: string;
  action: WorkItemAction;
  owner?: string;
  note?: string;
  recheck_on?: string | null;
}

function createWorkItemRequest(item: NewWorkItem): Promise<SupplyWorkItem> {
  return fetchJson<SupplyWorkItem>(BASE, { method: "POST", body: JSON.stringify(item) }, "Could not open the work item");
}

function updateWorkItemRequest(
  id: string, change: { title?: string; action?: WorkItemAction; owner?: string; recheck_on?: string | null; clear_recheck?: boolean; note?: string },
): Promise<SupplyWorkItem> {
  return fetchJson<SupplyWorkItem>(`${BASE}/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(change) }, "Could not change the work item");
}

function decideWorkItemRequest(id: string, state: WorkItemState, note = ""): Promise<SupplyWorkItem> {
  return fetchJson<SupplyWorkItem>(`${BASE}/${encodeURIComponent(id)}/state`, { method: "POST", body: JSON.stringify({ state, note }) }, "Could not change the work item");
}

export function workItemHistory(id: string, signal?: AbortSignal): Promise<Array<{ at: string; actor: string; action: string; detail: Record<string, unknown> }>> {
  return fetchJson(`${BASE}/${encodeURIComponent(id)}/history`, { signal }, "Could not load the history");
}

export const createWorkItem = changesSupply(createWorkItemRequest);
export const updateWorkItem = changesSupply(updateWorkItemRequest);
export const decideWorkItem = changesSupply(decideWorkItemRequest);
