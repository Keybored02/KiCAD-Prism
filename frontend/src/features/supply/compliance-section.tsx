import { useCallback, useState } from "react";
import { X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { SupplyCompliance } from "@/types/supply";
import { complianceBadge } from "./compliance-model";
import { declareSubstance, getPartCompliance, undeclareSubstance } from "./supply-api";
import { useConnectorSubmit } from "./use-connector-submit";
import { useLoaded } from "./use-loaded";

interface ComplianceSectionProps {
  partId: string;
  canEdit: boolean;
}

/** RoHS and REACH, with where each answer comes from, and the substances a supplier declared. */
export function ComplianceSection({ partId, canEdit }: ComplianceSectionProps) {
  const fetcher = useCallback((signal: AbortSignal) => getPartCompliance(partId, signal), [partId]);
  const loaded = useLoaded<SupplyCompliance>(`${partId}:compliance`, fetcher, "Could not load the compliance");
  const { busy, error, run } = useConnectorSubmit();
  const [cas, setCas] = useState("");
  const [note, setNote] = useState("");
  const data = loaded.data;
  if (!data) return null;
  const rows = [
    { label: "RoHS", ...data.rohs },
    { label: "REACH", ...data.reach },
  ];

  return (
    <section aria-label="Compliance" className="space-y-2">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Compliance</h3>
      <ul className="space-y-1 text-sm">
        {rows.map((row) => {
          const badge = complianceBadge(row.state);
          return (
            <li key={row.label} className="flex flex-wrap items-center gap-2">
              <span className="w-12 font-medium">{row.label}</span>
              <Badge variant={badge.variant}>{badge.label}</Badge>
              <span className="text-xs text-muted-foreground">{row.reason}</span>
            </li>
          );
        })}
      </ul>
      {data.substances.length > 0 ? (
        <ul className="divide-y border text-sm">
          {data.substances.map((item) => (
            <li key={item.cas} className="flex items-center justify-between gap-2 p-2">
              <span className="min-w-0">
                <span className="font-medium tabular-nums">{item.cas}</span>
                {item.note ? <span className="text-muted-foreground">, {item.note}</span> : null}
                {item.listed_as ? <Badge variant="warning" className="ml-2">On the Candidate List: {item.listed_as}</Badge> : null}
              </span>
              {canEdit ? (
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label={`Remove ${item.cas}`}
                  disabled={busy}
                  onClick={() => void run(async () => { await undeclareSubstance(partId, item.cas); await loaded.refresh(); })}
                >
                  <X className="h-4 w-4" />
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
      {!data.list.loaded ? (
        <p className="text-xs text-muted-foreground">The REACH Candidate List is not loaded, so declared substances cannot be checked. An administrator loads it in Supply settings.</p>
      ) : null}
      {canEdit ? (
        <form
          className="grid gap-2 sm:grid-cols-[10rem_1fr_auto] sm:items-end"
          onSubmit={(event) => {
            event.preventDefault();
            void run(async () => {
              await declareSubstance(partId, cas.trim(), note.trim());
              setCas("");
              setNote("");
              await loaded.refresh();
            });
          }}
        >
          <div className="space-y-1">
            <Label htmlFor="substance-cas" className="text-xs">Declared substance (CAS number)</Label>
            <Input id="substance-cas" placeholder="7439-92-1" value={cas} onChange={(event) => setCas(event.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="substance-note" className="text-xs">Note</Label>
            <Input id="substance-note" maxLength={200} value={note} onChange={(event) => setNote(event.target.value)} />
          </div>
          <Button type="submit" size="sm" variant="outline" disabled={busy || cas.trim() === ""}>Declare</Button>
        </form>
      ) : null}
      {error ? <p role="alert" className="text-xs text-destructive">{error}</p> : null}
    </section>
  );
}
