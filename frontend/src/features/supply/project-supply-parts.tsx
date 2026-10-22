import { Link } from "react-router-dom";

import type { ProjectSupplyPart } from "@/types/supply";
import { StatusDot } from "./status-dot";
import { formatStock } from "./supply-format";
import { DataAgeIcon, JlcIcon, LifecycleIcon, TrackedIcon, WaitingIcon } from "./supply-icons";

const partLink = (partId: string) => `/?section=supply&supplyView=parts&part=${encodeURIComponent(partId)}`;

/** The project's parts, worst first. A row with a part Prism knows opens its sheet in Supply. */
export function ProjectSupplyParts({ parts, shortAt8Weeks = {}, chance = 0.5 }: { parts: ProjectSupplyPart[]; shortAt8Weeks?: Record<string, number>; chance?: number }) {
  return (
    <div className="overflow-x-auto border">
      <table className="w-full text-sm">
        <thead className="border-b bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
          <tr>
            <th className="w-8 p-2"><span className="sr-only">Status</span></th>
            <th className="p-2">Part</th>
            <th className="p-2 text-right">Per board</th>
            <th className="p-2 text-right">In stock</th>
            <th className="p-2 text-right">Lead time</th>
            <th className="w-8 p-2"><span className="sr-only">Lifecycle</span></th>
            <th className="w-8 p-2"><span className="sr-only">Read</span></th>
            <th className="w-8 p-2"><span className="sr-only">Tracking</span></th>
            <th className="p-2 text-right">Notes</th>
          </tr>
        </thead>
        <tbody>
          {parts.map((part) => (
            <tr key={part.key} className="border-b last:border-0">
              <td className="p-2">{part.status ? <StatusDot status={part.status} /> : null}</td>
              <td className="p-2">
                {part.part_id ? (
                  <Link to={partLink(part.part_id)} className="font-medium text-primary hover:underline">{part.mpn}</Link>
                ) : (
                  <span className="font-medium">{part.mpn || "No part number"}</span>
                )}
                <div className="text-xs text-muted-foreground">{part.manufacturer} <JlcIcon jlc={part.jlc} /></div>
                {(shortAt8Weeks[part.key] ?? 0) >= chance ? (
                  <span className="mt-0.5 inline-block border border-warning/50 px-1 text-[11px] text-warning" title={`${Math.round(shortAt8Weeks[part.key] * 100)}% chance it cannot be bought for one board in 8 weeks`}>Out within 8 weeks</span>
                ) : null}
              </td>
              <td className="p-2 text-right tabular-nums">{part.quantity}</td>
              <td className={`p-2 text-right tabular-nums ${part.short ? "text-destructive" : ""}`}>{part.part_id ? formatStock(part.stock) : ""}</td>
              <td className="p-2 text-right tabular-nums">{part.lead_time_days ? `${part.lead_time_days} d` : ""}</td>
              <td className="p-2">{part.lifecycle ? <LifecycleIcon lifecycle={part.lifecycle} /> : null}</td>
              <td className="p-2"><DataAgeIcon fetchedAt={part.fetched_at ?? null} /></td>
              <td className="p-2">
                <span className="flex gap-1">
                  {part.tier ? <TrackedIcon tier={part.tier} /> : null}
                  {part.waiting ? <WaitingIcon /> : null}
                </span>
              </td>
              <td className="p-2 text-right tabular-nums">{part.notes > 0 ? part.notes : ""}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
