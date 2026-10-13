import { useCallback, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { canOpenSupply } from "@/lib/roles";
import type { UserRole } from "@/types/auth";
import type { SupplyBomRollup } from "@/types/supply";
import { rollupSentences } from "./bom-rollup-text";
import { getProjectBomHealth } from "./supply-api";
import { STATUS_LABEL } from "./supply-format";
import { useLoaded } from "./use-loaded";

/** How the project's parts stand, on its overview. Nothing shows to roles without supply access or before the BOM is read. */
export function ProjectSupplyCard({ projectId, role }: { projectId: string; role: UserRole | null | undefined }) {
  const allowed = canOpenSupply(role);
  const [variant, setVariant] = useState("");
  const fetcher = useCallback(
    (signal: AbortSignal) => (allowed ? getProjectBomHealth(projectId, signal, variant) : Promise.resolve({ available: false })),
    [allowed, projectId, variant],
  );
  const loaded = useLoaded<{ available: boolean; rollup?: SupplyBomRollup; variants?: string[] }>(`${projectId}:supply-card:${variant}`, fetcher, "Could not load the supply health");
  const rollup = loaded.data?.rollup;
  const variants = loaded.data?.variants ?? [];
  if (!allowed || !loaded.data?.available || !rollup) return null;
  const sentences = rollupSentences(rollup, 1, []);
  return (
    <section aria-label="Supply" className="space-y-1 rounded-md border p-3">
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-semibold">Supply</h2>
        {variants.length > 0 ? (
          <select aria-label="Design variant" className="h-7 border bg-background px-1 text-xs" value={variant} onChange={(event) => setVariant(event.target.value)}>
            <option value="">Base design</option>
            {variants.map((name) => <option key={name} value={name}>{name}</option>)}
          </select>
        ) : null}
        <Badge variant={rollup.health_status === "ok" ? "outline" : "warning"}>
          {STATUS_LABEL[rollup.health_status]}{rollup.health !== null ? `, ${rollup.health.toFixed(1)} of 10` : ""}
        </Badge>
      </div>
      <ul className="text-sm text-muted-foreground">
        {sentences.map((sentence) => <li key={sentence.text}>{sentence.text}</li>)}
      </ul>
      <p className="text-xs text-muted-foreground">
        One board, today's data. The BOM tab has the detail and your build size.{" "}
        <a href={`/api/supply/projects/${encodeURIComponent(projectId)}/compliance-draft?format=csv${variant ? `&variant=${encodeURIComponent(variant)}` : ""}`} className="text-primary hover:underline">
          Download a draft RoHS and REACH declaration
        </a>{" "}
        (a working document with the gaps listed, not a declaration).
      </p>
    </section>
  );
}
