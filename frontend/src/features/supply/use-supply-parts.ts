import { useCallback, useEffect, useReducer, useRef } from "react";

import type { PartsScope, SupplyManufacturer, SupplyPartDetail, SupplyPartsPage } from "@/types/supply";
import { getSupplyPart, listSupplyManufacturers, listSupplyParts } from "./supply-api";

interface Loaded<T> {
  status: "loading" | "ready" | "error";
  data: T | null;
  error: string;
}

type Action<T> =
  | { type: "loading" }
  | { type: "loaded"; data: T }
  | { type: "failed"; error: string };

function reducer<T>(state: Loaded<T>, action: Action<T>): Loaded<T> {
  switch (action.type) {
    case "loading":
      // A new key or a retry: whatever was on screen belongs to something else.
      return { status: "loading", data: null, error: "" };
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
 */
function useLoaded<T>(key: string | null, fetcher: (signal: AbortSignal) => Promise<T>, fallback: string) {
  const [state, dispatch] = useReducer(reducer<T>, { status: "loading", data: null, error: "" } as Loaded<T>);

  const load = useCallback(async (quiet: boolean, signal: AbortSignal) => {
    if (!quiet) dispatch({ type: "loading" });
    try {
      const data = await fetcher(signal);
      // The key may have changed while this was in flight; its answer belongs to something else.
      if (!signal.aborted) dispatch({ type: "loaded", data });
    } catch (error) {
      if (signal.aborted) return;
      dispatch({ type: "failed", error: error instanceof Error ? error.message : fallback });
    }
  }, [fetcher, fallback]);

  // The load for the current key. Retry and refresh join it, so a change of key cancels them too.
  const current = useRef<AbortController | null>(null);

  useEffect(() => {
    if (key === null) return undefined;
    const controller = new AbortController();
    current.current = controller;
    void load(false, controller.signal);
    return () => controller.abort();
  }, [key, load]);

  const retry = useCallback(() => {
    if (current.current) void load(false, current.current.signal);
  }, [load]);
  const refresh = useCallback(async () => {
    if (current.current) await load(true, current.current.signal);
  }, [load]);
  return { ...state, retry, refresh };
}

export function useSupplyPartsList(scope: PartsScope, query: string) {
  const fetcher = useCallback((signal: AbortSignal) => listSupplyParts(scope, query, signal), [scope, query]);
  return useLoaded<SupplyPartsPage>(`${scope}|${query}`, fetcher, "Could not load parts");
}

/** The manufacturers Prism knows, for suggestions. A failure just means no suggestions. */
export function useSupplyManufacturers(): SupplyManufacturer[] {
  const fetcher = useCallback(async (signal: AbortSignal) => (await listSupplyManufacturers(signal)).items, []);
  const { data } = useLoaded<SupplyManufacturer[]>("manufacturers", fetcher, "Could not load manufacturers");
  return data ?? [];
}

export function useSupplyPart(partId: string | null) {
  const fetcher = useCallback((signal: AbortSignal) => getSupplyPart(partId ?? "", signal), [partId]);
  return useLoaded<SupplyPartDetail>(partId, fetcher, "Could not load the part");
}
