import { useEffect, useState } from "react";
import { Box, ExternalLink, Layers, Lock, Share2, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fetchJson } from "@/lib/api";
import { getHierarchy, removeInstance, updateInstance } from "@/lib/systems-api";
import type { CatalogComponent } from "@/types/catalog";
import type { SystemDocument, SystemHierarchy, SystemInstance } from "@/types/system";

import { catalogComponentHref } from "./publish-dialog";
import { TONE_BADGE, boardStatus } from "./system-format";
import type { Mutate } from "./use-system-mutation";

const STAGE: Record<string, string> = {
  open: "open", in_progress: "in progress", qa_review: "in QA review", done: "approved", released: "released", archived: "archived",
};

interface SubsystemDetailProps {
  systemId: string;
  document: SystemDocument;
  instance: SystemInstance;
  etag: string;
  canEdit: boolean;
  busy: string | null;
  run: Mutate;
}

/**
 * An assembly instance: the catalog revision it pins and the boards inside it (CONTRACTS_P2 §5). A module
 * instance (§5.6) shows the same revision facts and its connectors.
 */
export function SubsystemDetail({ systemId, document, instance, etag, canEdit, busy, run }: SubsystemDetailProps) {
  const isModule = instance.kind === "module";
  const noun = isModule ? "module" : "subsystem";
  const [removing, setRemoving] = useState(false);
  const [tree, setTree] = useState<{ key: string; body: SystemHierarchy } | null>(null);
  const ref = instance.catalog;
  const status = boardStatus(instance);
  const linkCount = document.links.filter((link) => link.a.instanceId === instance.id || link.b.instanceId === instance.id).length;
  const treeKey = `${systemId}:${etag}`;

  useEffect(() => {
    let cancelled = false;
    getHierarchy(systemId).then((body) => !cancelled && setTree({ key: treeKey, body })).catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [systemId, treeKey]);

  const inside = (tree?.key === treeKey ? tree.body.occurrences : [])
    .filter((occurrence) => occurrence.path.startsWith(`/${instance.id}/`));

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {isModule ? <Box className="h-4 w-4 text-muted-foreground" aria-hidden /> : <Layers className="h-4 w-4 text-muted-foreground" aria-hidden />}
            <h2 className="text-lg font-semibold">{instance.label}</h2>
            <Badge variant="outline">{isModule ? "Module" : "Subsystem"}</Badge>
            <Badge variant={TONE_BADGE[status.tone]} title={status.detail}>{status.label}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {instance.projectName ?? (isModule ? "Catalog module" : "Catalog assembly")}{ref?.identity ? ` · ${ref.identity}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {ref?.systemId && (
            <Button asChild variant="outline" size="sm">
              <a href={`/systems/${encodeURIComponent(ref.systemId)}`}><ExternalLink className="mr-1 h-4 w-4" /> Open system</a>
            </Button>
          )}
          {ref && (
            <Button asChild variant="ghost" size="sm">
              <a href={catalogComponentHref(ref.componentId)}>In library</a>
            </Button>
          )}
          {canEdit && (
            <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setRemoving(true)}>
              <Trash2 className="mr-1 h-4 w-4" /> Remove
            </Button>
          )}
        </div>
      </header>

      <dl className="grid gap-px border bg-border text-sm sm:grid-cols-3">
        <div className="bg-card px-4 py-3">
          <dt className="text-xs text-muted-foreground">Revision</dt>
          <dd className="mt-1">{ref?.version ? `v${ref.version}` : "—"} {ref?.releaseStatus ? `· ${STAGE[ref.releaseStatus] ?? ref.releaseStatus}` : ""}</dd>
        </div>
        {!isModule && (
          <div className="bg-card px-4 py-3">
            <dt className="text-xs text-muted-foreground">Source snapshot</dt>
            <dd className="mt-1">{ref?.snapshotName ?? "—"}</dd>
          </div>
        )}
        <div className="bg-card px-4 py-3">
          <dt className="text-xs text-muted-foreground">Updates</dt>
          <dd className="mt-1 flex items-center gap-2">
            {canEdit ? (
              <Select value={ref?.follow ?? "pinned"} disabled={busy !== null}
                onValueChange={(value) => void run("update", () => updateInstance(systemId, etag, instance.id,
                  { follow: value as "pinned" | "latest_released" }), value === "pinned" ? "Pinned to this revision" : "Following released revisions")}>
                <SelectTrigger aria-label="Updates" className="h-8"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="latest_released">Follow released revisions</SelectItem>
                  <SelectItem value="pinned">Keep this revision</SelectItem>
                </SelectContent>
              </Select>
            ) : (ref?.follow === "pinned" ? "Keeps this revision" : "Follows released revisions")}
          </dd>
        </div>
      </dl>

      <section className="space-y-2">
        <h3 className="text-sm font-semibold">{isModule ? "Connectors" : "Exports"}</h3>
        <p className="text-xs text-muted-foreground">
          {isModule
            ? "One per unit of the module's symbol, each a catalog connector part placed on its model. Link to them on the Diagram."
            : "The connectors this subsystem offers. Link to them on the Diagram."}
        </p>
        {(instance.ports ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">{isModule ? "This revision has no connectors." : "This revision exports nothing."}</p>
        ) : (
          <ul className="divide-y rounded-md border text-sm">
            {(instance.ports ?? []).map((port) => (
              <li key={port.portKey} className="flex items-center gap-2 px-3 py-2">
                <Share2 className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
                <span className="font-medium">{port.reference}</span>
                <span className="text-muted-foreground">{port.value ?? ""} · {port.pinCount} pins</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {!isModule && <section className="space-y-2">
        <h3 className="text-sm font-semibold">Inside</h3>
        {inside.length === 0 ? (
          <p className="text-sm text-muted-foreground">{tree ? "Nothing you can see." : "Reading the hierarchy…"}</p>
        ) : (
          <ul className="space-y-1 text-sm" aria-label="Subsystem contents">
            {inside.map((occurrence) => (
              <li key={occurrence.path} className="flex items-center gap-2" style={{ paddingLeft: `${(occurrence.depth - 2) * 16}px` }}>
                {occurrence.kind === "assembly" ? <Layers className="h-3.5 w-3.5 text-muted-foreground" aria-hidden /> : null}
                {occurrence.restricted ? <Lock className="h-3 w-3" aria-label="restricted" /> : null}
                <span>{occurrence.labels[occurrence.labels.length - 1]}</span>
              </li>
            ))}
          </ul>
        )}
      </section>}

      <ConfirmDialog
        open={removing}
        onOpenChange={setRemoving}
        title={`Remove ${instance.label}?`}
        description={linkCount > 0
          ? `This ${noun} is an end of ${linkCount} ${linkCount === 1 ? "link" : "links"}. Removing it deletes those links and their rows.`
          : `The ${noun} is removed from this system. The catalog item is not touched.`}
        confirmLabel={`Remove ${noun}`}
        destructive
        busy={busy === "remove"}
        onConfirm={() => {
          void run("remove", () => removeInstance(systemId, etag, instance.id, linkCount > 0), `Removed ${instance.label}`)
            .then(() => setRemoving(false));
        }}
      />
    </div>
  );
}

interface AddSubsystemDialogProps {
  /** `module`: a bought-out catalog module (§5.6); an assembly otherwise. */
  kind?: "assembly" | "module";
  existingLabels: string[];
  busy: boolean;
  onClose: () => void;
  onSubmit: (value: { label: string; componentId: string; revisionId?: string; follow: "pinned" | "latest_released" }) => void | Promise<void>;
}

/** Pick a catalog assembly (or module) to place in this system. */
export function AddSubsystemDialog({ kind = "assembly", existingLabels, busy, onClose, onSubmit }: AddSubsystemDialogProps) {
  const isModule = kind === "module";
  const [items, setItems] = useState<CatalogComponent[] | null>(null);
  const [componentId, setComponentId] = useState("");
  const [label, setLabel] = useState("");
  const [failed, setFailed] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchJson<{ items: CatalogComponent[] }>(`/api/catalog/components?kind=${kind}&page_size=200`)
      .then((body) => !cancelled && setItems(body.items))
      .catch((error: unknown) => !cancelled && setFailed(error instanceof Error ? error.message : "Could not read the catalog"));
    return () => {
      cancelled = true;
    };
  }, [kind]);

  const chosen = items?.find((item) => item.id === componentId);
  const released = Boolean(chosen?.released_revision_id);
  const taken = existingLabels.some((existing) => existing.toLowerCase() === label.trim().toLowerCase());
  const ready = Boolean(chosen) && label.trim().length > 0 && !taken;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isModule ? "Add a module" : "Add a subsystem"}</DialogTitle>
          <DialogDescription>
            {isModule
              ? "Place a catalog module (a bought-out unit). Its connectors are ports: link, harness and mate them like a board's."
              : "Place a published assembly in this system. Link to its exports like any other port."}
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={(event) => {
          event.preventDefault();
          if (!ready || !chosen) return;
          void onSubmit(released
            ? { label: label.trim(), componentId: chosen.id, follow: "latest_released" }
            : { label: label.trim(), componentId: chosen.id, revisionId: chosen.current_revision_id, follow: "pinned" });
        }}>
          <div className="space-y-1.5">
            <Label htmlFor="subsystem-component">{isModule ? "Module" : "Assembly"}</Label>
            {failed ? <p className="text-sm text-destructive">{failed}</p> : (
              <Select value={componentId} onValueChange={(value) => {
                setComponentId(value);
                const item = items?.find((candidate) => candidate.id === value);
                if (item && !label.trim()) setLabel(item.name);
              }}>
                <SelectTrigger id="subsystem-component" aria-label={isModule ? "Module" : "Assembly"}>
                  <SelectValue placeholder={items ? (items.length ? `Choose ${isModule ? "a module" : "an assembly"}`
                    : isModule ? "No modules in the catalog yet" : "No assemblies published yet") : "Loading…"} />
                </SelectTrigger>
                <SelectContent>
                  {(items ?? []).map((item) => (
                    <SelectItem key={item.id} value={item.id}>{item.name} · {item.value}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {chosen && !released && (
              <p className="text-xs text-warning">Not released yet: it will be pinned to its current revision, with a warning, until QA releases one.</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="subsystem-label">Label in this system</Label>
            <Input id="subsystem-label" value={label} maxLength={100} placeholder="e.g. CNDH-A" onChange={(event) => setLabel(event.target.value)} />
            {taken && <p className="text-xs text-destructive">Another instance already has this label.</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={busy || !ready}>{busy ? "Adding…" : isModule ? "Add module" : "Add subsystem"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
