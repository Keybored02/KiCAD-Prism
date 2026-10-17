import type { PartHistory } from "@/types/supply";
import { TOTAL_KEY } from "./part-history-model";
import { vendorColor } from "./vendor-colors";

/** The distributors drawn, each a switch; the part's total is one more on the stock chart. */
export function HistoryLegend({ history, hidden, onToggle, withTotal }: { history: PartHistory; hidden: ReadonlySet<string>; onToggle: (key: string) => void; withTotal: boolean }) {
  const items = [
    ...history.connectors.map((line) => ({ key: line.connector_id, name: line.name, color: vendorColor(line.provider) ?? "#6b7280", stale: line.stale })),
    ...(withTotal ? [{ key: TOTAL_KEY, name: "Counted in total", color: "#9ca3af", stale: false }] : []),
  ];
  return (
    <ul className="flex flex-wrap gap-x-3 gap-y-1 text-xs" aria-label="Distributors drawn">
      {items.map((item) => (
        <li key={item.key}>
          <button
            type="button" aria-pressed={!hidden.has(item.key)} onClick={() => onToggle(item.key)}
            className={`inline-flex items-center gap-1.5 hover:text-foreground ${hidden.has(item.key) ? "text-muted-foreground line-through" : ""}`}
            title={item.stale ? "Not read for longer than its rate allows" : undefined}
          >
            <span aria-hidden className="h-2 w-2 rounded-[2px]" style={{ backgroundColor: item.color }} />
            {item.name}{item.stale ? " (not read lately)" : ""}
          </button>
        </li>
      ))}
    </ul>
  );
}

/** What the dashed vertical lines on the charts are: restocks in green, product change notices in amber. */
export function HistoryEvents({ events }: { events: PartHistory["events"] }) {
  if (events.length === 0) return null;
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground" aria-label="Marked days">
      {events.map((event, index) => (
        <li key={`${event.day}-${index}`} className="flex items-center gap-1.5">
          <span aria-hidden className={`h-2.5 w-0.5 ${event.kind === "restock" ? "bg-success" : "bg-warning"}`} />
          {event.day}: {event.text}
        </li>
      ))}
    </ul>
  );
}
