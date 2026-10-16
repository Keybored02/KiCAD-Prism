import { Plus, X } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { SupplyPartNumber, SupplySoldAs } from "@/types/supply";
import { addPartNumber, markPartNumbers, removePartNumber } from "./supply-api";
import { useConnectorSubmit } from "./use-connector-submit";

/** The numbers a part is sold under besides the catalog's own, each removable, with a way to add one. */
export function PartNumbers({ partId, mpn, numbers, soldAs = [], canEdit, onChanged }: {
  partId: string;
  mpn: string;
  numbers: readonly SupplyPartNumber[];
  /** Longer numbers the maker lists that do not count yet. */
  soldAs?: readonly SupplySoldAs[];
  canEdit: boolean;
  onChanged: () => void;
}) {
  const { busy, error, run } = useConnectorSubmit();
  const [adding, setAdding] = useState(false);
  const [text, setText] = useState("");
  if (numbers.length === 0 && soldAs.length === 0 && !canEdit) return null;
  const add = () => void run(async () => {
    await addPartNumber(partId, text.trim());
    setText("");
    setAdding(false);
    onChanged();
  });
  return (
    <section aria-label="Numbers" className="space-y-1">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Numbers</h3>
      <div className="flex flex-wrap items-center gap-1.5 text-xs">
        <span className="bg-secondary px-2 py-0.5 font-medium">{mpn}</span>
        {numbers.map((item) => (
          <span key={item.match_key} className="flex items-center gap-1 border px-2 py-0.5" title={item.source === "suffix" ? "Added by Prism: a packaging suffix" : undefined}>
            {item.mpn}
            {canEdit ? (
              <button type="button" aria-label={`Remove ${item.mpn}`} disabled={busy} className="text-muted-foreground hover:text-foreground"
                onClick={() => void run(async () => { await removePartNumber(partId, item.match_key); onChanged(); })}>
                <X className="h-3 w-3" />
              </button>
            ) : null}
          </span>
        ))}
        {soldAs.map((item) => (
          <span key={item.key} className="flex items-center gap-1 border border-dashed px-2 py-0.5" title={`${item.connectors.join(", ")} list it. It does not count for this part yet.`}>
            {item.mpn}
            <span className="text-muted-foreground">{item.kind === "grade" ? "grade" : item.kind === "packaging" ? "packaging" : "other"}</span>
            {canEdit ? (
              <button type="button" aria-label={`Count ${item.mpn}`} disabled={busy} className="font-medium text-primary hover:underline"
                onClick={() => void run(async () => { await markPartNumbers(partId, [item.key]); onChanged(); })}>
                Count it
              </button>
            ) : null}
          </span>
        ))}
        {canEdit && !adding ? (
          <Button type="button" size="sm" variant="ghost" className="h-6 px-2 text-xs" onClick={() => setAdding(true)}><Plus className="h-3 w-3" />Add a number</Button>
        ) : null}
      </div>
      {adding ? (
        <form className="flex items-center gap-2" onSubmit={(event) => { event.preventDefault(); if (text.trim()) add(); }}>
          <Input aria-label="Another number" className="h-8 max-w-xs text-xs" value={text} onChange={(event) => setText(event.target.value)} placeholder="LM358DR" autoFocus />
          <Button type="submit" size="sm" disabled={busy || !text.trim()}>Add</Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => { setAdding(false); setText(""); }}>Cancel</Button>
        </form>
      ) : null}
      {error ? <p role="alert" className="text-xs text-destructive">{error}</p> : null}
    </section>
  );
}
