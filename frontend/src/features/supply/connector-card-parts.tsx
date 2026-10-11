import { FileSpreadsheet } from "lucide-react";

import type { SupplyConnector } from "@/types/supply";
import { budgetUsedPercent, formatWhen } from "./connector-status";

/** Today's calls against the daily budget. */
export function CallBudget({ connector }: { connector: SupplyConnector }) {
  const used = budgetUsedPercent(connector);
  return (
    <div className="mt-3 space-y-1">
      <div className="flex items-baseline justify-between text-xs">
        <span className="font-medium uppercase tracking-wider text-muted-foreground">Calls today</span>
        <span className="tabular-nums">
          {connector.usage_today.spent.toLocaleString()} / {connector.daily_budget.toLocaleString()}
        </span>
      </div>
      <div
        role="progressbar"
        aria-label="Share of today's call budget spent"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={used}
        className="h-1.5 overflow-hidden rounded-full bg-muted"
      >
        <div className={used >= 90 ? "h-full bg-destructive" : "h-full bg-primary"} style={{ width: `${used}%` }} />
      </div>
      <p className="text-[11px] text-muted-foreground">{connector.interactive_reserve_pct}% held for lookups</p>
    </div>
  );
}

/** The uploaded file behind a CSV connector, and how old it is. */
export function OffersFile({ connector }: { connector: SupplyConnector }) {
  const upload = connector.csv_import;
  return (
    <div className="mt-3 flex items-start gap-2 text-xs">
      <FileSpreadsheet className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      {upload ? (
        <p>
          <span className="font-medium">{upload.filename || "Uploaded file"}</span>
          <span className="text-muted-foreground">
            {" "}· {upload.row_count.toLocaleString()} rows · uploaded {formatWhen(upload.imported_at)} by {upload.imported_by}
          </span>
        </p>
      ) : (
        <p className="text-muted-foreground">No file uploaded. Local data, no call budget.</p>
      )}
    </div>
  );
}
