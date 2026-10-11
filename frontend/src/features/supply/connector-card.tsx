import { Check, KeyRound, MoreHorizontal, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { SupplyConnector } from "@/types/supply";
import { budgetUsedPercent, connectorState, errorCodeLabel, formatWhen, lastCallFailed } from "./connector-status";

export type ConnectorAction =
  | "edit"
  | "credentials"
  | "pause"
  | "resume"
  | "enable"
  | "disable"
  | "terms"
  | "delete";

interface ConnectorCardProps {
  connector: SupplyConnector;
  isAdmin: boolean;
  onAction: (action: ConnectorAction, connector: SupplyConnector) => void;
}

export function ConnectorCard({ connector, isAdmin, onAction }: ConnectorCardProps) {
  const state = connectorState(connector);
  const used = budgetUsedPercent(connector);
  const credentialNames = Object.keys(connector.credentials);
  const where = [connector.provider_label, connector.storefront, connector.currency].filter(Boolean).join(" · ");

  return (
    <article className="rounded-lg border bg-card p-4" aria-label={connector.display_name}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-sm font-semibold">{connector.display_name}</h3>
            <Badge variant={state.tone}>{state.label}</Badge>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">{where}</p>
        </div>
        {isAdmin ? <ConnectorMenu connector={connector} onAction={onAction} /> : null}
      </div>

      <div className="mt-3 space-y-1">
        <div className="flex items-baseline justify-between text-xs">
          <span className="font-medium uppercase tracking-wider text-muted-foreground">Calls today</span>
          <span className="tabular-nums">
            {connector.usage_today.spent.toLocaleString()} / {connector.daily_budget.toLocaleString()}
          </span>
        </div>
        <div
          role="progressbar"
          aria-label="Share of today's call budget spent"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={used}
          className="h-1.5 overflow-hidden rounded-full bg-muted"
        >
          <div className={used >= 90 ? "h-full bg-destructive" : "h-full bg-primary"} style={{ width: `${used}%` }} />
        </div>
        <p className="text-[11px] text-muted-foreground">{connector.interactive_reserve_pct}% held for lookups</p>
      </div>

      <dl className="mt-3 grid gap-1.5 text-xs">
        {credentialNames.length > 0 ? (
          <div className="flex flex-wrap items-center gap-1.5">
            <dt className="flex items-center gap-1 text-muted-foreground"><KeyRound className="h-3 w-3" />Credentials</dt>
            {credentialNames.map((name) => (
              <dd key={name} className="inline-flex items-center gap-1 rounded border px-1.5 py-0.5">
                {connector.credentials[name] ? <Check className="h-3 w-3 text-success" /> : <X className="h-3 w-3 text-destructive" />}
                {name}
              </dd>
            ))}
          </div>
        ) : null}
        <div className="flex gap-1.5">
          <dt className="text-muted-foreground">Terms</dt>
          <dd>
            {connector.terms_reviewed_at
              ? `Reviewed by ${connector.terms_reviewed_by} on ${formatWhen(connector.terms_reviewed_at)}`
              : "Not reviewed"}
          </dd>
        </div>
        <div className="flex gap-1.5">
          <dt className="text-muted-foreground">Last call</dt>
          <dd>{lastCallText(connector)}</dd>
        </div>
        {connector.paused_reason ? (
          <div className="flex gap-1.5">
            <dt className="text-muted-foreground">Paused</dt>
            <dd>{connector.paused_reason}</dd>
          </div>
        ) : null}
      </dl>
    </article>
  );
}

function lastCallText(connector: SupplyConnector): string {
  if (lastCallFailed(connector)) {
    return `Failed (${errorCodeLabel(connector.last_error_code)}) ${formatWhen(connector.last_error_at)}`;
  }
  return connector.last_ok_at ? `OK ${formatWhen(connector.last_ok_at)}` : "None yet";
}

function ConnectorMenu({ connector, onAction }: Pick<ConnectorCardProps, "connector" | "onAction">) {
  const paused = connector.paused_reason !== "";
  const takesCredentials = Object.keys(connector.credentials).length > 0;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-xs" aria-label={`Actions for ${connector.display_name}`}>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onAction("edit", connector)}>Edit settings</DropdownMenuItem>
        {takesCredentials ? (
          <DropdownMenuItem onClick={() => onAction("credentials", connector)}>Replace credentials</DropdownMenuItem>
        ) : null}
        {paused ? (
          <DropdownMenuItem onClick={() => onAction("resume", connector)}>Resume</DropdownMenuItem>
        ) : (
          <DropdownMenuItem onClick={() => onAction("pause", connector)}>Pause</DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={() => onAction(connector.enabled ? "disable" : "enable", connector)}>
          {connector.enabled ? "Disable" : "Enable"}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onAction("terms", connector)}>Mark terms as reviewed</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={() => onAction("delete", connector)}>Delete</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
