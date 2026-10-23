import { ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { CheckOnceButton } from "./check-once-button";
import { SettleBadge } from "./settle-badge";
import { TrackProjectButton } from "./track-project-dialog";
import type { BomSupply } from "./use-bom-supply";

/** What the BOM's supply says when it cannot be read, and the actions on the project: its supply page, a check, settling lines, tracking. */
export function BomSupplyBar({ supply }: { supply: BomSupply }) {
  const { lookup, status, lines } = supply;

  // Lines with a manufacturer and a number that nobody reads: a check once would give them figures.
  const unread = lookup
    ? lines.filter((line) => {
      const result = lookup.lines[line.key];
      return Boolean(line.manufacturer && line.mpn && result && (result.state === "unknown" || (result.state === "tracked" && result.stock == null)));
    })
    : [];

  return (
    <div className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-1 border-b bg-card/40 px-2 py-1.5 text-xs">
      {status === "loading" ? <span className="text-muted-foreground">Reading supply data...</span> : null}
      {status === "error" ? (
        <span className="text-destructive">
          {supply.error}{" "}
          <button type="button" className="underline" onClick={supply.retry}>Retry</button>
        </span>
      ) : null}
      {supply.truncated ? <span className="text-warning">Only the first 2,000 distinct parts are looked up.</span> : null}
      <span className="ml-auto flex items-center gap-1.5">
        {supply.projectId ? (
          <Button asChild size="icon" variant="outline" className="h-8 w-8">
            <Link to="?section=supply" aria-label="Project supply" title="Project supply"><ExternalLink className="h-4 w-4" /></Link>
          </Button>
        ) : null}
        {supply.projectId && unread.length > 0 ? (
          <CheckOnceButton projectId={supply.projectId} lines={unread} onFinished={supply.refresh} />
        ) : null}
        {supply.projectId ? <SettleBadge projectId={supply.projectId} onChanged={supply.refresh} /> : null}
        {supply.projectId ? <TrackProjectButton projectId={supply.projectId} onChanged={supply.refresh} /> : null}
      </span>
    </div>
  );
}
