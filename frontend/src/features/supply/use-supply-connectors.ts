import { useCallback, useEffect, useReducer } from "react";

import type { SupplyConnector, SupplyProvider } from "@/types/supply";
import { listSupplyConnectors, listSupplyProviders } from "./supply-api";

interface State {
  status: "loading" | "ready" | "error";
  providers: SupplyProvider[];
  connectors: SupplyConnector[];
  error: string;
}

type Action =
  | { type: "loading" }
  | { type: "loaded"; providers: SupplyProvider[]; connectors: SupplyConnector[] }
  | { type: "failed"; error: string }
  | { type: "applied"; connector: SupplyConnector }
  | { type: "refreshed"; connectors: SupplyConnector[] }
  | { type: "removed"; id: string };

const INITIAL: State = { status: "loading", providers: [], connectors: [], error: "" };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "loading":
      return { ...state, status: "loading", error: "" };
    case "loaded":
      return { status: "ready", providers: action.providers, connectors: action.connectors, error: "" };
    case "failed":
      return { ...state, status: "error", error: action.error };
    case "applied": {
      const exists = state.connectors.some((item) => item.id === action.connector.id);
      const connectors = exists
        ? state.connectors.map((item) => (item.id === action.connector.id ? action.connector : item))
        : [...state.connectors, action.connector];
      return { ...state, connectors };
    }
    case "refreshed":
      return { ...state, connectors: action.connectors };
    case "removed":
      return { ...state, connectors: state.connectors.filter((item) => item.id !== action.id) };
  }
}

/** Providers and connectors for the Connectors tab, with local updates after a change. */
export function useSupplyConnectors() {
  const [state, dispatch] = useReducer(reducer, INITIAL);

  const load = useCallback(async (signal?: AbortSignal) => {
    dispatch({ type: "loading" });
    try {
      const [providers, connectors] = await Promise.all([
        listSupplyProviders(signal),
        listSupplyConnectors(signal),
      ]);
      dispatch({ type: "loaded", providers, connectors });
    } catch (error) {
      if (signal?.aborted) return;
      dispatch({ type: "failed", error: error instanceof Error ? error.message : "Could not load connectors" });
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);

  const apply = useCallback((connector: SupplyConnector) => dispatch({ type: "applied", connector }), []);
  const remove = useCallback((id: string) => dispatch({ type: "removed", id }), []);
  const reload = useCallback(() => void load(), [load]);
  // Fresh numbers without the loading state, for after something that changes them (a test spends a call).
  const refresh = useCallback(async () => {
    try {
      dispatch({ type: "refreshed", connectors: await listSupplyConnectors() });
    } catch {
      // The list on screen is still right; the next load will say if the server is gone.
    }
  }, []);

  return { ...state, apply, remove, reload, refresh };
}
