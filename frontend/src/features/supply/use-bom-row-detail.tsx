import { useCallback, useState } from "react";
import { toast } from "sonner";

import type { SemanticComponent } from "@/types/prism-selection";
import type { User } from "@/types/auth";
import { BomRowDrawer } from "./bom-row-drawer";
import { rowLines, type BomLineDetail } from "./bom-supply";
import { PartSheet } from "./part-sheet";
import type { BomSupply } from "./use-bom-supply";

const WHY: Record<string, string> = {
  no_mpn: "it has no part number",
  no_manufacturer: "it names no manufacturer",
  unknown_manufacturer: "Prism does not know that manufacturer (QA or an administrator can add it)",
};

/**
 * The drawer for one BOM row and the part sheet it opens. `open` takes the row's components;
 * `element` goes anywhere in the table's tree.
 */
export function useBomRowDetail(supply: BomSupply, user: User | null) {
  const [row, setRow] = useState<BomLineDetail[] | null>(null);
  const [partId, setPartId] = useState<string | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);

  const open = useCallback((components: readonly SemanticComponent[]) => setRow(rowLines(components, supply.lines)), [supply.lines]);

  const watch = useCallback(async (line: BomLineDetail) => {
    setBusyKey(line.key);
    try {
      const result = await supply.watchLines([line]);
      if (result.skipped.length > 0) toast.error(`Not watched: ${WHY[result.skipped[0].reason]}.`);
      else toast.success(`Watching ${line.mpn}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not watch the part");
    } finally {
      setBusyKey(null);
    }
  }, [supply]);

  const element = (
    <>
      <BomRowDrawer
        lines={partId === null ? row : null}
        results={supply.lookup?.lines ?? null}
        canWatch={supply.canWatch}
        busyKey={busyKey}
        onClose={() => setRow(null)}
        onWatch={(line) => void watch(line)}
        onOpenPart={setPartId}
      />
      <PartSheet partId={partId} user={user} onClose={() => setPartId(null)} onWatchChanged={() => void supply.refresh()} />
    </>
  );
  return { open, element };
}
