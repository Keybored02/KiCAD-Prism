import { useCallback } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import type { SupplyWorker } from "@/types/supply";
import { getSupplyWorker } from "./supply-api";
import { useLoaded } from "./use-loaded";
import { workerNote } from "./worker-note";

/** For administrators: a warning when the background worker that reads the distributors is missing or running old code. */
export function WorkerStatus() {
  const fetcher = useCallback((signal: AbortSignal) => getSupplyWorker(signal), []);
  const { data } = useLoaded<SupplyWorker>("worker", fetcher, "Could not load the worker report");
  if (!data) return null;
  const note = workerNote(data, Date.now());
  if (!note.warning) return null;
  return (
    <Alert variant="warning">
      <AlertDescription>{note.text}</AlertDescription>
    </Alert>
  );
}
