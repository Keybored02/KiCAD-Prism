import { useCallback, useState } from "react";
import { MoreHorizontal, Plus, Warehouse } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { InventorySource } from "@/types/supply";
import { deleteInventorySource, listInventorySources, updateInventorySource } from "./inventory-api";
import { formatDateTime } from "./supply-format";
import { invalidateSupply, useLoaded } from "./use-loaded";
import { InventorySourceDialog } from "./inventory-source-dialogs";
import { PushTokenDialog } from "./push-token-dialog";

type Dialog = { kind: "create" } | { kind: "edit" | "delete" | "push-token"; source: InventorySource };

/** The state a source is in, worst first. */
export function sourceState(source: InventorySource): { label: string; tone: "default" | "secondary" | "destructive" | "outline" } {
  if (!source.enabled) return { label: "Disabled", tone: "secondary" };
  if (source.kind === "push") return source.last_sync_at ? { label: "Pushed", tone: "default" } : { label: "Not pushed yet", tone: "outline" };
  // A server source from before Prism stopped reading them: it stays listed until an administrator deletes it.
  return { label: "Not read any more", tone: "secondary" };
}

const load = () => invalidateSupply("inventory");

async function toggle(source: InventorySource) {
  try {
    await updateInventorySource(source.id, { enabled: !source.enabled });
  } catch (caught) {
    toast.error(caught instanceof Error ? caught.message : "Could not save the source");
  }
}

/** Supply > Sources, local inventory: sources that push their stock to Prism, filling the catalog. */
export function InventorySourcesSection({ isAdmin }: { isAdmin: boolean }) {
  const fetcher = useCallback((signal: AbortSignal) => listInventorySources(signal), []);
  const loaded = useLoaded("inventory/sources", fetcher, "Could not load inventory sources");
  const sources = loaded.data;
  const failed = loaded.status === "error" ? loaded.error : "";
  const [dialog, setDialog] = useState<Dialog | null>(null);

  const remove = async (source: InventorySource) => {
    try {
      await deleteInventorySource(source.id);
      void load();
      setDialog(null);
      toast.success("Source deleted");
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : "Could not delete the source");
    }
  };

  return (
    <section className="space-y-3" aria-label="Local inventory">
      <div className="flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-sm font-semibold"><Warehouse className="h-4 w-4 text-muted-foreground" />Local inventory</h3>
        {isAdmin ? <Button size="sm" variant="outline" onClick={() => setDialog({ kind: "create" })}><Plus className="h-4 w-4" />Add source</Button> : null}
      </div>
      {failed ? <p className="text-sm text-destructive">{failed}</p> : null}
      {sources && sources.length === 0 ? <p className="border border-dashed p-4 text-center text-sm text-muted-foreground">No inventory sources</p> : null}
      {sources && sources.length > 0 ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(24rem,1fr))] gap-3">
          {sources.map((source) => (
            <SourceCard
              key={source.id}
              source={source}
              isAdmin={isAdmin}
              onToggle={() => void toggle(source)}
              onOpen={(kind) => setDialog({ kind, source })}
            />
          ))}
        </div>
      ) : null}

      {dialog?.kind === "create" || dialog?.kind === "edit" ? (
        <InventorySourceDialog
          key={dialog.kind === "edit" ? dialog.source.id : "create"}
          open
          source={dialog.kind === "edit" ? dialog.source : null}
          onClose={() => setDialog(null)}
          onSaved={(source) => {
            void load();
            toast.success("Source saved");
            if (dialog.kind === "create") setDialog({ kind: "push-token", source });
          }}
        />
      ) : null}
      <PushTokenDialog
        key={dialog?.kind === "push-token" ? `push-token:${dialog.source.id}` : "push-token"}
        target="inventory_source"
        id={dialog?.kind === "push-token" ? dialog.source.id : null}
        name={dialog?.kind === "push-token" ? dialog.source.display_name : ""}
        onClose={() => setDialog(null)}
      />
      <ConfirmDialog
        open={dialog?.kind === "delete"}
        onOpenChange={(open) => { if (!open) setDialog(null); }}
        title={`Delete ${dialog?.kind === "delete" ? dialog.source.display_name : "source"}`}
        description="Its token, the stock it brought in and its unmatched parts are removed."
        confirmLabel="Delete"
        onConfirm={() => { if (dialog?.kind === "delete") void remove(dialog.source); }}
      />
    </section>
  );
}

function SourceCard({ source, isAdmin, onToggle, onOpen }: {
  source: InventorySource;
  isAdmin: boolean;
  onToggle: () => void;
  onOpen: (kind: "edit" | "delete" | "push-token") => void;
}) {
  const state = sourceState(source);
  const pushed = source.kind === "push";
  const host = pushed ? "Push" : source.base_url.replace(/^https:\/\//, "");
  return (
    <article className="border bg-card p-4" aria-label={source.display_name}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="truncate text-sm font-semibold">{source.display_name}</h4>
            <Badge variant={state.tone}>{state.label}</Badge>
          </div>
          <p className="mt-0.5 truncate text-xs text-muted-foreground" title={source.base_url}>{host}</p>
        </div>
        {isAdmin ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label={`Actions for ${source.display_name}`}><MoreHorizontal className="h-4 w-4" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {pushed ? <DropdownMenuItem onSelect={() => onOpen("push-token")}>Push token</DropdownMenuItem> : null}
              <DropdownMenuItem onSelect={() => onOpen("edit")}>Edit</DropdownMenuItem>
              <DropdownMenuItem onSelect={onToggle}>{source.enabled ? "Disable" : "Enable"}</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onSelect={() => onOpen("delete")}>Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </div>
      <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
        <dt className="text-muted-foreground">{pushed ? "Last push" : "Last read"}</dt>
        <dd>{formatDateTime(source.last_sync_at) || "-"}</dd>
        <dt className="text-muted-foreground">Parts</dt><dd>{`${source.matched.toLocaleString()} matched · ${source.unmatched.toLocaleString()} unmatched`}</dd>
      </dl>
      {source.last_status === "error" && source.last_error ? <p className="mt-2 truncate text-xs text-destructive" title={source.last_error}>{source.last_error}</p> : null}
    </article>
  );
}
