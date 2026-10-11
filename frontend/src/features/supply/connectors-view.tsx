import { useState } from "react";
import { Plug, Plus } from "lucide-react";
import { toast } from "sonner";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { PermissionHint } from "@/components/ui/permission-hint";
import { Skeleton } from "@/components/ui/skeleton";
import type { User } from "@/types/auth";
import { ConnectorCard, type ConnectorAction } from "./connector-card";
import { ConnectorCredentialsDialog } from "./connector-credentials-dialog";
import { CreateConnectorDialog } from "./create-connector-dialog";
import { EditConnectorDialog } from "./edit-connector-dialog";
import { PauseConnectorDialog } from "./pause-connector-dialog";
import { deleteSupplyConnector } from "./supply-api";
import { isQuickAction, useQuickConnectorActions } from "./use-connector-actions";
import { useConnectorSubmit } from "./use-connector-submit";
import { useSupplyConnectors } from "./use-supply-connectors";

type Dialog = { kind: "create" } | { kind: Exclude<ConnectorAction, "resume" | "enable" | "disable" | "terms">; id: string };

/** Library Manager > Connectors: distributor accounts, budgets and state. Admins change them. */
export function SupplyConnectorsView({ user }: { user: User | null }) {
  const isAdmin = user?.role === "admin";
  const { status, providers, connectors, error, apply, remove, reload } = useSupplyConnectors();
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const quick = useQuickConnectorActions(apply);
  const deletion = useConnectorSubmit();

  const target = dialog && dialog.kind !== "create" ? connectors.find((item) => item.id === dialog.id) ?? null : null;
  const fieldsFor = target ? providers.find((item) => item.key === target.provider)?.credential_fields ?? [] : [];
  const closeDialog = () => setDialog(null);

  const handleAction = (action: ConnectorAction, connector: (typeof connectors)[number]) => {
    if (isQuickAction(action)) {
      void quick(action, connector);
      return;
    }
    setDialog({ kind: action, id: connector.id });
  };

  const confirmDelete = async () => {
    if (!target) return;
    const deleted = await deletion.run(async () => {
      await deleteSupplyConnector(target.id);
      remove(target.id);
      toast.success("Connector deleted");
    });
    if (deleted) closeDialog();
  };

  const canAdd = isAdmin && providers.length > 0;

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="mx-auto max-w-4xl space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Supply</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight">Connectors</h2>
            <p className="mt-1 max-w-xl text-sm text-muted-foreground">
              Distributor accounts that supply stock, price and part data. One per provider and storefront.
            </p>
          </div>
          <PermissionHint blocked={!isAdmin} action="add connectors" allowedRoles={["admin"]}>
            <Button disabled={!canAdd} onClick={() => setDialog({ kind: "create" })}>
              <Plus className="h-4 w-4" />Add connector
            </Button>
          </PermissionHint>
        </div>

        {status === "loading" ? <ConnectorsSkeleton /> : null}
        {status === "error" ? (
          <Alert variant="destructive">
            <AlertDescription className="flex items-center justify-between gap-3">
              {error}
              <Button size="sm" variant="outline" onClick={reload}>Retry</Button>
            </AlertDescription>
          </Alert>
        ) : null}
        {status === "ready" && connectors.length === 0 ? <EmptyState noProviders={providers.length === 0} isAdmin={isAdmin} /> : null}
        {status === "ready" && connectors.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-2">
            {connectors.map((connector) => (
              <ConnectorCard key={connector.id} connector={connector} isAdmin={isAdmin} onAction={handleAction} />
            ))}
          </div>
        ) : null}
      </div>

      <CreateConnectorDialog
        open={dialog?.kind === "create"}
        onOpenChange={(open) => { if (!open) closeDialog(); }}
        providers={providers}
        onCreated={(connector) => { apply(connector); toast.success("Connector added"); }}
      />
      <EditConnectorDialog
        connector={dialog?.kind === "edit" ? target : null}
        onClose={closeDialog}
        onSaved={(connector) => { apply(connector); toast.success("Connector saved"); }}
      />
      <ConnectorCredentialsDialog
        connector={dialog?.kind === "credentials" ? target : null}
        fields={fieldsFor}
        onClose={closeDialog}
        onSaved={(connector) => { apply(connector); toast.success("Credentials replaced"); }}
      />
      <PauseConnectorDialog
        connector={dialog?.kind === "pause" ? target : null}
        onClose={closeDialog}
        onPaused={(connector) => { apply(connector); toast.success("Connector paused"); }}
      />
      <ConfirmDialog
        open={dialog?.kind === "delete" && target !== null}
        onOpenChange={(open) => { if (!open) closeDialog(); }}
        title={`Delete ${target?.display_name ?? "connector"}`}
        description="Its credentials and call history are removed. Parts and stock history already collected stay."
        confirmLabel="Delete"
        busy={deletion.busy}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  );
}

function ConnectorsSkeleton() {
  return (
    <div className="grid gap-3 md:grid-cols-2" aria-label="Loading connectors">
      <Skeleton className="h-44 w-full" />
      <Skeleton className="h-44 w-full" />
    </div>
  );
}

function EmptyState({ noProviders, isAdmin }: { noProviders: boolean; isAdmin: boolean }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed p-10 text-center">
      <Plug className="h-8 w-8 text-muted-foreground" />
      <p className="text-sm font-medium">No connectors yet</p>
      <p className="max-w-md text-sm text-muted-foreground">
        {noProviders
          ? "No distributor providers are installed on this server."
          : isAdmin
            ? "Add a distributor to start collecting stock and price data."
            : "An administrator can add a distributor connector."}
      </p>
    </div>
  );
}
