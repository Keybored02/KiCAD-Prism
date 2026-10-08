import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { ApiHttpError } from "@/lib/api";
import { getSystem } from "@/lib/systems-api";
import type { SystemDocument } from "@/types/system";

/** How often to re-read while a board interface is still being extracted. */
export const PENDING_POLL_MS = 4000;

interface Loaded {
  systemId: string;
  document: SystemDocument;
  etag: string;
}

export interface SystemDocumentState {
  document: SystemDocument | null;
  /** The ETag the next mutation must send as `If-Match`. */
  etag: string | null;
  loading: boolean;
  error: string | null;
  notFound: boolean;
  /** Re-read the document, e.g. after a mutation or a 412. */
  reload: () => Promise<void>;
}

export function hasPendingInterface(document: SystemDocument | null): boolean {
  return Boolean(document?.instances.some((instance) => instance.interface?.status === "pending"));
}

/**
 * The live system document. It owns the request lifecycle (no query library
 * owns it), so local state holds only this request's result, keyed by the
 * system it belongs to: a stale result for another system is never shown.
 */
export function useSystemDocument(systemId: string): SystemDocumentState {
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [failure, setFailure] = useState<{ systemId: string; message: string; notFound: boolean } | null>(null);
  const controller = useRef<AbortController | null>(null);
  const shown = useRef<string | null>(null);

  const reload = useCallback(async () => {
    controller.current?.abort();
    const abort = new AbortController();
    controller.current = abort;
    try {
      const result = await getSystem(systemId, { signal: abort.signal });
      if (abort.signal.aborted) {
        return;
      }
      setLoaded({ systemId, document: result.body, etag: result.etag ?? result.body.system.etag });
      shown.current = systemId;
      setFailure(null);
    } catch (error) {
      if (abort.signal.aborted || (error instanceof DOMException && error.name === "AbortError")) {
        return;
      }
      const message = error instanceof Error ? error.message : "Could not load the system";
      // SB2-98: with a document on screen a failed re-read was silent, and the next edit then
      // sent an old ETag; say so, and keep the document until a re-read succeeds.
      if (shown.current === systemId) toast.error(`Could not refresh the system: ${message}`, { id: "system-reload" });
      setFailure({ systemId, message, notFound: error instanceof ApiHttpError && error.status === 404 });
    }
  }, [systemId]);

  useEffect(() => {
    void reload();
    return () => controller.current?.abort();
  }, [reload]);

  const current = loaded?.systemId === systemId ? loaded : null;
  const failed = failure?.systemId === systemId ? failure : null;
  const pending = hasPendingInterface(current?.document ?? null);

  // Extraction runs as a background job; re-read until every interface settles.
  useEffect(() => {
    if (!pending) {
      return;
    }
    const timer = window.setTimeout(() => void reload(), PENDING_POLL_MS);
    return () => window.clearTimeout(timer);
  }, [pending, reload, current]);

  return {
    document: current?.document ?? null,
    etag: current?.etag ?? null,
    loading: current === null && failed === null,
    error: failed?.message ?? null,
    notFound: failed?.notFound ?? false,
    reload,
  };
}
