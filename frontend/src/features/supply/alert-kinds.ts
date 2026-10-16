import type { SupplyAlertKind } from "@/types/supply";

export const ALERT_KIND_LABEL: Record<SupplyAlertKind, string> = {
  out_of_stock: "Out of stock",
  below_threshold: "Below threshold",
  lifecycle: "End of life",
  part_lost: "Part lost",
  rupture_soon: "Running out",
  price_up: "Price up",
  pcn: "Change notice",
  target_price_missed: "Target price missed",
  assessment_worse: "Assessment worse",
};

export const ALERT_KIND_COLOUR: Record<string, string> = {
  out_of_stock: "hsl(var(--destructive))",
  below_threshold: "hsl(var(--warning))",
  lifecycle: "#a855f7",
  part_lost: "#7f1d1d",
  rupture_soon: "#f59e0b",
  price_up: "#0070bb",
  pcn: "#4eb661",
  target_price_missed: "#64748b",
  assessment_worse: "#ec4899",
};

/** The kinds in an alerts-by-day series, most alerts first. */
export function kindsOf(days: ReadonlyArray<Record<string, number | string>>): string[] {
  const totals = new Map<string, number>();
  for (const day of days) {
    for (const [key, value] of Object.entries(day)) {
      if (key !== "day" && typeof value === "number") totals.set(key, (totals.get(key) ?? 0) + value);
    }
  }
  return [...totals.entries()].sort((a, b) => b[1] - a[1]).map(([kind]) => kind);
}
