import { useCallback, useEffect, useReducer, useRef } from "react";

import { readLoaded, storeLoaded } from "./loaded-cache";

interface Loaded<T> {
  status: "loading" | "ready" | "error";
  data: T | null;
  error: string;
}

type Action<T> =
  | { type: "loading" }
  | { type: "cached"; data: T }
  | { type: "loaded"; data: T }
  | { type: "failed"; error: string };

function reducer<T>(state: Loaded<T>, action: Action<T>): Loaded<T> {
  switch (action.type) {
    case "loading":
      // A new key or a retry: whatever was on screen belongs to something else.
      return { status: "loading", data: null, error: "" };
    case "cached":
    case "loaded":
      return { status: "ready", data: action.data, error: "" };
    case "failed":
      // A failed refresh keeps what is on screen; only a first load shows the error alone.
      return { ...state, status: state.data ? "ready" : "error", error: action.error };
  }
}

/**
 * Loads something keyed by `key`, again whenever the key changes.
 * `refresh` reloads without the loading state so a change does not blank the screen.
 * With `cacheAs` (a name for this kind of data, so keys of different hooks never meet),
 * it starts from what was last shown for the key, even after leaving the page, and reloads behind it.
 */
export function useLoaded<T>(key: string | null, fetcher: (signal: AbortSignal) => Promise<T>, fallback: string, cacheAs?: string) {
  const storeKey = cacheAs && key !== null ? `${cacheAs}:${key}` : null;
  const [state, dispatch] = useReducer(reducer<T>, storeKey, (initial): Loaded<T> => {
    const cached = readLoaded<T>(initial);
    return cached === undefined ? { status: "loading", data: null, error: "" } : { status: "ready", data: cached, error: "" };
  });

  const load = useCallback(async (quiet: boolean, signal: AbortSignal) => {
    if (!quiet) dispatch({ type: "loading" });
    try {
      const data = await fetcher(signal);
      // The key may have changed while this was in flight; its answer belongs to something else.
      if (!signal.aborted) {
        storeLoaded(storeKey, data);
        dispatch({ type: "loaded", data });
      }
    } catch (error) {
      if (signal.aborted) return;
      dispatch({ type: "failed", error: error instanceof Error ? error.message : fallback });
    }
  }, [fetcher, fallback, storeKey]);

  // The load for the current key. Retry and refresh join it, so a change of key cancels them too.
  const current = useRef<AbortController | null>(null);

  useEffect(() => {
    if (key === null) return undefined;
    const controller = new AbortController();
    current.current = controller;
    const cached = readLoaded<T>(storeKey);
    if (cached !== undefined) dispatch({ type: "cached", data: cached });
    void load(cached !== undefined, controller.signal);
    return () => controller.abort();
  }, [key, load, storeKey]);

  const retry = useCallback(() => {
    if (current.current) void load(false, current.current.signal);
  }, [load]);
  const refresh = useCallback(async () => {
    if (current.current) await load(true, current.current.signal);
  }, [load]);
  return { ...state, retry, refresh };
}
