import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Eye, EyeOff, Lock, MoreHorizontal, Pencil, Pin, PinOff, RefreshCw, RotateCcw, Share2, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  checkNow,
  createExport,
  getInstanceInterface,
  removeInstance,
  setPortOverride,
  updateInstance,
} from "@/lib/systems-api";
import { throwIfJobFailed, watchPrismJob } from "@/lib/jobs";
import { cn } from "@/lib/utils";
import type { InstanceComponent, SystemDocument, SystemInstance, SystemPort } from "@/types/system";

import { ExportDialog, exportForPort } from "./exports-section";
import { SubsystemDetail } from "./subsystem-detail";
import { TONE_BADGE, boardStatus, shortSha } from "./system-format";
import { useSystemMutation } from "./use-system-mutation";

type Mutate = ReturnType<typeof useSystemMutation>["run"];

export function linkedPortKeys(document: SystemDocument, instanceId: string): Set<string> {
  const keys = new Set<string>();
  for (const link of document.links) {
    for (const end of [link.a, link.b]) {
      if (end.instanceId === instanceId && end.port) {
        keys.add(end.port.portKey);
        end.port.memberKeys.forEach((key) => keys.add(key));
      }
    }
  }
  return keys;
}

export function portState(port: Pick<SystemPort, "override" | "exposed">): "promoted" | "hidden" | "exposed" | "not exposed" {
  if (port.override === "promoted") return "promoted";
  if (port.override === "hidden") return "hidden";
  return port.exposed ? "exposed" : "not exposed";
}

interface BoardDetailProps {
  systemId: string;
  document: SystemDocument;
  instance: SystemInstance;
  etag: string;
  canEdit: boolean;
  busy: string | null;
  run: Mutate;
}

interface EditBoardDialogProps {
  instance: SystemInstance;
  busy: boolean;
  onClose: () => void;
  onSave: (fields: { label?: string; trackedRef?: string | null }) => Promise<boolean>;
}

function EditBoardDialog({ instance, busy, onClose, onSave }: EditBoardDialogProps) {
  const [label, setLabel] = useState(instance.label);
  const [branch, setBranch] = useState(instance.trackedRef ?? "");
  const fields: { label?: string; trackedRef?: string | null } = {};
  if (label.trim() && label.trim() !== instance.label) fields.label = label.trim();
  if (branch.trim() !== (instance.trackedRef ?? "")) fields.trackedRef = branch.trim() || null;
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit {instance.label}</DialogTitle>
          <DialogDescription>
            The baseline never moves here: changing the branch only changes which commits are checked from now on.
          </DialogDescription>
        </DialogHeader>
        <form className="grid gap-4" onSubmit={async (event) => {
          event.preventDefault();
          if (await onSave(fields)) onClose();
        }}>
          <div className="grid gap-2">
            <Label htmlFor="board-label">Label</Label>
            <Input id="board-label" aria-label="Board label" value={label} maxLength={100} onChange={(event) => setLabel(event.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="board-branch">Tracked branch</Label>
            <Input id="board-branch" aria-label="Tracked branch" className="font-mono" value={branch} maxLength={200}
              placeholder="Not tracking" onChange={(event) => setBranch(event.target.value)} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={busy || !label.trim() || Object.keys(fields).length === 0}>{busy ? "Saving…" : "Save"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function BoardDetail(props: BoardDetailProps) {
  return props.instance.kind === "assembly" || props.instance.kind === "module"
    ? <SubsystemDetail {...props} /> : <BoardDetailBody {...props} />;
}

function BoardDetailBody({ systemId, document, instance, etag, canEdit, busy, run }: BoardDetailProps) {
  const status = boardStatus(instance);
  const [dialog, setDialog] = useState<"edit" | "remove" | null>(null);
  const linkCount = document.links.filter((link) => link.a.instanceId === instance.id || link.b.instanceId === instance.id).length;
  const editable = canEdit && !instance.restricted;

  const removeDialog = (
    <ConfirmDialog
      open={dialog === "remove"}
      onOpenChange={(open) => setDialog(open ? "remove" : null)}
      title={`Remove ${instance.label}?`}
      description={linkCount > 0
        ? `This board is an end of ${linkCount} ${linkCount === 1 ? "link" : "links"}. Removing it deletes those links and their rows.`
        : "The board is removed from this system. The project itself is not touched."}
      confirmLabel="Remove board"
      destructive
      busy={busy === "remove"}
      onConfirm={() => {
        void run("remove", () => removeInstance(systemId, etag, instance.id, linkCount > 0), `Removed ${instance.label}`)
          .then(() => setDialog(null));
      }}
    />
  );

  if (instance.restricted) {
    return (
      <div className="space-y-3">
        <h2 className="flex items-center gap-2 text-lg font-semibold"><Lock className="h-4 w-4" /> {instance.label}</h2>
        <p className="text-sm text-muted-foreground">
          {instance.projectDeleted
            ? "This board's project has been deleted. Only an admin can see what the system kept of it."
            : "This board's project is in a folder you cannot see. Its details and connections on its side are hidden."}
        </p>
        {canEdit && instance.projectDeleted && (
          <Button variant="outline" size="sm" onClick={() => setDialog("remove")}>
            <Trash2 className="mr-1 h-4 w-4" /> Remove board
          </Button>
        )}
        {removeDialog}
      </div>
    );
  }

  const save = (fields: Parameters<typeof updateInstance>[3], message: string) =>
    run("update", () => updateInstance(systemId, etag, instance.id, fields), message);
  // The check runs as a job; wait for it so a review it opens shows up on this page.
  const checkBranch = async () => {
    const job = await checkNow(systemId, instance.id);
    throwIfJobFailed(await watchPrismJob(job.job_id), "The branch check failed");
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold">{instance.label}</h2>
            <Badge variant={TONE_BADGE[status.tone]} title={status.detail}>{status.label}</Badge>
            {instance.pinned && <Badge variant="outline"><Pin className="h-3 w-3" /> Pinned</Badge>}
          </div>
          <p className="text-sm text-muted-foreground">{instance.projectName} · {status.detail}</p>
        </div>
        {editable && (
          <div className="flex items-center gap-2">
            {instance.trackedRef && (
              <>
                <Button variant="outline" size="sm" disabled={busy !== null}
                  onClick={() => void run("check", checkBranch, "Branch checked")}>
                  <RefreshCw className="mr-1 h-4 w-4" /> Check now
                </Button>
                <Button variant="outline" size="sm" disabled={busy !== null}
                  title={instance.pinned ? "Apply or review new commits again" : "Keep this baseline; only report new commits"}
                  onClick={() => void (instance.pinned
                    ? run("update", async () => {
                      await updateInstance(systemId, etag, instance.id, { pinned: false });
                      await checkBranch();
                    }, "Unpinned and checked the branch")
                    : save({ pinned: true }, "Pinned"))}>
                  {instance.pinned ? <PinOff className="mr-1 h-4 w-4" /> : <Pin className="mr-1 h-4 w-4" />}
                  {instance.pinned ? "Unpin" : "Pin"}
                </Button>
              </>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Board actions">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem onSelect={() => setDialog("edit")}>
                  <Pencil className="mr-2 h-4 w-4" /> Edit board
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={() => setDialog("remove")}>
                  <Trash2 className="mr-2 h-4 w-4" /> Remove board
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </header>

      <dl className="grid gap-px border bg-border text-sm sm:grid-cols-3">
        <div className="bg-card px-4 py-3">
          <dt className="text-xs text-muted-foreground">Baseline</dt>
          <dd className="mt-1 font-mono" title={instance.baselineCommit ?? undefined}>{shortSha(instance.baselineCommit)}</dd>
        </div>
        <div className="bg-card px-4 py-3">
          <dt className="text-xs text-muted-foreground">Tracked branch</dt>
          <dd className="mt-1 font-mono">{instance.trackedRef ?? <span className="font-sans text-muted-foreground">Not tracking</span>}</dd>
        </div>
        <div className="bg-card px-4 py-3">
          <dt className="text-xs text-muted-foreground">Branch tip</dt>
          <dd className="mt-1">
            <span className="font-mono">{instance.trackedRef ? shortSha(instance.tipCommit) : "—"}</span>
            {instance.tipCheckedAt && (
              <span className="ml-2 text-xs text-muted-foreground">checked {new Date(instance.tipCheckedAt).toLocaleString()}</span>
            )}
          </dd>
        </div>
      </dl>

      <PortsSection systemId={systemId} document={document} instance={instance} etag={etag} editable={editable} busy={busy} run={run} />

      {dialog === "edit" && (
        <EditBoardDialog instance={instance} busy={busy === "update"} onClose={() => setDialog(null)}
          onSave={async (fields) => Boolean(await save(fields, "Board updated"))} />
      )}

      {removeDialog}
    </div>
  );
}

interface PortsSectionProps {
  systemId: string;
  document: SystemDocument;
  instance: SystemInstance;
  etag: string;
  editable: boolean;
  busy: string | null;
  run: Mutate;
}

function PortsSection({ systemId, document, instance, etag, editable, busy, run }: PortsSectionProps) {
  const [showAll, setShowAll] = useState(false);
  const [exporting, setExporting] = useState<SystemPort | null>(null);
  const [components, setComponents] = useState<{ key: string; items: InstanceComponent[] } | null>(null);
  const linked = linkedPortKeys(document, instance.id);
  const componentsKey = `${instance.id}:${instance.baselineCommit}:${etag}`;

  const loadComponents = useCallback(async () => {
    const result = await getInstanceInterface(systemId, instance.id);
    if (result.state === "ready") {
      setComponents({ key: componentsKey, items: result.body.components });
    } else {
      toast.info("The board interface is still being read. Try again in a moment.");
      setShowAll(false);
    }
  }, [systemId, instance.id, componentsKey]);

  // The full component list is a separate read; refresh it when the system moves on.
  useEffect(() => {
    if (showAll && components?.key !== componentsKey) {
      loadComponents().catch((error: unknown) => toast.error(error instanceof Error ? error.message : "Could not read the board"));
    }
  }, [showAll, components?.key, componentsKey, loadComponents]);

  if (instance.interface?.status !== "ready") {
    return (
      <section className="space-y-2">
        <h3 className="text-sm font-semibold">Ports</h3>
        <p className="text-sm text-muted-foreground">
          {instance.interface?.status === "failed"
            ? `The board interface could not be read (${instance.interface.errorCode ?? "unknown error"}).`
            : "Reading the board interface…"}
        </p>
      </section>
    );
  }

  const rows: SystemPort[] = showAll && components?.key === componentsKey
    ? components.items.map((component) => ({ ...component, pinCount: component.pins.length }))
    : instance.ports ?? [];

  const setOverride = (port: SystemPort, state: "hidden" | "promoted" | null, message: string) =>
    run("override", () => setPortOverride(systemId, etag, instance.id, port.portKey, state), message);

  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">{showAll ? "All components" : "Ports"}</h3>
        <Button variant="ghost" size="sm" onClick={() => setShowAll((value) => !value)}>
          {showAll ? "Show ports only" : "Show all components"}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Connectors are detected automatically. Promote any other component to use it as a port, or hide a
        detected connector that is not one.
      </p>
      <div className="relative overflow-x-auto rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
            <tr>
              <th className="px-3 py-2 font-medium">Reference</th>
              <th className="px-3 py-2 font-medium">Value</th>
              <th className="px-3 py-2 font-medium">Pins</th>
              <th className="px-3 py-2 font-medium">State</th>
              {editable && <th className="px-3 py-2 font-medium"><span className="sr-only">Actions</span></th>}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={5} className="px-3 py-4 text-center text-muted-foreground">No ports on this board.</td></tr>
            )}
            {rows.map((port) => {
              const state = portState(port);
              const isLinked = linked.has(port.portKey);
              const exported = exportForPort(document, instance.id, port.portKey);
              return (
                <tr key={port.portKey} className="border-t">
                  <td className="px-3 py-2 font-medium" title={port.libId ?? undefined}>{port.reference}</td>
                  <td className="px-3 py-2 text-muted-foreground">{port.value ?? ""}</td>
                  <td className="px-3 py-2 tabular-nums">{port.pinCount}</td>
                  <td className="px-3 py-2">
                    <span className={cn(state === "hidden" || state === "not exposed" ? "text-muted-foreground" : "")}>{state}</span>
                    {isLinked && <Badge variant="outline" className="ml-2">linked</Badge>}
                    {exported && <Badge variant="outline" className="ml-2" title={exported.description || undefined}><Share2 className="h-3 w-3" /> exported as {exported.name}</Badge>}
                  </td>
                  {editable && (
                    <td className="whitespace-nowrap px-3 py-2 text-right">
                      {port.exposed && !isLinked && !exported && (
                        <Button size="sm" variant="ghost" disabled={busy !== null} onClick={() => setExporting(port)}>
                          <Share2 className="mr-1 h-3.5 w-3.5" /> Export
                        </Button>
                      )}
                      {port.override !== null ? (
                        <Button size="sm" variant="ghost" disabled={busy !== null || (port.override === "promoted" && isLinked && !port.candidate)}
                          onClick={() => void setOverride(port, null, `${port.reference} reset`)}>
                          <RotateCcw className="mr-1 h-3.5 w-3.5" /> Reset
                        </Button>
                      ) : port.exposed ? (
                        <Button size="sm" variant="ghost" disabled={busy !== null || isLinked || Boolean(exported)}
                          title={isLinked ? "A linked port cannot be hidden" : exported ? "An exported port cannot be hidden" : undefined}
                          onClick={() => void setOverride(port, "hidden", `${port.reference} hidden`)}>
                          <EyeOff className="mr-1 h-3.5 w-3.5" /> Hide
                        </Button>
                      ) : (
                        <Button size="sm" variant="ghost" disabled={busy !== null}
                          onClick={() => void setOverride(port, "promoted", `${port.reference} promoted`)}>
                          <Eye className="mr-1 h-3.5 w-3.5" /> Promote
                        </Button>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {exporting && (
        <ExportDialog title={`Export ${instance.label} ${exporting.reference}`}
          description="Publish this connector so a parent system can link to it. A linked port cannot be exported."
          initial={{ name: exporting.reference, description: "" }} submitLabel="Export"
          existingNames={(document.exports ?? []).map((entry) => entry.name)} busy={busy === "export"}
          onClose={() => setExporting(null)}
          onSubmit={async (value) => {
            const done = await run("export", () => createExport(systemId, etag, { ...value, instanceId: instance.id, portKey: exporting.portKey }),
              `Exported ${exporting.reference} as ${value.name}`);
            if (done) setExporting(null);
          }} />
      )}
    </section>
  );
}
