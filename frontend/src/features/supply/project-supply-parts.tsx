import { Link } from "react-router-dom";

import type { ProjectSupplyPart } from "@/types/supply";
import { StatusDot } from "./status-dot";
import { formatStock } from "./supply-format";
import { JlcIcon, LifecycleIcon, TrackedIcon, WaitingIcon } from "./supply-icons";

const partLink = (partId: string) => `/?section=supply&supplyView=parts&part=${encodeURIComponent(partId)}`;

/** The project's parts, worst first. A row with a part Prism knows opens its sheet in Supply. */
export function ProjectSupplyParts({ parts }: { parts: ProjectSupplyPart[] }) {
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
              </td>
              <td className="p-2 text-right tabular-nums">{part.quantity}</td>
              <td className={`p-2 text-right tabular-nums ${part.short ? "text-destructive" : ""}`}>{part.part_id ? formatStock(part.stock) : ""}</td>
              <td className="p-2 text-right tabular-nums">{part.lead_time_days ? `${part.lead_time_days} d` : ""}</td>
              <td className="p-2">{part.lifecycle ? <LifecycleIcon lifecycle={part.lifecycle} /> : null}</td>
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
