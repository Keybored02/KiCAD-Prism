import { useEffect, useState } from "react";
import { ScanSearch } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import type { CheckProgress } from "@/types/supply";
import { getCheck, startCheck } from "./tracking-api";

const EVERY_MS = 5000;

/**
 * Read the parts on a BOM that have no reading, once, without tracking them. The calls come from the pool the budget
 * keeps for this and, when it is empty, from spare budget, so a large BOM can take an evening. Progress shows here.
 */
export function CheckOnceButton({
  projectId, lines, onFinished,
}: { projectId: string; lines: ReadonlyArray<{ manufacturer: string; mpn: string }>; onFinished: () => void }) {
  const [requestId, setRequestId] = useState("");
  const [progress, setProgress] = useState<CheckProgress | null>(null);
  const [busy, setBusy] = useState(false);
  const finished = progress?.finished === true;

  useEffect(() => {
    if (!requestId || finished) return;
    const controller = new AbortController();
    const timer = window.setInterval(() => {
      getCheck(requestId, controller.signal)
        .then((next) => {
          setProgress(next);
          if (next.finished) onFinished();
        })
        .catch(() => undefined);
    }, EVERY_MS);
    return () => { controller.abort(); window.clearInterval(timer); };
  }, [requestId, finished, onFinished]);

  const start = () => {
    setBusy(true);
    startCheck("bom", projectId, lines)
      .then((made) => {
        if (made.parts === 0) { toast.success("Nothing to check", { description: "Every part is already tracked." }); return; }
        setRequestId(made.id);
        setProgress(made.progress);
      })
      .catch((caught: Error) => toast.error(caught.message))
      .finally(() => setBusy(false));
  };

  if (progress && !finished) {
    return <span className="text-xs text-muted-foreground" role="status">Checking: {progress.done} of {progress.parts} parts read</span>;
  }
  if (lines.length === 0) return null;
  return (
    <Button type="button" size="sm" variant="outline" className="h-7" disabled={busy} onClick={start}>
      <ScanSearch className="h-3.5 w-3.5" />Check once ({lines.length})
    </Button>
  );
}
