import { useCallback, useRef } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import type { SupplySvhcList } from "@/types/supply";
import { getSvhcList, loadSvhcList } from "./supply-api";
import { useConnectorSubmit } from "./use-connector-submit";
import { useLoaded } from "./use-loaded";

/** For administrators: load the ECHA Candidate List export, so substances declared for parts can be checked against it. */
export function SvhcListUpload() {
  const fetcher = useCallback((signal: AbortSignal) => getSvhcList(signal), []);
  const loaded = useLoaded<SupplySvhcList>("svhc-list", fetcher, "Could not load the Candidate List");
  const { busy, error, run } = useConnectorSubmit();
  const input = useRef<HTMLInputElement>(null);
  const info = loaded.data;

  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium">REACH Candidate List</legend>
      <p className="text-xs text-muted-foreground">
        {info?.loaded
          ? `${info.substances.toLocaleString()} substances, from ${info.source_name || "a file"}, loaded ${info.loaded_at?.slice(0, 10)} by ${info.loaded_by}.`
          : "Not loaded. Export the list from echa.europa.eu as CSV (it needs a substance name and a CAS number column)."}
      </p>
      <input
        ref={input}
        type="file"
        accept=".csv,.txt,text/csv"
        aria-label="Candidate List file"
        className="text-xs"
        disabled={busy}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (!file) return;
          void run(async () => {
            await loadSvhcList(await file.text(), file.name);
            await loaded.refresh();
          }).finally(() => { if (input.current) input.current.value = ""; });
        }}
      />
      {error ? <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert> : null}
    </fieldset>
  );
}
