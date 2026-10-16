import { Link } from "react-router-dom";

import { Input } from "@/components/ui/input";
import { CheckOnceButton } from "./check-once-button";
import { rollupSentences } from "./bom-rollup-text";
import { RollupChip } from "./supply-icons";
import { SettleBadge } from "./settle-badge";
import { TrackProjectButton } from "./track-project-dialog";
import type { BomSupply } from "./use-bom-supply";

/** Build size, the rollup of what the BOM will cost and whether it can be built, and the actions on it. */
export function BomSupplyBar({ supply }: { supply: BomSupply }) {
  const { lookup, status, lines, buildQuantity } = supply;

  const sentences = lookup ? rollupSentences(lookup.rollup, buildQuantity, lines) : [];
  // Lines with a manufacturer and a number that nobody reads: a check once would give them figures.
  const unread = lookup
    ? lines.filter((line) => {
      const result = lookup.lines[line.key];
      return Boolean(line.manufacturer && line.mpn && result && (result.state === "unknown" || (result.state === "tracked" && result.stock == null)));
    })
    : [];

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
          value={supply.attritionPercent ?? ""}
          disabled={supply.attritionPercent === null}
          aria-label="Spare parts, percent"
          className="h-7 w-16"
          onChange={(event) => {
            const next = Number(event.target.value);
            if (Number.isFinite(next) && next >= 0 && next <= 100) supply.setAttritionPercent(next);
          }}
        />
        %
      </label>
      <label className="flex items-center gap-1.5 text-muted-foreground" title="Small passives get 2% spares, other parts none">
        <input
          type="checkbox"
          checked={supply.attritionPercent === null}
          aria-label="Spares by package"
          onChange={(event) => supply.setAttritionPercent(event.target.checked ? null : 0)}
        />
        by package
      </label>
      {status === "loading" ? <span className="text-muted-foreground">Reading supply data...</span> : null}
      {status === "error" ? (
        <span className="text-destructive">
          {supply.error}{" "}
          <button type="button" className="underline" onClick={supply.retry}>Retry</button>
        </span>
      ) : null}
      {sentences.map((sentence) => <RollupChip key={sentence.kind} sentence={sentence} />)}
      {supply.truncated ? <span className="text-warning">Only the first 2,000 distinct parts are looked up.</span> : null}
      <span className="ml-auto flex items-center gap-1.5">
        {supply.projectId ? <Link to="?section=supply" className="text-primary hover:underline">Project supply</Link> : null}
        {supply.projectId && unread.length > 0 ? (
          <CheckOnceButton projectId={supply.projectId} lines={unread} onFinished={supply.refresh} />
        ) : null}
        {supply.projectId ? <SettleBadge projectId={supply.projectId} onChanged={supply.refresh} /> : null}
        {supply.projectId ? <TrackProjectButton projectId={supply.projectId} onChanged={supply.refresh} /> : null}
      </span>
    </div>
  );
}
