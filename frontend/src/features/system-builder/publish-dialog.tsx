import { useState } from "react";
import { PackageCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { SnapshotMeta, SnapshotPublication } from "@/types/system";

export interface PublishFields {
  ipn?: string;
  name?: string;
  description?: string;
  manufacturer?: string;
}

/** Where a catalog component opens in the library manager. */
export function catalogComponentHref(componentId: string): string {
  return `/?section=library-manager&component=${encodeURIComponent(componentId)}`;
}

const STAGE_LABELS: Record<string, string> = {
  open: "open", in_progress: "in progress", qa_review: "in QA review", done: "approved", released: "released",
  archived: "archived",
};

/** "Catalog v2 · released": the revision a snapshot was published as. */
export function PublicationBadge({ publication }: { publication: SnapshotPublication }) {
  const stage = publication.releaseStatus ? STAGE_LABELS[publication.releaseStatus] ?? publication.releaseStatus : "";
  return (
    <Badge asChild variant={publication.releaseStatus === "released" ? "success" : "outline"}>
      <a href={catalogComponentHref(publication.componentId)}
        title={`Open the assembly in the component library${publication.commit ? ` (commit ${publication.commit})` : ""}`}>
        <PackageCheck className="h-3 w-3" /> Catalog{publication.version ? ` v${publication.version}` : ""}{stage ? ` · ${stage}` : ""}
      </a>
    </Badge>
  );
}

interface PublishDialogProps {
  snapshot: SnapshotMeta;
  systemName: string;
  /** The first publish creates the assembly, so it asks for its identity. */
  firstPublish: boolean;
  busy: boolean;
  onClose: () => void;
  onPublish: (fields: PublishFields) => void | Promise<void>;
}

export function PublishDialog({ snapshot, systemName, firstPublish, busy, onClose, onPublish }: PublishDialogProps) {
  const [ipn, setIpn] = useState("");
  const [name, setName] = useState(systemName);
  const [description, setDescription] = useState("");
  const [manufacturer, setManufacturer] = useState("");
  const missing = firstPublish && !ipn.trim();
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Publish {snapshot.name} to the catalog</DialogTitle>
          <DialogDescription>
            {firstPublish
              ? "This creates the system's assembly in the component library. Its exports become the assembly's interface, and parent systems can pin it once QA releases it."
              : "This adds a new revision of the system's assembly. It goes through the catalog workflow before parent systems following released revisions take it."}
          </DialogDescription>
        </DialogHeader>
        {snapshot.openReviewCount > 0 && (
          <p className="rounded-md border border-warning/40 bg-warning/10 p-2 text-xs text-warning">
            This snapshot has {snapshot.openReviewCount} unreviewed {snapshot.openReviewCount === 1 ? "change" : "changes"}. It can be
            published, but the catalog will not release it.
          </p>
        )}
        <form className="space-y-4" onSubmit={(event) => {
          event.preventDefault();
          if (missing) return;
          void onPublish(firstPublish
            ? { ipn: ipn.trim(), name: name.trim() || undefined, description: description.trim() || undefined,
                manufacturer: manufacturer.trim() || undefined }
            : {});
        }}>
          {firstPublish && (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="publish-ipn">Internal part number</Label>
                <Input id="publish-ipn" value={ipn} maxLength={100} autoFocus placeholder="e.g. IPN-100234"
                  onChange={(event) => setIpn(event.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="publish-name">Assembly name</Label>
                <Input id="publish-name" value={name} maxLength={200} onChange={(event) => setName(event.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="publish-manufacturer">Manufacturer</Label>
                <Input id="publish-manufacturer" value={manufacturer} maxLength={200} placeholder="In-house"
                  onChange={(event) => setManufacturer(event.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="publish-description">Description</Label>
                <Textarea id="publish-description" value={description} rows={2} maxLength={4000}
                  onChange={(event) => setDescription(event.target.value)} />
              </div>
            </>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={busy || missing}>{busy ? "Publishing…" : "Publish"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
