import type { SupplyBomLineResult } from "@/types/supply";
import type { BomLineDetail } from "./bom-supply";

const HEADER = [
  "Distributor", "SKU", "Manufacturer", "Manufacturer Part Number", "SAP Code", "Order quantity", "Unit price", "Currency",
  "Extended", "Covers stock", "References", "Product page",
];

/** A spreadsheet runs a cell that starts with these as a formula. The part data is not ours to trust. */
function safe(value: string): string {
  return /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
}

function cell(value: string | number): string {
  const text = safe(String(value));
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/**
 * The parts to buy, one row per line that has an offer, grouped by distributor.
 * Lines nobody sells, or with no price, are left out: they have nothing to order from.
 */
export function buildOrderCsv(lines: readonly BomLineDetail[], results: Record<string, SupplyBomLineResult>): string {
  const rows = lines
    .map((line) => ({ line, buy: results[line.key]?.buy ?? null }))
    .filter((entry): entry is { line: BomLineDetail; buy: NonNullable<typeof entry.buy> } => entry.buy !== null)
    .sort((a, b) => a.buy.connector_name.localeCompare(b.buy.connector_name) || a.line.mpn.localeCompare(b.line.mpn));
  const body = rows.map(({ line, buy }) => [
    buy.connector_name, buy.sku, line.manufacturer, line.mpn, line.sapCode ?? "", buy.quantity, buy.unit_price, buy.currency,
    buy.extended, buy.covers ? "yes" : "no", line.references.join(" "), buy.product_url,
  ].map(cell).join(","));
  return [HEADER.map(cell).join(","), ...body].join("\r\n") + "\r\n";
}

export function downloadCsv(filename: string, text: string): void {
  const url = URL.createObjectURL(new Blob([text], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
