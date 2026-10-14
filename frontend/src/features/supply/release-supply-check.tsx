import { useCallback } from "react";

import type { ReleaseCheck } from "@/types/supply";
import { getReleaseCheck } from "./release-check-api";
import { StatusDot } from "./status-dot";
import { STATUS_LABEL } from "./supply-format";
import { useLoaded } from "./use-loaded";

/**
 * What supply data says about the BOM being released. It informs the release and blocks nothing.
 * Someone who cannot read supply data, or a failed check, sees no card: this is not the release's problem.
 */
export function ReleaseSupplyCheck({ projectId, commit }: { projectId: string; commit: string }) {
  const fetcher = useCallback((signal: AbortSignal) => getReleaseCheck(projectId, commit, signal), [projectId, commit]);
  const check = useLoaded<ReleaseCheck>(`${projectId}@${commit}`, fetcher, "Could not check the BOM");
  if (check.status === "loading") return <p className="text-xs text-muted-foreground">Checking the BOM against supply data...</p>;
  if (check.status === "error" || !check.data) return null;
  const data = check.data;
  if (!data.available) return <p className="text-xs text-muted-foreground">{data.reason}</p>;

  return (
    <section aria-label="Supply check" className="space-y-2 border p-3 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <StatusDot status={data.status} />
        <span className="font-medium">{data.health === null ? "No supply data on this BOM yet" : `BOM health ${data.health.toFixed(1)} of 10`}</span>
        <span className="text-xs text-muted-foreground">{STATUS_LABEL[data.status]}</span>
      </div>
      <p className="text-xs text-muted-foreground">
        {data.tracked} of {data.parts} parts tracked
        {data.not_tracked > 0 ? `, ${data.not_tracked} not yet` : ""}. This is a note for the release; it does not block publishing.
      </p>
      {data.variants && Object.keys(data.variants).length > 0 ? (
        <ul aria-label="Design variants" className="space-y-1 text-xs">
          {Object.entries(data.variants).map(([name, variant]) => (
            <li key={name} className="flex flex-wrap items-center gap-2">
              <StatusDot status={variant.status} />
              <span className="font-medium">{name}</span>
              <span className="text-muted-foreground">
                {variant.health === null ? "no supply data" : `health ${variant.health.toFixed(1)}`}
                {variant.needing_a_look > 0 ? `, ${variant.needing_a_look} to look at` : ""}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
      {data.attention.length > 0 ? (
        <ul aria-label="Parts that need a look" className="divide-y border">
          {data.attention.map((line) => (
            <li key={`${line.manufacturer}|${line.mpn}`} className="space-y-0.5 p-2 text-xs">
              <div className="font-medium">{line.mpn}{line.manufacturer ? `, ${line.manufacturer}` : ""}</div>
              {line.findings.map((finding) => (
                <div key={finding.check} className="text-muted-foreground">{finding.text}</div>
              ))}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
