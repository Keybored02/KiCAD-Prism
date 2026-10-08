import type { CatalogComponent } from "@/types/catalog";

/** A module connector's pin, from its symbol (CONTRACTS_P2 §3.5): the name is the signal. */
export interface ModulePin {
  pad: string;
  name: string;
  signal: string;
  powerNet: boolean;
}

/** One unit of a module's symbol: one connector. `key` is KiCad's unit letter. */
export interface ModuleUnit {
  key: string;
  unit: number;
  name: string;
  pins: ModulePin[];
}

interface ModuleInterface {
  units?: ModuleUnit[];
  error?: string;
}

/**
 * SB2-48 (D-P2-39): a module's connectors as its symbol defines them, read-only. They are
 * derived from the symbol on every revision; edit the symbol to change them.
 */
export function ModuleConnectorsPanel({ component }: { component: CatalogComponent }) {
  const derived = (component.interface ?? {}) as ModuleInterface;
  const units = Array.isArray(derived.units) ? derived.units : [];
  const hasModel = component.assets.some((asset) => asset.asset_type === "3dmodel" && /\.(step|stp)$/i.test(asset.name));
  return (
    <section className="space-y-3 rounded-md border p-4" aria-label="Connectors">
      <div className="flex flex-wrap items-baseline gap-2">
        <h3 className="text-sm font-semibold">Connectors</h3>
        <span className="text-xs text-muted-foreground">
          One per unit of the symbol. Systems link to these like a board's connectors; a pin's name is its signal.
        </span>
      </div>
      {derived.error ? <p className="text-xs text-destructive">{derived.error}: attach a multi-unit symbol whose units are the connectors.</p> : null}
      {!hasModel ? <p className="text-xs text-amber-700 dark:text-amber-300">No STEP model yet: a module can't be released without one.</p> : null}
      {units.map((unit) => (
        <div key={unit.key} className="space-y-1">
          <p className="text-sm"><b>{unit.name}</b> <span className="font-mono text-xs text-muted-foreground">unit {unit.key}</span></p>
          <table className="w-full text-xs">
            <thead><tr className="text-left text-muted-foreground"><th className="py-1 pr-3">Pad</th><th className="pr-3">Signal</th><th>Power</th></tr></thead>
            <tbody>
              {unit.pins.map((pin) => (
                <tr key={pin.pad} className="border-t">
                  <td className="py-1 pr-3 font-mono">{pin.pad}</td>
                  <td className="pr-3 font-mono">{pin.signal || <span className="text-muted-foreground">unnamed</span>}</td>
                  <td>{pin.powerNet ? "Yes" : ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </section>
  );
}
