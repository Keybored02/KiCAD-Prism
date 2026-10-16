import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { SupplyConnector, TrackingPreview } from "@/types/supply";
import { TrackCostBars } from "./track-cost-bars";

export type BuyingFor = "prototypes" | "production";

interface ChooseProps {
  designs: readonly string[];
  followed: ReadonlySet<string>;
  allDesigns: boolean;
  onDesign: (name: string, on: boolean) => void;
  onAllDesigns: (on: boolean) => void;
  regular: readonly SupplyConnector[];
  assembly: readonly SupplyConnector[];
  bought: ReadonlySet<string>;
  onConnector: (id: string, on: boolean) => void;
  buyingFor: BuyingFor;
  onBuyingFor: (next: BuyingFor) => void;
  preview: TrackingPreview | null;
  canRaise: boolean;
}

function Row({ id, label, checked, disabled, onChange, note }: { id: string; label: string; checked: boolean; disabled?: boolean; onChange: (on: boolean) => void; note?: string }) {
  return (
    <div className="flex items-center gap-3 p-3 hover:bg-muted/30">
      <Checkbox id={id} checked={checked} disabled={disabled} onCheckedChange={(on) => onChange(on === true)} />
      <Label htmlFor={id} className="flex-1 font-medium">{label}</Label>
      {note ? <span className="bg-secondary px-2 py-0.5 text-xs text-muted-foreground">{note}</span> : null}
    </div>
  );
}

const BUYING: ReadonlyArray<{ id: BuyingFor; label: string; hint: string }> = [
  { id: "prototypes", label: "Prototypes", hint: "Follows the packaging with the smallest order, usually cut tape" },
  { id: "production", label: "Production", hint: "Follows reels where there are any" },
];

/** The choices that start tracking a project, each preselected to the usual answer, and what they cost. */
export function TrackChooseStep(props: ChooseProps) {
  const { designs, followed, allDesigns, regular, assembly, bought, buyingFor, preview } = props;
  return (
    <div className="space-y-4">
      {designs.length > 1 ? (
        <section aria-label="Designs" className="space-y-1">
          <h3 className="text-xs font-medium text-muted-foreground">Designs</h3>
          <div className="divide-y border">
            {designs.map((name) => (
              <Row key={name || "base"} id={`var-${name || "base"}`} label={name || "Base design"} checked={allDesigns || followed.has(name)} disabled={allDesigns} onChange={(on) => props.onDesign(name, on)} />
            ))}
            <Row id="var-all" label="Also designs added later" checked={allDesigns} onChange={props.onAllDesigns} note="all" />
          </div>
        </section>
      ) : null}

      <section aria-label="Bought from" className="space-y-1">
        <h3 className="text-xs font-medium text-muted-foreground">Bought from</h3>
        <div className="divide-y border">
          {regular.map((item) => <Row key={item.id} id={`con-${item.id}`} label={item.display_name} checked={bought.has(item.id)} onChange={(on) => props.onConnector(item.id, on)} />)}
          {assembly.map((item) => <Row key={item.id} id={`con-${item.id}`} label={`Built at ${item.display_name}`} checked={bought.has(item.id)} onChange={(on) => props.onConnector(item.id, on)} note="assembly" />)}
        </div>
      </section>

      <section aria-label="Buying for" className="space-y-1">
        <h3 className="text-xs font-medium text-muted-foreground">Buying for</h3>
        <div className="grid grid-cols-2 gap-2">
          {BUYING.map((option) => (
            <button
              key={option.id} type="button" aria-pressed={buyingFor === option.id} title={option.hint} onClick={() => props.onBuyingFor(option.id)}
              className={cn("border px-3 py-2 text-left text-sm font-medium hover:bg-muted/30", buyingFor === option.id && "border-primary bg-primary/5")}
            >
              {option.label}
            </button>
          ))}
        </div>
      </section>

      {preview ? (
        <section aria-label="Cost" className="space-y-1">
          <h3 className="text-xs font-medium text-muted-foreground">Call budget</h3>
          <TrackCostBars connectors={preview.connectors} canRaise={props.canRaise} />
          {preview.fits_nowhere ? <p className="text-sm text-destructive">Nothing fits at any distributor.</p> : null}
        </section>
      ) : null}
    </div>
  );
}
