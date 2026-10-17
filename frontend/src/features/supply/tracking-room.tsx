import { ChevronRight } from "lucide-react";
import { useCallback, useState } from "react";

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

import type { TrackingRoom, TrackingRoomAccount } from "@/types/supply";
import { getTrackingRoom } from "./tracking-api";
import { useLoaded } from "./use-loaded";

/** A count rounded to two significant figures: the estimate is not better than that. */
export function roughly(count: number): string {
  if (count < 100) return count.toLocaleString();
  const step = 10 ** (Math.floor(Math.log10(count)) - 1);
  return (Math.round(count / step) * step).toLocaleString();
}

/** One sentence: how many more typical parts fit, and which distributor fills first. Empty when there is nothing to base it on. */
export function roomSentence(room: TrackingRoom): string {
  const daily = room.headline.daily;
  const weekly = room.headline.weekly;
  if (!daily || !weekly) return "";
  if (daily.room === 0) return `No room for more parts at ${daily.limited_by}: parts already wait there.`;
  const by = daily.limited_by === weekly.limited_by ? `${daily.limited_by} fills first.` : `${daily.limited_by} fills first for daily parts, ${weekly.limited_by} for weekly.`;
  return `Room for about ${roughly(daily.room)} more daily parts, or ${roughly(weekly.room)} weekly. ${by}`;
}

function useRoom() {
  const fetcher = useCallback((signal: AbortSignal) => getTrackingRoom(signal), []);
  return useLoaded<TrackingRoom>("tracking-room", fetcher, "Could not work out the room for tracking");
}

/** The headline for the Parts page. */
export function TrackingRoomLine() {
  const { data, status } = useRoom();
  if (status !== "ready" || !data) return null;
  const sentence = roomSentence(data);
  return sentence ? <p className="text-xs text-muted-foreground">{sentence}</p> : null;
}

function basis(item: TrackingRoomAccount): string {
  const parts = [`carries ${item.carried_percent}% of ${item.searched} parts searched`];
  if (item.measured_per_day !== null) {
    parts.push(`tracking spent ${item.measured_per_day} calls a day last week, against ${item.estimated_per_day} estimated`);
  }
  return parts.join("; ");
}

function RoomRow({ item }: { item: TrackingRoomAccount }) {
  const withheld = item.room.daily === null;
  return (
    <tr className="border-t">
      <th scope="row" className="py-1.5 pr-3 text-left font-medium">
        {item.name}{item.assembly_only ? <span className="ml-1 font-normal text-muted-foreground">(assembly)</span> : null}
      </th>
      <td className="py-1.5 pr-3 text-right tabular-nums">{withheld ? "–" : roughly(item.room.daily ?? 0)}</td>
      <td className="py-1.5 pr-3 text-right tabular-nums">{withheld ? "–" : roughly(item.room.weekly ?? 0)}</td>
      <td className="py-1.5 text-muted-foreground">
        {withheld ? "Too few parts searched there to tell" : item.waiting > 0 ? `${item.waiting} wait for room` : basis(item)}
      </td>
    </tr>
  );
}

/** Yesterday's spend against the estimate. A gap of more than a quarter either way means the room estimate is off. */
function spendSentence(account: TrackingRoomAccount): { text: string; off: boolean } | null {
  const { expected, spent } = account.yesterday;
  if (spent === null || expected <= 0) return null;
  return { text: `Yesterday: expected ${expected.toLocaleString()}, spent ${spent.toLocaleString()}`, off: Math.abs(spent - expected) / expected > 0.25 };
}

/** One stacked bar of the day's calls: tier 1, tier 2 and what is free, with what each is spent on and how many more parts fit. */
function TierBar({ account, daily, weekly }: { account: TrackingRoomAccount; daily: number; weekly: number }) {
  const { capacity } = account;
  const one = account.by_tier["1"];
  const two = account.by_tier["2"];
  const share = (calls: number) => (capacity > 0 ? Math.min(100, (calls / capacity) * 100) : 0);
  const spend = spendSentence(account);
  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between text-xs">
        <span className="font-medium">{account.name}</span>
        <span className="tabular-nums text-muted-foreground">{capacity.toLocaleString()} calls a day for tracking</span>
      </div>
      <div role="img" aria-label={`Tier 1 ${one.calls} calls, tier 2 ${two.calls} calls, ${account.free} free`} className="flex h-2 overflow-hidden bg-muted">
        <div className="h-full bg-primary" style={{ width: `${share(one.calls)}%` }} />
        <div className="h-full bg-primary/50" style={{ width: `${share(two.calls)}%` }} />
      </div>
      <p className="text-xs text-muted-foreground">
        Tier 1: {one.calls.toLocaleString()} calls for {one.parts.toLocaleString()} parts · Tier 2: {two.calls.toLocaleString()} calls for {two.parts.toLocaleString()} parts · room for about {roughly(daily)} more tier-1 parts or {roughly(weekly)} tier-2
      </p>
      {spend ? <p className={`text-xs ${spend.off ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"}`}>{spend.text}</p> : null}
    </div>
  );
}

/** The call budget for the Connectors page: one bar for the distributor that fills first, the rest on request. */
export function TrackingRoomSection() {
  const { data, status } = useRoom();
  const [open, setOpen] = useState(false);
  if (status !== "ready" || !data || data.accounts.length === 0) return null;
  const daily = data.headline.daily;
  const weekly = data.headline.weekly;
  const first = daily ? data.accounts.find((item) => item.name === daily.limited_by) : undefined;
  return (
    <section aria-label="Call budget" className="space-y-2">
      <h3 className="text-sm font-semibold">Call budget</h3>
      {first && daily && weekly ? (
        <TierBar account={first} daily={daily.room} weekly={weekly.room} />
      ) : <p className="text-xs text-muted-foreground">Not enough parts searched yet to tell.</p>}
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
          <ChevronRight className={`h-3 w-3 transition-transform ${open ? "rotate-90" : ""}`} />Per distributor
        </CollapsibleTrigger>
        <CollapsibleContent>
          <table className="mt-2 w-full text-xs">
            <thead>
              <tr className="text-muted-foreground">
                <th scope="col" className="pb-1 pr-3 text-left font-normal">Distributor</th>
                <th scope="col" className="pb-1 pr-3 text-right font-normal">Daily parts</th>
                <th scope="col" className="pb-1 pr-3 text-right font-normal">Weekly parts</th>
                <th scope="col" className="pb-1 text-left font-normal">Based on</th>
              </tr>
            </thead>
            <tbody>
              {data.accounts.map((item) => <RoomRow key={item.connector_ids.join(",")} item={item} />)}
            </tbody>
          </table>
        </CollapsibleContent>
      </Collapsible>
    </section>
  );
}
