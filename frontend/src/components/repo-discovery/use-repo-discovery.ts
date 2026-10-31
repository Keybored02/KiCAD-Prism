import { useCallback, useEffect, useRef, useState } from "react";

import { isAbortError, watchPrismJob, type PrismJobStatus } from "@/lib/jobs";
import {
  loadDiscoveredRepositories,
  startDiscoveryScan,
  type DiscoveredRepositoryList,
} from "@/lib/repo-discovery";

interface DiscoveryData {
  list: DiscoveredRepositoryList;
  /** False until the stored list has been read once. */
  loaded: boolean;
  error: string;
}

const EMPTY_LIST: DiscoveredRepositoryList = { candidates: [], hiddenCount: 0 };

const messageOf = (error: unknown, fallback: string) =>
  error instanceof Error && error.message ? error.message : fallback;

/** What a scan found on one host, and the scan itself. A host that was never scanned is scanned on entry. */
export function useRepoDiscovery(sourceId: string) {
  const [data, setData] = useState<DiscoveryData>({ list: EMPTY_LIST, loaded: false, error: "" });
  /** The running scan's last status; `null` when none is running. */
  const [scan, setScan] = useState<PrismJobStatus | null>(null);
  const watchRef = useRef<AbortController | null>(null);

  /** `keepError` leaves a message the caller still has to show, such as why a scan failed. */
  const loadList = useCallback(
    async (keepError = false) => {
      try {
        const list = await loadDiscoveredRepositories(sourceId);
        setData((current) => ({ list, loaded: true, error: keepError ? current.error : "" }));
        return list;
      } catch (error) {
        setData((current) => ({ ...current, loaded: true, error: messageOf(error, "Failed to load repositories") }));
        return EMPTY_LIST;
      }
    },
    [sourceId],
  );

  const startScan = useCallback(async () => {
    if (watchRef.current) return;
    const controller = new AbortController();
    watchRef.current = controller;
    setData((current) => ({ ...current, error: "" }));
    try {
      const { job_id } = await startDiscoveryScan(sourceId);
      const job = await watchPrismJob(job_id, {
        signal: controller.signal,
        intervalMs: 1000,
        onUpdate: setScan,
      });
      if (job.status !== "completed") {
        throw new Error(job.error_message || (job.status === "cancelled" ? "The scan was cancelled" : "The scan failed"));
      }
    } catch (error) {
      if (isAbortError(error) || controller.signal.aborted) return;
      setData((current) => ({ ...current, error: messageOf(error, "The scan failed") }));
    } finally {
      if (watchRef.current === controller) watchRef.current = null;
      if (!controller.signal.aborted) {
        setScan(null);
        await loadList(true);
      }
    }
  }, [sourceId, loadList]);

  useEffect(() => {
    let cancelled = false;
    loadDiscoveredRepositories(sourceId)
      .then((list) => {
        if (cancelled) return;
        setData({ list, loaded: true, error: "" });
        if (list.candidates.length === 0 && list.hiddenCount === 0) void startScan();
      })
      .catch((error) => {
        if (!cancelled) setData({ list: EMPTY_LIST, loaded: true, error: messageOf(error, "Failed to load repositories") });
      });
    return () => {
      cancelled = true;
      watchRef.current?.abort();
    };
  }, [sourceId, startScan]);

  return { ...data, scanning: scan !== null || watchRef.current !== null, scan, startScan, reload: loadList };
}
