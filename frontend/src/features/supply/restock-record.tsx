import { Clock } from "lucide-react";

import type { RestockRecord } from "@/types/supply";
import { VendorName } from "./vendor-name";

function promise(item: NonNullable<RestockRecord["open"]>): string {
  const said = item.kind === "dated"
    ? `${item.quantity?.toLocaleString() ?? ""} due ${item.expected}`.trim()
    : `back by ${item.expected}${item.quoted_lead_days ? ` (quoted ${item.quoted_lead_days} days)` : ""}`;
  return item.late ? `${said}, past that day` : said;
}

/** What each distributor said about the part's return, and how often it kept its word on this part. Nothing until one has run out or announced stock. */
export function RestockRecordSection({ record }: { record: RestockRecord[] }) {
  const shown = record.filter((item) => item.open || item.resolved > 0 || item.stock_outs > 0);
  if (shown.length === 0) return null;
  return (
    <section aria-label="Restock promises" className="space-y-1">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Restock promises</h3>
      <ul className="space-y-0.5 text-sm">
        {shown.map((item) => (
          <li key={item.connector_id} className="flex flex-wrap items-center gap-x-2">
            <VendorName provider={item.provider} name={item.name} />
            {item.open ? (
              <span className={item.open.late ? "inline-flex items-center gap-1 text-warning" : "inline-flex items-center gap-1"}>
                <Clock className="h-3.5 w-3.5" aria-hidden="true" />{promise(item.open)}
              </span>
            ) : <span className="text-muted-foreground">no open promise</span>}
            <span className="text-xs text-muted-foreground">
              {item.resolved > 0 ? `kept ${item.kept} of ${item.resolved} here` : `${item.stock_outs} ${item.stock_outs === 1 ? "stock-out" : "stock-outs"} seen`}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
