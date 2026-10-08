import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Boxes, FileSpreadsheet } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getProjectSystems, projectRenamesCsvUrl } from "@/lib/systems-api";
import type { ProjectSystems } from "@/types/system";

/**
 * SB2-106 (CONTRACTS_P2 §23.5): on a board's project page, the systems that place it and the net
 * renames they propose. Nothing shows when no system the reader can see uses the board.
 */
export function UsedInPanel({ projectId }: { projectId: string }) {
  const [data, setData] = useState<ProjectSystems | null>(null);

  useEffect(() => {
    let cancelled = false;
    getProjectSystems(projectId)
      .then((body) => !cancelled && setData(body))
      .catch(() => !cancelled && setData(null));
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  if (!data?.systems.length) return null;
  const renameCount = data.systems.reduce((total, system) => total + system.renames.length, 0);

  return (
    <section aria-label="Used in" className="rounded-md border">
      <header className="flex h-9 items-center gap-2 border-b px-3 text-sm">
        <Boxes className="size-4 text-muted-foreground" aria-hidden />
        <span className="font-medium">Used in</span>
        <span className="text-muted-foreground tabular-nums">{data.systems.length}</span>
        <span className="flex-1" />
        {renameCount > 0 && (
          <Button asChild variant="ghost" size="sm" className="h-7">
            <a href={projectRenamesCsvUrl(projectId)} download title="Net renames to apply (CSV)">
              <FileSpreadsheet className="size-3.5" /> {renameCount} {renameCount === 1 ? "rename" : "renames"}
            </a>
          </Button>
        )}
      </header>
      <ul className="text-sm">
        {data.systems.map((system) => (
          <li key={system.id} className="border-b last:border-b-0">
            <div className="flex h-8 items-center gap-3 px-3">
              <Link to={`/systems/${system.id}`} className="min-w-0 flex-1 truncate font-medium hover:underline">{system.name}</Link>
              <span className="min-w-0 max-w-[50%] truncate text-xs text-muted-foreground">
                {system.instances.map((instance) => instance.label).join(", ")}
              </span>
            </div>
            {system.renames.length > 0 && (
              <ul aria-label={`Renames in ${system.name}`}>
                {system.renames.map((rename) => (
                  <li key={rename.id} className="flex h-7 items-center gap-3 pl-8 pr-3 text-xs" title={rename.note || undefined}>
                    <span className="w-20 shrink-0 truncate">{rename.board}</span>
                    <span className="min-w-0 flex-1 truncate font-mono">
                      {rename.net} <span className="text-primary">→ {rename.name}</span>
                    </span>
                    <span className="hidden w-32 shrink-0 truncate text-right font-mono text-muted-foreground sm:block">
                      {rename.connectors.join(" ")}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
