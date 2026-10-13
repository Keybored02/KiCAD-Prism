import { useCallback, useState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { SupplyDeniedHost } from "@/types/supply";
import { allowDatasheetHost, denyDatasheetHost, listDeniedDatasheetHosts } from "./supply-api";
import { useConnectorSubmit } from "./use-connector-submit";
import { useLoaded } from "./use-loaded";

/** For administrators: hosts datasheets are never fetched from, with their subdomains. */
export function DatasheetHosts() {
  const fetcher = useCallback((signal: AbortSignal) => listDeniedDatasheetHosts(signal), []);
  const loaded = useLoaded<SupplyDeniedHost[]>("datasheet-hosts", fetcher, "Could not load the blocked hosts");
  const { busy, error, run } = useConnectorSubmit();
  const [host, setHost] = useState("");
  const items = loaded.data ?? [];

  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium">Datasheet hosts to avoid</legend>
      <p className="text-xs text-muted-foreground">Datasheets are fetched from any public HTTPS host. Add a host here and nothing is fetched from it or its subdomains.</p>
      {items.length > 0 ? (
        <ul className="divide-y border text-sm">
          {items.map((item) => (
            <li key={item.host} className="flex items-center justify-between gap-2 px-2 py-1">
              <span>{item.host}{item.reason ? <span className="ml-2 text-xs text-muted-foreground">{item.reason}</span> : null}</span>
              <Button type="button" size="sm" variant="ghost" disabled={busy} aria-label={`Allow ${item.host}`}
                onClick={() => void run(async () => { await allowDatasheetHost(item.host); await loaded.refresh(); })}>
                Allow
              </Button>
            </li>
          ))}
        </ul>
      ) : null}
      <div className="flex gap-2">
        <Input aria-label="Host to avoid" className="h-8" placeholder="example.com" value={host} onChange={(event) => setHost(event.target.value)} />
        <Button type="button" size="sm" disabled={busy || !host.trim()}
          onClick={() => void run(async () => { await denyDatasheetHost(host.trim()); setHost(""); await loaded.refresh(); })}>
          Avoid
        </Button>
      </div>
      {error ? <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert> : null}
    </fieldset>
  );
}
