import { ChevronRight } from "lucide-react";
import { useState, type ReactNode } from "react";

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

const STORAGE = "prism.supply.sections";
/** A section with more items than this starts closed. */
const LONG = 10;

function remembered(id: string): boolean | undefined {
  try {
    const stored = JSON.parse(window.localStorage.getItem(STORAGE) ?? "{}") as Record<string, boolean>;
    return typeof stored[id] === "boolean" ? stored[id] : undefined;
  } catch {
    return undefined;
  }
}

function remember(id: string, open: boolean) {
  try {
    const stored = JSON.parse(window.localStorage.getItem(STORAGE) ?? "{}") as Record<string, boolean>;
    window.localStorage.setItem(STORAGE, JSON.stringify({ ...stored, [id]: open }));
  } catch {
    // Not remembered; the section still opens and closes.
  }
}

interface CollapsibleSectionProps {
  /** Names the section in the viewer's remembered choices. */
  id: string;
  title: string;
  count: number;
  /** A line shown beside the count, such as what picking saves. */
  note?: string;
  /** Small marks after the count (status chips). */
  chips?: ReactNode;
  /** Opens at first whatever the count, until the viewer chooses. */
  startOpen?: boolean;
  /** False: the viewer's earlier choice is neither used nor kept (an open group while searching). */
  remembers?: boolean;
  children: ReactNode;
}

/** A titled section that opens and closes, with its count in a chip. Closed at first when it is long; the choice is remembered. */
export function CollapsibleSection({ id, title, count, note, chips, startOpen, remembers = true, children }: CollapsibleSectionProps) {
  const [open, setOpen] = useState(() => (remembers ? remembered(id) : undefined) ?? startOpen ?? count <= LONG);
  const change = (next: boolean) => { setOpen(next); if (remembers) remember(id, next); };
  return (
    <Collapsible open={open} onOpenChange={change} className="border" aria-label={title} data-slot="section">
      <CollapsibleTrigger className="flex w-full items-center gap-2 bg-muted/30 px-3 py-2 text-left hover:bg-muted/50">
        <ChevronRight className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-90")} />
        <span className="text-sm font-medium">{title}</span>
        <span className="bg-secondary px-2 py-0.5 text-xs tabular-nums text-muted-foreground">{count.toLocaleString()}</span>
        {chips}
        {note ? <span className="ml-auto text-xs text-muted-foreground">{note}</span> : null}
      </CollapsibleTrigger>
      <CollapsibleContent className="border-t">{children}</CollapsibleContent>
    </Collapsible>
  );
}
