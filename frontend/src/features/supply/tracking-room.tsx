import { useCallback } from "react";

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
  return `Room for about ${roughly(daily.room)} more daily parts, or ${roughly(weekly.room)} weekly.`;
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

/** Yesterday's spend against the estimate. A gap of more than a quarter either way means the room estimate is off. */
function spendSentence(account: TrackingRoomAccount): { text: string; off: boolean } | null {
  const { expected, spent } = account.yesterday;
  if (spent === null || expected <= 0) return null;
  return { text: `Yesterday: expected ${expected.toLocaleString()}, spent ${spent.toLocaleString()}`, off: Math.abs(spent - expected) / expected > 0.25 };
}

/** One distributor's day of tracking calls as a stacked bar: tier 1, tier 2 and what is free, with how many more parts fit. */
function TierBar({ account }: { account: TrackingRoomAccount }) {
  const { capacity } = account;
  const one = account.by_tier["1"];
  const two = account.by_tier["2"];
  const share = (calls: number) => (capacity > 0 ? Math.min(100, (calls / capacity) * 100) : 0);
  const spend = spendSentence(account);
  const withheld = account.room.daily === null || account.room.weekly === null;
  return (
    <li className="space-y-1" aria-label={account.name}>
      <div className="flex items-baseline justify-between text-xs">
        <span className="font-medium">{account.name}{account.assembly_only ? <span className="ml-1 font-normal text-muted-foreground">(assembly)</span> : null}</span>
        <span className="tabular-nums text-muted-foreground">{capacity.toLocaleString()} calls a day for tracking</span>
      </div>
      <div role="img" aria-label={`${account.name}: tier 1 ${one.calls} calls, tier 2 ${two.calls} calls, ${account.free} free`} className="flex h-2 overflow-hidden bg-muted">
        <div className="h-full bg-primary" style={{ width: `${share(one.calls)}%` }} />
        <div className="h-full bg-primary/50" style={{ width: `${share(two.calls)}%` }} />
      </div>
      <p className="text-xs text-muted-foreground">
        Tier 1: {one.calls.toLocaleString()} calls for {one.parts.toLocaleString()} parts · Tier 2: {two.calls.toLocaleString()} calls for {two.parts.toLocaleString()} parts
        {withheld ? " · too few parts searched here to tell the room left" : ` · room for about ${roughly(account.room.daily ?? 0)} more tier-1 parts or ${roughly(account.room.weekly ?? 0)} tier-2`}
      </p>
      {account.waiting > 0 ? <p className="text-xs text-warning">{account.waiting} wait for room</p> : null}
      {!withheld && account.waiting === 0 ? <p className="text-xs text-muted-foreground">{basis(account)}</p> : null}
      {spend ? <p className={`text-xs ${spend.off ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"}`}>{spend.text}</p> : null}
    </li>
  );
}

/** The call budget for the Connectors page: one bar for each distributor. */
export function TrackingRoomSection() {
  const { data, status } = useRoom();
  if (status !== "ready" || !data || data.accounts.length === 0) return null;
  return (
    <section aria-label="Call budget" className="space-y-2">
      <h3 className="text-sm font-semibold">Call budget</h3>
      <ul className="space-y-4">
        {data.accounts.map((account) => <TierBar key={account.connector_ids.join(",")} account={account} />)}
      </ul>
    </section>
  );
}
