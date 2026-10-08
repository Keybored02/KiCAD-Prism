import { Loader2 } from "lucide-react";

import { SelectionInspector } from "@/components/selection-inspector";
import type { PrismSelection } from "@/types/prism-selection";

import type { PartDetail } from "./part-detail";

function describe(selection: PrismSelection): string {
  if (selection.kind === "net") return `Net ${selection.netName}`;
  if (selection.kind === "terminal") return `Pad ${selection.reference}.${selection.pin}`;
  return `Component ${selection.reference}`;
}

/**
 * The part picked in the 3D view, as the board 3D tab's own inspector shows it
 * (value, footprint, pins), read from the board's design index.
 */
export function PartInspector({ part }: { part: PartDetail }) {
  const { selection, index } = part;
  return (
    <section aria-label="Selected part" className="-mx-5 -mt-5 border-b">
      <p className="px-5 pt-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">On {part.boardName}</p>
      {index?.index ? (
        <SelectionInspector open selection={selection} semanticIndex={index.index} onOpenChange={() => undefined} onClear={part.clear} embedded />
      ) : index?.error ? (
        <p className="px-5 py-4 text-sm text-muted-foreground">{describe(selection)}. Its details are unavailable: {index.error}</p>
      ) : index ? (
        <p className="flex items-center gap-2 px-5 py-4 text-sm text-muted-foreground">
          <Loader2 className="size-3.5 animate-spin" aria-hidden /> Loading {part.boardName}&apos;s design index…
        </p>
      ) : (
        <p className="px-5 py-4 text-sm text-muted-foreground">{describe(selection)}. This board has no design index to read its details from.</p>
      )}
    </section>
  );
}
