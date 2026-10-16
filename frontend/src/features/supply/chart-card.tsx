import { BarChart3, Info, Table2 } from "lucide-react";
import { useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

interface ChartCardProps {
  title: string;
  /** The answer in a line: "4 parts run out within 2 weeks". */
  answer?: ReactNode;
  /** A caveat that sits behind an info icon. */
  info?: string;
  /** The same figures as a table; with it, the card can swap between chart and table. */
  table?: ReactNode;
  className?: string;
  children: ReactNode;
}

/** A square card: title, the answer, the chart, and an icon that swaps the chart for its numbers. */
export function ChartCard({ title, answer, info, table, className, children }: ChartCardProps) {
  const [asTable, setAsTable] = useState(false);
  return (
    <section aria-label={title} className={cn("flex min-w-0 flex-col gap-2 border p-3", className)}>
      <header className="flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
          {info ? <span title={info} aria-label={info} role="img"><Info className="h-3.5 w-3.5" /></span> : null}
        </h3>
        {table ? (
          <button
            type="button"
            aria-label={asTable ? `Show ${title} as a chart` : `Show ${title} as a table`}
            aria-pressed={asTable}
            className="text-muted-foreground hover:text-foreground"
            onClick={() => setAsTable((current) => !current)}
          >
            {asTable ? <BarChart3 className="h-4 w-4" /> : <Table2 className="h-4 w-4" />}
          </button>
        ) : null}
      </header>
      {answer ? <p className="text-sm font-medium">{answer}</p> : null}
      <div className="min-w-0">{asTable && table ? table : children}</div>
    </section>
  );
}

/** Rows of a label and a number, for the table behind a chart. */
export function FigureTable({ rows, head = ["", "Parts"] }: { rows: Array<[string, string | number]>; head?: [string, string] }) {
  return (
    <table className="w-full text-sm">
      <thead className="text-left text-xs text-muted-foreground">
        <tr><th className="py-1 font-normal">{head[0]}</th><th className="py-1 text-right font-normal">{head[1]}</th></tr>
      </thead>
      <tbody>
        {rows.map(([label, value]) => (
          <tr key={label} className="border-t"><td className="py-1">{label}</td><td className="py-1 text-right tabular-nums">{typeof value === "number" ? value.toLocaleString() : value}</td></tr>
        ))}
      </tbody>
    </table>
  );
}
