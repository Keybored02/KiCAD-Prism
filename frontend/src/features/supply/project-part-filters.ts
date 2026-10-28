import type { ProjectSupplyPart } from "@/types/supply";

/** What a "needs a look" chip counts and filters the parts table by. */
export type Chip = "unchecked" | "out" | "short" | "limiting" | "end_of_life" | "alerts" | "not_priced";

export const CHIPS: ReadonlyArray<{ key: Chip; label: string }> = [
  { key: "unchecked", label: "Unchecked" },
  { key: "out", label: "Out of stock" },
  { key: "short", label: "Short for this build" },
  { key: "limiting", label: "Limiting the build" },
  { key: "not_priced", label: "Not priced" },
  { key: "end_of_life", label: "End of life" },
  { key: "alerts", label: "Open alerts" },
];

/**
 * Each part as one row of the list: a part on two BOM lines adds their pieces, needs, notes and references, and its cost is the one
 * line that carries it (the other is bought with it).
 */
export function linesByPart(parts: readonly ProjectSupplyPart[]): Map<string, ProjectSupplyPart> {
  const byPart = new Map<string, ProjectSupplyPart>();
  for (const part of parts) {
    if (!part.part_id) continue;
    const kept = byPart.get(part.part_id);
    byPart.set(part.part_id, kept ? {
      ...kept,
      quantity: kept.quantity + part.quantity,
      need: kept.need == null || part.need == null ? (kept.need ?? part.need) : kept.need + part.need,
      notes: kept.notes + part.notes,
      references: [kept.references, part.references].filter(Boolean).join(" "),
      line_cost: kept.line_cost ?? part.line_cost,
    } : part);
  }
  return byPart;
}

/**
 * The lines whose part's stock covers the fewest boards: what decides how many boards can be built. A part on two lines is judged on
 * what both need, and both lines are kept. Parts with no stock figure or no need are left out.
 */
export function limitingKeys(parts: readonly ProjectSupplyPart[]): ReadonlySet<string> {
  const ratios = new Map<string, number>();
  for (const part of linesByPart(parts).values()) {
    if (part.part_id && part.stock !== null && part.need) ratios.set(part.part_id, part.stock / part.need);
  }
  const lowest = Math.min(...ratios.values());
  return new Set(parts.flatMap((part) => (part.part_id && ratios.get(part.part_id) === lowest ? [part.key] : [])));
}

/** Whether a part row is one the chip counts. `limiting` is the keys of the lines that limit the build. */
export function matchesChip(part: ProjectSupplyPart, chip: Chip, limiting: ReadonlySet<string> = new Set()): boolean {
  switch (chip) {
    case "unchecked": return part.state !== "tracked";
    case "out": return part.part_id !== null && part.stock === 0;
    case "short": return part.short;
    case "limiting": return limiting.has(part.key);
    case "end_of_life": return Boolean(part.lifecycle) && part.lifecycle !== "active" && part.lifecycle !== "unknown";
    case "alerts": return (part.alerts ?? 0) > 0;
    case "not_priced": return part.part_id !== null && part.status !== null && part.unit_price === null;
  }
}
