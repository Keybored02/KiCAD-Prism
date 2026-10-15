import { useCallback } from "react";
import { Link } from "react-router-dom";

import { canOpenSupply } from "@/lib/roles";
import type { UserRole } from "@/types/auth";
import type { SupplyBomRollup } from "@/types/supply";
import { StatusDot } from "./status-dot";
import { getProjectBomHealth } from "./supply-api";
import { STATUS_LABEL } from "./supply-format";
import { useLoaded } from "./use-loaded";

/** One line on the project overview: how its parts stand, opening the Supply tab. Nothing shows to roles without supply access or before the BOM is read. */
export function ProjectSupplyCard({ projectId, role }: { projectId: string; role: UserRole | null | undefined }) {
  const allowed = canOpenSupply(role);
  const fetcher = useCallback(
    (signal: AbortSignal) => (allowed ? getProjectBomHealth(projectId, signal) : Promise.resolve({ available: false })),
    [allowed, projectId],
  );
  const loaded = useLoaded<{ available: boolean; rollup?: SupplyBomRollup }>(`${projectId}:supply-card`, fetcher, "Could not load the supply health");
  const rollup = loaded.data?.rollup;
  if (!allowed || !loaded.data?.available || !rollup) return null;
  return (
    <section aria-label="Supply" className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
      <StatusDot status={rollup.health_status} />
      <span>{STATUS_LABEL[rollup.health_status]}{rollup.health !== null ? `, ${rollup.health.toFixed(1)} of 10` : ""}</span>
      <Link to="?section=supply" className="ml-auto text-xs text-primary hover:underline">Supply</Link>
    </section>
  );
}
