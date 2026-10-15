import type { SupplyRecentChange } from "@/types/supply";
import { alertTitle } from "./alert-text";
import { StatusDot } from "./status-dot";
import { formatAgo } from "./supply-format";

function sentence(change: SupplyRecentChange): string {
  const detail = change.detail ?? {};
  if (change.type === "listing_gone") {
    const packaging = typeof detail.packaging === "string" && detail.packaging !== "unknown" ? `, ${detail.packaging.replace(/_/g, " ")}` : "";
    return `A distributor stopped listing it${change.sku ? ` (${change.sku}${packaging})` : ""}`;
  }
  if (change.type === "lifecycle_changed") return `Lifecycle changed from ${String(detail.from).replace(/_/g, " ")} to ${String(detail.to).replace(/_/g, " ")}${change.sku ? ` (${change.sku})` : ""}`;
  if (change.type === "normally_stocking_lost") return `A distributor no longer stocks it normally${change.sku ? ` (${change.sku})` : ""}`;
  if (change.type === "family_member_new") return `A new number turned up beside it: ${String(detail.mpn)}${detail.manufacturer ? ` (${String(detail.manufacturer)})` : ""}`;
  if (change.type === "param_changed") return `${String(detail.provider)} changed ${String(detail.name)} from ${String(detail.from)} to ${String(detail.to)} with no notice`;
  if (change.type === "moq_jump") return `Smallest order went from ${String(detail.from)} to ${String(detail.to)}${change.sku ? ` (${change.sku})` : ""}`;
  if (!change.alert) return "";
  return change.type === "alert_cleared" ? `Cleared: ${alertTitle(change.alert)}` : alertTitle(change.alert);
}

/** Alerts that opened or cleared and listings that went in the last two weeks, newest first. */
export function RecentChanges({ changes, onOpenPart }: { changes: SupplyRecentChange[]; onOpenPart: (partId: string) => void }) {
  if (changes.length === 0) return null;
  return (
    <section aria-label="Recent changes" className="space-y-2">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Recent changes</h3>
      <ul className="rounded-lg border">
        {changes.map((change) => (
          <li key={`${change.type}-${change.part_id}-${change.at}`} className="flex items-center gap-3 border-b px-3 py-2 last:border-0">
            <StatusDot status={change.type === "alert_cleared" ? "ok" : (change.alert?.severity ?? "warning")} />
            <div className="min-w-0 flex-1">
              <button type="button" className="text-left text-sm font-medium hover:underline" onClick={() => onOpenPart(change.part_id)}>
                {change.mpn}
              </button>
              <span className="ml-2 text-xs text-muted-foreground">{change.manufacturer}</span>
              <p className="truncate text-xs text-muted-foreground">{sentence(change)}</p>
            </div>
            <span className="shrink-0 text-xs text-muted-foreground">{formatAgo(change.at)}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
