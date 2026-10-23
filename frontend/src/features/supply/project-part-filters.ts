import type { ProjectSupplyPart } from "@/types/supply";

/** What a "needs a look" chip counts and filters the parts table by. */
export type Chip = "out" | "short" | "limiting" | "end_of_life" | "alerts" | "not_priced";

export const CHIPS: ReadonlyArray<{ key: Chip; label: string }> = [
  { key: "out", label: "Out of stock" },
  { key: "short", label: "Short for this build" },
  { key: "limiting", label: "Limiting the build" },
  { key: "not_priced", label: "Not priced" },
  { key: "end_of_life", label: "End of life" },
  { key: "alerts", label: "Open alerts" },
];

/** The lines whose stock covers the fewest boards: what decides how many boards can be built. Lines with no stock figure or no need are left out. */
export function limitingKeys(parts: readonly ProjectSupplyPart[]): ReadonlySet<string> {
  const covered = parts.flatMap((part) => (part.part_id && part.stock !== null && part.need ? [{ key: part.key, ratio: part.stock / part.need }] : []));
  const lowest = Math.min(...covered.map((item) => item.ratio));
  return new Set(covered.flatMap((item) => (item.ratio === lowest ? [item.key] : [])));
}

/** Whether a part row is one the chip counts. `limiting` is the keys of the lines that limit the build. */
export function matchesChip(part: ProjectSupplyPart, chip: Chip, limiting: ReadonlySet<string> = new Set()): boolean {
  switch (chip) {
    case "out": return part.part_id !== null && part.stock === 0;
    case "short": return part.short;
    case "limiting": return limiting.has(part.key);
    case "end_of_life": return Boolean(part.lifecycle) && part.lifecycle !== "active" && part.lifecycle !== "unknown";
    case "alerts": return (part.alerts ?? 0) > 0;
    case "not_priced": return part.part_id !== null && part.status !== null && part.unit_price === null;
  }
}
