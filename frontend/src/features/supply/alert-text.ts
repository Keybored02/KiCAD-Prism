import type { SupplyAlert, SupplyLifecycle, SupplyProblem } from "@/types/supply";
import { LIFECYCLE_LABEL, PROBLEM_LABEL } from "./supply-format";

/** One line saying what crossed the line. */
export function alertTitle(alert: SupplyAlert): string {
  const { detail } = alert;
  switch (alert.kind) {
    case "out_of_stock":
      return "Out of stock";
    case "below_threshold":
      return `${(detail.stock ?? 0).toLocaleString()} in stock, at or below the ${(detail.threshold ?? 0).toLocaleString()} you set`;
    case "lifecycle":
      return detail.lifecycle === "obsolete"
        ? "Marked obsolete"
        : `Now ${LIFECYCLE_LABEL[(detail.lifecycle ?? "unknown") as SupplyLifecycle].toLowerCase()}`;
    case "part_lost":
      return PROBLEM_LABEL[(detail.problem ?? "gone") as SupplyProblem];
  }
}

export const SNOOZE_CHOICES: ReadonlyArray<{ hours: number; label: string }> = [
  { hours: 4, label: "4 hours" },
  { hours: 24, label: "1 day" },
  { hours: 24 * 7, label: "1 week" },
];

export const ALERT_STATE_LABEL: Record<SupplyAlert["state"], string> = {
  open: "Open",
  acknowledged: "Acknowledged",
  snoozed: "Snoozed",
  resolved: "Cleared",
};
