import { useCallback } from "react";

import type { ComponentCoverage } from "@/types/supply";
import { formatStock } from "./supply-format";
import { getComponentCoverage } from "./supply-api";
import { useLoaded } from "./use-loaded";

/** What a component's parts hold together, with each part's share. Nothing for a component with one part. */
export function CoverageSummary({ coverage }: { coverage: ComponentCoverage }) {
  if (coverage.parts.length < 2) return null;
  const given = coverage.parts.filter((part) => part.stock !== null);
  return (
    <p className="text-xs text-muted-foreground">
      {coverage.component ? `${coverage.component}: ` : ""}
      Together {coverage.stock === null ? "no part has been read yet" : `these hold ${formatStock(coverage.stock)}`}
      {given.length > 0 ? ` (${given.map((part) => `${formatStock(part.stock)} ${part.mpn}`).join(", ")})` : ""}.
      {coverage.unread > 0 ? ` ${coverage.unread} ${coverage.unread === 1 ? "part has" : "parts have"} not been read, so this is not the whole.` : ""}
    </p>
  );
}

/** The coverage of one catalog component, loaded. */
export function ComponentCoverageNote({ componentId, version }: { componentId: string; version?: number }) {
  const fetcher = useCallback((signal: AbortSignal) => getComponentCoverage(componentId, signal), [componentId]);
  const { data } = useLoaded<ComponentCoverage>(`coverage:${componentId}:${version ?? 0}`, fetcher, "Could not load the component's coverage");
  return data ? <CoverageSummary coverage={data} /> : null;
}
