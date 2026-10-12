import { useState } from "react";
import { Eye } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { unwatchedCount } from "./bom-supply";
import { rollupSentences } from "./bom-rollup-text";
import type { BomSupply } from "./use-bom-supply";

const SKIPPED_WHY: Record<string, string> = {
  no_mpn: "no part number",
  no_manufacturer: "no manufacturer",
  unknown_manufacturer: "a manufacturer Prism does not know (QA or an administrator can add it)",
};

/** Build size, the rollup of what the BOM will cost and whether it can be built, and the actions on it. */
export function BomSupplyBar({ supply }: { supply: BomSupply }) {
  const [busy, setBusy] = useState(false);
  const { lookup, status, lines, buildQuantity } = supply;

  const watchAll = async () => {
    setBusy(true);
    try {
      const result = await supply.watchAll();
      const skipped = result.skipped.length;
      toast.success(
        `Watching ${result.watched + result.already_watched} parts`,
        skipped > 0 ? { description: `${skipped} lines skipped. First: ${SKIPPED_WHY[result.skipped[0].reason]}.` } : undefined,
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not watch the parts");
    } finally {
      setBusy(false);
    }
  };

  const sentences = lookup ? rollupSentences(lookup.rollup, buildQuantity, lines) : [];
  const unwatched = lookup ? unwatchedCount(lines, lookup.lines) : 0;

  return (
    <div className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-1 border-b bg-card/40 px-2 py-1.5 text-xs">
      <label className="flex items-center gap-1.5 text-muted-foreground">
        Build
        <Input
          type="number"
          min={1}
          max={1_000_000}
          value={buildQuantity}
          aria-label="Boards to build"
          className="h-7 w-20"
          onChange={(event) => {
            const next = Math.floor(Number(event.target.value));
            if (Number.isFinite(next) && next >= 1 && next <= 1_000_000) supply.setBuildQuantity(next);
          }}
        />
        boards
      </label>
      <label className="flex items-center gap-1.5 text-muted-foreground" title="Extra parts to order on top of what the boards use">
        Spares
        <Input
          type="number"
          min={0}
          max={100}
          step={1}
          value={supply.attritionPercent}
          aria-label="Spare parts, percent"
          className="h-7 w-16"
          onChange={(event) => {
            const next = Number(event.target.value);
            if (Number.isFinite(next) && next >= 0 && next <= 100) supply.setAttritionPercent(next);
          }}
        />
        %
      </label>
      {status === "loading" ? <span className="text-muted-foreground">Reading supply data...</span> : null}
      {status === "error" ? (
        <span className="text-destructive">
          {supply.error}{" "}
          <button type="button" className="underline" onClick={supply.retry}>Retry</button>
        </span>
      ) : null}
      {sentences.map((sentence) => (
        <span key={sentence.text} className={cn(sentence.tone === "bad" && "text-destructive", sentence.tone === "warn" && "text-warning")}>
          {sentence.text}
        </span>
      ))}
      {supply.truncated ? <span className="text-warning">Only the first 2,000 distinct parts are looked up.</span> : null}
      <span className="ml-auto flex items-center gap-1.5">
        {supply.canWatch && lookup && unwatched > 0 ? (
          <Button type="button" size="sm" variant="outline" className="h-7" disabled={busy} onClick={() => void watchAll()}>
            <Eye className="h-3.5 w-3.5" />Watch all lines
          </Button>
        ) : null}
      </span>
    </div>
  );
}
