import { Checkbox } from "@/components/ui/checkbox";
import { InspectorSection } from "./workspace/inspector-section";
import type { OptionalRule, SystemDocument } from "@/types/system";

const OPTIONAL_CHECKS: { rule: OptionalRule; label: string; hint: string }[] = [
  {
    rule: "SYS-V09",
    label: "Net names across links",
    hint: "Warn when the two nets a link row joins have no related name (SYS-V09). Useful once boards share a naming scheme.",
  },
];

export function ChecksSection({ document, canEdit, busy, onToggle }: {
  document: SystemDocument; canEdit: boolean; busy: boolean;
  onToggle: (rule: OptionalRule, enabled: boolean) => void;
}) {
  const enabled = new Set(document.system.optionalRules ?? []);
  return (
    <InspectorSection title="Optional checks">
      <ul className="text-sm">
        {OPTIONAL_CHECKS.map((check) => (
          <li key={check.rule} className="flex h-8 items-center gap-2" title={check.hint}>
            <Checkbox id={`check-${check.rule}`} checked={enabled.has(check.rule)}
              disabled={!canEdit || busy} onCheckedChange={(value) => onToggle(check.rule, value === true)} />
            <label htmlFor={`check-${check.rule}`} className="min-w-0 flex-1 truncate">{check.label}</label>
            <span className="shrink-0 font-mono text-xs text-muted-foreground">{check.rule}</span>
          </li>
        ))}
      </ul>
    </InspectorSection>
  );
}
