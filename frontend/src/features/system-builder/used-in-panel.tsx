import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { getProjectSystems } from "@/lib/systems-api";
import type { ProjectSystems } from "@/types/system";

const SHOWN_LABELS = 4;

/** ``OBC-1, OBC-2, OBC-3, OBC-4 +46``: the first few placements, then a count. */
function placements(labels: string[]): string {
  const shown = labels.slice(0, SHOWN_LABELS).join(", ");
  return labels.length > SHOWN_LABELS ? `${shown} +${labels.length - SHOWN_LABELS}` : shown;
}

/**
 * SB2-106 (CONTRACTS_P2 §23.5): on a board's project page, the systems that place it, styled like
 * the README under it. Nothing shows when no system the reader can see uses the board.
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

  return (
    <section aria-label="Used in" className="markdown-body" style={{ background: "transparent" }}>
      <h2>Used in</h2>
      <table>
        <thead>
          <tr><th>System</th><th>Placed as</th></tr>
        </thead>
        <tbody>
          {data.systems.map((system) => (
            <tr key={system.id}>
              <td><Link to={`/systems/${system.id}`}>{system.name}</Link></td>
              <td title={system.instances.map((instance) => instance.label).join(", ")}>
                {placements(system.instances.map((instance) => instance.label))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
