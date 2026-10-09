import { useEffect, useRef, useState } from "react";
import { FileBox, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { getStepExport, requestStepExport, stepFileUrl, type StepExport } from "@/lib/systems-api";

import { ToolbarButton } from "./workspace/toolbar-button";

const POLL_MS = 3000;
const POLL_LIMIT = 600; // thirty minutes: every board's STEP may be exported first

function download(systemId: string) {
  const link = window.document.createElement("a");
  link.href = stepFileUrl(systemId);
  link.rel = "noopener";
  link.click();
}

function megabytes(bytes: number | null): string {
  return bytes === null ? "" : ` · ${(bytes / 1_000_000).toFixed(1)} MB`;
}

/** The 3D toolbar's STEP export (P2 §25): downloads the export of this version, else makes one first. */
export function StepExportButton({ systemId, version }: { systemId: string; version: number }) {
  const [latest, setLatest] = useState<StepExport | null>(null);
  const [running, setRunning] = useState(false);
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true; // StrictMode mounts twice
    const controller = new AbortController();
    getStepExport(systemId, controller.signal).then(setLatest).catch(() => undefined);
    return () => {
      alive.current = false;
      controller.abort();
    };
  }, [systemId]);

  const current = latest?.state === "ready" && latest.version === version;
  const run = async () => {
    if (current) {
      download(systemId);
      return;
    }
    setRunning(true);
    try {
      await requestStepExport(systemId);
      for (let attempt = 0; attempt < POLL_LIMIT && alive.current; attempt += 1) {
        await new Promise((resolve) => window.setTimeout(resolve, POLL_MS));
        const next = await getStepExport(systemId);
        if (!alive.current) return;
        setLatest(next);
        if (next.state === "ready") {
          if (next.skipped.length) toast.warning(`${next.skipped.length} left out of the STEP: ${next.skipped.map((s) => s.label).join(", ")}`);
          download(systemId);
          return;
        }
        if (next.state === "failed") throw new Error(next.error ?? "The STEP export failed");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "The STEP export failed");
    } finally {
      if (alive.current) setRunning(false);
    }
  };

  const title = running || latest?.state === "running" ? "Exporting STEP…"
    : current ? `Download STEP · v${version}${megabytes(latest.sizeBytes)}` : "Export STEP";
  return (
    <ToolbarButton title={title} disabled={running} onClick={() => void run()}>
      {running ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <FileBox className="size-4" aria-hidden />}
    </ToolbarButton>
  );
}
