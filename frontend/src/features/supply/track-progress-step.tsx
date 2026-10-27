import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

import type { TrackProgress, TrackingPreview } from "@/types/supply";
import { getTrackProgress } from "./tracking-api";

const POLL_MS = 3000;

/** The first searches of the project's parts, a bar per distributor, and what tracking did. Closing leaves the work running. */
export function TrackProgressStep({ projectId, result, onFinished }: { projectId: string; result: TrackingPreview | null; onFinished: () => void }) {
  const [progress, setProgress] = useState<TrackProgress | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    let stopped = false;
    const look = () => {
      getTrackProgress(projectId, controller.signal)
        .then((next) => {
          if (stopped) return;
          setProgress(next);
          if (next.finished) { stopped = true; clearInterval(timer); onFinished(); }
        })
        .catch(() => undefined);
    };
    const timer = setInterval(look, POLL_MS);
    look();
    return () => { stopped = true; controller.abort(); clearInterval(timer); };
  }, [projectId, onFinished]);

  const waiting = (result?.connectors ?? []).reduce((count, item) => count + Math.max(item.waiting_new ?? 0, 0), 0);
  const finished = progress?.finished === true;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 text-xs">
        <span className="bg-secondary px-2 py-0.5">{progress?.parts ?? 0} {(progress?.parts ?? 0) === 1 ? "part" : "parts"} tracked</span>
        {waiting > 0 ? <span className="bg-warning/15 px-2 py-0.5 text-warning">{waiting} wait for room</span> : null}
        {result?.tracked?.skipped.length ? <span className="bg-secondary px-2 py-0.5">{result.tracked.skipped.length} to settle later</span> : null}
      </div>
      <ul className="space-y-2" aria-label="First searches">
        {(progress?.connectors ?? []).map((item) => {
          const share = item.parts > 0 ? Math.min(100, Math.round((item.searched / item.parts) * 100)) : 100;
          return (
            <li key={item.connector_id} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-medium">{item.name}</span>
                <span className="tabular-nums text-muted-foreground">{item.searched} of {item.parts}</span>
              </div>
              <div role="progressbar" aria-label={`${item.name} searched`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={share} className="h-2 overflow-hidden bg-secondary">
                <div className="h-full bg-primary transition-[width] duration-300" style={{ width: `${share}%` }} />
              </div>
            </li>
          );
        })}
      </ul>
      {finished ? null : (
        <p className="flex items-center gap-2 text-xs text-muted-foreground"><Loader2 className="h-3.5 w-3.5 animate-spin" />Searching continues if you close this.</p>
      )}
    </div>
  );
}
