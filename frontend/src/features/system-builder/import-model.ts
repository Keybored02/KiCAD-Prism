/** Pure helpers for the CSV import wizard (§9.3). */

import type { ImportEntry, ImportTarget, ImportUpload, SystemInstance } from "@/types/system";

export const SKIP = "skip";

export const TARGETS: { target: ImportTarget; label: string; required: boolean }[] = [
  { target: "from_board", label: "From board", required: true },
  { target: "from_connector", label: "From connector", required: true },
  { target: "from_pin", label: "From pin", required: true },
  { target: "to_board", label: "To board", required: true },
  { target: "to_connector", label: "To connector", required: true },
  { target: "to_pin", label: "To pin", required: true },
  { target: "signal", label: "Signal", required: false },
  { target: "harness", label: "Harness", required: false },
  { target: "link_name", label: "Link name", required: false },
  { target: "row_id", label: "Row ID", required: false },
  { target: "from_end", label: "From harness end", required: false },
  { target: "from_end_pin", label: "From end pin", required: false },
  { target: "to_end", label: "To harness end", required: false },
  { target: "to_end_pin", label: "To end pin", required: false },
  { target: "gauge_awg", label: "Wire gauge (AWG)", required: false },
  { target: "colour", label: "Wire colour", required: false },
  { target: "wire_label", label: "Wire label", required: false },
];

export type ColumnMap = Partial<Record<ImportTarget, string>>;

export function missingTargets(columnMap: ColumnMap): string[] {
  const missing: string[] = [];
  for (const { target, label, required } of TARGETS) {
    if (required && !columnMap[target]) missing.push(label);
  }
  return missing;
}

/** Distinct values of the two board columns, which the board map must cover. */
export function boardValues(upload: ImportUpload, columnMap: ColumnMap): string[] {
  const values = new Set<string>();
  for (const target of ["from_board", "to_board"] as const) {
    const column = columnMap[target];
    for (const value of column ? upload.boardValues[column] ?? [] : []) {
      values.add(value);
    }
  }
  return [...values].sort((a, b) => a.localeCompare(b));
}

/** Suggest each board value's instance by label, case-insensitively; unknown values stay unmapped. */
export function suggestBoardMap(values: string[], instances: SystemInstance[], current: Record<string, string> = {}): Record<string, string> {
  const byLabel = new Map<string, string>();
  for (const instance of instances) {
    if (!instance.restricted) byLabel.set(instance.label.toLowerCase(), instance.id);
  }
  const map: Record<string, string> = {};
  for (const value of values) {
    const chosen = current[value] ?? byLabel.get(value.trim().toLowerCase());
    if (chosen) {
      map[value] = chosen;
    }
  }
  return map;
}

export function unmappedBoards(values: string[], boardMap: Record<string, string>): string[] {
  return values.filter((value) => !boardMap[value]);
}

export const REASON_LABELS: Record<string, string> = {
  missing_value: "A board, connector or pin is empty",
  board_unmapped: "Board not mapped",
  board_skipped: "Board skipped",
  interface_not_ready: "Board still being read",
  connector_not_found: "Connector not found at the baseline",
  connector_ambiguous: "More than one component has this reference",
  pin_not_found: "Pin not found on the connector",
  same_port: "Both ends are the same connector",
  row_in_other_link: "Row ID belongs to another link",
  pin_pair_taken: "Pins already used by another row",
  duplicate_existing: "Already connected",
  duplicate_upload: "Repeats an earlier row",
  signal_mismatch: "Signal matches no net on either pin",
  end_label_invalid: "Harness end is not \"End 1\" … \"End 32\"",
  gauge_invalid: "Wire gauge is not a whole number from 0 to 40",
  same_end: "Both ends of the wire are the same harness end",
  wire_in_other_harness: "Wire ID belongs to another harness",
  harness_ambiguous: "More than one harness has this name",
  end_not_found: "The harness has no end in that position",
  end_mate_mismatch: "The harness end mates a different connector",
  pin_map_mismatch: "The end pin lands on a different pad",
  port_already_mated: "Another harness end or board-to-board link mates this connector",
};

/** How a preview or review names one side of an entry: a board pin, or a harness end pin. */
export function entrySide(entry: Pick<ImportEntry, "kind" | "fromEnd" | "fromPin" | "toEnd" | "toPin" | "from" | "to">, side: "from" | "to"): string {
  const end = entry[side];
  const pad = end ? `${end.label}/${end.reference}.${end.pin}` : "";
  if (entry.kind !== "wire") return pad;
  const ordinal = side === "from" ? entry.fromEnd : entry.toEnd;
  const pin = side === "from" ? entry.fromPin : entry.toPin;
  const name = `End ${ordinal == null ? "?" : ordinal + 1}.${pin ?? "?"}`;
  return end ? `${name} (${pad})` : `${name} (not mated)`;
}
