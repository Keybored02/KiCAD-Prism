import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ChevronDown, ChevronUp, FileSpreadsheet, FileText, FileUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { icdUrl } from "@/lib/systems-api";
import { cn } from "@/lib/utils";
import type { Finding, SystemDocument, SystemHarness, SystemLink } from "@/types/system";

import { ChangesTab } from "../changes-tab";
import { FindingCountBadge, findingText } from "../findings-ui";
import { HarnessEditor } from "../harness-editor";
import { HistoryTab } from "../history-tab";
import { ImportTab } from "../import-tab";
import { LinkEditor, endLabel } from "../link-editor";
import type { SystemTabProps } from "../system-tab-content";
import type { Mutate } from "../use-system-mutation";
import { harnessFindings } from "./use-validation";
import { TRAY_TABS, type TrayTab, type WorkspaceSelection, type WorkspaceView } from "./workspace-state";

interface TrayProps extends SystemTabProps {
  tab: TrayTab | null;
  findings: Finding[];
  selection: WorkspaceSelection | null;
  busy: string | null;
  run: Mutate;
  importing: boolean;
  /** Bumped by the top bar's Take snapshot, which opens History with its dialog. */
  takeRequest: number;
  onTab: (tab: TrayTab | null) => void;
  onSelect: (selection: WorkspaceSelection | null) => void;
  onImporting: (open: boolean) => void;
  view: WorkspaceView;
  /** The Nets tab's body, which the 3D view fills with its net list. */
  onNetsSlot: (node: HTMLElement | null) => void;
}

function Count({ value, tone }: { value: number; tone?: "error" | "warning" }) {
  if (!value) return null;
  return (
    <span className={cn("px-1.5 text-[11px] font-medium tabular-nums",
      tone === "error" ? "bg-destructive/20 text-destructive" : tone === "warning" ? "bg-warning/15 text-warning" : "bg-muted text-foreground")}>
      {value}
    </span>
  );
}

function connectionName(document: SystemDocument, link: SystemLink): string {
  return link.name || `${endLabel(document, link, "a")} ↔ ${endLabel(document, link, "b")}`;
}

function endsText(document: SystemDocument, harness: SystemHarness): string {
  const label = (instanceId: string | null | undefined) => document.instances.find((item) => item.id === instanceId)?.label ?? "Free end";
  return harness.ends.map((end) => `${label(end.mates?.instanceId)}${end.mates?.port ? ` ${end.mates.port.reference}` : ""}`).join(" · ");
}

const HEIGHT_KEY = "prism.system-workspace.tray-height";
const DEFAULT_HEIGHT = 320;
const MIN_HEIGHT = 160;
/** Room the tray always leaves for the view above it. */
const VIEW_MIN = 200;

function storedHeight(): number {
  try {
    const value = Number.parseInt(window.localStorage.getItem(HEIGHT_KEY) ?? "", 10);
    return Number.isFinite(value) ? value : DEFAULT_HEIGHT;
  } catch {
    return DEFAULT_HEIGHT;
  }
}

/** The open tray's height: dragged on its top edge or set with the arrow keys, kept per browser. */
function useTrayHeight() {
  const [height, setHeight] = useState(storedHeight);
  const [dragging, setDragging] = useState(false);
  const ref = useRef<HTMLElement | null>(null);
  const clamp = (value: number) => {
    const room = (ref.current?.parentElement?.clientHeight ?? Number.POSITIVE_INFINITY) - VIEW_MIN;
    return Math.round(Math.max(MIN_HEIGHT, Math.min(room, value)));
  };
  useEffect(() => {
    try {
      window.localStorage.setItem(HEIGHT_KEY, String(height));
    } catch {
      // Private windows: the height lasts for this page only.
    }
  }, [height]);
  const handle = {
    role: "separator" as const,
    "aria-orientation": "horizontal" as const,
    "aria-label": "Resize the tray",
    "aria-valuenow": height,
    tabIndex: 0,
    onPointerDown: (event: React.PointerEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);
      setDragging(true);
    },
    onPointerMove: (event: React.PointerEvent<HTMLDivElement>) => {
      const rect = ref.current?.getBoundingClientRect();
      if (dragging && rect) setHeight(clamp(rect.bottom - event.clientY));
    },
    onPointerUp: (event: React.PointerEvent<HTMLDivElement>) => {
      event.currentTarget.releasePointerCapture(event.pointerId);
      setDragging(false);
    },
    onKeyDown: (event: React.KeyboardEvent<HTMLDivElement>) => {
      const step = event.shiftKey ? 64 : 16;
      if (event.key === "ArrowUp") setHeight((current) => clamp(current + step));
      else if (event.key === "ArrowDown") setHeight((current) => clamp(current - step));
      else if (event.key === "Home") setHeight(clamp(DEFAULT_HEIGHT));
      else return;
      event.preventDefault();
    },
    onDoubleClick: () => setHeight(clamp(DEFAULT_HEIGHT)),
  };
  return { height, dragging, ref, handle };
}

const TH = "h-8 px-4 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground";
const TD = "h-8 max-w-0 truncate px-4";

function ConnectionsTable({ document, findings, onSelect }: { document: SystemDocument; findings: Finding[]; onSelect: (selection: WorkspaceSelection) => void }) {
  const harnesses = document.harnesses ?? [];
  if (!document.links.length && !harnesses.length) {
    return <p className="p-4 text-sm text-muted-foreground">No connections</p>;
  }
  const rows = [
    ...harnesses.map((harness) => ({ key: harness.id, selection: { kind: "harness", id: harness.id } as WorkspaceSelection, name: harness.name,
      type: "Harness", ends: endsText(document, harness), count: harness.wires.length, findings: harnessFindings(findings, harness.id) })),
    ...document.links.map((link) => ({ key: link.id, selection: { kind: "link", id: link.id } as WorkspaceSelection, name: connectionName(document, link),
      type: link.type === "b2b" ? "B2B mate" : "Link", ends: `${endLabel(document, link, "a")} ↔ ${endLabel(document, link, "b")}`,
      count: link.rows.length, findings: findings.filter((finding) => finding.linkId === link.id) })),
  ];
  return (
    <table aria-label="Connections" className="w-full table-fixed text-sm">
      <thead className="border-b">
        <tr>
          <th className={cn(TH, "md:w-[22%]")}>Name</th><th className={cn(TH, "hidden w-28 md:table-cell")}>Type</th><th className={cn(TH, "hidden md:table-cell")}>Ends</th>
          <th className={cn(TH, "w-20 text-right")}>Rows</th><th className={cn(TH, "w-24 text-right")}>Findings</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.key} className="border-b hover:bg-accent/50">
            <td className={TD}>
              <button type="button" className="max-w-full truncate font-medium hover:underline" onClick={() => onSelect(row.selection)}>{row.name}</button>
            </td>
            <td className={cn(TD, "hidden text-muted-foreground md:table-cell")}>{row.type}</td>
            <td className={cn(TD, "hidden md:table-cell")} title={row.ends}>{row.ends}</td>
            <td className={cn(TD, "text-right tabular-nums text-muted-foreground")}>{row.count}</td>
            <td className={cn(TD, "text-right")}><span className="inline-flex justify-end"><FindingCountBadge findings={row.findings} /></span></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

const SEVERITY_ORDER = { error: 0, warning: 1, info: 2 } as const;

function findingKey(finding: Finding): string {
  return [finding.rule, finding.instanceId, finding.linkId, finding.rowId, finding.end, finding.reference, finding.pin,
    (finding.detail as { harnessId?: string } | null)?.harnessId].join("|");
}

function findingPlace(document: SystemDocument, finding: Finding): string {
  if (finding.linkId) {
    const link = document.links.find((item) => item.id === finding.linkId);
    return link ? connectionName(document, link) : "";
  }
  return document.instances.find((item) => item.id === finding.instanceId)?.label ?? "";
}

function findingTarget(finding: Finding): WorkspaceSelection | null {
  const harnessId = (finding.detail as { harnessId?: string } | null)?.harnessId;
  if (harnessId) return { kind: "harness", id: harnessId };
  if (finding.linkId) return { kind: "link", id: finding.linkId };
  return finding.instanceId ? { kind: "instance", id: finding.instanceId } : null;
}

function FindingsList({ findings, document, onSelect }: { findings: Finding[]; document: SystemDocument; onSelect: (selection: WorkspaceSelection) => void }) {
  if (!findings.length) return <p className="p-4 text-sm text-muted-foreground">No findings</p>;
  const sorted = [...findings].sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);
  return (
    <ul aria-label="Findings" className="text-sm">
      {sorted.map((finding) => {
        const to = findingTarget(finding);
        return (
          <li key={findingKey(finding)} className="flex h-8 items-center gap-3 border-b px-4" title={findingText(finding)}>
            <span className={cn("w-16 shrink-0 font-mono text-xs font-bold",
              finding.severity === "error" ? "text-destructive" : finding.severity === "warning" ? "text-warning" : "text-muted-foreground")}>
              {finding.rule}
            </span>
            <span className="min-w-0 flex-1 truncate">{findingText(finding)}</span>
            <span className="hidden w-48 shrink-0 truncate text-xs text-muted-foreground md:block">{findingPlace(document, finding)}</span>
            {to ? (
              <button type="button" className="w-12 shrink-0 text-right text-xs text-primary hover:underline" onClick={() => onSelect(to)}>Show</button>
            ) : <span className="w-12 shrink-0" />}
          </li>
        );
      })}
    </ul>
  );
}

/** The workspace's bottom tray (D-P2-47): what used to be the Connections, Changes and History tabs. */
export function WorkspaceTray(props: TrayProps) {
  const { tab, document, findings, selection, systemId, etag, canEdit, busy, run, onTab, onSelect } = props;
  const errors = findings.filter((finding) => finding.severity === "error").length;
  const warnings = findings.filter((finding) => finding.severity === "warning").length;
  const link = selection?.kind === "link" ? document.links.find((item) => item.id === selection.id) : undefined;
  const harness = selection?.kind === "harness" ? document.harnesses?.find((item) => item.id === selection.id) : undefined;
  const editing = tab === "connections" && (link || harness);
  const tray = useTrayHeight();
  const tabProps: SystemTabProps = {
    systemId, document, etag, canEdit, user: props.user, reload: props.reload, onNavigate: props.onNavigate,
  };

  return (
    <section ref={tray.ref} className="relative flex shrink-0 flex-col border-t bg-background" aria-label="Tray"
      style={{ height: tab ? tray.height : 36, maxHeight: tab ? `calc(100% - ${VIEW_MIN}px)` : undefined }}>
      {tab && (
        <div {...tray.handle} className={cn("absolute inset-x-0 -top-1 z-20 h-2 cursor-row-resize transition-colors hover:bg-primary/40 focus-visible:bg-primary/60 focus-visible:outline-none",
          tray.dragging && "bg-primary/60")} />
      )}
      <div className="flex h-9 shrink-0 items-center gap-4 overflow-x-auto border-b px-3 text-sm sm:gap-5 sm:px-4" role="tablist" aria-label="Tray">
        {TRAY_TABS.map((item) => (
          <button
            key={item.id} type="button" role="tab" aria-selected={tab === item.id}
            onClick={() => onTab(tab === item.id ? null : item.id)}
            className={cn("flex h-9 shrink-0 items-center gap-1.5 border-b-2", tab === item.id
              ? "border-foreground font-semibold" : "border-transparent text-muted-foreground hover:text-foreground")}
          >
            {item.label}
            {item.id === "findings" && <Count value={errors || warnings} tone={errors ? "error" : "warning"} />}
            {item.id === "changes" && <Count value={document.openReviewCount} />}
          </button>
        ))}
        <span className="ml-auto flex shrink-0 items-center gap-1">
          {tab === "connections" && !editing && (
            <>
              {canEdit && <Button variant="ghost" size="sm" className="h-7" aria-label="Import CSV" title="Import CSV" onClick={() => props.onImporting(true)}><FileUp className="size-3.5" /><span className="hidden sm:inline"> Import CSV</span></Button>}
              <Button asChild variant="ghost" size="sm" className="h-7">
                <a href={icdUrl(systemId, "html")} target="_blank" rel="noreferrer" aria-label="ICD" title="ICD"><FileText className="size-3.5" /><span className="hidden sm:inline"> ICD</span></a>
              </Button>
              <Button asChild variant="ghost" size="sm" className="h-7">
                <a href={icdUrl(systemId, "csv")} download aria-label="CSV" title="CSV"><FileSpreadsheet className="size-3.5" /><span className="hidden sm:inline"> CSV</span></a>
              </Button>
            </>
          )}
          {editing && (
            <Button variant="ghost" size="sm" className="h-7" onClick={() => onSelect(null)}><ArrowLeft className="size-3.5" /> All connections</Button>
          )}
          <Button variant="ghost" size="icon-sm" aria-label={tab ? "Collapse the tray" : "Expand the tray"}
            onClick={() => onTab(tab ? null : "connections")}>
            {tab ? <ChevronDown className="size-4" /> : <ChevronUp className="size-4" />}
          </Button>
        </span>
      </div>
      {tab && (
        <div className="min-h-0 flex-1 overflow-y-auto">
          {tab === "connections" && (harness ? (
            <div className="p-4">
              <HarnessEditor key={harness.id} systemId={systemId} document={document} harness={harness} etag={etag}
                canEdit={canEdit} findings={findings} busy={busy} run={run}
                onDeleted={() => onSelect(null)} onConverted={(linkId) => onSelect({ kind: "link", id: linkId })} />
            </div>
          ) : link ? (
            <div className="p-4">
              <LinkEditor key={link.id} systemId={systemId} document={document} link={link} etag={etag}
                canEdit={canEdit} findings={findings} busy={busy} run={run}
                onDeleted={() => onSelect(null)} onHarness={(harnessId) => onSelect({ kind: "harness", id: harnessId })} />
            </div>
          ) : (
            <ConnectionsTable document={document} findings={findings} onSelect={onSelect} />
          ))}
          {tab === "nets" && (props.view === "3d"
            ? <div ref={props.onNetsSlot} className="h-full" />
            : <p className="p-4 text-sm text-muted-foreground">3D view only</p>)}
          {tab === "findings" && <FindingsList findings={findings} document={document} onSelect={onSelect} />}
          {tab === "changes" && <ChangesTab {...tabProps} />}
          {tab === "history" && <HistoryTab key={`history-${props.takeRequest}`} {...tabProps} startTaking={props.takeRequest > 0} />}
        </div>
      )}
      {canEdit && (
        <Sheet open={props.importing} onOpenChange={props.onImporting}>
          <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-3xl">
            <SheetHeader>
              <SheetTitle>Import connections</SheetTitle>
              <SheetDescription>
                Upload a wiring list as CSV. An ICD export of this system imports back unchanged. Nothing is written until you commit.
              </SheetDescription>
            </SheetHeader>
            <ImportTab {...tabProps} onNavigate={(next, params) => {
              props.onImporting(false);
              if (next !== "connectivity") props.onNavigate(next, params);
            }} />
          </SheetContent>
        </Sheet>
      )}
    </section>
  );
}
