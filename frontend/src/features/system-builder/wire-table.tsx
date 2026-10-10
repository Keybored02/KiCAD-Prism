import { useState, type ClipboardEvent } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { SystemHarness } from "@/types/system";

import { endLabel } from "./diagram-model";
import type { DraftWire } from "./harness-editor";
import { isGrid, parseGrid, pasteGrid, setSelected, type WireColumn } from "./wire-table-edits";

function EndPicker({ harness, value, onChange, label }: {
  harness: SystemHarness; value: { end: string; pin: string }; label: string;
  onChange: (value: { end: string; pin: string }) => void;
}) {
  const end = harness.ends.find((candidate) => candidate.id === value.end);
  return (
    <div className="flex gap-1">
      <Select value={value.end} onValueChange={(next) => onChange({ end: next, pin: "" })}>
        <SelectTrigger aria-label={`${label} end`} className="h-8 w-24"><SelectValue placeholder="End" /></SelectTrigger>
        <SelectContent>
          {harness.ends.map((candidate) => <SelectItem key={candidate.id} value={candidate.id}>{endLabel(candidate)}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={value.pin} onValueChange={(pin) => onChange({ ...value, pin })} disabled={!end}>
        <SelectTrigger aria-label={`${label} pin`} className="h-8 w-20"><SelectValue placeholder="Pin" /></SelectTrigger>
        <SelectContent>
          {(end?.pins ?? []).map((pin) => <SelectItem key={pin} value={pin}>{pin}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}

/** A harness's wires as an editable table (SB2-123: paste a spreadsheet block, set gauge/colour on ticked rows). */
export function WireTable({ harness, wires, editable, problems, spliced, edit }: {
  harness: SystemHarness;
  wires: DraftWire[];
  editable: boolean;
  problems: Map<string, string>;
  spliced: Set<string>;
  edit: (update: (rows: DraftWire[]) => DraftWire[]) => void;
}) {
  // SB2-123: rows ticked for a shared gauge/colour, and the values to set on them.
  const [selected, setSelectedKeys] = useState<Set<string>>(new Set());
  const [bulk, setBulk] = useState({ gauge: "", colour: "" });
  /** SB2-123: a pasted spreadsheet block fills down and right from the cell it lands in. */
  const paste = (index: number, column: WireColumn) => (event: ClipboardEvent<HTMLInputElement>) => {
    const text = event.clipboardData.getData("text/plain");
    if (!isGrid(text)) return;
    event.preventDefault();
    const grid = parseGrid(text);
    edit((rows) => pasteGrid(rows, index, column, grid).wires);
    const dropped = Math.max(0, index + grid.length - wires.length);
    if (dropped) toast.warning(`${dropped} pasted ${dropped === 1 ? "row" : "rows"} past the last wire were left out`);
  };
  return (
    <>
        {editable && selected.size > 0 && (
          <div className="flex flex-wrap items-center gap-2 text-sm" aria-label="Selected wires">
            <span className="tabular-nums text-muted-foreground">{selected.size} selected</span>
            <Input aria-label="Gauge for selected" placeholder="AWG" inputMode="numeric" className="h-8 w-20" value={bulk.gauge}
              onChange={(event) => setBulk({ ...bulk, gauge: event.target.value })} />
            <Input aria-label="Colour for selected" placeholder="Colour" className="h-8 w-28" value={bulk.colour}
              onChange={(event) => setBulk({ ...bulk, colour: event.target.value })} />
            <Button size="sm" variant="outline" disabled={!bulk.gauge.trim() && !bulk.colour.trim()}
              onClick={() => edit((rows) => setSelected(rows, selected, bulk))}>Set</Button>
            <Button size="sm" variant="ghost" onClick={() => setSelectedKeys(new Set())}>Clear</Button>
          </div>
        )}
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full min-w-[56rem] text-sm">
            <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
              <tr>{editable && (
                <th className="w-8 px-2 py-2">
                  <Checkbox aria-label="Select all wires" checked={wires.length > 0 && selected.size === wires.length}
                    onCheckedChange={(checked) => setSelectedKeys(checked === true ? new Set(wires.map((wire) => wire.key)) : new Set())} />
                </th>
              )}<th className="px-2 py-2 font-medium">From</th><th className="px-2 py-2 font-medium">To</th>
                <th className="px-2 py-2 font-medium">Signal</th><th className="px-2 py-2 font-medium">AWG</th>
                <th className="px-2 py-2 font-medium">Colour</th><th className="px-2 py-2 font-medium">Nets</th><th className="px-2 py-2" /></tr>
            </thead>
            <tbody>
              {wires.length === 0 && (
                <tr><td colSpan={editable ? 8 : 7} className="px-3 py-4 text-center text-muted-foreground">No wires yet.</td></tr>
              )}
              {wires.map((wire, index) => {
                const saved = harness.wires.find((candidate) => candidate.id === wire.id);
                const problem = problems.get(wire.key);
                const update = (patch: Partial<DraftWire>) => edit((rows) => rows.map((row) => (row.key === wire.key ? { ...row, ...patch } : row)));
                return (
                  <tr key={wire.key} className="border-t align-top" data-testid="wire-row">
                    {editable && (
                      <td className="px-2 py-2.5">
                        <Checkbox aria-label={`Select wire ${index + 1}`} checked={selected.has(wire.key)}
                          onCheckedChange={(checked) => setSelectedKeys((current) => {
                            const next = new Set(current);
                            if (checked === true) next.add(wire.key); else next.delete(wire.key);
                            return next;
                          })} />
                      </td>
                    )}
                    <td className="px-2 py-1.5">
                      {editable ? <EndPicker harness={harness} label={`Wire ${index + 1} from`} value={wire.from} onChange={(from) => update({ from })} />
                        : <span>{endLabel(harness.ends.find((end) => end.id === wire.from.end)!)} · {wire.from.pin}</span>}
                      {spliced.has(`${wire.from.end}#${wire.from.pin}`) && <Badge variant="outline" className="mt-1">splice</Badge>}
                    </td>
                    <td className="px-2 py-1.5">
                      {editable ? <EndPicker harness={harness} label={`Wire ${index + 1} to`} value={wire.to} onChange={(to) => update({ to })} />
                        : <span>{endLabel(harness.ends.find((end) => end.id === wire.to.end)!)} · {wire.to.pin}</span>}
                      {spliced.has(`${wire.to.end}#${wire.to.pin}`) && <Badge variant="outline" className="mt-1">splice</Badge>}
                    </td>
                    <td className="px-2 py-1.5">
                      <Input aria-label={`Wire ${index + 1} signal`} className="h-8" value={wire.signal ?? ""} disabled={!editable}
                        onPaste={paste(index, "signal")} onChange={(event) => update({ signal: event.target.value })} />
                    </td>
                    <td className="px-2 py-1.5">
                      <Input aria-label={`Wire ${index + 1} gauge`} className="h-8 w-16" inputMode="numeric" disabled={!editable}
                        value={wire.gaugeAwg ?? ""} onPaste={paste(index, "gaugeAwg")} onChange={(event) => update({ gaugeAwg: event.target.value ? Number(event.target.value) : null })} />
                    </td>
                    <td className="px-2 py-1.5">
                      <Input aria-label={`Wire ${index + 1} colour`} className="h-8 w-24" disabled={!editable}
                        value={wire.colour ?? ""} onPaste={paste(index, "colour")} onChange={(event) => update({ colour: event.target.value })} />
                    </td>
                    <td className="px-2 py-1.5 font-mono text-[11px] text-muted-foreground">
                      {saved ? `${(saved.netFrom ?? ["restricted"]).join(", ") || "—"} → ${(saved.netTo ?? ["restricted"]).join(", ") || "—"}` : "on save"}
                      {problem && <p className="font-sans text-xs text-destructive">{problem}</p>}
                    </td>
                    <td className="px-2 py-1.5 text-right">
                      {editable && (
                        <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={`Remove wire ${index + 1}`}
                          onClick={() => edit((rows) => rows.filter((row) => row.key !== wire.key))}><X className="h-4 w-4" /></Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
    </>
  );
}
