import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { DiscoveryFilters } from "@/lib/repo-discovery";

const OPTIONS: { key: keyof DiscoveryFilters; label: string }[] = [
  { key: "showImported", label: "Already imported" },
  { key: "showArchived", label: "Archived" },
  { key: "showNoKicad", label: "No KiCad files" },
  { key: "showUnreadable", label: "Unreadable" },
];

interface RepoDiscoveryFiltersProps {
  filters: DiscoveryFilters;
  onChange: (filters: DiscoveryFilters) => void;
}

export function RepoDiscoveryFilters({ filters, onChange }: RepoDiscoveryFiltersProps) {
  return (
    <fieldset className="flex flex-wrap items-center gap-x-4 gap-y-2">
      <legend className="sr-only">Also show</legend>
      <span className="text-xs text-muted-foreground" aria-hidden="true">
        Also show
      </span>
      {OPTIONS.map(({ key, label }) => (
        <div key={key} className="flex items-center gap-2">
          <Checkbox
            id={`discovery-${key}`}
            checked={filters[key]}
            onCheckedChange={(checked) => onChange({ ...filters, [key]: checked === true })}
          />
          <Label htmlFor={`discovery-${key}`} className="text-xs font-normal">
            {label}
          </Label>
        </div>
      ))}
    </fieldset>
  );
}
