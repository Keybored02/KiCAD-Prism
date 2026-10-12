import { useCallback, useState } from "react";
import { Download } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { SupplyDatasheets } from "@/types/supply";
import { datasheetStatusText, formatSize } from "./datasheet-model";
import { datasheetFileUrl, getPartDatasheets, setDatasheetUrl } from "./supply-api";
import { useConnectorSubmit } from "./use-connector-submit";
import { useLoaded } from "./use-loaded";

interface DatasheetSectionProps {
  partId: string;
  canEdit: boolean;
}

/** The manufacturer's datasheet as Prism has kept it: versions, what changed, and where it is read from. */
export function DatasheetSection({ partId, canEdit }: DatasheetSectionProps) {
  const fetcher = useCallback((signal: AbortSignal) => getPartDatasheets(partId, signal), [partId]);
  const loaded = useLoaded<SupplyDatasheets>(`${partId}:datasheets`, fetcher, "Could not load the datasheets");
  const { busy, error, run } = useConnectorSubmit();
  const [draft, setDraft] = useState<string | null>(null);
  const data = loaded.data;
  if (!data) return null;
  if (!data.url && data.items.length === 0 && !canEdit) return null;
  const address = draft ?? data.url;

  return (
    <section aria-label="Datasheets" className="space-y-2">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Datasheets</h3>
      <p className="text-xs text-muted-foreground">
        {data.url ? datasheetStatusText(data.status) : "No datasheet address yet. A distributor may give one when the part is found."}
      </p>
      {data.items.length > 0 ? (
        <ul className="divide-y border text-sm">
          {data.items.map((item) => (
            <li key={item.id} className="space-y-1 p-2">
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium">Version {item.version}, {item.fetched_at.slice(0, 10)}</span>
                <span className="flex items-center gap-2 text-xs text-muted-foreground">
                  {item.pages} pages, {formatSize(item.size_bytes)}
                  <a href={datasheetFileUrl(item.id)} aria-label={`Download version ${item.version}`} className="text-primary hover:underline">
                    <Download className="h-4 w-4" />
                  </a>
                </span>
              </div>
              {item.change_summary ? <p className="text-xs text-muted-foreground">{item.change_summary}</p> : null}
              {item.markers.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {item.markers.map((marker) => <Badge key={marker} variant="warning">{marker}</Badge>)}
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
      {canEdit ? (
        <form
          className="flex items-end gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            void run(async () => {
              await setDatasheetUrl(partId, address.trim());
              setDraft(null);
              await loaded.refresh();
            });
          }}
        >
          <div className="min-w-0 flex-1 space-y-1">
            <Label htmlFor="datasheet-address" className="text-xs">Datasheet address</Label>
            <Input id="datasheet-address" inputMode="url" placeholder="https://" value={address} onChange={(event) => setDraft(event.target.value)} />
          </div>
          <Button type="submit" size="sm" variant="outline" disabled={busy || address.trim() === data.url}>Save address</Button>
        </form>
      ) : null}
      {error ? <p role="alert" className="text-xs text-destructive">{error}</p> : null}
    </section>
  );
}
