import type { ReactNode } from "react";

export interface Fact {
  label: string;
  value: ReactNode;
  /** The full value as a tooltip, when the row truncates it. */
  title?: string;
}

/** Label and value rows, one line each; a long value truncates with its tooltip (PLAN M8, SB2-63). */
export function InspectorFacts({ rows }: { rows: Fact[] }) {
  return (
    <dl className="text-sm">
      {rows.map((row) => (
        <div key={row.label} className="flex h-8 items-center gap-3 border-b last:border-b-0">
          <dt className="w-24 shrink-0 truncate text-muted-foreground">{row.label}</dt>
          <dd className="min-w-0 flex-1 truncate" title={row.title ?? (typeof row.value === "string" ? row.value : undefined)}>{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}
