import { useCallback, useState } from "react";

import type { TradeReport } from "@/types/supply";
import { getProjectTrade } from "./supply-api";
import { useLoaded } from "./use-loaded";

const CONTROL_TEXT: Record<TradeReport["parts"][number]["control"], string> = {
  none: "No specific control", controlled: "Controlled", disputed: "Disputed", unknown: "Unknown",
};

function Table({ projectId, variant }: { projectId: string; variant: string }) {
  const fetcher = useCallback((signal: AbortSignal) => getProjectTrade(projectId, variant, signal), [projectId, variant]);
  const { data, status } = useLoaded<{ available: boolean; report: TradeReport | null }>(`trade:${projectId}:${variant}`, fetcher, "Could not load the trade classification");
  if (status === "loading") return <p className="text-xs text-muted-foreground">Reading the classification...</p>;
  if (!data?.report) return null;
  const { report } = data;
  const csv = `/api/supply/projects/${encodeURIComponent(projectId)}/trade?format=csv${variant ? `&variant=${encodeURIComponent(variant)}` : ""}`;
  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">
        {report.summary.controlled} controlled, {report.summary.disputed} disputed, {report.summary.unknown} unknown of {report.summary.parts} parts.{" "}
        {report.summary.note} <a href={csv} className="text-primary hover:underline">Download as CSV</a>
      </p>
      <div className="overflow-x-auto border">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr><th className="p-2">Part</th><th className="p-2">ECCN</th><th className="p-2">Export control</th><th className="p-2">Tariff US</th><th className="p-2">Tariff EU</th></tr>
          </thead>
          <tbody>
            {report.parts.map((part) => (
              <tr key={part.key} className="border-b last:border-0" title={part.gaps.join(" ")}>
                <td className="p-2"><span className="font-medium">{part.mpn || "No part number"}</span> <span className="text-xs text-muted-foreground">{part.manufacturer}</span></td>
                <td className="p-2">{part.eccn.join(", ")}</td>
                <td className={`p-2 ${part.control === "controlled" || part.control === "disputed" ? "text-warning" : ""}`}>{CONTROL_TEXT[part.control]}</td>
                <td className="p-2">{part.hts_us.join(", ")}</td>
                <td className="p-2">{part.hts_eu.join(", ")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** What distributors state for each part's export control class and tariff codes. It loads when opened. */
export function ProjectTrade({ projectId, variant }: { projectId: string; variant: string }) {
  const [open, setOpen] = useState(false);
  return (
    <details onToggle={(event) => setOpen((event.currentTarget as HTMLDetailsElement).open)}>
      <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wider text-muted-foreground">Trade classification</summary>
      <div className="mt-2">{open ? <Table projectId={projectId} variant={variant} /> : null}</div>
    </details>
  );
}
