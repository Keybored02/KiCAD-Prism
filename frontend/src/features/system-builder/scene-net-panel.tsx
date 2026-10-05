import { useEffect, useState } from "react";
import { Focus, Loader2, Search, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { listSystemNets } from "@/lib/systems-api";
import type { PrismSystemSceneEmphasisResult } from "@/types/prism-semantic-viewer";
import type { SystemNetDetail, SystemNetSummary } from "@/types/system";

import { MAX_HIGHLIGHTED_NETS, netBoards, unlitSummary } from "./scene-net-model";

const SEARCH_DELAY_MS = 200;
const RESULT_LIMIT = 20;

interface NetPanelProps {
  systemId: string;
  highlighted: readonly SystemNetDetail[];
  results: ReadonlyMap<string, PrismSystemSceneEmphasisResult>;
  /** The group being loaded, if any. */
  adding: string | null;
  onAdd: (net: SystemNetSummary) => void;
  onRemove: (groupId: string) => void;
  /** Move the camera to the copper the net lights. */
  onFrame: (groupId: string) => void;
  /** Only the highlighted copper draws (the I key). */
  isolated: boolean;
  onIsolate: (isolated: boolean) => void;
  onClear: () => void;
  onClose: () => void;
}

/**
 * SB2-31: find a system net and light it on every board it reaches, each net in
 * its own colour. Click-to-trace (SB2-32) and the full search (SB2-33) build on this.
 */
export function NetPanel({
  systemId, highlighted, results, adding, onAdd, onRemove, onFrame, isolated, onIsolate, onClear, onClose,
}: NetPanelProps) {
  const [query, setQuery] = useState("");
  const [found, setFound] = useState<SystemNetSummary[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const full = highlighted.length >= MAX_HIGHLIGHTED_NETS;

  useEffect(() => {
    const text = query.trim();
    if (!text) {
      setFound(null);
      setError(null);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(() => {
      setSearching(true);
      listSystemNets(systemId, text).then(
        (list) => {
          if (cancelled) return;
          setFound(list.groups.slice(0, RESULT_LIMIT));
          setError(null);
        },
        (cause) => {
          if (!cancelled) setError(cause instanceof Error ? cause.message : "Could not search the nets");
        },
      ).finally(() => {
        if (!cancelled) setSearching(false);
      });
    }, SEARCH_DELAY_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [systemId, query]);

  const shown = new Set(highlighted.map((net) => net.groupId));

  return (
    <section aria-label="Highlight nets" className="flex max-h-full w-80 flex-col gap-2 rounded-lg border bg-card/95 p-3 text-sm shadow-md backdrop-blur">
      <div className="flex items-center justify-between">
        <h2 className="font-medium">Highlight nets</h2>
        <Button variant="ghost" size="icon-sm" aria-label="Close" onClick={onClose}><X className="size-4" aria-hidden /></Button>
      </div>
      <div className="relative">
        <Search className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <Input
          value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Net name or alias"
          aria-label="Search system nets" className="h-8 pl-7" autoFocus
        />
      </div>
      {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
      {found && (
        <ul aria-label="Matching nets" className="max-h-56 overflow-y-auto rounded-md border">
          {found.length === 0 && <li className="px-2 py-1.5 text-xs text-muted-foreground">No net matches.</li>}
          {found.map((net) => {
            const on = shown.has(net.groupId);
            return (
              <li key={net.groupId} className="flex items-center gap-2 border-b px-2 py-1 last:border-b-0">
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-mono text-xs">{net.name}</span>
                  {net.aliases.length > 1 && (
                    <span className="block truncate text-[11px] text-muted-foreground" title={net.aliases.join(", ")}>
                      also {net.aliases.filter((alias) => alias !== net.name).slice(0, 3).join(", ")}
                      {net.aliases.length > 4 ? "…" : ""}
                    </span>
                  )}
                </span>
                <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">{net.pinCount} pins</span>
                <Button
                  size="sm" variant="outline" className="h-6 px-2 text-xs"
                  disabled={on || full || adding !== null}
                  title={full && !on ? `At most ${MAX_HIGHLIGHTED_NETS} nets at once` : undefined}
                  onClick={() => onAdd(net)}
                >
                  {adding === net.groupId ? <Loader2 className="size-3 animate-spin" aria-label="Loading" /> : on ? "Shown" : "Show"}
                </Button>
              </li>
            );
          })}
        </ul>
      )}
      {searching && !found && <p className="text-xs text-muted-foreground">Searching…</p>}

      {highlighted.length > 0 ? (
        <>
          <ul aria-label="Highlighted nets" className="flex flex-col gap-1.5">
            {highlighted.map((net) => {
              const result = results.get(net.groupId);
              const { boards, restricted } = netBoards(net);
              const unlit = unlitSummary(net, result);
              return (
                <li key={net.groupId} className="flex items-start gap-2">
                  <span
                    className="mt-1 size-3 shrink-0 rounded-sm border border-black/20"
                    style={{ background: result?.color ?? "transparent" }} aria-hidden
                  />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5">
                      <span className="truncate font-mono text-xs">{net.name}</span>
                      {net.large && <Badge variant="outline" className="h-4 px-1 text-[10px]">{net.pinCount} pins</Badge>}
                    </span>
                    <span className="block text-[11px] text-muted-foreground">
                      {boards.join(", ")}{restricted ? ` · ${restricted} on restricted boards` : ""}
                    </span>
                    {unlit && <span className="block text-[11px] text-amber-700 dark:text-amber-300">Not lit: {unlit}</span>}
                  </span>
                  <Button
                    variant="ghost" size="icon-sm" aria-label={`Frame ${net.name}`} title="Frame this net"
                    disabled={!result?.lit} onClick={() => onFrame(net.groupId)}
                  >
                    <Focus className="size-3.5" aria-hidden />
                  </Button>
                  <Button variant="ghost" size="icon-sm" aria-label={`Stop highlighting ${net.name}`} onClick={() => onRemove(net.groupId)}>
                    <X className="size-3.5" aria-hidden />
                  </Button>
                </li>
              );
            })}
          </ul>
          <div className="flex gap-2">
            <Button
              size="sm" variant={isolated ? "secondary" : "outline"} aria-pressed={isolated}
              title="Show only the highlighted copper (I)" onClick={() => onIsolate(!isolated)}
            >
              Isolate
            </Button>
            <Button size="sm" variant="ghost" onClick={onClear}>Clear all</Button>
          </div>
        </>
      ) : (
        !found && <p className="text-xs text-muted-foreground">Search for a net to light it on every board it reaches. The boards hide and other copper dims; I isolates it.</p>
      )}
    </section>
  );
}
