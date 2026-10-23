import type { ProjectSupplyPart } from "@/types/supply";

/** What a "needs a look" chip counts and filters the parts table by. */
export type Chip = "out" | "short" | "end_of_life" | "alerts" | "not_priced";

export const CHIPS: ReadonlyArray<{ key: Chip; label: string }> = [
  { key: "out", label: "Out of stock" },
  { key: "short", label: "Short for this build" },
  { key: "not_priced", label: "Not priced" },
  { key: "end_of_life", label: "End of life" },
  { key: "alerts", label: "Open alerts" },
];

/** The chance of being short at 8 weeks that marks a line "Out within 8 weeks" when the page does not say (the setting is the alert's). */
export const LIKELY_OUT_CHANCE = 0.7;

/** Whether a part row is one the chip counts. */
export function matchesChip(part: ProjectSupplyPart, chip: Chip): boolean {
  switch (chip) {
    case "out": return part.part_id !== null && part.stock === 0;
    case "short": return part.short;
    case "end_of_life": return Boolean(part.lifecycle) && part.lifecycle !== "active" && part.lifecycle !== "unknown";
    case "alerts": return (part.alerts ?? 0) > 0;
    case "not_priced": return part.part_id !== null && part.status !== null && part.unit_price === null;
  }
}
