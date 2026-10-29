import { ChevronRight, Inbox } from "lucide-react";

import type { SupplyInboxItem, SupplyStatus } from "@/types/supply";
import { ALERT_KIND_LABEL } from "./alert-kinds";
import { DEADLINE_KIND } from "./dashboard-risk-cards";
import { StatusDot } from "./status-dot";
import { formatAgo } from "./supply-format";

const TONE: Record<SupplyInboxItem["severity"], SupplyStatus> = { fatal: "fatal", error: "error", warning: "warning", info: "unknown" };

/** What tells two items apart: the kind and what it is about. */
function inboxKey(item: SupplyInboxItem): string {
  switch (item.kind) {
    case "feed": return `feed:${item.feed}:${item.name}`;
    case "deadline": return `deadline:${item.part_id}`;
    case "project_short":
    case "project_unconfirmed": return `${item.kind}:${item.project_id}`;
    case "alerts": return `alerts:${item.alert_kind}`;
    default: return item.kind;
  }
}

/** One item in words: what it is, and the figure that matters. */
export function inboxText(item: SupplyInboxItem): { title: string; figure: string } {
  switch (item.kind) {
    case "feed":
      return { title: `${item.name} down`, figure: item.since ? `since ${formatAgo(item.since)}` : "" };
    case "ending":
      return { title: "Components ending", figure: item.count.toLocaleString() };
    case "deadline":
      return { title: `${DEADLINE_KIND[item.deadline]} · ${item.mpn}`, figure: item.count > 1 ? `${item.date} +${item.count - 1}` : item.date };
    case "project_short":
      return { title: `${item.name} short`, figure: `${item.count.toLocaleString()} of ${item.of.toLocaleString()} boards` };
    case "project_unconfirmed":
      return { title: `${item.name} unconfirmed`, figure: `${item.count.toLocaleString()} unchecked` };
    case "alerts":
      return { title: ALERT_KIND_LABEL[item.alert_kind as keyof typeof ALERT_KIND_LABEL] ?? item.alert_kind, figure: item.count.toLocaleString() };
    case "likely_out":
      return { title: "Likely out in 4 weeks", figure: item.count.toLocaleString() };
    case "approvals":
      return { title: "To approve", figure: item.count.toLocaleString() };
  }
}

/** The Dashboard's first card: what needs a person today, worst first, each opening where it is acted on. Nothing when nothing does. */
export function InboxCard({ items, more, onOpen }: { items: SupplyInboxItem[]; more: number; onOpen: (item: SupplyInboxItem) => void }) {
  if (items.length === 0) return null;
  return (
    <section aria-label="Inbox" className="border">
      <h3 className="flex items-center gap-2 border-b px-3 py-2 text-sm font-semibold">
        <Inbox className="h-4 w-4 text-muted-foreground" aria-hidden />Inbox
      </h3>
      <ul className="divide-y">
        {items.map((item) => {
          const { title, figure } = inboxText(item);
          return (
            <li key={inboxKey(item)}>
              <button type="button" className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted/50" onClick={() => onOpen(item)}>
                <StatusDot status={TONE[item.severity]} />
                <span className="min-w-0 flex-1 truncate">{title}</span>
                <span className="shrink-0 tabular-nums text-muted-foreground">{figure}</span>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
              </button>
            </li>
          );
        })}
      </ul>
      {more > 0 ? <p className="border-t px-3 py-1.5 text-xs text-muted-foreground">+{more.toLocaleString()}</p> : null}
    </section>
  );
}
