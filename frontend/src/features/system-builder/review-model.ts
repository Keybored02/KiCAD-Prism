/**
 * Pure helpers for the Source changes view (§6, §7.1): which group an item
 * belongs in, which decisions it allows, and how to show its values.
 */

import type { AuditEvent, Decision, Review, ReviewItem, ReviewItemKind } from "@/types/system";

export type ItemGroup = "conflict" | "review";

/** Conflicts need a new mapping (the connector or pad is gone); the rest need a yes/no. */
export function itemGroup(kind: ReviewItemKind): ItemGroup {
  return kind === "connector_missing" || kind === "pin_missing" ? "conflict" : "review";
}

/** §7.1 for source reviews; §9.3 (v1.7) for import reviews. */
export function allowedDecisions(review: Pick<Review, "kind">, kind: ReviewItemKind): Decision[] {
  if (review.kind === "import") {
    return ["accept", "remove_rows"];
  }
  switch (kind) {
    case "net_changed":
      return ["accept", "remap", "remove_rows"];
    case "connector_changed":
      return ["accept"];
    case "pin_missing":
      return ["remap", "remove_rows"];
    case "connector_missing":
      return ["bind_candidate"];
    default:
      return [];
  }
}

export const DECISION_LABELS: Record<Decision, string> = {
  accept: "Accept",
  remap: "Remap",
  bind_candidate: "Bind",
  remove_rows: "Remove rows",
};

export const KIND_LABELS: Record<ReviewItemKind, string> = {
  connector_missing: "Connector missing",
  connector_changed: "Connector changed",
  pin_missing: "Pin missing",
  net_changed: "Net changed",
  signal_mismatch: "Signal does not match",
};

/** A net set, a fact map or anything else, as short text. */
export function describeValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "—";
  }
  if (Array.isArray(value)) {
    return value.length ? value.map((entry) => describeValue(entry)).join(" | ") : "(no net)";
  }
  if (typeof value === "object") {
    return Object.entries(value as Record<string, unknown>)
      .map(([key, entry]) => `${key}: ${describeValue(entry)}`)
      .join(", ");
  }
  return String(value);
}

export function progress(review: Review): { decided: number; total: number } {
  const items = review.items ?? [];
  return { decided: items.filter((item) => item.decision !== null).length, total: items.length };
}

export function groupItems(items: ReviewItem[]): Record<ItemGroup, ReviewItem[]> {
  const groups: Record<ItemGroup, ReviewItem[]> = { conflict: [], review: [] };
  for (const item of items) {
    groups[itemGroup(item.kind)].push(item);
  }
  return groups;
}

/** Audit kinds that record a change detection applied without asking anyone. */
export const AUTOMATIC_EVENT_KINDS = new Set(["baseline_auto_advanced", "connector_relabelled", "connector_rebound"]);

export function automaticEvents(events: AuditEvent[]): AuditEvent[] {
  return events.filter((event) => AUTOMATIC_EVENT_KINDS.has(event.kind));
}
