import { useState } from "react";
import { CircleAlert, TriangleAlert, Wand2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { generateRows } from "@/lib/systems-api";
import type { GeneratedRow, GeneratorKind, GeneratorResult } from "@/types/system";

import { findingText } from "./findings-ui";

const GENERATOR_LABELS: Record<GeneratorKind, string> = {
  identity: "Same pin (1↔1, 2↔2…)",
  reverse: "Reversed (1↔N, 2↔N−1…)",
  offset: "Offset (n ↔ n + k)",
  net_name: "Matching net names",
};

/** An inclusive pad window, or nothing when both bounds are blank. */
function padRange(from: string, to: string) {
  return from.trim() || to.trim() ? { from: from.trim() || undefined, to: to.trim() || undefined } : undefined;
}

function pairKey(row: GeneratedRow): string {
  return `${row.pinA}\u0000${row.pinB}`;
}

/** SB2-120: the rules a proposed pair would raise, as one icon with the labels in its title. */
function PairFlags({ row }: { row: GeneratedRow }) {
  const flags = row.flags ?? [];
  if (!flags.length) return null;
  const error = flags.some((flag) => flag.severity === "error");
  const Icon = error ? CircleAlert : TriangleAlert;
  const text = flags.map((flag) => `${flag.rule} ${findingText(flag)}`).join("\n");
  return (
    <span role="img" aria-label={text} title={text} className="inline-flex">
      <Icon className={error ? "size-3.5 text-destructive" : "size-3.5 text-warning"} aria-hidden />
    </span>
  );
}

interface GeneratorPanelProps {
  systemId: string;
  linkId: string;
  sideA: string;
  sideB: string;
  onApprove: (rows: GeneratedRow[]) => void;
}

/** Preview a generator's proposals, then approve some or all into the draft (never saved directly). */
export function GeneratorPanel({ systemId, linkId, sideA, sideB, onApprove }: GeneratorPanelProps) {
  const [generator, setGenerator] = useState<GeneratorKind>("identity");
  const [offset, setOffset] = useState("0");
  const [range, setRange] = useState({ aFrom: "", aTo: "", bFrom: "", bTo: "" });
  const [includeUnconnected, setIncludeUnconnected] = useState(false);
  const [result, setResult] = useState<GeneratorResult | null>(null);
  const [rejected, setRejected] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const preview = async () => {
    setLoading(true);
    setError(null);
    try {
      const options: Record<string, unknown> = { includeUnconnected };
      if (generator === "offset") options.offset = Number.parseInt(offset, 10);
      const rangeA = padRange(range.aFrom, range.aTo);
      const rangeB = padRange(range.bFrom, range.bTo);
      if (rangeA) options.rangeA = rangeA;
      if (rangeB) options.rangeB = rangeB;
      const { body } = await generateRows(systemId, linkId, generator, options);
      setResult(body);
      setRejected(new Set());
    } catch (caught) {
      setResult(null);
      setError(caught instanceof Error ? caught.message : "Could not generate rows");
    } finally {
      setLoading(false);
    }
  };

  const approved = result?.rows.filter((row) => !rejected.has(pairKey(row))) ?? [];
  const skippedExisting = result?.skipped.filter((s) => s.reason === "existing").length ?? 0;
  const skippedUnconnected = result?.skipped.filter((s) => s.reason === "unconnected").length ?? 0;
  const suspect = result?.rows.filter((row) => row.flags?.length) ?? [];
  const suspectKept = suspect.filter((row) => !rejected.has(pairKey(row))).length;

  return (
    <section className="grid gap-5 pb-6 pt-4" aria-label="Generate rows">
      <div className="grid gap-2">
        <Label>Pairing</Label>
        <Select value={generator} onValueChange={(value) => { setGenerator(value as GeneratorKind); setResult(null); }}>
          <SelectTrigger aria-label="Generator" className="w-full"><SelectValue /></SelectTrigger>
          <SelectContent>
            {(Object.keys(GENERATOR_LABELS) as GeneratorKind[]).map((kind) => (
              <SelectItem key={kind} value={kind}>{GENERATOR_LABELS[kind]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {generator === "offset" && (
        <div className="grid gap-2">
          <Label htmlFor="generator-offset">Offset</Label>
          <Input id="generator-offset" aria-label="Offset" type="number" className="w-28" value={offset}
            onChange={(event) => setOffset(event.target.value)} />
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {([["a", sideA], ["b", sideB]] as const).map(([end, side]) => (
          <div key={end} className="grid gap-2">
            <Label>{side} pads <span className="font-normal text-muted-foreground">(optional)</span></Label>
            <div className="flex items-center gap-2">
              <Input aria-label={`End ${end.toUpperCase()} from`} placeholder="From" className="font-mono"
                value={range[`${end}From`]} onChange={(event) => setRange({ ...range, [`${end}From`]: event.target.value })} />
              <span className="text-muted-foreground">–</span>
              <Input aria-label={`End ${end.toUpperCase()} to`} placeholder="To" className="font-mono"
                value={range[`${end}To`]} onChange={(event) => setRange({ ...range, [`${end}To`]: event.target.value })} />
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <Checkbox id="include-unconnected" aria-label="Include unconnected pins" checked={includeUnconnected}
          onCheckedChange={(checked) => setIncludeUnconnected(checked === true)} />
        <Label htmlFor="include-unconnected" className="font-normal">Include pins with no net on either side</Label>
      </div>

      <Button variant="outline" onClick={() => void preview()} disabled={loading} className="justify-self-start">
        <Wand2 className="mr-1 h-4 w-4" /> {loading ? "Generating…" : "Preview"}
      </Button>

      {error && <p className="text-sm text-destructive" role="alert">{error}</p>}

      {result && (
        <div className="grid gap-3">
          <p className="text-sm text-muted-foreground">
            {result.rows.length} proposed
            {skippedExisting > 0 && ` · ${skippedExisting} skipped (already used)`}
            {skippedUnconnected > 0 && ` · ${skippedUnconnected} skipped (no net)`}
            {suspect.length > 0 && <span className="text-warning"> · {suspect.length} suspect</span>}
            {suspectKept > 0 && (
              <Button variant="link" size="sm" className="h-auto px-1.5 py-0 text-xs"
                onClick={() => setRejected((current) => new Set([...current, ...suspect.map(pairKey)]))}>
                Leave out suspect
              </Button>
            )}
          </p>
          {result.rows.length > 0 && (
            <div className="max-h-[50vh] overflow-y-auto border">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-muted text-left text-muted-foreground">
                  <tr>
                    <th className="w-8 px-2 py-1.5"><span className="sr-only">Keep</span></th>
                    <th className="px-2 py-1.5 font-medium">Pins</th>
                    <th className="px-2 py-1.5 font-medium">Signal</th>
                    <th className="px-2 py-1.5 font-medium">Nets</th>
                    <th className="w-6 px-1 py-1.5"><span className="sr-only">Flags</span></th>
                  </tr>
                </thead>
                <tbody>
                  {result.rows.map((row) => {
                    const key = pairKey(row);
                    return (
                      <tr key={key} className="border-t">
                        <td className="px-2 py-1">
                          <Checkbox aria-label={`Keep ${row.pinA} ↔ ${row.pinB}`} checked={!rejected.has(key)}
                            onCheckedChange={(checked) => setRejected((current) => {
                              const next = new Set(current);
                              if (checked === true) next.delete(key); else next.add(key);
                              return next;
                            })} />
                        </td>
                        <td className="whitespace-nowrap px-2 py-1 font-mono">{row.pinA} ↔ {row.pinB}</td>
                        <td className="px-2 py-1">{row.signal}</td>
                        <td className="max-w-[14rem] truncate px-2 py-1 font-mono text-muted-foreground"
                          title={`${row.netA.join(" | ") || "no net"} ↔ ${row.netB.join(" | ") || "no net"}`}>
                          {row.netA.join(" | ") || "no net"} ↔ {row.netB.join(" | ") || "no net"}
                        </td>
                        <td className="px-1 py-1"><PairFlags row={row} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          <Button disabled={approved.length === 0} onClick={() => { onApprove(approved); setResult(null); }} className="justify-self-start">
            Add {approved.length} to the draft
          </Button>
        </div>
      )}
    </section>
  );
}
