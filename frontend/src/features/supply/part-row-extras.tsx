import { ArrowDown, ArrowUp, Ban, Clock, GitFork, Hourglass, PackageX, ShieldAlert, Timer } from "lucide-react";

import type { SupplyPartRow } from "@/types/supply";
import { vendorColor } from "./vendor-colors";

const FLAG: Record<string, { icon: typeof Hourglass; text: string }> = {
  waiting: { icon: Hourglass, text: "Waiting for room to be read" },
  rohs: { icon: ShieldAlert, text: "A distributor says it is not RoHS compliant" },
  reach: { icon: ShieldAlert, text: "A distributor says REACH affects it" },
  ncnr: { icon: Ban, text: "Non-cancellable, non-returnable" },
  not_stocked: { icon: PackageX, text: "A distributor does not normally stock it" },
  no_alternate: { icon: GitFork, text: "At risk and no approved alternate" },
};

/** The projects using the part: the first two by name, then how many more. */
export function ProjectNames({ part }: { part: SupplyPartRow }) {
  if (part.used_in <= 0) return null;
  const shown = part.project_names ?? [];
  const more = part.used_in - shown.length;
  return (
    <div className="text-xs text-muted-foreground">
      {shown.length > 0 ? shown.join(", ") : `Used in ${part.used_in} ${part.used_in === 1 ? "project" : "projects"}`}
      {shown.length > 0 && more > 0 ? ` +${more}` : ""}
    </div>
  );
}

/** One square per distributor in its colour: filled when it holds stock, hollow when it lists the part with none. The preferred one has a ring. */
export function DistributorSquares({ part }: { part: SupplyPartRow }) {
  const list = part.distributors ?? [];
  if (list.length === 0) return null;
  return (
    <span className="inline-flex items-center gap-1" aria-label="Distributors">
      {list.map((item) => {
        const color = vendorColor(item.provider) ?? "#6b7280";
        const preferred = item.connector_id === part.preferred_connector_id;
        return (
          <span
            key={item.connector_id} title={`${item.name}: ${item.stock > 0 ? `${item.stock.toLocaleString()} in stock` : "none in stock"}${preferred ? ", preferred" : ""}`}
            className={`h-2.5 w-2.5 rounded-[2px] border ${preferred ? "ring-1 ring-offset-1 ring-foreground" : ""}`}
            style={{ borderColor: color, backgroundColor: item.stock > 0 ? color : "transparent" }}
          />
        );
      })}
    </span>
  );
}

/** The price's move over 30 days as an arrow and a percent, when a distributor's price has moved. */
export function PriceMove({ percent }: { percent: number | null | undefined }) {
  if (percent === null || percent === undefined || percent === 0) return null;
  const Icon = percent > 0 ? ArrowUp : ArrowDown;
  return (
    <span className={`inline-flex items-center text-xs ${percent > 0 ? "text-warning" : "text-success"}`} title="Cheapest price, over 30 days">
      <Icon className="h-3 w-3" />{Math.abs(percent)}%
    </span>
  );
}

/** How fresh it is kept and how long waiting costs: the read rate, and the shortest lead time quoted. */
export function RateAndLead({ part }: { part: SupplyPartRow }) {
  const rate = part.tracking?.rate;
  if (!rate && !part.lead_days) return null;
  return (
    <div className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
      {rate ? <span className="inline-flex items-center gap-0.5"><Timer className="h-3 w-3" />{rate.charAt(0).toUpperCase() + rate.slice(1)}</span> : null}
      {part.lead_days ? <span className="inline-flex items-center gap-0.5" title="Shortest quoted lead time"><Clock className="h-3 w-3" />{Math.round(part.lead_days / 7)} w</span> : null}
    </div>
  );
}

/** Problems the list used to hide, as icons. */
export function RowFlags({ flags }: { flags: readonly string[] | undefined }) {
  if (!flags || flags.length === 0) return null;
  return (
    <span className="inline-flex items-center gap-1">
      {flags.map((flag) => {
        const item = FLAG[flag];
        if (!item) return null;
        const Icon = item.icon;
        return <Icon key={flag} role="img" className="h-3.5 w-3.5 text-warning" aria-label={item.text} />;
      })}
    </span>
  );
}
