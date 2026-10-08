import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import type { Tone } from "../system-format";

const DOT: Record<Tone, string> = {
  ok: "bg-success", info: "bg-primary", warning: "bg-warning", error: "bg-destructive", muted: "bg-muted-foreground",
};

interface InspectorHeaderProps {
  /** What is selected: Board, Module, Link… */
  kind: string;
  title: string;
  icon?: ReactNode;
  /** A short state with its explanation as a tooltip. */
  status?: { label: string; tone: Tone; detail?: string };
  /** One line under the title (the project, the catalog identity). */
  subtitle?: ReactNode;
  /** Icon buttons, top right. */
  actions?: ReactNode;
}

/** The inspector's head for any selection (PLAN M8, SB2-63): one line each, nothing wraps. */
export function InspectorHeader({ kind, title, icon, status, subtitle, actions }: InspectorHeaderProps) {
  return (
    <header className="space-y-1">
      <div className="flex h-7 items-center gap-2">
        <p className="min-w-0 flex-1 truncate text-xs font-semibold uppercase tracking-wider text-muted-foreground">{kind}</p>
        {actions && <div className="-mr-1.5 flex shrink-0 items-center">{actions}</div>}
      </div>
      <div className="flex min-w-0 items-center gap-2">
        {icon}
        <h2 className="min-w-0 truncate text-lg font-semibold leading-tight" title={title}>{title}</h2>
        {status && (
          <span className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground" title={status.detail}>
            <span className={cn("size-1.5 rounded-full", DOT[status.tone])} aria-hidden />{status.label}
          </span>
        )}
      </div>
      {subtitle && <p className="truncate text-sm text-muted-foreground">{subtitle}</p>}
    </header>
  );
}
