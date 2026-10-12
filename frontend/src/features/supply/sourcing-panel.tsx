import { useState } from "react";
import { Link } from "react-router-dom";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { canEditSupply } from "@/lib/roles";
import type { User } from "@/types/auth";
import { PartDetailSections } from "./part-detail-sections";
import { StatusDot } from "./status-dot";
import { STATUS_LABEL } from "./supply-format";
import { addSupplyWatch } from "./supply-api";
import { useSupplyPart, useSupplyPartFor } from "./use-supply-parts";

interface SourcingPanelProps {
  manufacturer: string;
  mpn: string;
  user: User | null;
}

/**
 * The Sourcing tab of a catalog component: what the distributors hold for its manufacturer part.
 * A component without a manufacturer part number has nothing to look up.
 */
export default function SourcingPanel({ manufacturer, mpn, user }: SourcingPanelProps) {
  if (!manufacturer.trim() || !mpn.trim()) {
    return (
      <Alert>
        <AlertDescription>This component needs a manufacturer and a manufacturer part number before it can be looked up.</AlertDescription>
      </Alert>
    );
  }
  return <Lookup manufacturer={manufacturer.trim()} mpn={mpn.trim()} user={user} />;
}

function Lookup({ manufacturer, mpn, user }: SourcingPanelProps) {
  const lookup = useSupplyPartFor(manufacturer, mpn);
  if (lookup.status === "loading") return <Skeleton className="h-40 w-full" aria-label="Looking the part up" />;
  if (lookup.status === "error") return <Failure message={lookup.error} onRetry={lookup.retry} />;
  if (lookup.data === null) {
    return <Untracked manufacturer={manufacturer} mpn={mpn} canEdit={canEditSupply(user?.role)} onTracked={lookup.retry} />;
  }
  return <Tracked key={lookup.data} partId={lookup.data} user={user} />;
}

function Failure({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <Alert variant="destructive">
      <AlertDescription className="flex items-center justify-between gap-3">
        {message}
        <Button size="sm" variant="outline" onClick={onRetry}>Retry</Button>
      </AlertDescription>
    </Alert>
  );
}

function Untracked({ manufacturer, mpn, canEdit, onTracked }: { manufacturer: string; mpn: string; canEdit: boolean; onTracked: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const track = async () => {
    setBusy(true);
    setError("");
    try {
      await addSupplyWatch({ manufacturer, mpn });
      onTracked();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not watch the part");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="space-y-3 border p-4">
      <p className="text-sm font-medium">Prism is not tracking {mpn} yet.</p>
      <p className="text-sm text-muted-foreground">
        Watch it to read its stock, price and lifecycle from the connected distributors and keep the history.
      </p>
      {canEdit ? (
        <Button size="sm" disabled={busy} onClick={() => void track()}>Watch this part</Button>
      ) : (
        <p className="text-xs text-muted-foreground">Watching a part needs the Designer or Admin role.</p>
      )}
      {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}

function Tracked({ partId, user }: { partId: string; user: User | null }) {
  const part = useSupplyPart(partId);
  if (part.status === "loading") return <Skeleton className="h-40 w-full" aria-label="Loading the part" />;
  if (part.status === "error" || !part.data) return <Failure message={part.error} onRetry={part.retry} />;
  const detail = part.data;
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm">
          <StatusDot status={detail.status} />
          <span className="font-medium">{STATUS_LABEL[detail.status]}</span>
        </div>
        <Link to={`/?section=supply&supplyView=parts&part=${encodeURIComponent(partId)}`} className="text-xs text-primary hover:underline">
          Open in Supply
        </Link>
      </div>
      <PartDetailSections detail={detail} canEdit={canEditSupply(user?.role)} onChanged={part.refresh} />
    </div>
  );
}
