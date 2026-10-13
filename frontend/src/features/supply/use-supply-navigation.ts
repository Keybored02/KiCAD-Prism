import { useCallback } from "react";
import { useSearchParams } from "react-router-dom";

/** Moving between Supply tabs from inside one. The URL holds the place, as everywhere else in Supply. */
export function useSupplyNavigation() {
  const [, setSearchParams] = useSearchParams();

  const go = useCallback((view: string, extra: Record<string, string> = {}) => {
    setSearchParams((current) => {
      const updated = new URLSearchParams(current);
      updated.set("section", "supply");
      updated.set("supplyView", view);
      for (const key of ["part", "partsQ", "partsScope", "partsOnly"]) updated.delete(key);
      for (const [key, value] of Object.entries(extra)) updated.set(key, value);
      return updated;
    });
  }, [setSearchParams]);

  const openPart = useCallback((partId: string) => go("parts", { part: partId }), [go]);
  return { go, openPart };
}
