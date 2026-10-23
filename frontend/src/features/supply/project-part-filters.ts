import type { ProjectSupplyPart } from "@/types/supply";

/** What a "needs a look" chip counts and filters the parts table by. */
export type Chip = "out" | "short" | "end_of_life" | "one_distributor" | "runs_out_soon" | "likely_out" | "alerts" | "waiting" | "not_priced";

export const CHIPS: ReadonlyArray<{ key: Chip; label: string }> = [
  { key: "out", label: "Out of stock" },
  { key: "short", label: "Short for this build" },
  { key: "end_of_life", label: "End of life" },
  { key: "one_distributor", label: "One distributor" },
  { key: "runs_out_soon", label: "Runs out within 2 weeks" },
  { key: "likely_out", label: "Likely out in 8 weeks" },
  { key: "alerts", label: "Open alerts" },
  { key: "waiting", label: "Waiting for room" },
  { key: "not_priced", label: "Not priced" },
];

/** The chance of being short at 8 weeks that counts as "likely out", until the setting for it exists. */
export const LIKELY_OUT_CHANCE = 0.5;
const SOON_DAYS = 14;

/** Whether a part row is one the chip counts. `shortAt8Weeks` is the forecast's chance by BOM line key. */
export function matchesChip(part: ProjectSupplyPart, chip: Chip, shortAt8Weeks: Record<string, number> = {}): boolean {
  switch (chip) {
    case "out": return part.part_id !== null && part.stock === 0;
    case "short": return part.short;
    case "end_of_life": return Boolean(part.lifecycle) && part.lifecycle !== "active" && part.lifecycle !== "unknown";
    case "one_distributor": return part.holders === 1;
    case "runs_out_soon": return part.days_to_zero != null && part.days_to_zero <= SOON_DAYS;
    case "likely_out": return (shortAt8Weeks[part.key] ?? 0) >= LIKELY_OUT_CHANCE;
    case "alerts": return (part.alerts ?? 0) > 0;
    case "waiting": return part.waiting;
    case "not_priced": return part.part_id !== null && part.status !== null && part.unit_price === null;
  }
}
