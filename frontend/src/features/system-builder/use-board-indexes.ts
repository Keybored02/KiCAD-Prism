import { useEffect, useRef, useState } from "react";

import { getSemanticIndex } from "@/lib/systems-api";
import type { PrismSemanticIndex } from "@/types/prism-selection";
import type { SystemScene } from "@/types/system";

export interface BoardIndexState {
  index: PrismSemanticIndex | null;
  loading: boolean;
  error: string | null;
}

const indexKey = (projectId: string, commit: string) => `${projectId}@${commit}`;

/** Retry a failed read after these delays, then leave the error showing (retro D7). */
const RETRY_DELAYS_MS = [5_000, 15_000, 45_000];

/**
 * SB2-31e.2: every drawn board's semantic index (the one its own visualizer
 * loads), for the System 3D tab's inspector and search. One read per project
 * and commit, kept across scene re-reads; restricted boards have no asset and
 * are never read. A failed read retries a few times with backoff. Keyed by asset id.
 */
export function useBoardIndexes(scene: SystemScene | null): ReadonlyMap<string, BoardIndexState> {
  const [byKey, setByKey] = useState<ReadonlyMap<string, BoardIndexState>>(new Map());
  const wanted = [...new Set((scene?.assets ?? []).map((asset) => indexKey(asset.projectId, asset.commit)))].sort().join("|");

  // Keys already asked for: a re-read of the scene does not read an index again.
  const requested = useRef(new Set<string>());
  // Failed reads so far per key; keys waiting to retry (with their attempt); a tick that re-runs the read.
  const failures = useRef(new Map<string, number>());
  const [waiting, setWaiting] = useState<ReadonlyMap<string, number>>(new Map());
  const [retry, setRetry] = useState(0);
  // Reads outlive scene re-reads (a key never needs reading twice); only leaving the tab cancels them.
  const controllerRef = useRef<AbortController | null>(null);
  useEffect(() => {
    const asked = requested.current;
    return () => {
      controllerRef.current?.abort();
      controllerRef.current = null;
      asked.clear();
    };
  }, []);
  // Retry the waiting keys together after the shortest of their backoffs.
  useEffect(() => {
    if (!waiting.size) return;
    const delay = Math.min(...[...waiting.values()].map((attempt) => RETRY_DELAYS_MS[attempt - 1]));
    const timer = setTimeout(() => {
      for (const key of waiting.keys()) requested.current.delete(key);
      setWaiting(new Map());
      setRetry((count) => count + 1);
    }, delay);
    return () => clearTimeout(timer);
  }, [waiting]);
  useEffect(() => {
    controllerRef.current ??= new AbortController();
    const controller = controllerRef.current;
    const fresh = wanted.split("|").filter((key) => key && !requested.current.has(key));
    if (!fresh.length) return;
    setByKey((current) => {
      const next = new Map(current);
      for (const key of fresh) next.set(key, { index: null, loading: true, error: null });
      return next;
    });
    for (const key of fresh) {
      requested.current.add(key);
      const [projectId, commit] = key.split("@");
      getSemanticIndex(projectId, commit, controller.signal)
        .then((index) => setByKey((latest) => new Map(latest).set(key, { index, loading: false, error: null })))
        .catch((cause: unknown) => {
          if (controller.signal.aborted) return;
          const error = cause instanceof Error ? cause.message : "The board's design index is unavailable";
          setByKey((latest) => new Map(latest).set(key, { index: null, loading: false, error }));
          const attempts = (failures.current.get(key) ?? 0) + 1;
          failures.current.set(key, attempts);
          if (attempts <= RETRY_DELAYS_MS.length) setWaiting((latest) => new Map(latest).set(key, attempts));
        });
    }
  }, [wanted, retry]);

  const byAsset = new Map<string, BoardIndexState>();
  for (const asset of scene?.assets ?? []) {
    const state = byKey.get(indexKey(asset.projectId, asset.commit));
    if (state) byAsset.set(asset.assetId, state);
  }
  return byAsset;
}
