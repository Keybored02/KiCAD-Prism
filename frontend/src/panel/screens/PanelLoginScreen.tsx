import { useState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { startAgentSignIn } from "@/lib/kicad-agent-signin";

interface PanelLoginScreenProps {
  onLogin: () => void;
  isLoading: boolean;
  error: string | null;
  sessionReady: boolean;
}

export function PanelLoginScreen({
  onLogin,
  isLoading,
  error,
  sessionReady,
}: PanelLoginScreenProps) {
  // Signing in with the sign-in the plugin already has. Purely an alternative to the
  // button below: it fails to the same KiCad flow, so nothing depends on it working.
  const [agentBusy, setAgentBusy] = useState(false);
  const [agentError, setAgentError] = useState<string | null>(null);

  const useAgentSignIn = async () => {
    setAgentBusy(true);
    setAgentError(null);
    try {
      // A full navigation, so this browser keeps the session cookie the handoff URL
      // sets, then comes back here authenticated.
      window.location.href = await startAgentSignIn(
        window.location.pathname + window.location.search,
      );
    } catch (err) {
      setAgentError(
        err instanceof Error ? err.message : "Couldn't use the plugin's sign-in.",
      );
      setAgentBusy(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-3rem)] flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-5">
        {/* Branding */}
        <div className="space-y-1 text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-primary">
            KiCAD Prism
          </p>
          <h1 className="text-xl font-semibold tracking-tight">
            Remote Library
          </h1>
          <p className="text-xs text-muted-foreground">
            Search and place components from the Prism catalog directly into
            KiCad.
          </p>
        </div>

        {/* Login Card */}
        <Card className="border-primary/30 ring-1 ring-primary/20">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-sm">Sign In</CardTitle>
            <CardDescription className="text-xs">
              {sessionReady
                ? "Authenticate via KiCad to access the component catalog."
                : "Waiting for KiCad to establish a session…"}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-3 pb-5">
            <Button
              className="w-full"
              onClick={onLogin}
              disabled={isLoading || !sessionReady}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                  Authenticating…
                </>
              ) : (
                "Sign In via KiCad"
              )}
            </Button>

            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
              <span className="h-px flex-1 bg-border" />
              <span>or</span>
              <span className="h-px flex-1 bg-border" />
            </div>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => void useAgentSignIn()}
              disabled={agentBusy || isLoading}
            >
              {agentBusy ? (
                <>
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                  Signing in…
                </>
              ) : (
                "Use the plugin's sign-in"
              )}
            </Button>

            {agentError && (
              <div className="rounded border border-destructive/30 bg-destructive/10 px-3 py-2 text-[11px] text-destructive">
                {agentError}
              </div>
            )}

            {!sessionReady && (
              <div className="flex items-center justify-center gap-2 rounded border bg-muted/20 px-3 py-2 text-[11px] text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>Waiting for KiCad session…</span>
              </div>
            )}

            {error && (
              <div className="rounded border border-destructive/30 bg-destructive/10 px-3 py-2 text-[11px] text-destructive">
                {error}
              </div>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-[10px] text-muted-foreground">
          Authentication is handled through KiCad's system browser.
        </p>
      </div>
    </div>
  );
}
