import { ChevronRight, FileSpreadsheet } from "lucide-react";
import { useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import type { BudgetNotices, SupplyCapacity, SupplyConnector } from "@/types/supply";
import { budgetUsedPercent, formatWhen } from "./connector-status";

/** The change-notice quota some providers keep apart from their product calls, with how the tracked parts use it. */
export function NoticeBar({ notices }: { notices: BudgetNotices }) {
  const used = notices.limit > 0 ? Math.min(100, Math.round((notices.used / notices.limit) * 100)) : 0;
  const pace = notices.parts > 0
    ? `${notices.parts.toLocaleString()} parts, ${notices.interval_days === 7 ? "weekly" : `every ${notices.interval_days} days`}, about ${notices.per_day.toLocaleString()} a day`
    : "No parts to read notices for";
  return (
    <div className="space-y-1 pt-2">
      <div className="flex items-baseline justify-between text-xs">
        <span className="font-medium uppercase tracking-wider text-muted-foreground">Change notices today</span>
        <span className="tabular-nums">{notices.used.toLocaleString()} / {notices.limit.toLocaleString()}</span>
      </div>
      <div role="progressbar" aria-label="Share of today's change notice calls spent" aria-valuemin={0} aria-valuemax={100} aria-valuenow={used} className="h-1.5 overflow-hidden bg-muted">
        <div className={used >= 90 ? "h-full bg-destructive" : "h-full bg-primary"} style={{ width: `${used}%` }} />
      </div>
      <p className="text-[11px] text-muted-foreground">{pace}</p>
    </div>
  );
}

/** Today's calls against the daily budget. */
export function CallBudget({ connector, detail }: { connector: SupplyConnector; detail?: ReactNode }) {
  const used = budgetUsedPercent(connector);
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-3 space-y-1">
      <div className="flex items-baseline justify-between text-xs">
        {detail ? (
          <button type="button" aria-expanded={open} onClick={() => setOpen(!open)} className="flex items-center gap-1 font-medium uppercase tracking-wider text-muted-foreground hover:text-foreground">
            <ChevronRight className={`h-3 w-3 transition-transform ${open ? "rotate-90" : ""}`} />Calls today
          </button>
        ) : <span className="font-medium uppercase tracking-wider text-muted-foreground">Calls today</span>}
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
        className="h-1.5 overflow-hidden bg-muted"
      >
        <div className={used >= 90 ? "h-full bg-destructive" : "h-full bg-primary"} style={{ width: `${used}%` }} />
      </div>
      <p className="text-[11px] text-muted-foreground">{connector.interactive_reserve_pct}% held for lookups</p>
      {detail && open ? <div className="pt-2">{detail}</div> : null}
    </div>
  );
}

/** Whether the daily budget keeps up with what is watched, said before it bites. */
export function CapacityNote({ capacity }: { capacity: SupplyCapacity | undefined }) {
  if (!capacity || (capacity.listings === 0 && capacity.searches_pending === 0 && !capacity.quotes?.of)) return null;
  const calls = capacity.calls_per_day.toLocaleString();
  const usable = capacity.usable_per_day.toLocaleString();
  return (
    <div className="mt-2 space-y-0.5 text-[11px]">
      {capacity.listings > 0 ? (
        capacity.fits ? (
          <p className="text-muted-foreground">
            Reading {capacity.listings.toLocaleString()} {capacity.listings === 1 ? "listing" : "listings"} needs about {calls} calls a day of {usable} usable.
          </p>
        ) : (
          <p role="alert" className="text-warning">
            Reading {capacity.listings.toLocaleString()} {capacity.listings === 1 ? "listing" : "listings"} needs about {calls} calls a day, but only {usable} are usable.
            About {capacity.shortfall_pct}% of reads will run later than their tier asks. Raise the budget or watch fewer parts.
          </p>
        )
      ) : null}
      {capacity.quotes && capacity.quotes.of > 0 ? (
        <p className="text-muted-foreground">Gives a price for {capacity.quotes.parts.toLocaleString()} of {capacity.quotes.of.toLocaleString()} tracked parts.</p>
      ) : null}
      {capacity.searches_pending > 0 ? (
        <p className="text-muted-foreground">
          {capacity.searches_pending.toLocaleString()} watched {capacity.searches_pending === 1 ? "part has" : "parts have"} not been searched here yet.
        </p>
      ) : null}
    </div>
  );
}

/** When the provider's day seems to reset, or is known to. */
export function ReportedLimits({ connector, isAdmin, onApply }: { connector: SupplyConnector; isAdmin: boolean; onApply: () => void }) {
  const guess = connector.reset_suggestion;
  if (!guess && !connector.reset_from_provider) return null;
  return connector.reset_from_provider ? (
    <div className="flex gap-1.5">
      <dt className="text-muted-foreground">Day resets</dt>
      <dd>{connector.reset_time} {connector.reset_tz}, from the provider's readings</dd>
    </div>
  ) : guess ? (
    <div className="flex flex-wrap items-center gap-1.5">
      <dt className="text-muted-foreground">Day seems to reset</dt>
      <dd>between {guess.from} and {guess.to} {guess.tz} ({guess.windows} readings)</dd>
      {isAdmin ? <Button variant="outline" size="xs" onClick={onApply}>Use {guess.suggested}</Button> : null}
    </div>
  ) : null;
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
