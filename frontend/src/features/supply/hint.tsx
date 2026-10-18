import { Info } from "lucide-react";

/** A small info icon whose words show on hover, for what explains a figure but need not take a line of its own. */
export function Hint({ text }: { text: string }) {
  return (
    <span title={text} aria-label={text} role="img" className="inline-flex shrink-0 cursor-help text-muted-foreground hover:text-foreground">
      <Info className="h-3.5 w-3.5" />
    </span>
  );
}
