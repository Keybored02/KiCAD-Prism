import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { searchCatalogParts } from "@/lib/systems-api";
import type { CatalogPartSummary } from "@/lib/systems-api";

export function partText(part: { name?: string | null; mpn?: string | null; manufacturer?: string | null }): string {
  return part.mpn ? [part.mpn, part.manufacturer].filter(Boolean).join(" · ") : part.name ?? "";
}

/**
 * Pick a catalog part: an end's mating block (the connector's known partners first), its contact,
 * or a covering (SB2-110), or any part by search.
 */
export function PartDialog({ title, description, current, suggestions = [], busy, onClose, onPick }: {
  title: string; description?: string; current?: string | null; suggestions?: CatalogPartSummary[]; busy: boolean;
  onClose: () => void; onPick: (part: CatalogPartSummary) => Promise<unknown>;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ query: string; items: CatalogPartSummary[] }>({ query: "", items: [] });
  const text = query.trim();
  useEffect(() => {
    if (text.length < 2) return undefined;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      searchCatalogParts(text, controller.signal)
        .then((items) => setResults({ query: text, items }))
        .catch(() => undefined);
    }, 200);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [text]);
  const found = text.length >= 2 && results.query === text ? results.items : [];
  const pick = async (part: CatalogPartSummary) => {
    await onPick(part);
    onClose();
  };
  const row = (part: CatalogPartSummary) => (
    <li key={part.componentId} className="flex items-center gap-3 px-3 py-2 text-sm">
      <span className="min-w-0 flex-1 truncate">{partText(part)}</span>
      <Button size="sm" variant="outline" disabled={busy || part.componentId === current}
        aria-label={`Use ${part.mpn || part.name}`} onClick={() => void pick(part)}>Use</Button>
    </li>
  );
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className={description ? undefined : "sr-only"}>{description ?? title}</DialogDescription>
        </DialogHeader>
        {suggestions.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Mates with the connector</p>
            <ul className="divide-y border" data-testid="part-suggestions">{suggestions.map(row)}</ul>
          </div>
        )}
        <Input aria-label="Find a catalog part" placeholder="Find a part by MPN or name" value={query}
          onChange={(event) => setQuery(event.target.value)} />
        {found.length > 0 && <ul className="divide-y border">{found.map(row)}</ul>}
        <DialogFooter><Button variant="outline" onClick={onClose}>Cancel</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
