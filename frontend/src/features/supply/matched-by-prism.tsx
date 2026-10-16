import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import type { SupplyMatched } from "@/types/supply";
import { CollapsibleSection } from "./collapsible-section";
import { undoLearnedAlias } from "./supply-api";
import { useConnectorSubmit } from "./use-connector-submit";

function LearnedRow({ alias, canDecide, onDecided }: { alias: SupplyMatched["aliases"][number]; canDecide: boolean; onDecided: () => Promise<void> }) {
  const { busy, error, run } = useConnectorSubmit();
  return (
    <li className="flex flex-wrap items-center gap-3 px-3 py-2">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{alias.alias_text} <span className="text-muted-foreground">is {alias.manufacturer}</span></p>
        <p className="text-xs text-muted-foreground">Learned from {alias.parts} {alias.parts === 1 ? "part" : "parts"}</p>
      </div>
      {canDecide ? (
        <Button size="sm" variant="ghost" disabled={busy} onClick={() => void run(async () => { await undoLearnedAlias(alias.alias_key); await onDecided(); })}>
          Undo
        </Button>
      ) : null}
      {error ? <p role="alert" className="basis-full text-xs text-destructive">{error}</p> : null}
    </li>
  );
}

/** What Prism settled by itself: the spellings it learned (undoable) and the parts whose maker the distributors settled. */
export function MatchedByPrism({ matched, canDecide, onDecided }: { matched: SupplyMatched | undefined; canDecide: boolean; onDecided: () => Promise<void> }) {
  if (!matched || (matched.aliases.length === 0 && matched.parts.length === 0)) return null;
  return (
    <CollapsibleSection id="review-matched" title="Matched by Prism" count={matched.aliases.length + matched.parts.length} startOpen={false}>
      <ul className="divide-y">
        {matched.aliases.map((alias) => <LearnedRow key={alias.alias_key} alias={alias} canDecide={canDecide} onDecided={onDecided} />)}
        {matched.parts.map((part) => (
          <li key={`${part.part_id}:${part.at}`} className="flex items-center gap-3 px-3 py-2 text-sm">
            <Link to={`/?section=supply&supplyView=parts&part=${encodeURIComponent(part.part_id)}`} className="font-medium text-primary hover:underline">{part.mpn}</Link>
            <span className="text-muted-foreground">made by {part.manufacturer}, from what distributors list</span>
          </li>
        ))}
      </ul>
    </CollapsibleSection>
  );
}
