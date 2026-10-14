import { useCallback } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import type { SupplyWorker } from "@/types/supply";
import { getSupplyWorker } from "./supply-api";
import { useLoaded } from "./use-loaded";
import { workerNote } from "./worker-note";

/** For administrators: whether the background worker that reads the distributors is running current code. */
export function WorkerStatus() {
  const fetcher = useCallback((signal: AbortSignal) => getSupplyWorker(signal), []);
  const { data } = useLoaded<SupplyWorker>("worker", fetcher, "Could not load the worker report");
  if (!data) return null;
  const note = workerNote(data, Date.now());
  if (!note.warning) return <p className="text-xs text-muted-foreground">{note.text}</p>;
  return (
    <Alert variant="warning">
      <AlertDescription>{note.text}</AlertDescription>
    </Alert>
  );
}
