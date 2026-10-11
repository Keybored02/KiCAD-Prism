import type { SemanticComponent } from "@/types/prism-selection";
import type { BomLineInput, SupplyBomLineResult, SupplyStatus } from "@/types/supply";

/**
 * Field names KiCad projects use for the manufacturer and the manufacturer part number, best
 * first, compared ignoring case. When a part carries several, the earliest in the list wins, so an
 * explicit "Manufacturer Part Number" beats a looser "PartNumber". Plan 6.4 moves this list to one
 * backend contract; until then the supply columns read their fields through here.
 *
 * Found in real projects: satnogs-comms uses "Mnf." and "PartNumber"; others use "MPN" or "Mfr. No.".
 * "Vendor Part Number" is a distributor's number, not the manufacturer's, and is deliberately absent.
 */
const MANUFACTURER_FIELDS: readonly string[] = [
  "manufacturer", "manufacturer name", "manufacturer_name", "mfr", "mfr.", "mfg", "mnf", "mnf.", "make", "brand",
];
const MPN_FIELDS: readonly string[] = [
  "manufacturer part number", "manufacturer_part_number", "mpn", "mfr. no.", "mfr no", "mfr part number",
  "mfg part number", "manufacturer pn", "mfr pn", "mnf part number", "partnumber", "part number", "part_number",
];

/** The columns the supply data adds to the BOM table, in the order they appear. */
export const BOM_SUPPLY_COLUMNS = ["Supply", "Stock", "Unit price", "Extended", "Lead time"] as const;

export function isSupplyColumn(column: string): boolean {
  return (BOM_SUPPLY_COLUMNS as readonly string[]).includes(column);
}

const SEPARATOR = " | ";

function fieldText(component: SemanticComponent, names: readonly string[]): string {
  const byName = new Map<string, string>();
  for (const [key, raw] of Object.entries(component.fields ?? {})) {
    const text = raw === null || raw === undefined ? "" : String(raw).trim();
    const name = key.trim().toLowerCase();
    if (text && !byName.has(name)) byName.set(name, text);
  }
  for (const name of names) {
    const found = byName.get(name);
    if (found) return found;
  }
  return "";
}

export interface PartIdentity {
  manufacturer: string;
  mpn: string;
}

export function identityOf(component: SemanticComponent): PartIdentity {
  return { manufacturer: fieldText(component, MANUFACTURER_FIELDS), mpn: fieldText(component, MPN_FIELDS) };
}

/** A key that is the same for the same manufacturer and part number, however it is cased or spaced. */
export function lineKey(identity: PartIdentity): string {
  return `${identity.manufacturer.toLowerCase()}${SEPARATOR}${identity.mpn.toLowerCase().replace(/[\s_-]+/g, "")}`;
}

export interface BomLineDetail extends BomLineInput {
  references: string[];
}

/** The distinct parts among the fitted components, with how many go on one board. */
export function buildLines(fitted: readonly SemanticComponent[]): BomLineDetail[] {
  const lines = new Map<string, BomLineDetail>();
  for (const component of fitted) {
    const identity = identityOf(component);
    const key = lineKey(identity);
    const line = lines.get(key);
    if (line) {
      line.quantity += 1;
      line.references.push(component.reference);
    } else {
      lines.set(key, { key, ...identity, quantity: 1, references: [component.reference] });
    }
  }
  return [...lines.values()];
}

const SEVERITY: SupplyStatus[] = ["fatal", "error", "warning", "unknown", "ok"];

/** What a table row shows: one part's figures, or a summary when the row holds several. */
export type RowSupply =
  | { kind: "line"; key: string; result: SupplyBomLineResult }
  | { kind: "mixed"; count: number; worst: SupplyStatus | null }
  | { kind: "none" };

export function rowSupply(
  rowComponents: readonly SemanticComponent[],
  results: Record<string, SupplyBomLineResult> | null,
  fittedKeys: ReadonlySet<string>,
): RowSupply {
  if (!results) return { kind: "none" };
  const keys = [...new Set(rowComponents.map((component) => lineKey(identityOf(component))))].filter((key) => fittedKeys.has(key));
  if (keys.length === 0) return { kind: "none" };
  if (keys.length === 1) {
    const result = results[keys[0]];
    return result ? { kind: "line", key: keys[0], result } : { kind: "none" };
  }
  const statuses = keys.map((key) => results[key]?.status).filter((status): status is SupplyStatus => status !== undefined);
  const worst = statuses.length ? SEVERITY.find((status) => statuses.includes(status)) ?? null : null;
  return { kind: "mixed", count: keys.length, worst };
}

/** Why a line has no figures, in words for a cell. */
export function untrackedLabel(result: SupplyBomLineResult): string {
  switch (result.state) {
    case "no_mpn":
      return "No part number";
    case "ambiguous":
      return "Several parts match";
    case "unknown":
      return "Not watched yet";
    default:
      return "";
  }
}

/** Lines that could be watched and are not yet: they name a manufacturer and a number but no one reads them. */
export function unwatchedCount(lines: readonly BomLineDetail[], results: Record<string, SupplyBomLineResult>): number {
  return lines.filter((line) => {
    const result = results[line.key];
    if (!result || !line.manufacturer || !line.mpn) return false;
    return result.state === "unknown" || (result.state === "tracked" && !result.watched);
  }).length;
}
