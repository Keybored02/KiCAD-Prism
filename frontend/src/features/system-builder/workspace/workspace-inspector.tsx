import type { ReactNode } from "react";
import { PanelBottomOpen } from "lucide-react";

import { Button } from "@/components/ui/button";
import { updateSystem } from "@/lib/systems-api";
import type { Finding, SystemDocument, SystemHarness, SystemLink } from "@/types/system";

import { BoardDetail } from "../board-detail";
import { ExportsSection } from "../exports-section";
import { findingText } from "../findings-ui";
import { endLabel } from "../link-editor";
import { ChecksSection } from "../checks-section";
import type { Mutate } from "../use-system-mutation";
import { harnessFindings } from "./use-validation";
import type { WorkspaceSelection } from "./workspace-state";

interface InspectorProps {
  systemId: string;
  document: SystemDocument;
  etag: string;
  canEdit: boolean;
  findings: Finding[];
  selection: WorkspaceSelection | null;
  busy: string | null;
  run: Mutate;
  onSelect: (selection: WorkspaceSelection | null) => void;
  /** Opens the tray on the selected link's or harness's rows. */
  onEditRows: () => void;
}

function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{children}</p>;
}

function Facts({ rows }: { rows: { label: string; value: ReactNode; aside?: ReactNode }[] }) {
  return (
    <dl className="border-t text-sm">
      {rows.map((row) => (
        <div key={row.label} className="flex min-h-9 items-center gap-3 border-b py-1.5">
          <dt className="w-24 shrink-0 text-muted-foreground">{row.label}</dt>
          <dd className="min-w-0 flex-1 break-words">{row.value}</dd>
          {row.aside && <dd className="shrink-0 text-xs text-muted-foreground">{row.aside}</dd>}
        </div>
      ))}
    </dl>
  );
}

function plural(count: number, word: string): string {
  return `${count} ${word}${count === 1 ? "" : "s"}`;
}

function findingSummary(findings: Finding[]): ReactNode {
  return countSummary(findings.filter((finding) => finding.severity === "error").length,
    findings.filter((finding) => finding.severity === "warning").length);
}

function countSummary(errors: number, warnings: number): ReactNode {
  if (!errors && !warnings) return <span className="text-muted-foreground">None</span>;
  return (
    <span>
      {errors > 0 && <span className="text-destructive">{plural(errors, "error")}</span>}
      {errors > 0 && warnings > 0 && " · "}
      {warnings > 0 && <span className="text-warning">{plural(warnings, "warning")}</span>}
    </span>
  );
}

function FindingList({ findings }: { findings: Finding[] }) {
  if (!findings.length) return null;
  return (
    <section className="space-y-1.5">
      <Eyebrow>Findings</Eyebrow>
      <ul className="space-y-1 text-sm">
        {findings.slice(0, 8).map((finding) => (
          <li key={[finding.rule, finding.instanceId, finding.linkId, finding.rowId, finding.end, finding.pin].join("|")} className="flex gap-2">
            <span className={finding.severity === "error" ? "font-mono text-xs text-destructive" : "font-mono text-xs text-warning"}>{finding.rule}</span>
            <span className="min-w-0 flex-1">{findingText(finding)}</span>
          </li>
        ))}
      </ul>
      {findings.length > 8 && <p className="text-xs text-muted-foreground">and {findings.length - 8} more in the Findings tray</p>}
    </section>
  );
}

function SystemOverview({ systemId, document, etag, canEdit, busy, run, onSelect }: InspectorProps) {
  const { system } = document;
  const kinds = (kind: string) => document.instances.filter((item) => (item.kind ?? "board") === kind).length;
  const contents = [plural(kinds("board"), "board"), kinds("module") ? plural(kinds("module"), "module") : "",
    kinds("assembly") ? plural(kinds("assembly"), "subsystem") : ""].filter(Boolean).join(", ");
  const counts = document.findingCounts;
  return (
    <div className="space-y-6">
      <header className="space-y-1.5">
        <Eyebrow>System</Eyebrow>
        <h2 className="text-2xl font-bold tracking-tight">{system.name}</h2>
        {system.description && <p className="text-sm text-muted-foreground">{system.description}</p>}
      </header>
      <Facts rows={[
        { label: "Contents", value: contents || "Empty", aside: plural(document.links.length + (document.harnesses?.length ?? 0), "connection") },
        { label: "To review", value: document.openReviewCount ? plural(document.openReviewCount, "change") : <span className="text-muted-foreground">Nothing</span> },
        { label: "Findings", value: counts ? countSummary(counts.error, counts.warning) : <span className="text-muted-foreground">Not evaluated</span> },
      ]} />
      <ExportsSection systemId={systemId} document={document} etag={etag} canEdit={canEdit} busy={busy} run={run}
        onOpenBoard={(instanceId) => onSelect({ kind: "instance", id: instanceId })} />
      <ChecksSection document={document} canEdit={canEdit} busy={busy !== null} onToggle={(rule, on) => {
        const rules = new Set(system.optionalRules ?? []);
        if (on) rules.add(rule); else rules.delete(rule);
        void run("checks", () => updateSystem(systemId, etag, { optionalRules: [...rules].sort() }),
          on ? "Check enabled" : "Check disabled");
      }} />
    </div>
  );
}

function LinkSummary({ document, link, findings, onEditRows }: { document: SystemDocument; link: SystemLink; findings: Finding[]; onEditRows: () => void }) {
  const own = findings.filter((finding) => finding.linkId === link.id);
  return (
    <div className="space-y-6">
      <header className="space-y-1.5">
        <Eyebrow>{link.type === "b2b" ? "Board-to-board link" : "Link"}</Eyebrow>
        <h2 className="break-words text-2xl font-bold tracking-tight">{link.name || `${endLabel(document, link, "a")} ↔ ${endLabel(document, link, "b")}`}</h2>
      </header>
      <Facts rows={[
        { label: "End A", value: endLabel(document, link, "a") },
        { label: "End B", value: endLabel(document, link, "b") },
        { label: "Rows", value: plural(link.rows.length, "pin") },
        ...(link.type === "b2b" ? [{ label: "Stack height", value: link.stackHeightMm != null ? `${link.stackHeightMm} mm` : "Not set" }] : []),
        { label: "Findings", value: findingSummary(own) },
      ]} />
      <FindingList findings={own} />
      <Button variant="secondary" className="w-full" onClick={onEditRows}><PanelBottomOpen className="size-4" /> Open its rows</Button>
    </div>
  );
}

function HarnessSummary({ document, harness, findings, onEditRows }: { document: SystemDocument; harness: SystemHarness; findings: Finding[]; onEditRows: () => void }) {
  const own = harnessFindings(findings, harness.id);
  const label = (instanceId: string | null | undefined) => document.instances.find((item) => item.id === instanceId)?.label;
  return (
    <div className="space-y-6">
      <header className="space-y-1.5">
        <Eyebrow>Harness</Eyebrow>
        <h2 className="break-words text-2xl font-bold tracking-tight">{harness.name}</h2>
        <p className="text-sm text-muted-foreground">{plural(harness.ends.length, "end")}, {plural(harness.wires.length, "wire")}</p>
      </header>
      <Facts rows={[
        { label: "Cut length", value: harness.cutLengthMm != null ? `${harness.cutLengthMm} mm` : <span className="text-muted-foreground">From the route</span> },
        { label: "Findings", value: findingSummary(own) },
      ]} />
      <section className="space-y-1.5">
        <Eyebrow>Ends</Eyebrow>
        <ul className="space-y-1 text-sm">
          {harness.ends.map((end) => (
            <li key={end.id} className="flex gap-2">
              <span className="w-12 shrink-0 font-mono text-xs leading-5 text-muted-foreground">{end.mates?.port?.reference ?? "—"}</span>
              <span className="min-w-0 flex-1 truncate">{label(end.mates?.instanceId) ?? "Free end"}</span>
              <span className="text-xs text-muted-foreground">{plural(harness.wires.filter((wire) => wire.from.end === end.id || wire.to.end === end.id).length, "wire")}</span>
            </li>
          ))}
        </ul>
      </section>
      <FindingList findings={own} />
      <Button variant="secondary" className="w-full" onClick={onEditRows}><PanelBottomOpen className="size-4" /> Open its wires</Button>
    </div>
  );
}

/** The workspace's right column: the selection, or the system when nothing is selected (D-P2-47). */
export function WorkspaceInspector(props: InspectorProps) {
  const { document, selection, findings } = props;
  const instance = selection?.kind === "instance" ? document.instances.find((item) => item.id === selection.id) : undefined;
  const link = selection?.kind === "link" ? document.links.find((item) => item.id === selection.id) : undefined;
  const harness = selection?.kind === "harness" ? document.harnesses?.find((item) => item.id === selection.id) : undefined;
  return (
    <aside className="h-full overflow-auto p-5" aria-label="Inspector">
      {instance ? (
        <BoardDetail key={instance.id} systemId={props.systemId} document={document} instance={instance} etag={props.etag}
          canEdit={props.canEdit} busy={props.busy} run={props.run} />
      ) : link ? (
        <LinkSummary document={document} link={link} findings={findings} onEditRows={props.onEditRows} />
      ) : harness ? (
        <HarnessSummary document={document} harness={harness} findings={findings} onEditRows={props.onEditRows} />
      ) : (
        <SystemOverview {...props} />
      )}
    </aside>
  );
}
