import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  findAgentSignIn,
  startAgentSignIn,
  type AgentSignIn,
} from "@/lib/kicad-agent-signin";

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
  // The Prism agent's sign-in, offered when there is one to use. The user signed in
  // once in the KiCad plugin; asking again here proves nothing new. Absent on a
  // machine with no agent, which is the normal case and shows nothing.
  const [agent, setAgent] = useState<AgentSignIn | null>(null);
  const [agentBusy, setAgentBusy] = useState(false);
  const [agentError, setAgentError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void findAgentSignIn().then((found) => {
      if (!cancelled) setAgent(found);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const useAgentSignIn = async () => {
    if (!agent) return;
    setAgentBusy(true);
    setAgentError(null);
    try {
      // A full navigation: the point is to land on the handoff URL so this panel
      // keeps the session cookie it sets, then come back here authenticated.
      window.location.href = await startAgentSignIn(
        agent.port,
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
            {/* The account is named rather than assumed: the plugin may be signed
                in as someone other than whoever is at the keyboard, and silently
                using that account would be worse than a click. */}
            {agent && (
              <>
                <Button
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
                    `Continue as ${agent.email}`
                  )}
                </Button>
                <p className="text-center text-[10px] text-muted-foreground">
                  Already signed in through the KiCad plugin.
                </p>

                {agentError && (
                  <div className="rounded border border-destructive/30 bg-destructive/10 px-3 py-2 text-[11px] text-destructive">
                    {agentError}
                  </div>
                )}

                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                  <span className="h-px flex-1 bg-border" />
                  <span>or</span>
                  <span className="h-px flex-1 bg-border" />
                </div>
              </>
            )}

            <Button
              className="w-full"
              variant={agent ? "outline" : "default"}
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
