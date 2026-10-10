import type { ReactNode } from "react";

/** A titled part of the inspector, with a count and an optional action on the right. */
export function InspectorSection({ title, count, action, children, label }: {
  title: string;
  count?: number;
  action?: ReactNode;
  /** The accessible name, when it differs from the title. */
  label?: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-1" aria-label={label ?? title}>
      <div className="flex h-7 items-center gap-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</h3>
        {count !== undefined && <span className="text-xs tabular-nums text-muted-foreground">{count}</span>}
        <span className="flex-1" />
        {action}
      </div>
      {children}
    </section>
  );
}
