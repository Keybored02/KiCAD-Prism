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

/** Room per distributor, for the Connectors page. */
export function TrackingRoomSection() {
  const { data, status } = useRoom();
  if (status !== "ready" || !data || data.accounts.length === 0) return null;
  const sentence = roomSentence(data);
  return (
    <section aria-label="Room to track" className="space-y-2">
      <h3 className="text-sm font-semibold">Room to track</h3>
      <p className="text-sm">{sentence || "Not enough parts searched yet to tell."}</p>
      <p className="text-xs text-muted-foreground">
        Counted in parts like the ones already searched: what each distributor carries, its listings per part, and what tracking really spent.
      </p>
      <table className="w-full text-xs">
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
    </section>
  );
}
