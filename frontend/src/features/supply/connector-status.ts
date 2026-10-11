import { CSV_PROVIDER, type SupplyConnector } from "@/types/supply";

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

/** The one line that says whether a connector is working, most urgent reason first. */
export function connectorState(connector: SupplyConnector): ConnectorState {
  if (!connector.provider_available) return { label: "Provider missing", tone: "destructive" };
  if (connector.credentials_status === "locked") return { label: "Credentials locked", tone: "destructive" };
  if (connector.credentials_status === "unknown_key") return { label: "Credential key changed", tone: "destructive" };
  if (connector.paused_reason) return { label: "Paused", tone: "warning" };
  if (!connector.enabled) return { label: "Disabled", tone: "outline" };
  if (hasUnsetCredentials(connector)) return { label: "Needs credentials", tone: "warning" };
  if (connector.provider === CSV_PROVIDER && !connector.csv_import) return { label: "No file uploaded", tone: "warning" };
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
