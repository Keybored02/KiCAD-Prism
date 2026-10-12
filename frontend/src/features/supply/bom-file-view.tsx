import { useMemo, useState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { SupplyBomLookup } from "@/types/supply";
import { rollupSentences } from "./bom-rollup-text";
import {
  buildFileLines, guessMapping, MAX_FILE_BYTES, MAX_FILE_ROWS, parseTable, type Mapping, type Role,
} from "./bom-file-model";
import { BomFileResults } from "./bom-file-results";
import { lineInput } from "./bom-supply";
import { lookupSupplyBom } from "./supply-api";
import { useConnectorSubmit } from "./use-connector-submit";

// A row needs one of the two numbers, so neither is marked optional.
const ROLES: ReadonlyArray<{ role: Role; label: string; required: boolean }> = [
  { role: "mpn", label: "Manufacturer part number", required: true },
  { role: "manufacturer", label: "Manufacturer", required: false },
  { role: "lcsc", label: "LCSC number", required: true },
  { role: "quantity", label: "Quantity per board", required: false },
  { role: "references", label: "References", required: false },
];

/** Check a BOM that is not in a project: pick the columns, and see what it would cost and whether it can be built. */
export function BomFileView() {
  const [rows, setRows] = useState<string[][]>([]);
  const [fileName, setFileName] = useState("");
  const [header, setHeader] = useState(true);
  const [mapping, setMapping] = useState<Mapping>({ manufacturer: null, mpn: null, lcsc: null, quantity: null, references: null });
  const [build, setBuild] = useState(1);
  const [lookup, setLookup] = useState<SupplyBomLookup | null>(null);
  const { busy, error, run } = useConnectorSubmit();

  const columns = rows[0]?.map((name, index) => ({ id: `column-${index}`, index, name: header ? name.trim() || `Column ${index + 1}` : `Column ${index + 1}` })) ?? [];
  const body = header ? rows.slice(1) : rows;
  const built = useMemo(() => buildFileLines(body, mapping), [body, mapping]);

  const choose = async (file: File) => {
    setLookup(null);
    if (file.size > MAX_FILE_BYTES) {
      setRows([]);
      await run(async () => { throw new Error("The file is larger than 2 MB."); });
      return;
    }
    const parsed = parseTable(await file.text()).slice(0, MAX_FILE_ROWS + 1);
    setRows(parsed);
    setFileName(file.name);
    if (parsed.length > 0) setMapping(guessMapping(parsed[0]));
  };

  const check = () => run(async () => {
    setLookup(await lookupSupplyBom(built.lines.map(lineInput), build));
  });

  return (
    <div className="space-y-4 p-4">
      <p className="max-w-3xl text-sm text-muted-foreground">
        Check a BOM that is not a project here: a CSV with a part number or LCSC number column. Nothing is saved. Parts
        Prism does not watch show as unknown; watch them from their project or from the Parts tab.
      </p>
      <div className="space-y-1">
        <Label htmlFor="bom-file">BOM file (CSV, semicolon or tab separated)</Label>
        <input id="bom-file" type="file" accept=".csv,.tsv,.txt,text/csv" className="block text-sm" onChange={(event) => { const file = event.target.files?.[0]; if (file) void choose(file); }} />
      </div>
      {rows.length > 0 ? (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">{fileName}: {body.length.toLocaleString()} rows{rows.length > MAX_FILE_ROWS ? ` (only the first ${MAX_FILE_ROWS.toLocaleString()} are read)` : ""}.</p>
          <div className="flex items-center gap-2">
            <Checkbox id="bom-header" checked={header} onCheckedChange={(value) => { setHeader(value === true); setLookup(null); }} />
            <Label htmlFor="bom-header" className="font-normal">The first row is a header</Label>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {ROLES.map(({ role, label, required }) => (
              <div key={role} className="space-y-1">
                <Label htmlFor={`map-${role}`} className="text-xs">{label}{required ? "" : " (optional)"}</Label>
                <select
                  id={`map-${role}`}
                  className="h-9 w-full border bg-background px-2 text-sm"
                  value={mapping[role] ?? ""}
                  onChange={(event) => { setMapping({ ...mapping, [role]: event.target.value === "" ? null : Number(event.target.value) }); setLookup(null); }}
                >
                  <option value="">{required ? "Choose a column" : "None"}</option>
                  {columns.map((column) => <option key={column.id} value={column.index}>{column.name}</option>)}
                </select>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <Label htmlFor="bom-file-build" className="text-xs">Boards to build</Label>
              <Input id="bom-file-build" type="number" min={1} max={1_000_000} className="h-9 w-28" value={build}
                onChange={(event) => { const next = Math.floor(Number(event.target.value)); if (next >= 1 && next <= 1_000_000) { setBuild(next); setLookup(null); } }} />
            </div>
            <button
              type="button"
              className="h-9 border bg-primary px-3 text-sm text-primary-foreground disabled:opacity-50"
              disabled={busy || (mapping.mpn === null && mapping.lcsc === null) || built.lines.length === 0}
              onClick={() => void check()}
            >
              Check {built.lines.length.toLocaleString()} distinct parts
            </button>
            {built.skipped > 0 ? <span className="text-xs text-muted-foreground">{built.skipped} rows without a part number or LCSC number are left out.</span> : null}
          </div>
        </div>
      ) : null}
      {error ? <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert> : null}
      {lookup ? (
        <>
          <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
            {rollupSentences(lookup.rollup, build, built.lines).map((sentence) => <li key={sentence.text}>{sentence.text}</li>)}
          </ul>
          <BomFileResults lines={built.lines} lookup={lookup} />
        </>
      ) : null}
    </div>
  );
}
