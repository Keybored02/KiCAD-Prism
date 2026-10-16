import { useCallback } from "react";

import type { BomSuggestions } from "@/types/supply";
import { getBomSuggestions } from "./supply-api";
import { useLoaded } from "./use-loaded";

const HOW: Record<BomSuggestions["items"][number]["kind"], string> = {
  manufacturer: "Set the Manufacturer field on the symbol.",
  lcsc_part: "Set the Manufacturer and Manufacturer Part Number fields on the symbol.",
  datasheet: "Set the Datasheet field on the symbol.",
  prism_id: "Link the symbol to the library component (Update symbols from library).",
};

/** What Prism could add to the BOM lines, as a list. Nothing is changed in the project: a person applies it in KiCad. */
export function ProjectSuggestions({ projectId, variant }: { projectId: string; variant: string }) {
  const fetcher = useCallback((signal: AbortSignal) => getBomSuggestions(projectId, variant, signal), [projectId, variant]);
  const { data, status } = useLoaded<BomSuggestions>(`suggestions:${projectId}:${variant}`, fetcher, "Could not load the suggestions");
  if (status !== "ready" || !data || data.items.length === 0) return null;
  return (
    <details>
      <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Suggestions for the BOM ({data.items.length})
      </summary>
      <div className="mt-2 space-y-2">
        <p className="text-xs text-muted-foreground">
          Facts Prism knows about these parts that the symbols lack. Nothing is changed in the project; apply them in KiCad.
        </p>
        <div className="overflow-x-auto border">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr><th className="p-2">Line</th><th className="p-2">Field</th><th className="p-2">Suggested</th><th className="p-2">Why</th></tr>
            </thead>
            <tbody>
              {data.items.map((item) => (
                <tr key={`${item.kind}-${item.line_key}`} className="border-b last:border-0" title={HOW[item.kind]}>
                  <td className="p-2">
                    <span className="font-medium">{item.mpn || item.current || "No part number"}</span>{" "}
                    <span className="text-xs text-muted-foreground">{item.references}</span>
                  </td>
                  <td className="p-2">{item.label}</td>
                  <td className="max-w-xs break-all p-2">{item.suggested}</td>
                  <td className="p-2 text-xs text-muted-foreground">{item.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </details>
  );
}
