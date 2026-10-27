import { type SupplyConnector } from "@/types/supply";

export type ConnectorTone = "success" | "warning" | "destructive" | "outline";

export interface ConnectorState {
  label: string;
  tone: ConnectorTone;
}

function hasUnsetCredentials(connector: SupplyConnector): boolean {
  return Object.values(connector.credentials).some((isSet) => !isSet);
}

export function lastCallFailed(connector: SupplyConnector): boolean {
  if (!connector.last_error_code || !connector.last_error_at) return false;
  if (!connector.last_ok_at) return true;
  return Date.parse(connector.last_error_at) > Date.parse(connector.last_ok_at);
}

/** Whether the connector is resting after a refusal, a rate limit or a run of errors: it makes no calls until `cooldown_until`. */
export function resting(connector: SupplyConnector, now: number = Date.now()): boolean {
  return Boolean(connector.cooldown_until) && Date.parse(connector.cooldown_until as string) > now;
}

/** A time of day today, "14:20", or with the day when it is not today ("tomorrow 09:10", "Oct 24 09:10"). */
export function clockTime(iso: string, now: number = Date.now()): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const time = date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", hour12: false });
  const days = Math.round((new Date(date).setHours(0, 0, 0, 0) - new Date(now).setHours(0, 0, 0, 0)) / 86_400_000);
  if (days === 0) return time;
  if (days === 1) return `tomorrow ${time}`;
  return `${date.toLocaleDateString(undefined, { month: "short", day: "numeric" })} ${time}`;
}

/** "Calls slowed until tomorrow 09:10", or empty when they are not. */
export function slowedText(connector: SupplyConnector, now: number = Date.now()): string {
  return connector.slow_until && Date.parse(connector.slow_until) > now ? `Calls slowed until ${clockTime(connector.slow_until, now)}` : "";
}

/** The one line that says whether a connector is working, most urgent reason first. */
export function connectorState(connector: SupplyConnector, now: number = Date.now()): ConnectorState {
  if (!connector.provider_available) return { label: "Provider missing", tone: "destructive" };
  if (connector.credentials_status === "locked") return { label: "Credentials locked", tone: "destructive" };
  if (connector.credentials_status === "unknown_key") return { label: "Credential key changed", tone: "destructive" };
  if (connector.paused_reason) return { label: "Paused", tone: "warning" };
  if (!connector.enabled) return { label: "Disabled", tone: "outline" };
  if (hasUnsetCredentials(connector)) return { label: "Needs credentials", tone: "warning" };
  if (connector.csv_fed && !connector.csv_import) return { label: "No file uploaded", tone: "warning" };
  if (resting(connector, now)) return { label: `Resting until ${clockTime(connector.cooldown_until as string, now)}`, tone: "warning" };
  if (lastCallFailed(connector)) return { label: "Last call failed", tone: "destructive" };
  return { label: "Active", tone: "success" };
}

/** Share of today's budget spent, 0 to 100. A zero budget reads as fully spent. */
export function budgetUsedPercent(connector: SupplyConnector): number {
  if (connector.daily_budget <= 0) return 100;
  return Math.min(100, Math.round((connector.usage_today.spent / connector.daily_budget) * 100));
}

/** Readable text for an error code from the server. */
export function errorCodeLabel(code: string): string {
  switch (code) {
    case "auth_failed":
      return "credentials rejected";
    case "rate_limited":
      return "rate limited";
    case "unavailable":
      return "provider unavailable";
    case "blocked":
      return "refused";
    case "egress_denied":
      return "blocked by network policy";
    default:
      return code.replace(/_/g, " ");
  }
}

/** A short local date and time for an ISO timestamp. */
export function formatWhen(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}
