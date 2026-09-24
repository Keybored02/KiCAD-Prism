import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, ChevronRight, Plus, RefreshCw } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ConnectorSettings } from "@/features/tracker-integration/connector-settings";
import { getOAuthCallbackUrl, listConnectors, TrackerApiError } from "@/lib/trackers-client";
import type { TrackerConnector } from "@/types/trackers";

import { CODE_HOST_PROVIDERS, CodeHostMark, instanceLabel, providerName, type CodeHostProvider } from "./code-host-meta";
import { OAuthHostForm } from "./oauth-host-form";

type View =
    | { kind: "list" }
    | { kind: "choose" }
    | { kind: "edit"; provider: CodeHostProvider; connectorId: string | null };

const PROVIDER_PITCH: Record<CodeHostProvider, { what: string; needs: string }> = {
    github: {
        what: "Publish review threads as issues, sync replies both ways, and link accounts.",
        needs: "A GitHub App installed on your repositories.",
    },
    gitlab: {
        what: "Link accounts on GitLab.com or your own GitLab.",
        needs: "An OAuth application on that GitLab. Issue publishing is not available yet.",
    },
    gitea: {
        what: "Link accounts on Codeberg or your own Gitea or Forgejo server.",
        needs: "An OAuth2 application on that server. Issue publishing is not available yet.",
    },
};

function status(connector: TrackerConnector): { label: string; variant: "success" | "warning" | "destructive" | "outline" } {
    if (connector.pausedReason === "revoked") return { label: "Credentials revoked", variant: "destructive" };
    if (connector.provider !== "github") {
        return connector.capabilities?.accountLinking || connector.oauthClientConfigured
            ? { label: "Ready", variant: "success" }
            : { label: "Needs OAuth app", variant: "warning" };
    }
    if (connector.writesEnabled) return { label: "Ready", variant: "success" };
    if (connector.paused && connector.pausedReason === "test_failed") return { label: "Needs a connection test", variant: "warning" };
    if (connector.paused) return { label: "Paused", variant: "warning" };
    return { label: "Needs a connection test", variant: "warning" };
}

function hostOf(connector: TrackerConnector): string {
    if (connector.host) return connector.host;
    try {
        return connector.baseUrl ? new URL(connector.baseUrl).host : "";
    } catch {
        return connector.baseUrl;
    }
}

/**
 * Admin view of the code hosts this workspace talks to: which can publish
 * issues, which people can link accounts on, and each one's setup.
 */
// react-doctor-disable-next-line prefer-useReducer - list loading and the master/detail view are independent
export function CodeHostsSettings({ onOpenConnectedAccounts }: { onOpenConnectedAccounts?: () => void }) {
    const [view, setView] = useState<View>({ kind: "list" });
    const [connectors, setConnectors] = useState<TrackerConnector[]>([]);
    const [phase, setPhase] = useState<"loading" | "ready" | "error">("loading");
    const [loadError, setLoadError] = useState<string | null>(null);
    const [reloadKey, setReloadKey] = useState(0);
    const [callbackUrl, setCallbackUrl] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        setPhase("loading");
        void Promise.all([listConnectors(), getOAuthCallbackUrl().catch(() => null)])
            .then(([rows, callback]) => {
                if (cancelled) return;
                setConnectors(rows);
                setCallbackUrl(callback);
                setPhase("ready");
            })
            .catch((error: unknown) => {
                if (cancelled) return;
                setLoadError(error instanceof TrackerApiError || error instanceof Error
                    ? error.message : "Code hosts could not be loaded.");
                setPhase("error");
            });
        return () => { cancelled = true; };
    }, [reloadKey]);

    const upsert = useCallback((next: TrackerConnector) => {
        setConnectors((current) => current.some((row) => row.id === next.id)
            ? current.map((row) => (row.id === next.id ? next : row))
            : [...current, next]);
    }, []);

    const githubChanged = useCallback((next: TrackerConnector) => {
        upsert(next);
        setView((current) => current.kind === "edit" && current.provider === "github" && !current.connectorId
            ? { kind: "edit", provider: "github", connectorId: next.id }
            : current);
    }, [upsert]);

    const removed = useCallback((connectorId: string) => {
        setConnectors((current) => current.filter((row) => row.id !== connectorId));
        setView({ kind: "list" });
    }, []);

    const back = (
        <Button variant="ghost" size="sm" className="-ml-2" onClick={() => setView({ kind: "list" })}>
            <ArrowLeft className="mr-1.5 size-4" aria-hidden="true" /> All code hosts
        </Button>
    );

    if (view.kind === "choose") {
        return (
            <div className="space-y-4">
                {back}
                <div>
                    <h3 className="text-lg font-medium">Add a code host</h3>
                    <p className="text-sm text-muted-foreground">Choose where your team's repositories and accounts live.</p>
                </div>
                <div className="grid gap-3">
                    {CODE_HOST_PROVIDERS.map((provider) => (
                        <button
                            key={provider}
                            type="button"
                            onClick={() => setView({ kind: "edit", provider, connectorId: null })}
                            className="flex items-start gap-3 rounded-lg border p-4 text-left transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                            <CodeHostMark provider={provider} />
                            <span className="min-w-0 flex-1">
                                <span className="block font-medium">{providerName(provider)}</span>
                                <span className="block text-sm">{PROVIDER_PITCH[provider].what}</span>
                                <span className="mt-1 block text-xs text-muted-foreground">
                                    You will need: {PROVIDER_PITCH[provider].needs}
                                </span>
                            </span>
                            <ChevronRight className="mt-2 size-4 text-muted-foreground" aria-hidden="true" />
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    if (view.kind === "edit") {
        const connector = view.connectorId ? connectors.find((row) => row.id === view.connectorId) ?? null : null;
        return (
            <div className="space-y-4">
                {back}
                {view.provider === "github" ? (
                    <ConnectorSettings
                        connectorId={view.connectorId}
                        isAdmin
                        onConnectorChange={githubChanged}
                    />
                ) : (
                    <OAuthHostForm
                        key={view.connectorId ?? `new-${view.provider}`}
                        provider={view.provider}
                        connector={connector}
                        callbackUrl={callbackUrl}
                        onSaved={(next) => {
                            upsert(next);
                            setView({ kind: "edit", provider: view.provider, connectorId: next.id });
                        }}
                        onRemoved={removed}
                    />
                )}
                {onOpenConnectedAccounts && (connector?.capabilities?.accountLinking || connector?.oauthClientConfigured) && (
                    <p className="text-sm text-muted-foreground">
                        Check it end to end by{" "}
                        <button type="button" className="text-primary underline-offset-2 hover:underline"
                            onClick={onOpenConnectedAccounts}>
                            connecting your own account
                        </button>.
                    </p>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h3 className="text-lg font-medium">Code hosts</h3>
                    <p className="text-sm text-muted-foreground">
                        Where this workspace publishes issues, and where people can link their accounts.
                    </p>
                </div>
                <Button size="sm" onClick={() => setView({ kind: "choose" })}>
                    <Plus className="mr-1.5 size-4" aria-hidden="true" /> Add code host
                </Button>
            </div>

            {phase === "loading" && (
                <div className="space-y-2" aria-busy="true" aria-label="Loading code hosts">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                </div>
            )}

            {phase === "error" && (
                <div className="flex items-center justify-between gap-3 rounded-lg border p-4 text-sm" role="alert">
                    <span className="text-destructive">{loadError}</span>
                    <Button variant="outline" size="sm" onClick={() => setReloadKey((key) => key + 1)}>
                        <RefreshCw className="mr-1.5 size-4" aria-hidden="true" /> Retry
                    </Button>
                </div>
            )}

            {phase === "ready" && connectors.length === 0 && (
                <div className="rounded-lg border border-dashed p-6 text-center text-sm">
                    <p className="font-medium">No code hosts yet</p>
                    <p className="mt-1 text-muted-foreground">
                        Add GitHub to publish review threads as issues, or any host so people can link their accounts.
                    </p>
                    <Button className="mt-4" size="sm" onClick={() => setView({ kind: "choose" })}>Add code host</Button>
                </div>
            )}

            {phase === "ready" && connectors.length > 0 && (
                <ul className="divide-y rounded-lg border" aria-label="Code hosts">
                    {connectors.map((connector) => {
                        const state = status(connector);
                        const issues = connector.capabilities?.issues ?? connector.provider === "github";
                        const linking = connector.capabilities?.accountLinking ?? Boolean(connector.oauthClientConfigured);
                        return (
                            <li key={connector.id}>
                                <button
                                    type="button"
                                    className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                                    onClick={() => setView({
                                        kind: "edit",
                                        provider: connector.provider as CodeHostProvider,
                                        connectorId: connector.id,
                                    })}
                                >
                                    <CodeHostMark provider={connector.provider} />
                                    <span className="min-w-0 flex-1">
                                        <span className="flex flex-wrap items-baseline gap-x-2">
                                            <span className="font-medium">{connector.displayName || providerName(connector.provider)}</span>
                                            <span className="text-xs text-muted-foreground">
                                                {hostOf(connector) || instanceLabel(connector.provider, connector.instanceKind)}
                                            </span>
                                        </span>
                                        <span className="block text-xs text-muted-foreground">
                                            {[
                                                issues ? "Issue publishing" : null,
                                                linking ? "Account linking" : issues ? "Account linking not set up" : null,
                                            ].filter(Boolean).join(" · ")}
                                        </span>
                                    </span>
                                    <Badge variant={state.variant}>{state.label}</Badge>
                                    <ChevronRight className="size-4 text-muted-foreground" aria-hidden="true" />
                                </button>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}
