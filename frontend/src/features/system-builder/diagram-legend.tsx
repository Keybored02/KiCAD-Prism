import type { SystemDocument } from "@/types/system";
import { cn } from "@/lib/utils";

import { BLOCK_STYLE, CONNECTION_STYLE, blockKind, type BlockKind, type ConnectionKind } from "./kind-style";

const BLOCK_ORDER: BlockKind[] = ["board", "module", "subsystem", "harness"];
const CONNECTION_ORDER: ConnectionKind[] = ["b2b", "harness", "link"];

/** The kinds on the canvas and what their colours mean (D-P2-50); only kinds the system has. */
export function DiagramLegend({ document }: { document: SystemDocument }) {
  const blocks = new Set<BlockKind>(document.instances.map(blockKind));
  if (document.harnesses?.length) blocks.add("harness");
  const connections = new Set<ConnectionKind>(document.links.map((link) => (link.type === "b2b" ? "b2b" : "link")));
  if (document.harnesses?.some((harness) => harness.ends.some((end) => end.mates))) connections.add("harness");
  return (
    <div aria-label="Legend"
      className="pointer-events-auto flex items-center gap-3 rounded-md border bg-background/95 px-2.5 py-1.5 text-[11px] text-muted-foreground shadow-sm backdrop-blur">
      {BLOCK_ORDER.filter((kind) => blocks.has(kind)).map((kind) => (
        <span key={kind} className="flex items-center gap-1.5">
          <span className={cn("size-2.5 rounded-sm", BLOCK_STYLE[kind].bar)} aria-hidden />{BLOCK_STYLE[kind].label}
        </span>
      ))}
      {connections.size > 0 && <span className="h-3 w-px bg-border" aria-hidden />}
      {CONNECTION_ORDER.filter((kind) => connections.has(kind)).map((kind) => (
        <span key={kind} className="flex items-center gap-1.5">
          <svg width="18" height="6" aria-hidden><line x1="0" x2="18" y1="3" y2="3" stroke={CONNECTION_STYLE[kind].stroke} strokeWidth={CONNECTION_STYLE[kind].width} /></svg>
          {CONNECTION_STYLE[kind].label}
        </span>
      ))}
    </div>
  );
}
