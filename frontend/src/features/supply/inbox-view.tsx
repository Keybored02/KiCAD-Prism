import { useState } from "react";
import { BellRing } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { canEditSupply } from "@/lib/roles";
import type { User } from "@/types/auth";
import { AlertRow } from "./alert-row";
import { acknowledgeSupplyAlert, snoozeSupplyAlert } from "./supply-api";
import { useConnectorSubmit } from "./use-connector-submit";
import { useSupplyAlerts } from "./use-supply-parts";
import { useSupplyNavigation } from "./use-supply-navigation";

/** What watched parts have crossed: out of stock, under the threshold, going obsolete, lost. In the app only. */
export function InboxView({ user }: { user: User | null }) {
  const [showCleared, setShowCleared] = useState(false);
  const { status, data, error, retry, refresh } = useSupplyAlerts(showCleared);
  const { busy, error: actionError, run } = useConnectorSubmit();
  const { openPart } = useSupplyNavigation();
  const canAct = canEditSupply(user?.role);

  const act = (action: () => Promise<void>) => void run(async () => {
    await action();
    await refresh();
  });

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="mx-auto max-w-4xl space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Supply</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight">Inbox</h2>
            <p className="mt-1 max-w-xl text-sm text-muted-foreground">
              Watched parts that ran out, fell to their threshold, went end of life or disappeared. Alerts clear by
              themselves when the part recovers.
              {canAct ? "" : " Designers and administrators acknowledge and snooze."}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="inbox-cleared" checked={showCleared} onCheckedChange={(checked) => setShowCleared(checked === true)} />
            <Label htmlFor="inbox-cleared" className="font-normal">Show cleared</Label>
          </div>
        </div>

        {status === "loading" ? <Skeleton className="h-40 w-full" aria-label="Loading alerts" /> : null}
        {status === "error" ? (
          <Alert variant="destructive">
            <AlertDescription className="flex items-center justify-between gap-3">
              {error}
              <Button size="sm" variant="outline" onClick={retry}>Retry</Button>
            </AlertDescription>
          </Alert>
        ) : null}
        {actionError ? <Alert variant="destructive"><AlertDescription>{actionError}</AlertDescription></Alert> : null}
        {status === "ready" && data ? (
          data.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed p-10 text-center">
              <BellRing className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm font-medium">{showCleared ? "Nothing here yet" : "Nothing needs you"}</p>
              <p className="max-w-md text-sm text-muted-foreground">
                Watched parts that need attention show up here after they have been read twice.
              </p>
            </div>
          ) : (
            <ul className="rounded-lg border">
              {data.map((alert) => (
                <AlertRow
                  key={alert.id}
                  alert={alert}
                  canAct={canAct}
                  busy={busy}
                  onOpenPart={openPart}
                  onAcknowledge={(id) => act(() => acknowledgeSupplyAlert(id))}
                  onSnooze={(id, hours) => act(() => snoozeSupplyAlert(id, hours))}
                />
              ))}
            </ul>
          )
        ) : null}
      </div>
    </div>
  );
}
