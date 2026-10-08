import { useState } from "react";
import { Cpu, Edit3, Loader2, Plus, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { fetchJson } from "@/lib/api";
import type { CatalogComponent } from "@/types/catalog";

/** A module's connector pin (CONTRACTS_P2 §3.5). */
export interface ModulePin {
  pad: string;
  name: string;
  signal: string;
  powerNet: boolean;
}

/** One connector of a module: `key` names it for ports and links and stays across revisions. */
export interface ModuleUnit {
  key: string;
  name: string;
  description: string;
  pins: ModulePin[];
}

interface UnitDraft {
  /** Stable while editing (React list identity), never sent. */
  id: number;
  key: string;
  name: string;
  description: string;
  pinsText: string;
}

const POWER_WORDS = new Set(["power", "pwr", "p", "yes", "y", "1", "true"]);

/** `pad, name, signal, power` lines (comma or tab separated; signal and power optional) as pins. */
export function parsePins(text: string): { pins: ModulePin[]; errors: string[] } {
  const pins: ModulePin[] = [];
  const errors: string[] = [];
  const seen = new Set<string>();
  text.split(/\r?\n/).forEach((line, index) => {
    if (!line.trim() || line.trim().startsWith("#")) return;
    const [pad = "", name = "", signal = "", power = ""] = line.split(/\t|,/).map((cell) => cell.trim());
    if (!pad) {
      errors.push(`Line ${index + 1}: a pad is required`);
      return;
    }
    if (seen.has(pad)) {
      errors.push(`Line ${index + 1}: pad ${pad} appears twice`);
      return;
    }
    seen.add(pad);
    pins.push({ pad, name, signal, powerNet: POWER_WORDS.has(power.toLowerCase()) });
  });
  return { pins, errors };
}

export function pinsText(pins: readonly ModulePin[]): string {
  return pins.map((pin) => [pin.pad, pin.name, pin.signal, pin.powerNet ? "power" : ""].join(", ").replace(/(, )+$/, "")).join("\n");
}

/** The interface the drafts describe, or the first problem. */
export function draftsInterface(drafts: readonly Omit<UnitDraft, "id">[]): { units: ModuleUnit[] } | { error: string } {
  if (!drafts.length) return { error: "Add at least one connector." };
  const units: ModuleUnit[] = [];
  const keys = new Set<string>();
  for (const draft of drafts) {
    const key = draft.key.trim();
    if (!/^[A-Za-z0-9_.-]{1,40}$/.test(key)) return { error: `Connector key "${key}": use 1–40 letters, digits, _ . or -.` };
    if (keys.has(key)) return { error: `Connector key ${key} appears twice.` };
    keys.add(key);
    const { pins, errors } = parsePins(draft.pinsText);
    if (errors.length) return { error: `${key}: ${errors[0]}` };
    if (!pins.length) return { error: `${key}: list its pins.` };
    units.push({ key, name: draft.name.trim() || key, description: draft.description.trim(), pins });
  }
  return { units };
}

let nextDraftId = 1;

function toDrafts(units: readonly ModuleUnit[]): UnitDraft[] {
  return units.map((unit) => ({ id: nextDraftId++, key: unit.key, name: unit.name, description: unit.description, pinsText: pinsText(unit.pins) }));
}

function emptyDraft(number = 1): UnitDraft {
  return { id: nextDraftId++, key: `J${number}`, name: `J${number}`, description: "", pinsText: "" };
}

function UnitsEditor({ drafts, onChange }: { drafts: UnitDraft[]; onChange: (drafts: UnitDraft[]) => void }) {
  const set = (index: number, patch: Partial<UnitDraft>) => onChange(drafts.map((draft, i) => (i === index ? { ...draft, ...patch } : draft)));
  return (
    <div className="space-y-3">
      {drafts.map((draft, index) => {
        const parsed = parsePins(draft.pinsText);
        return (
          <fieldset key={draft.id} className="space-y-2 rounded-md border p-3">
            <legend className="px-1 text-xs font-medium text-muted-foreground">Connector {index + 1}</legend>
            <div className="grid gap-2 sm:grid-cols-3">
              <div className="grid gap-1"><Label htmlFor={`unit-key-${index}`}>Key</Label>
                <Input id={`unit-key-${index}`} value={draft.key} maxLength={40} onChange={(event) => set(index, { key: event.target.value })} /></div>
              <div className="grid gap-1"><Label htmlFor={`unit-name-${index}`}>Name</Label>
                <Input id={`unit-name-${index}`} value={draft.name} maxLength={80} onChange={(event) => set(index, { name: event.target.value })} /></div>
              <div className="grid gap-1"><Label htmlFor={`unit-description-${index}`}>Description</Label>
                <Input id={`unit-description-${index}`} value={draft.description} maxLength={500} placeholder="e.g. 15-way Micro-D socket"
                  onChange={(event) => set(index, { description: event.target.value })} /></div>
            </div>
            <div className="grid gap-1">
              <Label htmlFor={`unit-pins-${index}`}>Pins: pad, name, signal, power</Label>
              <Textarea id={`unit-pins-${index}`} rows={6} className="font-mono text-xs" value={draft.pinsText}
                placeholder={"1, VIN, VIN, power\n2, GND, GND, power\n3, TX, UART_TX"}
                onChange={(event) => set(index, { pinsText: event.target.value })} />
              <p className="text-xs text-muted-foreground">
                {parsed.errors.length ? <span className="text-destructive">{parsed.errors[0]}</span>
                  : `${parsed.pins.length} pins · paste rows from a datasheet (comma or tab separated); the signal label is the pin's net in systems.`}
              </p>
            </div>
            {drafts.length > 1 && (
              <Button type="button" size="sm" variant="ghost" onClick={() => onChange(drafts.filter((_, i) => i !== index))}>
                <Trash2 className="h-3.5 w-3.5" /> Remove connector
              </Button>
            )}
          </fieldset>
        );
      })}
      <Button type="button" size="sm" variant="outline"
        onClick={() => onChange([...drafts, emptyDraft(drafts.length + 1)])}>
        <Plus className="h-3.5 w-3.5" /> Add connector
      </Button>
    </div>
  );
}

/** SB2-48: a new catalog module, its identity and its connectors. */
export function CreateModuleDialog({ open, onOpenChange, onCreated }: {
  open: boolean; onOpenChange: (open: boolean) => void; onCreated: (componentId: string) => void;
}) {
  const [fields, setFields] = useState({ ipn: "", name: "", manufacturer: "", datasheetUrl: "", description: "" });
  const [drafts, setDrafts] = useState<UnitDraft[]>(() => [emptyDraft()]);
  const [submitting, setSubmitting] = useState(false);
  const built = draftsInterface(drafts);
  const ready = Boolean(fields.ipn.trim() && fields.manufacturer.trim() && fields.datasheetUrl.trim()) && "units" in built;

  const submit = async () => {
    if (!("units" in built)) return;
    setSubmitting(true);
    try {
      const created = await fetchJson<{ componentId: string }>("/api/catalog/modules", {
        method: "POST", body: JSON.stringify({ ...fields, interface: { units: built.units } }),
      });
      toast.success(`Module ${fields.ipn.trim()} created; attach its STEP model next.`);
      onOpenChange(false);
      onCreated(created.componentId);
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : String(reason));
    } finally {
      setSubmitting(false);
    }
  };

  const field = (key: keyof typeof fields, label: string, placeholder = "") => (
    <div className="grid gap-1"><Label htmlFor={`module-${key}`}>{label}</Label>
      <Input id={`module-${key}`} value={fields[key]} placeholder={placeholder}
        onChange={(event) => setFields((current) => ({ ...current, [key]: event.target.value }))} /></div>
  );

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!submitting) onOpenChange(next); }}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>New module</DialogTitle>
          <DialogDescription>A bought or in-house peripheral with connectors. Systems link to its connectors like a board's; release needs a STEP model.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          {field("ipn", "IPN", "e.g. MOD-IMU-01")}
          {field("name", "Name", "e.g. Inertial measurement unit")}
          {field("manufacturer", "Manufacturer")}
          {field("datasheetUrl", "Datasheet or ICD URL")}
        </div>
        {field("description", "Description")}
        <UnitsEditor drafts={drafts} onChange={setDrafts} />
        {"error" in built && <p className="text-xs text-destructive">{built.error}</p>}
        <DialogFooter>
          <Button variant="outline" disabled={submitting} onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={!ready || submitting} onClick={() => void submit()}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Cpu className="h-4 w-4" />} Create module
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditInterfaceDialog({ component, units, onClose, onSaved }: {
  component: CatalogComponent; units: ModuleUnit[]; onClose: () => void; onSaved: () => void;
}) {
  const [drafts, setDrafts] = useState<UnitDraft[]>(() => (units.length ? toDrafts(units) : [emptyDraft()]));
  const [summary, setSummary] = useState("Interface revised");
  const [submitting, setSubmitting] = useState(false);
  const built = draftsInterface(drafts);

  const submit = async () => {
    if (!("units" in built)) return;
    setSubmitting(true);
    try {
      await fetchJson(`/api/catalog/components/${encodeURIComponent(component.id)}/module-interface`, {
        method: "PUT", body: JSON.stringify({ interface: { units: built.units }, changeSummary: summary.trim() || "Interface revised" }),
      });
      toast.success("A new revision carries the revised interface.");
      onSaved();
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : String(reason));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => { if (!open && !submitting) onClose(); }}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Edit {component.name}'s connectors</DialogTitle>
          <DialogDescription>Saving makes a new revision; its model and metadata carry over. Keep a connector's key so systems keep their links.</DialogDescription>
        </DialogHeader>
        <UnitsEditor drafts={drafts} onChange={setDrafts} />
        <div className="grid gap-1"><Label htmlFor="module-summary">Change summary</Label>
          <Input id="module-summary" value={summary} maxLength={500} onChange={(event) => setSummary(event.target.value)} /></div>
        {"error" in built && <p className="text-xs text-destructive">{built.error}</p>}
        <DialogFooter>
          <Button variant="outline" disabled={submitting} onClick={onClose}>Cancel</Button>
          <Button disabled={!("units" in built) || submitting} onClick={() => void submit()}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Save as new revision
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** A module's connectors on its overview, with the interface editor and the model hint. */
export function ModuleConnectorsPanel({ component, canMutate, hasModel, onAttachModel, onSaved }: {
  component: CatalogComponent; canMutate: boolean; hasModel: boolean; onAttachModel: () => void; onSaved: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const units = (Array.isArray(component.interface?.units) ? component.interface.units : []) as ModuleUnit[];
  return (
    <section className="space-y-3 rounded-md border p-4" aria-label="Connectors">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-sm font-semibold">Connectors</h3>
        <span className="text-xs text-muted-foreground">Systems link to these like a board's connectors; a pin's signal is its net.</span>
        {canMutate && (
          <span className="ml-auto flex gap-2">
            {!hasModel && <Button size="sm" variant="outline" onClick={onAttachModel}><Upload className="h-3.5 w-3.5" /> Attach STEP model</Button>}
            <Button size="sm" variant="outline" onClick={() => setEditing(true)}><Edit3 className="h-3.5 w-3.5" /> Edit connectors</Button>
          </span>
        )}
      </div>
      {!hasModel && <p className="text-xs text-amber-700 dark:text-amber-300">No STEP model yet: a module can't be released without one.</p>}
      {units.map((unit) => (
        <div key={unit.key} className="space-y-1">
          <p className="text-sm"><b>{unit.name}</b> <span className="font-mono text-xs text-muted-foreground">{unit.key}</span>
            {unit.description ? <span className="text-muted-foreground"> · {unit.description}</span> : null}</p>
          <table className="w-full text-xs">
            <thead><tr className="text-left text-muted-foreground"><th className="py-1 pr-3">Pad</th><th className="pr-3">Name</th><th className="pr-3">Signal</th><th>Power</th></tr></thead>
            <tbody>
              {unit.pins.map((pin) => (
                <tr key={pin.pad} className="border-t">
                  <td className="py-1 pr-3 font-mono">{pin.pad}</td><td className="pr-3">{pin.name}</td>
                  <td className="pr-3 font-mono">{pin.signal || <span className="text-muted-foreground">unused</span>}</td>
                  <td>{pin.powerNet ? "Yes" : ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
      {editing && <EditInterfaceDialog component={component} units={units} onClose={() => setEditing(false)}
        onSaved={() => { setEditing(false); onSaved(); }} />}
    </section>
  );
}
