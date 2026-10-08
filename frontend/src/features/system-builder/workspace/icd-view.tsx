import { useEffect, useState } from "react";
import { ExternalLink, FileSpreadsheet, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { fetchApi, readApiError } from "@/lib/api";
import { icdUrl } from "@/lib/systems-api";

/**
 * The live ICD as a workspace view (PLAN M8). The document is read through the
 * API client and shown from `srcDoc`: a framed navigation would carry no
 * credentials and is refused by some browsers and blockers. The frame runs
 * nothing (the document is static HTML and CSS).
 */
export function IcdView({ systemId, etag }: { systemId: string; etag: string }) {
  const [state, setState] = useState<{ etag: string; html: string | null; error: string | null } | null>(null);
  useEffect(() => {
    let cancelled = false;
    fetchApi(icdUrl(systemId, "html"))
      .then(async (response) => {
        if (!response.ok) throw new Error(await readApiError(response, "The ICD could not be generated"));
        return response.text();
      })
      .then((html) => !cancelled && setState({ etag, html, error: null }))
      .catch((error: unknown) => !cancelled && setState({ etag, html: null, error: error instanceof Error ? error.message : String(error) }));
    return () => {
      cancelled = true;
    };
  }, [systemId, etag]);

  return (
    <div className="flex size-full flex-col">
      <div className="flex h-9 shrink-0 items-center gap-1 border-b px-3 text-xs text-muted-foreground">
        <span className="mr-auto">Live interface control document</span>
        {state && state.etag !== etag && <Loader2 className="size-3.5 animate-spin" aria-label="Updating" />}
        <Button asChild variant="ghost" size="sm" className="h-7">
          <a href={icdUrl(systemId, "html")} target="_blank" rel="noreferrer"><ExternalLink className="size-3.5" /> Open in a new tab</a>
        </Button>
        <Button asChild variant="ghost" size="sm" className="h-7">
          <a href={icdUrl(systemId, "csv")} download><FileSpreadsheet className="size-3.5" /> CSV</a>
        </Button>
      </div>
      {state?.html != null ? (
        <iframe title="Interface control document" srcDoc={state.html} sandbox=""
          className="min-h-0 w-full flex-1 border-0 bg-white" />
      ) : state?.error ? (
        <p className="p-6 text-sm text-destructive">{state.error}</p>
      ) : (
        <p className="flex items-center gap-2 p-6 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" aria-hidden /> Generating the ICD…</p>
      )}
    </div>
  );
}

