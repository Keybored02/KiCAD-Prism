import { FileText, Pencil } from "lucide-react";
import { useCallback, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { getPartDatasheet, setDatasheetUrl } from "./supply-api";
import { useConnectorSubmit } from "./use-connector-submit";
import { useLoaded } from "./use-loaded";

/**
 * The manufacturer's datasheet as an icon beside the title: it opens the address in the browser, and Prism downloads nothing. A
 * person who may edit also gets a pencil to set or change the address.
 */
export function DatasheetLink({ partId, canEdit }: { partId: string; canEdit: boolean }) {
  const fetcher = useCallback((signal: AbortSignal) => getPartDatasheet(partId, signal), [partId]);
  const loaded = useLoaded<{ url: string }>(`${partId}:datasheet`, fetcher, "Could not load the datasheet address");
  const { busy, error, run } = useConnectorSubmit();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<string | null>(null);
  const data = loaded.data;
  if (!data || (!data.url && !canEdit)) return null;
  const address = draft ?? data.url;
  return (
    <span className="inline-flex items-center gap-1">
      {data.url ? (
        <Button asChild size="icon" variant="outline" className="h-8 w-8 shrink-0">
          <a href={data.url} target="_blank" rel="noopener noreferrer" aria-label="Open the datasheet" title="Open the datasheet">
            <FileText className="h-4 w-4" />
          </a>
        </Button>
      ) : null}
      {canEdit ? (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button type="button" size="icon" variant="ghost" className="h-8 w-8 shrink-0" aria-label="Set the datasheet address" title="Set the datasheet address">
              {data.url ? <Pencil className="h-3.5 w-3.5" /> : <FileText className="h-4 w-4 text-muted-foreground" />}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 gap-2 p-3">
            <form
              className="space-y-2"
              onSubmit={(event) => {
                event.preventDefault();
                void run(async () => {
                  await setDatasheetUrl(partId, address.trim());
                  setDraft(null);
                  setOpen(false);
                  await loaded.refresh();
                });
              }}
            >
              <Label htmlFor="datasheet-address" className="text-xs">Datasheet address</Label>
              <Input id="datasheet-address" inputMode="url" placeholder="https://" value={address} onChange={(event) => setDraft(event.target.value)} />
              <Button type="submit" size="sm" variant="outline" disabled={busy || address.trim() === data.url}>Save address</Button>
              {error ? <p role="alert" className="text-xs text-destructive">{error}</p> : null}
            </form>
          </PopoverContent>
        </Popover>
      ) : null}
    </span>
  );
}
