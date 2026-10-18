import { Badge } from "@/components/ui/badge";
import type { SupplyOutlook } from "@/types/supply";
import { Hint } from "./hint";

const TONE: Record<SupplyOutlook["band"], "outline" | "warning" | "destructive" | "success"> = {
  ended: "destructive",
  under_2_years: "destructive",
  "2_to_5_years": "warning",
  no_signs: "success",
  unknown: "outline",
};

/** Whether the part is heading for its end, with every signal behind the answer. Rule-based, and it says so. */
export function OutlookSection({ outlook }: { outlook: SupplyOutlook }) {
  return (
    <section aria-label="Outlook" className="space-y-1">
      <div className="flex items-center gap-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Outlook</h3>
        <Badge variant={TONE[outlook.band]}>{outlook.label}</Badge>
        <Hint text={outlook.band === "no_signs" ? "Rule-based. Nothing found points to an end. That is not a promise of a long life." : "Rule-based, from the signals listed here."} />
      </div>
      {outlook.signals.length > 0 ? (
        <ul className="space-y-0.5 text-sm">
          {outlook.signals.map((signal) => (
            <li key={signal.text}>
              {signal.text} <span className="text-xs text-muted-foreground">({signal.source})</span>
            </li>
          ))}
        </ul>
      ) : outlook.band === "unknown" ? (
        <p className="text-xs text-muted-foreground">Nothing has been read for this part yet.</p>
      ) : null}
    </section>
  );
}
