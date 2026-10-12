import { useCallback } from "react";

import { Button } from "@/components/ui/button";
import type { SupplySignin } from "@/types/supply";
import { formatWhen } from "./connector-status";
import { forgetSupplySignin, getSupplySignin, startSupplySignin } from "./supply-api";
import { useConnectorSubmit } from "./use-connector-submit";
import { useLoaded } from "./use-loaded";

const STATE_TEXT: Record<SupplySignin["state"], string> = {
  none: "Nobody is signed in, so change notices are not read.",
  ok: "",
  expired: "The sign-in ran out. Sign in again to keep reading change notices.",
  refused: "DigiKey refused the sign-in. Sign in again to keep reading change notices.",
};

/** DigiKey change notices need a person's sign-in at DigiKey. Administrators start it and see who did it and until when. */
export function ConnectorSignin({ connectorId }: { connectorId: string }) {
  const fetcher = useCallback((signal: AbortSignal) => getSupplySignin(connectorId, signal), [connectorId]);
  const loaded = useLoaded<SupplySignin>(`${connectorId}:signin`, fetcher, "Could not load the sign-in");
  const { busy, error, run } = useConnectorSubmit();
  const status = loaded.data;
  if (!status) return null;

  return (
    <div className="mt-3 space-y-1.5 border-t pt-3 text-xs">
      <p className="font-medium">Change notices</p>
      <p className="text-muted-foreground">
        {status.signed_in
          ? `Signed in by ${status.granted_by}${status.expires_at ? ` until ${formatWhen(status.expires_at)}` : ""}.`
          : STATE_TEXT[status.state]}
      </p>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" disabled={busy}
          onClick={() => void run(async () => { window.location.assign(await startSupplySignin(connectorId)); })}>
          {status.signed_in ? "Sign in again" : "Sign in at DigiKey"}
        </Button>
        {status.state !== "none" ? (
          <Button size="sm" variant="ghost" disabled={busy}
            onClick={() => void run(async () => { await forgetSupplySignin(connectorId); await loaded.refresh(); })}>
            Sign out
          </Button>
        ) : null}
      </div>
      {!status.signed_in ? (
        <p className="break-all text-muted-foreground">The DigiKey app must list this callback address: {status.redirect_uri}</p>
      ) : null}
      {error ? <p role="alert" className="text-destructive">{error}</p> : null}
    </div>
  );
}
