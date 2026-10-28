import { Link } from "react-router-dom";
import { CircleAlert } from "lucide-react";

import type { SupplyDashboard } from "@/types/supply";
import { shortWhen } from "./stores-cell";
import { CONNECTORS_PLACE } from "./supply-views";

type Feed = SupplyDashboard["failing_feeds"][number];

/** "Stores feed down · 17:09", "DigiKey down · 28 Oct": a failing feed and its last good read. */
export function feedText(feed: Feed): string {
  const when = shortWhen(feed.since);
  return `${feed.kind === "stores" ? "Stores feed" : feed.name} down${when ? ` · ${when}` : ""}`;
}

/** One line above the Dashboard while any feed fails, for everyone; the way to Connectors for those who can open it. */
export function FeedHealthStrip({ feeds, canOpenConnectors }: { feeds: SupplyDashboard["failing_feeds"]; canOpenConnectors: boolean }) {
  if (feeds.length === 0) return null;
  // Several stores sources read as one feed: the cell on every screen says "Feed down" whichever one failed.
  const shown = [...new Map(feeds.map((feed) => [feed.kind === "stores" ? "stores" : `connector:${feed.name}`, feed])).values()];
  return (
    <div role="status" className="flex flex-wrap items-center gap-x-2 gap-y-1 border border-destructive/40 bg-destructive/10 px-3 py-1.5 text-sm text-destructive">
      <CircleAlert aria-hidden className="h-4 w-4 shrink-0" />
      <span>{shown.map(feedText).join(" · ")}</span>
      {canOpenConnectors ? <Link to={CONNECTORS_PLACE} className="ml-auto text-xs font-medium hover:underline">Connectors →</Link> : null}
    </div>
  );
}
