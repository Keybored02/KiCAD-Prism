import { useEffect, useState } from "react";
import { toast } from "sonner";
import { FileJson, FileSpreadsheet, FileText, GitCompare, Layers, PackageCheck, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { canWriteCatalog } from "@/lib/roles";
import { cn } from "@/lib/utils";
import { createSnapshot, diffSnapshot, getHistory, icdUrl, listSnapshots, manifestUrl, publishSnapshot } from "@/lib/systems-api";
import type { AuditEvent, RowFields, SnapshotDiff, SnapshotMeta, SystemDocument } from "@/types/system";

import type { SystemTabProps } from "./system-tab-content";
import { shortSha, timeAgo } from "./system-format";
import { GitLinkPanel, SnapshotGitBadge } from "./git-link-panel";
import { PublicationBadge, PublishDialog } from "./publish-dialog";
import { useSystemMutation } from "./use-system-mutation";

const LIVE = "live";

/** One line describing an audit event, with board labels where the payload names an instance. */
export function eventSummary(event: AuditEvent, labels: Map<string, string>): string {
  if (event.redacted || !event.payload) {
    return event.redacted ? "on a board you cannot see" : "";
  }
  const p = event.payload as Record<string, unknown>;
  const board = typeof p.instanceId === "string" ? labels.get(p.instanceId) ?? "a removed board" : null;
  switch (event.kind) {
    case "instance_added":
    case "instance_removed":
      return String(p.label ?? board ?? "");
    case "review_applied":
      if (p.kind === "import") {
        return `import review: ${p.created ?? 0} created, ${p.updated ?? 0} updated`;
      }
      return `${board ?? ""} ${shortSha(p.from as string)} → ${shortSha(p.to as string)}`.trim();
    case "baseline_auto_advanced":
    case "baseline_rebased":
      return `${board ?? ""} ${shortSha(p.from as string)} → ${shortSha(p.to as string)}`.trim();
    case "rows_replaced":
      return `${p.rowCount ?? 0} rows (${(p.added as unknown[] | undefined)?.length ?? 0} added, ${(p.removed as unknown[] | undefined)?.length ?? 0} removed)`;
    case "snapshot_created":
      return String(p.name ?? "");
    case "git_linked":
    case "git_relinked":
      return `${String(p.url ?? "")} ${String(p.branch ?? "")}`.trim();
    case "git_unlinked":
      return String(p.url ?? "");
    case "snapshot_committed":
    case "snapshot_commit_refused":
    case "manifest_imported":
    case "manifest_import_rejected":
      return shortSha(p.commit as string);
    case "import_committed":
      return `${p.created ?? 0} created, ${p.updated ?? 0} updated`;
    case "port_override_set":
      return `${board ?? ""} ${String(p.after ?? "reset")}`.trim();
    case "review_item_decided":
      return String(p.decision ?? "");
    case "pose_updated":
      return `${board ?? ""} ${p.after ? "moved" : "back to its default position"}`.trim();
    case "poses_reset": {
      const count = (p.instanceIds as unknown[] | undefined)?.length ?? 0;
      return `${count} ${count === 1 ? "board" : "boards"} back to the default layout`;
    }
    default:
      return board ?? "";
  }
}

/** Only what changed in a row, e.g. "net A PAYLOAD_IRQ# → PAYLOAD_INT#". */
export function rowChange(before: RowFields, after: RowFields): string {
  const nets = (value: string[] | null) => (value?.length ? value.join(" | ") : "no net");
  const parts: string[] = [];
  if (before.pinA !== after.pinA) parts.push(`pin A ${before.pinA ?? "—"} → ${after.pinA ?? "—"}`);
  if (before.pinB !== after.pinB) parts.push(`pin B ${before.pinB ?? "—"} → ${after.pinB ?? "—"}`);
  if (before.signal !== after.signal) parts.push(`signal ${before.signal || "—"} → ${after.signal || "—"}`);
  if (nets(before.netA) !== nets(after.netA)) parts.push(`net A ${nets(before.netA)} → ${nets(after.netA)}`);
  if (nets(before.netB) !== nets(after.netB)) parts.push(`net B ${nets(before.netB)} → ${nets(after.netB)}`);
  return parts.join("; ");
}

function rowText(row: Pick<RowFields, "pinA" | "pinB" | "signal">): string {
  return `${row.pinA ?? "—"} ↔ ${row.pinB ?? "—"}${row.signal ? ` (${row.signal})` : ""}`;
}

const TH = "h-8 px-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground first:pl-0";
const TD = "h-9 max-w-0 truncate px-2 first:pl-0";

export function HistoryTab({ systemId, document, etag, canEdit, user, reload, startTaking = false }: SystemTabProps & {
  /** Open the Take snapshot dialog on mount (the workspace top bar's button). */
  startTaking?: boolean;
}) {
  // Taking a snapshot does not bump the version, so both lists also follow this counter.
  const [snapshotsTaken, setSnapshotsTaken] = useState(0);
  const refresh = `${etag}#${snapshotsTaken}`;
  return (
    <div className="grid min-h-full xl:grid-cols-[3fr_2fr] xl:divide-x">
      <SnapshotsSection systemId={systemId} document={document} etag={etag} refresh={refresh} canEdit={canEdit} reload={reload}
        startTaking={startTaking && canEdit}
        canPublish={canEdit && canWriteCatalog(user?.role)}
        onTaken={() => setSnapshotsTaken((count) => count + 1)} />
      <AuditLog systemId={systemId} document={document} refresh={refresh} />
    </div>
  );
}

interface SnapshotsProps {
  systemId: string;
  document: SystemDocument;
  etag: string;
  /** Changes whenever the lists must be re-read. */
  refresh: string;
  onTaken: () => void;
  canEdit: boolean;
  /** Designers who may also write to the catalog (CONTRACTS_P2 §3.3). */
  canPublish: boolean;
  reload: () => Promise<void>;
  startTaking?: boolean;
}

function SnapshotsSection({ systemId, document, etag, refresh, canEdit, canPublish, reload, onTaken, startTaking = false }: SnapshotsProps) {
  const [publishing, setPublishing] = useState<SnapshotMeta | null>(null);
  const [snapshots, setSnapshots] = useState<{ refresh: string; items: SnapshotMeta[] } | null>(null);
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [taking, setTaking] = useState(startTaking);
  const [compare, setCompare] = useState<{ snapshotId: string; against: string } | null>(null);
  const [diff, setDiff] = useState<{ key: string; body: SnapshotDiff } | null>(null);
  const { busy, run } = useSystemMutation(reload);

  useEffect(() => {
    let cancelled = false;
    listSnapshots(systemId).then((items) => !cancelled && setSnapshots({ refresh, items })).catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [systemId, refresh]);

  // A commit runs in a job after the snapshot is stored: re-read while one is queued (P2 §21.2).
  const committing = snapshots?.items.some((snapshot) => snapshot.git?.state === "queued") ?? false;
  useEffect(() => {
    if (!committing) return;
    const timer = window.setInterval(() => {
      listSnapshots(systemId).then((items) => setSnapshots({ refresh, items })).catch(() => undefined);
    }, 3000);
    return () => window.clearInterval(timer);
  }, [systemId, refresh, committing]);

  const compareKey = compare ? `${compare.snapshotId}:${compare.against}:${etag}` : null;
  useEffect(() => {
    if (!compare || !compareKey) return;
    let cancelled = false;
    diffSnapshot(systemId, compare.snapshotId, compare.against)
      .then((body) => !cancelled && setDiff({ key: compareKey, body }))
      .catch((error: unknown) => toast.error(error instanceof Error ? error.message : "Could not compare"));
    return () => {
      cancelled = true;
    };
  }, [systemId, compare, compareKey]);

  const take = async () => {
    const done = await run("snapshot", () => createSnapshot(systemId, etag, { name: name.trim(), note: note.trim() }),
      `Snapshot ${name.trim()} created`);
    if (done) {
      setName("");
      setNote("");
      setTaking(false);
      onTaken();
    }
  };

  const items = snapshots?.items ?? [];
  const shown = diff && diff.key === compareKey ? diff.body : null;
  const openReviews = document.openReviewCount;

  return (
    <section className="min-w-0 space-y-2 p-4 pt-0" aria-label="Snapshots">
      <div className="flex items-center gap-2">
        <div className="min-w-0 flex-1">
          <GitLinkPanel systemId={systemId} etag={etag} refresh={refresh} canEdit={canEdit} busy={busy} run={run} />
        </div>
        {document.instances.some((instance) => instance.kind === "assembly") && (
          <Button asChild variant="ghost" size="sm" className="h-7 shrink-0">
            <a href={icdUrl(systemId, "html", undefined, "all")} target="_blank" rel="noreferrer"
              title="This system's links and every subsystem's own links">
              <Layers className="size-3.5" /> ICD, all levels
            </a>
          </Button>
        )}
      </div>

      <Dialog open={taking} onOpenChange={setTaking}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Take a snapshot</DialogTitle>
            <DialogDescription>
              A snapshot freezes every board's baseline, the links and pins, and the findings under a name, for a design
              review or a release. It never changes afterwards.
              {openReviews > 0 && ` It will record that ${openReviews} ${openReviews === 1 ? "change is" : "changes are"} still unreviewed.`}
            </DialogDescription>
          </DialogHeader>
          <form className="grid gap-4" onSubmit={(event) => { event.preventDefault(); void take(); }}>
            <div className="grid gap-2">
              <Label htmlFor="snapshot-name">Name</Label>
              <Input id="snapshot-name" aria-label="Snapshot name" placeholder="e.g. CDR" value={name} maxLength={200}
                onChange={(event) => setName(event.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="snapshot-note">Note <span className="font-normal text-muted-foreground">(optional)</span></Label>
              <Textarea id="snapshot-note" aria-label="Snapshot note" rows={3} value={note} maxLength={4000}
                onChange={(event) => setNote(event.target.value)} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setTaking(false)}>Cancel</Button>
              <Button type="submit" disabled={!name.trim() || busy !== null}>
                {busy === "snapshot" ? "Saving…" : "Take snapshot"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">No snapshots</p>
      ) : (
        <table className="w-full table-fixed text-sm" aria-label="Snapshots list">
          <thead className="border-b">
            <tr>
              <th className={TH}>Snapshot</th>
              <th className={cn(TH, "w-24")}>Taken</th>
              <th className={cn(TH, "hidden w-28 md:table-cell")}>By</th>
              <th className={cn(TH, "w-[30%]")}>State</th>
              <th className={cn(TH, "w-36")}><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            {items.map((snapshot) => (
              <tr key={snapshot.id} className="border-b hover:bg-accent/50">
                <td className={cn(TD, "font-medium")} title={[snapshot.name, snapshot.note, snapshot.digest].filter(Boolean).join("\n")}>{snapshot.name}</td>
                <td className={cn(TD, "text-muted-foreground")} title={new Date(snapshot.createdAt).toLocaleString()}>{timeAgo(snapshot.createdAt)}</td>
                <td className={cn(TD, "hidden text-muted-foreground md:table-cell")}>{snapshot.createdBy.replace(/^user:/, "")}</td>
                <td className={cn(TD, "overflow-visible")}>
                  <span className="flex items-center gap-1.5">
                    {snapshot.openReviewCount > 0 && (
                      <span className="shrink-0 text-xs text-warning" title={`${snapshot.openReviewCount} unreviewed when taken`}>{snapshot.openReviewCount} unreviewed</span>
                    )}
                    {snapshot.publication && <PublicationBadge publication={snapshot.publication} />}
                    <SnapshotGitBadge systemId={systemId} snapshotId={snapshot.id} name={snapshot.name} git={snapshot.git}
                      canEdit={canEdit} run={run} />
                  </span>
                </td>
                <td className="px-2 text-right">
                  <span className="inline-flex">
                    <Button asChild variant="ghost" size="icon-sm">
                      <a href={icdUrl(systemId, "html", snapshot.id)} target="_blank" rel="noreferrer" aria-label={`ICD of ${snapshot.name}`} title="ICD">
                        <FileText className="size-4" />
                      </a>
                    </Button>
                    <Button asChild variant="ghost" size="icon-sm">
                      <a href={icdUrl(systemId, "csv", snapshot.id)} download aria-label={`CSV of ${snapshot.name}`} title="CSV">
                        <FileSpreadsheet className="size-4" />
                      </a>
                    </Button>
                    {snapshot.manifestSchema && (
                      <Button asChild variant="ghost" size="icon-sm">
                        <a href={manifestUrl(systemId, snapshot.id)} download={`${snapshot.name}.manifest.json`}
                          aria-label={`Manifest of ${snapshot.name}`} title="System manifest (JSON)">
                          <FileJson className="size-4" />
                        </a>
                      </Button>
                    )}
                    {canPublish && snapshot.manifestSchema && !snapshot.publication && (
                      <Button variant="ghost" size="icon-sm" aria-label={`Publish ${snapshot.name}`} title="Publish to the catalog"
                        onClick={() => setPublishing(snapshot)}>
                        <PackageCheck className="size-4" />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon-sm" aria-label={`Compare ${snapshot.name}`} title="Compare"
                      onClick={() => setCompare({ snapshotId: snapshot.id, against: LIVE })}>
                      <GitCompare className="size-4" />
                    </Button>
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {publishing && (
        <PublishDialog snapshot={publishing} systemName={document.system.name}
          firstPublish={!document.system.catalogComponentId} busy={busy === "publish"}
          onClose={() => setPublishing(null)}
          onPublish={async (fields) => {
            const done = await run("publish", () => publishSnapshot(systemId, publishing.id, fields),
              `${publishing.name} published to the catalog`);
            if (done) {
              setPublishing(null);
              onTaken();
            }
          }} />
      )}

      {compare && (
        <div className="space-y-2 border-t pt-2" aria-label="Snapshot comparison">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="font-medium">{items.find((s) => s.id === compare.snapshotId)?.name}</span>
            <span className="text-muted-foreground">vs</span>
            <Select value={compare.against} onValueChange={(value) => setCompare({ ...compare, against: value })}>
              <SelectTrigger aria-label="Compare with" className="h-7 w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={LIVE}>Live</SelectItem>
                {items.map((s) => (s.id === compare.snapshotId ? null : <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>))}
              </SelectContent>
            </Select>
            <Button variant="ghost" size="icon-sm" className="ml-auto" aria-label="Close the comparison" onClick={() => setCompare(null)}><X className="size-4" /></Button>
          </div>
          {!shown ? (
            <p className="text-sm text-muted-foreground">Comparing…</p>
          ) : shown.boards.length === 0 && shown.links.length === 0 ? (
            <p className="text-sm text-muted-foreground">No differences.</p>
          ) : (
            <div className="space-y-3 text-sm">
              {shown.boards.map((board) => (
                <p key={board.instanceId}>
                  <Badge variant="outline">{board.status}</Badge> <span className="font-medium">{board.label}</span>{" "}
                  <span className="font-mono text-xs text-muted-foreground">{shortSha(board.before)} → {shortSha(board.after)}</span>
                </p>
              ))}
              {shown.links.map((link) => (
                <div key={link.linkId} className="space-y-1">
                  <p><Badge variant="outline">{link.status}</Badge> <span className="font-medium">{link.name || "Unnamed link"}</span></p>
                  <ul className="space-y-0.5 pl-4 font-mono text-xs">
                    {link.rows.added.map((row) => <li key={`a-${row.id}`} className="text-success">+ {rowText(row)}</li>)}
                    {link.rows.removed.map((row) => <li key={`r-${row.id}`} className="text-destructive">− {rowText(row)}</li>)}
                    {link.rows.changed.map((row) => (
                      <li key={`c-${row.id}`} className="text-warning">
                        ~ {row.before.pinA ?? "—"} ↔ {row.before.pinB ?? "—"}: {rowChange(row.before, row.after)}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function AuditLog({ systemId, document, refresh }: { systemId: string; document: SystemDocument; refresh: string }) {
  const [page, setPage] = useState<{ refresh: string; events: AuditEvent[]; next: number | null } | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const labels = new Map(document.instances.map((instance) => [instance.id, instance.label]));

  // The newest page is re-read whenever the system moves on; older pages load on demand.
  useEffect(() => {
    let cancelled = false;
    getHistory(systemId, null, 50)
      .then((body) => !cancelled && setPage({ refresh, events: body.events, next: body.nextCursor }))
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [systemId, refresh]);

  const more = async () => {
    if (!page?.next) return;
    setLoadingMore(true);
    try {
      const body = await getHistory(systemId, page.next, 50);
      setPage({ ...page, events: [...page.events, ...body.events], next: body.nextCursor });
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <section className="min-w-0 p-4 pt-0" aria-label="Activity">
      <h2 className="flex h-9 items-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">Activity</h2>
      {!page ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <>
          <ul className="text-sm">
            {page.events.map((event) => {
              const actor = event.actor === "system:detection" ? "Detection" : event.actor === "system:git" ? "Git" : event.actor.replace(/^user:/, "");
              const summary = eventSummary(event, labels);
              return (
                <li key={event.id} className="flex h-8 items-center gap-2 border-b last:border-b-0"
                  title={`${event.kind.replace(/_/g, " ")} ${summary} · ${actor} · ${new Date(event.at).toLocaleString()}`}>
                  <span className="shrink-0 font-medium">{event.kind.replace(/_/g, " ")}</span>
                  <span className="min-w-0 flex-1 truncate text-muted-foreground">{summary}</span>
                  <span className="hidden w-24 shrink-0 truncate text-xs text-muted-foreground 2xl:block">{actor}</span>
                  <span className="w-16 shrink-0 text-right text-xs text-muted-foreground">{timeAgo(event.at)}</span>
                </li>
              );
            })}
          </ul>
          {page.next && (
            <Button variant="ghost" size="sm" className="mt-1 h-7" disabled={loadingMore} onClick={() => void more()}>
              {loadingMore ? "Loading…" : "Load older"}
            </Button>
          )}
        </>
      )}
    </section>
  );
}
