import { Checkbox } from "@/components/ui/checkbox";
import type { OptionalRule, SystemDocument } from "@/types/system";

const OPTIONAL_CHECKS: { rule: OptionalRule; label: string; hint: string }[] = [
  {
    rule: "SYS-V09",
    label: "Check net names across links",
    hint: "Warn when the two nets a link row joins have no related name (SYS-V09). Useful once boards share a naming scheme.",
  },
];

export function ChecksSection({ document, canEdit, busy, onToggle }: {
  document: SystemDocument; canEdit: boolean; busy: boolean;
  onToggle: (rule: OptionalRule, enabled: boolean) => void;
}) {
  const enabled = new Set(document.system.optionalRules ?? []);
  return (
    <section className="space-y-2">
      <h2 className="text-sm font-semibold">Checks</h2>
      <ul className="divide-y rounded-md border">
        {OPTIONAL_CHECKS.map((check) => (
          <li key={check.rule} className="flex items-start gap-3 px-3 py-2 text-sm">
            <Checkbox id={`check-${check.rule}`} className="mt-0.5" checked={enabled.has(check.rule)}
              disabled={!canEdit || busy} onCheckedChange={(value) => onToggle(check.rule, value === true)} />
            <label htmlFor={`check-${check.rule}`} className="min-w-0 flex-1">
              <span className="font-medium">{check.label}</span>
              <span className="block text-xs text-muted-foreground">{check.hint}</span>
            </label>
          </li>
        ))}
      </ul>
    </section>
  );
}
