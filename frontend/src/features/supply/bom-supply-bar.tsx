import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { BomPlanButton } from "./bom-plan-button";
import { rollupSentences } from "./bom-rollup-text";
import { TrackProjectButton } from "./track-project-dialog";
import type { BomSupply } from "./use-bom-supply";

/** Build size, the rollup of what the BOM will cost and whether it can be built, and the actions on it. */
export function BomSupplyBar({ supply }: { supply: BomSupply }) {
  const { lookup, status, lines, buildQuantity } = supply;

  const sentences = lookup ? rollupSentences(lookup.rollup, buildQuantity, lines) : [];

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
        {supply.canWatch && lookup && lookup.rollup.tracked > 0 ? <BomPlanButton supply={supply} /> : null}
        {supply.projectId ? <TrackProjectButton projectId={supply.projectId} onChanged={supply.refresh} /> : null}
      </span>
    </div>
  );
}
