import { Badge } from "@/components/ui/badge";
import type { SupplyOutlook } from "@/types/supply";

const TONE: Record<SupplyOutlook["band"], "outline" | "warning" | "destructive"> = {
  ended: "destructive",
  under_2_years: "destructive",
  "2_to_5_years": "warning",
  no_signs: "outline",
  unknown: "outline",
};

/** Whether the part is heading for its end, with every signal behind the answer. Rule-based, and it says so. */
export function OutlookSection({ outlook }: { outlook: SupplyOutlook }) {
  return (
    <section aria-label="Outlook" className="space-y-1">
      <div className="flex items-center gap-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Outlook</h3>
        <Badge variant={TONE[outlook.band]}>{outlook.label}</Badge>
        <span className="text-xs text-muted-foreground">rule-based</span>
      </div>
      {outlook.signals.length > 0 ? (
        <ul className="space-y-0.5 text-sm">
          {outlook.signals.map((signal) => (
            <li key={signal.text}>
              {signal.text} <span className="text-xs text-muted-foreground">({signal.source})</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-muted-foreground">
          {outlook.band === "unknown" ? "Nothing has been read for this part yet." : "Nothing found points to an end. That is not a promise of a long life."}
        </p>
      )}
    </section>
  );
}
