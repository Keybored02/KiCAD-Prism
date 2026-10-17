import { useCallback, useState } from "react";

/** The lines switched off in a chart legend. */
export function useHidden() {
  const [hidden, setHidden] = useState<ReadonlySet<string>>(new Set());
  const toggle = useCallback((key: string) => setHidden((current) => {
    const next = new Set(current);
    if (next.has(key)) next.delete(key); else next.add(key);
    return next;
  }), []);
  return { hidden, toggle };
}
