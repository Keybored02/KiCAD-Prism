import type { PartsFilter } from "@/types/supply";

export const FILTER_LABEL: Record<Exclude<PartsFilter, "">, string> = {
  at_risk: "At risk",
  out_of_stock: "Out of stock",
  lifecycle: "End of life",
  runs_out_2w: "Runs out within 2 weeks",
  runs_out_8w: "Runs out in 2 to 8 weeks",
  runs_out_later: "Runs out later",
  steady: "Steady or rising",
  few_readings: "Too few readings",
  draining: "Draining",
  restock_late: "Restock overdue",
  often_out: "Often out of stock",
  one_distributor: "One distributor holds it",
  lead_up: "Lead time growing",
  unusual_drop: "Unusual drop",
  price_moving: "Price moving",
  likely_out_4w: "Likely out within 4 weeks",
  likely_out_8w: "Likely out within 8 weeks",
  lifecycle_active: "Active",
  lifecycle_nrnd: "Not recommended for new designs",
  lifecycle_last_time_buy: "Last time buy",
  lifecycle_obsolete: "Obsolete",
  lifecycle_unknown: "Lifecycle unknown",
};

/** The lifecycle menu: any ending part first, then each state on its own. */
export const LIFECYCLE_FILTERS = ["lifecycle", "lifecycle_active", "lifecycle_nrnd", "lifecycle_last_time_buy", "lifecycle_obsolete", "lifecycle_unknown"] as const;
export const ANY = "any";

/** A filter from the address, or none when it is not one Prism knows. */
export function filterFromParam(value: string | null): PartsFilter {
  return value && value in FILTER_LABEL ? (value as PartsFilter) : "";
}
