import type { SupplySeedResult } from "./supply-api";

/** What a seeding run did, in a sentence. */
export function seedSummary(result: SupplySeedResult): string {
  if (result.considered === 0) return "No catalog component names a vendor and its part number.";
  const parts = [`${result.added} added`, `${result.already} already known`];
  if (result.no_connector > 0) parts.push(`${result.no_connector} for a vendor with no single connector`);
  if (result.unknown_manufacturer > 0) parts.push(`${result.unknown_manufacturer} with a manufacturer Prism does not know`);
  return `${result.considered} components with a vendor part number: ${parts.join(", ")}.`;
}
