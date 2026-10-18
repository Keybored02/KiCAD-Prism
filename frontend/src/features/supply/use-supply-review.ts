import { useCallback, useEffect, useReducer } from "react";

import type { SupplyReviewQueue } from "@/types/supply";
import { readLoaded, storeLoaded } from "./loaded-cache";
import { getSupplyReviewQueue } from "./supply-api";

interface State {
  status: "loading" | "ready" | "error";
  queue: SupplyReviewQueue | null;
  error: string;
}

type Action =
  | { type: "loading" }
  | { type: "loaded"; queue: SupplyReviewQueue }
  | { type: "failed"; error: string };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "loading":
      return { ...state, status: "loading", error: "" };
    case "loaded":
      return { status: "ready", queue: action.queue, error: "" };
    case "failed":
      // A failed refresh keeps the queue on screen; only a first load shows the error alone.
      return { ...state, status: state.queue ? "ready" : "error", error: action.error };
  }
}

/**
 * The review queue. `refresh` reloads without the loading state, so a decision
 * does not blank the list; the server is the source of truth for what remains.
 */
export function useSupplyReview() {
  const [state, dispatch] = useReducer(reducer, undefined, (): State => {
    const cached = readLoaded<SupplyReviewQueue>("review");
    return cached ? { status: "ready", queue: cached, error: "" } : { status: "loading", queue: null, error: "" };
  });

  const load = useCallback(async (quiet: boolean, signal?: AbortSignal) => {
    if (!quiet) dispatch({ type: "loading" });
    try {
      const queue = await getSupplyReviewQueue(signal);
      storeLoaded("review", queue);
      dispatch({ type: "loaded", queue });
    } catch (error) {
      if (signal?.aborted) return;
      dispatch({ type: "failed", error: error instanceof Error ? error.message : "Could not load the review queue" });
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    // Back on the page: show what it showed and reload behind it.
    void load(readLoaded("review") !== undefined, controller.signal);
    return () => controller.abort();
  }, [load]);

  const retry = useCallback(() => void load(false), [load]);
  const refresh = useCallback(() => load(true), [load]);

  return { ...state, retry, refresh };
}
