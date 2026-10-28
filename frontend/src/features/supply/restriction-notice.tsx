import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import type { RestrictionLevel } from "@/types/supply";
import { getComponentsStatus } from "./catalog-supply-api";
import { clearRestriction } from "./ending-api";

/** "Not for new designs" on a component's Supply tab, with Clear for QA and administrators. Nothing for an unmarked component. */
export function RestrictionNotice({ componentId, manufacturer, mpn, canDecide }: { componentId: string; manufacturer: string; mpn: string; canDecide: boolean }) {
  const [level, setLevel] = useState<RestrictionLevel | null>(null);
  const load = useCallback(async (signal?: AbortSignal) => {
    try {
      const status = await getComponentsStatus([{ id: componentId, manufacturer, mpn }], signal);
      setLevel(status[componentId]?.restriction ?? null);
    } catch {
      // The mark is a note on the tab; the rest of the tab does not depend on it.
    }
  }, [componentId, manufacturer, mpn]);
  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);

  if (level !== "not_for_new_designs") return null;
  const clear = () => {
    clearRestriction(componentId).then(() => { setLevel(null); toast.success("Mark cleared"); }, (caught: Error) => toast.error(caught.message));
  };
  return (
    <div className="flex items-center justify-between gap-3 border border-warning/40 bg-warning/10 px-3 py-2 text-sm" role="status">
      <span className="font-medium text-warning">Not for new designs</span>
      {canDecide ? <Button size="sm" variant="ghost" onClick={clear}>Clear mark</Button> : null}
    </div>
  );
}
