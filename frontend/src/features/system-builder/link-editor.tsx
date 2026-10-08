import { useEffect, useState } from "react";
import { Cable, MoreHorizontal, Pencil, Plus, Trash2, Wand2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { deleteLink, getInstanceInterface, harnessFromLabel, linkToHarness, replaceRows, updateLink } from "@/lib/systems-api";
import type { Finding, LinkType, SystemDocument, SystemInstance, SystemLink } from "@/types/system";

import { FindingsAlert } from "./findings-ui";
import { GeneratorPanel } from "./generator-panel";
import {
  changedRowCount,
  componentFor,
  draftFromRows,
  draftProblems,
  draftToInputs,
  linkFindings,
  mergeGenerated,
  newDraftKey,
  pinFacts,
  sameNets,
  type DraftRow,
  type PinFact,
} from "./link-model";
import { LinkRowsTable, type RowView } from "./link-rows-table";
import { MatingPanel } from "./mating-panel";
import { comparePads } from "./pads";
import type { useSystemMutation } from "./use-system-mutation";
import { useDraftGuard } from "./draft-guard";

type Mutate = ReturnType<typeof useSystemMutation>["run"];

interface EndPins {
  key: string;
  a: Map<string, PinFact> | null;
  b: Map<string, PinFact> | null;
}

const leaf = (net: string) => net.slice(net.lastIndexOf("/") + 1);

function sortedPads(facts: Map<string, PinFact> | null | undefined): string[] {
  return [...(facts?.keys() ?? [])].sort(comparePads);
}

/** Pins of each end at its baseline, for adding rows and showing draft rows. */
function useEndPins(systemId: string, link: SystemLink, instances: SystemInstance[]): EndPins | null {
  const byId = new Map(instances.map((instance) => [instance.id, instance]));
  // Everything that decides which pins are read, as one comparable value.
  const spec = JSON.stringify((["a", "b"] as const).map((end) => {
    const instance = byId.get(link[end].instanceId);
    const port = link[end].port;
    return instance && !instance.restricted && port && instance.interface?.status === "ready"
      ? { instanceId: instance.id, baseline: instance.baselineCommit, port }
      : null;
  }));
  const [loaded, setLoaded] = useState<EndPins | null>(null);

  useEffect(() => {
    let cancelled = false;
    const requests = JSON.parse(spec) as ({ instanceId: string; port: SystemLink["a"]["port"] } | null)[];
    Promise.all(requests.map(async (request) => {
      if (!request?.port) {
        return null;
      }
      const result = await getInstanceInterface(systemId, request.instanceId);
      return result.state === "ready" ? pinFacts(componentFor(result.body, request.port)) : null;
    }))
      .then(([a, b]) => !cancelled && setLoaded({ key: spec, a, b }))
      .catch(() => !cancelled && setLoaded({ key: spec, a: null, b: null }));
    return () => {
      cancelled = true;
    };
  }, [systemId, spec]);

  return loaded?.key === spec ? loaded : null;
}

/** "OBC-1 J14": the board label and connector of one link end. */
export function endLabel(document: SystemDocument, link: SystemLink, end: "a" | "b"): string {
  const label = document.instances.find((instance) => instance.id === link[end].instanceId)?.label ?? "?";
  const physical = link[end].export?.reference;
  return `${label} ${link[end].port?.reference ?? "restricted"}${physical ? ` → ${physical}` : ""}`;
}

interface DetailsFields {
  name: string;
  harness: string | null;
  type: LinkType;
  stackHeightMm: number | null;
}

interface DetailsDialogProps {
  link: SystemLink;
  busy: boolean;
  onClose: () => void;
  onSave: (fields: DetailsFields) => Promise<boolean>;
}

function DetailsDialog({ link, busy, onClose, onSave }: DetailsDialogProps) {
  const [name, setName] = useState(link.name);
  const [harness, setHarness] = useState(link.harness ?? "");
  const [type, setType] = useState<LinkType>(link.type ?? "unspecified");
  const [stack, setStack] = useState(link.stackHeightMm ? String(link.stackHeightMm) : "");
  const stackValue = type === "b2b" && stack.trim() ? Number(stack) : null;
  const stackInvalid = stackValue !== null && !(stackValue > 0 && stackValue < 1000);
  const unchanged = name.trim() === link.name && (harness.trim() || null) === link.harness
    && type === (link.type ?? "unspecified") && stackValue === (link.stackHeightMm ?? null);
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Link details</DialogTitle>
          <DialogDescription>
            A harness label groups links that share a cable. Links on the same harness may share a pin without a fan-out warning.
          </DialogDescription>
        </DialogHeader>
        <form
          className="grid gap-4"
          onSubmit={async (event) => {
            event.preventDefault();
            if (await onSave({ name: name.trim(), harness: harness.trim() || null, type, stackHeightMm: stackValue })) onClose();
          }}
        >
          <div className="grid gap-2">
            <Label htmlFor="link-name">Name</Label>
            <Input id="link-name" value={name} maxLength={200} placeholder="e.g. Payload bus" onChange={(event) => setName(event.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="link-harness">Harness</Label>
            <Input id="link-harness" value={harness} maxLength={200} placeholder="None" onChange={(event) => setHarness(event.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="link-type">Type</Label>
            <Select value={type} onValueChange={(value) => setType(value as LinkType)}>
              <SelectTrigger id="link-type" aria-label="Link type" className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="unspecified">Unspecified</SelectItem>
                <SelectItem value="b2b">Board-to-board (mated connectors)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {type === "b2b" && (
            <div className="grid gap-2">
              <Label htmlFor="link-stack">Stack height (mm)</Label>
              <Input id="link-stack" inputMode="decimal" value={stack} placeholder="From the datasheet; optional"
                aria-invalid={stackInvalid} onChange={(event) => setStack(event.target.value)} />
              {stackInvalid && <p className="text-xs text-destructive">Enter a height between 0 and 1000 mm.</p>}
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={busy || unchanged || stackInvalid}>{busy ? "Saving…" : "Save"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface AddRowProps {
  padsA: string[];
  padsB: string[];
  sideA: string;
  sideB: string;
  onAdd: (row: { pinA: string; pinB: string; signal: string }) => void;
}

function AddRow({ padsA, padsB, sideA, sideB, onAdd }: AddRowProps) {
  const [row, setRow] = useState({ pinA: "", pinB: "", signal: "" });
  const ends = [
    { key: "pinA", side: sideA, pads: padsA, label: "New row pin A" },
    { key: "pinB", side: sideB, pads: padsB, label: "New row pin B" },
  ] as const;
  return (
    <form
      className="flex flex-wrap items-end gap-3"
      aria-label="Add a row"
      onSubmit={(event) => {
        event.preventDefault();
        onAdd(row);
        setRow({ pinA: "", pinB: "", signal: "" });
      }}
    >
      {ends.map((end) => (
        <div key={end.key} className="grid gap-1.5">
          <Label className="text-xs text-muted-foreground">{end.side}</Label>
          <Select value={row[end.key]} onValueChange={(value) => setRow({ ...row, [end.key]: value })}>
            <SelectTrigger className="h-8 w-28 font-mono" aria-label={end.label}>
              <SelectValue placeholder="Pin" />
            </SelectTrigger>
            <SelectContent>
              {end.pads.map((pad) => <SelectItem key={pad} value={pad} className="font-mono">{pad}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      ))}
      <div className="grid gap-1.5">
        <Label htmlFor="new-row-signal" className="text-xs text-muted-foreground">Signal</Label>
        <Input id="new-row-signal" aria-label="New row signal" className="h-8 w-48" placeholder="From net A" value={row.signal}
          maxLength={200} onChange={(event) => setRow({ ...row, signal: event.target.value })} />
      </div>
      <Button type="submit" variant="outline" size="sm" className="h-8" disabled={!row.pinA || !row.pinB}>
        <Plus className="mr-1 h-4 w-4" /> Add row
      </Button>
    </form>
  );
}

interface LinkEditorProps {
  systemId: string;
  document: SystemDocument;
  link: SystemLink;
  etag: string;
  canEdit: boolean;
  findings: Finding[];
  busy: string | null;
  run: Mutate;
  onDeleted: () => void;
  /** Opens a harness this link was just converted into (CONTRACTS_P2 §16.1). */
  onHarness?: (harnessId: string) => void;
}

export function LinkEditor({ systemId, document, link, etag, canEdit, findings, busy, run, onDeleted, onHarness }: LinkEditorProps) {
  const pins = useEndPins(systemId, link, document.instances);
  const [draft, setDraft] = useState<DraftRow[] | null>(null);
  // SB2-102: the rows before the last save, for one level of Undo; dropped on the next edit.
  const [undo, setUndo] = useState<{ linkId: string; rows: ReturnType<typeof draftToInputs> } | null>(null);
  const changed = draft ? changedRowCount(draft, link.rows) : 0;
  useDraftGuard(changed > 0);
  const [dialog, setDialog] = useState<"details" | "delete" | "generate" | null>(null);

  const redacted = link.a.redacted || link.b.redacted;
  const editable = canEdit && !redacted;
  const { all: linkIssues, byRow } = linkFindings(findings, link);
  const sideA = endLabel(document, link, "a");
  const sideB = endLabel(document, link, "b");

  const padsA = pins?.a ? new Set(pins.a.keys()) : null;
  const padsB = pins?.b ? new Set(pins.b.keys()) : null;
  const problems = draft ? draftProblems(draft, padsA, padsB) : [];
  const problemsByRow = new Map<string, string[]>();
  for (const problem of problems) {
    problemsByRow.set(problem.key, [...(problemsByRow.get(problem.key) ?? []), problem.message]);
  }

  const rows: RowView[] = draft
    ? draft.map((row) => {
      const factA = pins?.a?.get(row.pinA);
      const factB = pins?.b?.get(row.pinB);
      return {
        key: row.key, signal: row.signal, source: row.source,
        a: { pad: row.pinA, names: factA?.pinNames ?? null, nets: factA?.nets ?? null, changed: false,
          missing: Boolean(pins?.a) && !factA, redacted: false },
        b: { pad: row.pinB, names: factB?.pinNames ?? null, nets: factB?.nets ?? null, changed: false,
          missing: Boolean(pins?.b) && !factB, redacted: false },
        findings: row.id ? byRow.get(row.id) ?? [] : [],
        problems: problemsByRow.get(row.key) ?? [],
      };
    })
    : [...link.rows].sort((x, y) => comparePads(x.pinA ?? "", y.pinA ?? "") || comparePads(x.pinB ?? "", y.pinB ?? "")).map((row) => {
      const end = (side: "a" | "b") => {
        const observed = side === "a" ? row.observedA : row.observedB;
        const accepted = side === "a" ? row.netA : row.netB;
        return {
          pad: side === "a" ? row.pinA : row.pinB,
          names: observed?.pinNames ?? null,
          nets: observed?.present ? observed.nets : accepted,
          changed: Boolean(observed?.present) && !sameNets(observed?.nets, accepted),
          missing: observed?.present === false,
          redacted: row.redactedEnds.includes(side),
        };
      };
      return { key: row.id, signal: row.signal, source: row.source, a: end("a"), b: end("b"),
        findings: byRow.get(row.id) ?? [], problems: [] };
    });

  const editDraft = (update: (rows: DraftRow[]) => DraftRow[]) => {
    setUndo(null);
    setDraft((current) => update(current ?? draftFromRows(link.rows)));
  };

  const addRow = (row: { pinA: string; pinB: string; signal: string }) => {
    const nets = pins?.a?.get(row.pinA)?.nets ?? [];
    editDraft((current) => [...current, {
      key: newDraftKey(), pinA: row.pinA, pinB: row.pinB,
      signal: row.signal.trim() || (nets[0] ? leaf(nets[0]) : ""), source: "manual",
    }]);
  };

  const save = async () => {
    if (!draft) return;
    const before = draftToInputs(draftFromRows(link.rows));
    const done = await run("rows", () => replaceRows(systemId, etag, link.id, draftToInputs(draft)), "Pins saved");
    if (done) {
      setDraft(null);
      setUndo({ linkId: link.id, rows: before });
    }
  };
  const undoSave = async () => {
    if (!undo) return;
    const done = await run("rows", () => replaceRows(systemId, etag, undo.linkId, undo.rows), "Pins restored");
    if (done) setUndo(null);
  };

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate text-lg font-semibold">{link.name || `${sideA} ↔ ${sideB}`}</h2>
          <p className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span>{sideA} ↔ {sideB}</span>
            <span aria-hidden>·</span>
            <span>{link.rows.length} {link.rows.length === 1 ? "pin" : "pins"}</span>
            {link.harness && <Badge variant="outline">Harness {link.harness}</Badge>}
            {link.type === "b2b" && <Badge variant="secondary">Board-to-board</Badge>}
          </p>
        </div>
        {editable && (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setDialog("generate")}>
              <Wand2 className="mr-1 h-4 w-4" /> Generate rows
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Link actions">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem onSelect={() => setDialog("details")}>
                  <Pencil className="mr-2 h-4 w-4" /> Edit details
                </DropdownMenuItem>
                {link.type !== "b2b" && (
                  <DropdownMenuItem onSelect={() => void run("link", () => linkToHarness(systemId, etag, link.id), "Converted to a harness")
                    .then((done) => done && onHarness?.(done.body.id))}>
                    <Cable className="mr-2 h-4 w-4" /> Convert to a harness
                  </DropdownMenuItem>
                )}
                {link.harness && link.type !== "b2b" && (
                  <DropdownMenuItem onSelect={() => void run("link", () => harnessFromLabel(systemId, etag, link.harness!),
                    `Harness ${link.harness} created`).then((done) => done && onHarness?.(done.body.id))}>
                    <Cable className="mr-2 h-4 w-4" /> Make harness {link.harness} from its links
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={() => setDialog("delete")}>
                  <Trash2 className="mr-2 h-4 w-4" /> Delete link
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </header>

      <FindingsAlert findings={linkIssues} />

      {link.type === "b2b" && (
        <MatingPanel systemId={systemId} etag={etag} document={document} link={link} editable={editable}
          busy={busy !== null} run={run} />
      )}

      {redacted && (
        <p className="text-sm text-muted-foreground">One end of this link is on a board you cannot see, so it cannot be edited here.</p>
      )}

      <LinkRowsTable
        rows={rows}
        sideA={sideA}
        sideB={sideB}
        editable={editable}
        onSignalChange={(key, signal) => editDraft((current) => current.map((row) => (row.key === key ? { ...row, signal } : row)))}
        onRemove={(key) => editDraft((current) => current.filter((row) => row.key !== key))}
      />

      {editable && (
        <AddRow padsA={sortedPads(pins?.a)} padsB={sortedPads(pins?.b)} sideA={sideA} sideB={sideB} onAdd={addRow} />
      )}

      {editable && draft && (
        <div className="sticky bottom-0 flex flex-wrap items-center gap-3 border bg-card p-3 shadow-sm">
          <p className="text-sm">
            Unsaved changes: {changed} {changed === 1 ? "row" : "rows"}
            {problems.length > 0 && <span className="text-destructive"> · {problems.length} to fix before saving</span>}
          </p>
          <div className="ml-auto flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setDraft(null)} disabled={busy !== null}>Discard</Button>
            <Button size="sm" onClick={() => void save()} disabled={busy !== null || problems.length > 0}>
              {busy === "rows" ? "Saving…" : "Save pins"}
            </Button>
          </div>
        </div>
      )}

      {editable && !draft && undo?.linkId === link.id && (
        <div className="flex items-center gap-3 border bg-card px-3 py-2 text-sm">
          <span className="text-muted-foreground">Pins saved</span>
          <Button variant="outline" size="sm" className="ml-auto" onClick={() => void undoSave()} disabled={busy !== null}>Undo</Button>
        </div>
      )}

      {editable && (
        <Sheet open={dialog === "generate"} onOpenChange={(open) => setDialog(open ? "generate" : null)}>
          <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl">
            <SheetHeader>
              <SheetTitle>Generate rows</SheetTitle>
              <SheetDescription>
                Propose pin pairs between {sideA} and {sideB}. Proposals go into your draft; nothing is saved until you save pins.
              </SheetDescription>
            </SheetHeader>
            <GeneratorPanel systemId={systemId} linkId={link.id} sideA={sideA} sideB={sideB}
              onApprove={(generated) => {
                editDraft((current) => mergeGenerated(current, generated));
                setDialog(null);
              }} />
          </SheetContent>
        </Sheet>
      )}

      {dialog === "details" && (
        <DetailsDialog
          link={link}
          busy={busy === "link"}
          onClose={() => setDialog(null)}
          onSave={async (fields) => Boolean(await run("link", () => updateLink(systemId, etag, link.id, fields), "Link updated"))}
        />
      )}

      <ConfirmDialog
        open={dialog === "delete"}
        onOpenChange={(open) => setDialog(open ? "delete" : null)}
        title="Delete this link?"
        description={`The link and its ${link.rows.length} ${link.rows.length === 1 ? "row" : "rows"} are deleted. The boards are not touched.`}
        confirmLabel="Delete link"
        destructive
        busy={busy === "delete"}
        onConfirm={() => {
          void run("delete", () => deleteLink(systemId, etag, link.id), "Link deleted").then((done) => {
            setDialog(null);
            if (done !== undefined) onDeleted();
          });
        }}
      />
    </div>
  );
}
