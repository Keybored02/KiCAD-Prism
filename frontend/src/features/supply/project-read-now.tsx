import { useEffect, useState } from "react";
import { FileSearch, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { readProjectBom } from "./tracking-api";

const POLL_MS = 5000;
// About five minutes; an index that takes longer is still building, and Read now starts the wait again.
const POLLS = 60;

/**
 * A project whose BOM Prism has not read: one button reads it, or queues its index and looks again until the parts land.
 * The wait shows its time so far.
 */
export function ProjectReadNow({ projectId, onRead }: { projectId: string; onRead: () => void }) {
  const [started, setStarted] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (started === null) return undefined;
    let polls = 0;
    let stopped = false;
    const look = () => {
      polls += 1;
      readProjectBom(projectId)
        .then(({ status }) => {
          if (stopped) return;
          if (status !== "reading") {
            setStarted(null);
            onRead();
          } else if (polls >= POLLS) {
            setStarted(null);
          }
        })
        .catch((error: unknown) => {
          if (stopped) return;
          setStarted(null);
          toast.error(error instanceof Error ? error.message : "Could not read the project's BOM");
        });
    };
    look();
    const poll = window.setInterval(look, POLL_MS);
    const tick = window.setInterval(() => setNow(Date.now()), 1000);
    return () => {
      stopped = true;
      window.clearInterval(poll);
      window.clearInterval(tick);
    };
  }, [onRead, projectId, started]);

  const seconds = started === null ? 0 : Math.max(0, Math.round((now - started) / 1000));
  return (
    <div className="flex items-center gap-3 border border-dashed p-6 text-sm text-muted-foreground">
      <span>Not read</span>
      {started === null ? (
        <Button size="sm" variant="outline" className="gap-1.5" onClick={() => { setNow(Date.now()); setStarted(Date.now()); }}>
          <FileSearch className="h-4 w-4" />Read now
        </Button>
      ) : (
        <span role="status" className="flex items-center gap-1.5">
          <Loader2 className="h-4 w-4 animate-spin" />Reading · {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, "0")}
        </span>
      )}
    </div>
  );
}
