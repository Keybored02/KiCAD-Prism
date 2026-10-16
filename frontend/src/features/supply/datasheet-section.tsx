import { useCallback, useState } from "react";
import { ExternalLink } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getPartDatasheet, setDatasheetUrl } from "./supply-api";
import { useConnectorSubmit } from "./use-connector-submit";
import { useLoaded } from "./use-loaded";

interface DatasheetSectionProps {
  partId: string;
  canEdit: boolean;
}

/** A link to the manufacturer's datasheet. Prism downloads nothing; the address opens in the browser. */
export function DatasheetSection({ partId, canEdit }: DatasheetSectionProps) {
  const fetcher = useCallback((signal: AbortSignal) => getPartDatasheet(partId, signal), [partId]);
  const loaded = useLoaded<{ url: string }>(`${partId}:datasheet`, fetcher, "Could not load the datasheet address");
  const { busy, error, run } = useConnectorSubmit();
  const [draft, setDraft] = useState<string | null>(null);
  const data = loaded.data;
  if (!data) return null;
  if (!data.url && !canEdit) return null;
  const address = draft ?? data.url;

  return (
    <section aria-label="Datasheet" className="space-y-2">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Datasheet</h3>
      {data.url ? (
        <a href={data.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
          Open the datasheet<ExternalLink className="h-3.5 w-3.5" />
        </a>
      ) : (
        <p className="text-xs text-muted-foreground">No datasheet address yet. A distributor may give one when the part is found.</p>
      )}
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
