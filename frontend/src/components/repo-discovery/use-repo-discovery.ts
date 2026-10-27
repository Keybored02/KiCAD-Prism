import { useCallback, useEffect, useRef, useState } from "react";

import { isAbortError, watchPrismJob, type PrismJobStatus } from "@/lib/jobs";
import {
  loadDiscoveredRepositories,
  loadDiscoverySources,
  setRepositoryDismissed,
  startDiscoveryScan,
  type DiscoveredRepositoryList,
  type DiscoverySource,
} from "@/lib/repo-discovery";

interface DiscoveryData {
  /** `null` until the connected hosts have loaded. */
  sources: DiscoverySource[] | null;
  sourceId: string;
  list: DiscoveredRepositoryList;
  error: string;
}

const EMPTY_LIST: DiscoveredRepositoryList = { candidates: [], hiddenCount: 0 };

const messageOf = (error: unknown, fallback: string) =>
  error instanceof Error && error.message ? error.message : fallback;

/** The hosts, what a scan found on the chosen one, and the scan itself. */
export function useRepoDiscovery() {
  const [data, setData] = useState<DiscoveryData>({
    sources: null,
    sourceId: "",
    list: EMPTY_LIST,
    error: "",
  });
  /** The running scan's last status; `null` when none is running. */
  const [scan, setScan] = useState<PrismJobStatus | null>(null);
  const watchRef = useRef<AbortController | null>(null);

  const loadList = useCallback(async (sourceId: string) => {
    try {
      const list = await loadDiscoveredRepositories(sourceId);
      setData((current) => (current.sourceId === sourceId ? { ...current, list, error: "" } : current));
    } catch (error) {
      setData((current) => ({ ...current, error: messageOf(error, "Failed to load repositories") }));
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadDiscoverySources()
      .then((sources) => {
        if (cancelled) return;
        const sourceId = sources[0]?.id ?? "";
        setData((current) => ({ ...current, sources, sourceId }));
        if (sourceId) void loadList(sourceId);
      })
      .catch((error) => {
        if (!cancelled) setData((current) => ({ ...current, sources: [], error: messageOf(error, "Failed to load hosts") }));
      });
    return () => {
      cancelled = true;
      watchRef.current?.abort();
    };
  }, [loadList]);

  const chooseSource = (sourceId: string) => {
    watchRef.current?.abort();
    setScan(null);
    setData((current) => ({ ...current, sourceId, list: EMPTY_LIST, error: "" }));
    void loadList(sourceId);
  };

  const startScan = async () => {
    const { sourceId } = data;
    if (!sourceId || scan) return;
    watchRef.current?.abort();
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
        await loadList(sourceId);
      }
    }
  };

  const dismiss = async (repositoryId: string, dismissed: boolean) => {
    try {
      await setRepositoryDismissed(repositoryId, dismissed);
      setData((current) => ({
        ...current,
        list: {
          ...current.list,
          candidates: current.list.candidates.map((item) =>
            item.id === repositoryId ? { ...item, dismissed } : item,
          ),
        },
      }));
    } catch (error) {
      setData((current) => ({ ...current, error: messageOf(error, "Failed to update the repository") }));
    }
  };

  return {
    ...data,
    scan,
    chooseSource,
    startScan,
    dismiss,
    reload: () => (data.sourceId ? loadList(data.sourceId) : Promise.resolve()),
  };
}
