import type { SupplyWorker } from "@/types/supply";

/** The worker scans every minute. Missing for this long means it has stopped. */
const SILENT_MINUTES = 5;

export interface WorkerNote {
  /** A warning needs an administrator to act. */
  warning: boolean;
  text: string;
}

function ago(minutes: number): string {
  if (minutes < 1) return "less than a minute ago";
  if (minutes < 120) return minutes === 1 ? "1 minute ago" : `${minutes} minutes ago`;
  return `${Math.round(minutes / 60)} hours ago`;
}

/** What the background worker's last report says, in words. */
export function workerNote(worker: SupplyWorker, now: number): WorkerNote {
  if (!worker.seen_at) return { warning: true, text: "The background worker has not reported yet. Nothing is read until it runs." };
  const minutes = Math.max(0, Math.floor((now - new Date(worker.seen_at).getTime()) / 60000));
  if (minutes >= SILENT_MINUTES) {
    return { warning: true, text: `The background worker last reported ${ago(minutes)}. It may have stopped, and then nothing is read.` };
  }
  if (worker.older_than_server) {
    return { warning: true, text: "The background worker started before the last update. Restart it to run the new code." };
  }
  if (worker.missing_providers.length > 0) {
    return { warning: true, text: `The background worker does not know ${worker.missing_providers.join(", ")}. Restart it; those connectors are not read until then.` };
  }
  return { warning: false, text: `Background worker seen ${ago(minutes)}.` };
}
