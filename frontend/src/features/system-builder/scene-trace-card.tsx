import { useState } from "react";
import { ArrowRight, Loader2, Spline } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { PrismSystemSceneEmphasisResult } from "@/types/prism-semantic-viewer";
import type { SystemNetHop } from "@/types/system";

import { hopEndLabel, hopVia, netBoards, orderedHops, unlitSummary } from "./scene-net-model";
import type { TracedNet } from "./use-traced-net";

/** Hops listed before "Show all": a ground can cross hundreds of connector pins. */
const HOPS_SHOWN = 50;

/** A hop is one link row or harness wire: its carrier and its two pin ends. */
function hopKey(hop: SystemNetHop): string {
  const side = (end: SystemNetHop["from"]) => [end.occurrence, end.reference, end.pad, end.end, end.endPin].join(".");
  return [hop.linkId ?? hop.harnessId ?? "", hop.wireId ?? "", ...[side(hop.from), side(hop.to)].sort()].join("|");
}

/** A board net's own name without its sheet path, as the server names aliases. */
function leaf(name: string): string {
  return name.slice(name.lastIndexOf("/") + 1) || name;
}

/**
 * SB2-32 (D-P2-28): the system net of the clicked trace, above the board's own
 * inspector. Its boards (each frames the net there) and its hops in the order
 * the net travels from the clicked board (each frames its two connectors).
 */
export function TraceCard({
  traced,
  result,
  onLight,
  onFrameBoard,
  onFrameHop,
}: {
  traced: TracedNet;
  /** What the view lit for the trace. */
  result?: PrismSystemSceneEmphasisResult;
  onLight: (groupId: string) => void;
  onFrameBoard: (occurrence: string) => void;
  onFrameHop: (hop: SystemNetHop) => void;
}) {
  const [allHops, setAllHops] = useState(false);
  if (traced.loading) {
    return (
      <p className="flex items-center gap-2 border-b px-3 py-2 text-xs text-muted-foreground">
        <Loader2 className="size-3.5 animate-spin" aria-hidden /> Tracing {traced.boardNet} across the system…
      </p>
    );
  }
  if (traced.error) {
    return <p className="border-b px-3 py-2 text-xs text-destructive" role="alert">{traced.error}</p>;
  }
  const net = traced.net;
  if (!net) {
    return (
      <p className="border-b px-3 py-2 text-xs text-muted-foreground">
        {traced.boardNet} stays on this board: no link carries it to another.
      </p>
    );
  }
  const { boards, restricted } = netBoards(net);
  const hops = orderedHops(net, traced.origin);
  const shown = allHops ? hops : hops.slice(0, HOPS_SHOWN);
  const unlit = traced.waiting ? "" : unlitSummary(net, result);
  // Named by the clicked end; the other names are aliases (D-P2-8).
  const name = leaf(traced.boardNet);
  const aliases = net.aliases.filter((alias) => alias !== name);
  return (
    <section className="max-h-[45%] shrink-0 overflow-y-auto border-b px-3 py-2" aria-label={`System net ${name}`}>
      <div className="flex items-center gap-1.5">
        <Spline className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
        <p className="min-w-0 flex-1 truncate text-sm font-medium" title={name}>{name}</p>
        <Badge variant="outline" className="shrink-0">System net</Badge>
      </div>
      <p className="mt-0.5 text-[11px] text-muted-foreground">
        {net.pinCount} pins on {boards.length} board{boards.length === 1 ? "" : "s"}
        {restricted ? `, ${restricted} restricted` : ""}
        {aliases.length ? ` · also ${aliases.join(", ")}` : ""}
      </p>

      {traced.waiting && (
        <div className="mt-2 rounded-md border border-amber-300/60 bg-amber-50 px-2 py-1.5 text-xs text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
          {name} has over 200 pins: it is lit on this board only.
          <Button size="sm" variant="outline" className="ml-2 h-6 px-2 text-xs" onClick={() => onLight(net.groupId)}>
            Light on all {boards.length} boards
          </Button>
        </div>
      )}
      {unlit && <p className="mt-1 text-[11px] text-muted-foreground">Not lit: {unlit}</p>}

      <p className="mt-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Boards</p>
      <div className="mt-1 flex flex-wrap gap-1">
        {boards.map((board) => (
          <Button
            key={board.occurrence} size="sm" variant={board.occurrence === traced.origin ? "secondary" : "outline"}
            className="h-6 px-2 text-xs" title={`Frame ${name} on ${board.name}`} onClick={() => onFrameBoard(board.occurrence)}
          >
            {board.name}
          </Button>
        ))}
      </div>

      <p className="mt-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        Path{hops.length ? ` · ${hops.length} hop${hops.length === 1 ? "" : "s"}` : ""}
      </p>
      {hops.length === 0 ? (
        <p className="mt-1 text-xs text-muted-foreground">No hops you can see.</p>
      ) : (
        <ol className="mt-1 grid gap-0.5">
          {shown.map((hop) => (
            <li key={hopKey(hop)}>
              <button
                type="button"
                className="w-full rounded px-1.5 py-1 text-left text-xs hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"
                title="Frame this connection"
                onClick={() => onFrameHop(hop)}
              >
                <span className="flex items-center gap-1">
                  <span className="truncate">{hopEndLabel(hop.from)}</span>
                  <ArrowRight className="size-3 shrink-0 text-muted-foreground" aria-hidden />
                  <span className="truncate">{hopEndLabel(hop.to)}</span>
                </span>
                <span className="block truncate text-[11px] text-muted-foreground">{hopVia(hop)}</span>
              </button>
            </li>
          ))}
        </ol>
      )}
      {shown.length < hops.length && (
        <Button size="sm" variant="ghost" className="mt-1 h-6 px-2 text-xs" onClick={() => setAllHops(true)}>
          Show all {hops.length} hops
        </Button>
      )}
    </section>
  );
}
