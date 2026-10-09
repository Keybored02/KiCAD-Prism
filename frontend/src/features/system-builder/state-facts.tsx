import { cn } from "@/lib/utils";

type Tone = "error" | "warning" | "muted";

function Fact({ count, word, tone }: { count: number; word: string; tone: Tone }) {
  return (
    <span className={cn("tabular-nums", count > 0 && tone === "error" && "text-destructive",
      count > 0 && tone === "warning" && "text-warning", (count === 0 || tone === "muted") && "text-muted-foreground")}>
      {count} {word}{count === 1 ? "" : "s"}
    </span>
  );
}

/** SB2-116: what a snapshot or a publish carries, on one line: open errors and warnings, unreviewed changes, exports. */
export function StateFacts({ errors, warnings, reviews, exports }: {
  errors: number; warnings: number; reviews: number; exports?: number;
}) {
  return (
    <p className="flex flex-wrap gap-x-3 gap-y-1 text-xs" aria-label="State">
      <Fact count={errors} word="error" tone="error" />
      <Fact count={warnings} word="warning" tone="warning" />
      <Fact count={reviews} word="unreviewed change" tone="warning" />
      {exports !== undefined && <Fact count={exports} word="export" tone="muted" />}
    </p>
  );
}
