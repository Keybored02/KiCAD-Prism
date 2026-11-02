import { useCallback, useEffect, useRef, useState } from "react";

import {
  entryState,
  FINDER,
  readEntry,
  readTop,
  writeTop,
  type PanelPlace,
} from "@/panel/lib/panel-history";

type Position = {
  /** Null while signed out: the login screen is a state, not a place to go back to. */
  place: PanelPlace | null;
  idx: number;
  top: number;
};

function initialPosition(): Position {
  const saved = readEntry(window.history.state);
  if (!saved) {
    // A fresh page load: nothing behind it, so nothing ahead is left over either.
    writeTop(0);
    return { place: null, idx: 0, top: 0 };
  }
  return { place: null, idx: saved.idx, top: Math.max(readTop(), saved.idx) };
}

/**
 * The panel's place, kept in the webview's history.
 *
 * ``onArrive`` runs whenever a place is shown, however it was reached, so the screens' own state
 * (a category's list) can follow it.
 */
export function usePanelNavigation(onArrive: (place: PanelPlace) => void) {
  const [position, setPosition] = useState(initialPosition);
  const current = useRef(position);

  const commit = useCallback((next: Position) => {
    current.current = next;
    writeTop(next.top);
    setPosition(next);
  }, []);

  useEffect(() => {
    const onPop = (event: PopStateEvent) => {
      const entry = readEntry(event.state);
      if (!entry || !current.current.place) return;
      commit({ place: entry.place, idx: entry.idx, top: Math.max(current.current.top, entry.idx) });
      onArrive(entry.place);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [commit, onArrive]);

  const push = useCallback(
    (place: PanelPlace) => {
      const idx = current.current.idx + 1;
      window.history.pushState(entryState({ place, idx }), "");
      commit({ place, idx, top: idx });
      onArrive(place);
    },
    [commit, onArrive],
  );

  /**
   * Signed in: show the place this entry recorded, or the finder, or ``opened`` on top of the finder.
   * Once there is a place, only ``opened`` moves it.
   */
  const enter = useCallback(
    (opened: string | null) => {
      const now = current.current;
      if (now.place && !opened) return;
      if (opened) {
        const place: PanelPlace = { kind: "detail", componentId: opened };
        window.history.replaceState(entryState({ place: FINDER, idx: 0 }), "");
        window.history.pushState(entryState({ place, idx: 1 }), "");
        commit({ place, idx: 1, top: 1 });
        onArrive(place);
        return;
      }
      const saved = readEntry(window.history.state);
      const place = saved?.place ?? FINDER;
      const idx = saved?.idx ?? 0;
      window.history.replaceState(entryState({ place, idx }), "");
      commit({ place, idx, top: Math.max(now.top, idx) });
      onArrive(place);
    },
    [commit, onArrive],
  );

  const showLogin = useCallback(() => commit({ ...current.current, place: null }), [commit]);

  /** Call before leaving the panel for a page of its own, so Forward comes back to it from the panel's entry. */
  const leaveForward = useCallback(() => {
    commit({ ...current.current, top: current.current.idx + 1 });
  }, [commit]);

  return {
    place: position.place,
    canGoBack: position.place !== null && position.idx > 0,
    canGoForward: position.place !== null && position.idx < position.top,
    push,
    enter,
    showLogin,
    leaveForward,
    back: useCallback(() => window.history.back(), []),
    forward: useCallback(() => window.history.forward(), []),
  };
}
