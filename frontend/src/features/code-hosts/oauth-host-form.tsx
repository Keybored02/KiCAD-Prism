import { useState } from "react";
import { Check, Copy, ExternalLink } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createConnector, deleteConnector, TrackerApiError, updateConnector } from "@/lib/trackers-client";
import { cn } from "@/lib/utils";
import type { TrackerConnector } from "@/types/trackers";

import { CodeHostMark, hostFromUrl, providerName, registerApplicationUrl } from "./code-host-meta";

type OAuthProvider = "gitlab" | "gitea";

interface OAuthHostFormProps {
    provider: OAuthProvider;
    /** Omitted when adding a new host. */
    connector?: TrackerConnector | null;
    callbackUrl: string | null;
    onSaved: (connector: TrackerConnector) => void;
    onRemoved: (connectorId: string) => void;
}

function describe(error: unknown, fallback: string): string {
    if (error instanceof TrackerApiError || error instanceof Error) return error.message || fallback;
    return fallback;
}

/**
 * Account linking on GitLab or Gitea/Forgejo: where the host lives, and the
 * OAuth application an admin registers there so people can sign in with it.
 */
// react-doctor-disable-next-line prefer-useReducer - each field is edited independently; save/remove are separate async states
export function OAuthHostForm({ provider, connector, callbackUrl, onSaved, onRemoved }: OAuthHostFormProps) {
    const existing = connector ?? null;
    const [selfManaged, setSelfManaged] = useState(
        provider === "gitea" || (existing ? existing.instanceKind !== "gitlab.com" : false),
    );
    const [baseUrl, setBaseUrl] = useState(existing?.baseUrl ?? "");
    const [displayName, setDisplayName] = useState(existing?.displayName ?? "");
    const [clientId, setClientId] = useState("");
    const [clientSecret, setClientSecret] = useState("");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [confirmRemove, setConfirmRemove] = useState(false);
    const [removing, setRemoving] = useState(false);
    const [copied, setCopied] = useState(false);

    const host = selfManaged ? hostFromUrl(baseUrl) : "gitlab.com";
    const registerUrl = host ? registerApplicationUrl(provider, host) : null;
    const name = providerName(provider);
    const credentialsRequired = !existing?.oauthClientConfigured;
    const canSave = Boolean(host)
        && (credentialsRequired ? Boolean(clientId.trim() && clientSecret.trim()) : true)
        && (!existing || Boolean(clientId.trim() || clientSecret.trim() || displayName !== existing.displayName));

    const copyCallback = async () => {
        if (!callbackUrl) return;
        try {
            await navigator.clipboard.writeText(callbackUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch {
            toast.error("Copy failed; select the address and copy it.");
        }
    };

    const save = async () => {
        setSaving(true);
        setError(null);
        const credentials: Record<string, string> = {};
        if (clientId.trim()) credentials.oauthClientId = clientId.trim();
        if (clientSecret.trim()) credentials.oauthClientSecret = clientSecret.trim();
        try {
            const saved = existing
                ? await updateConnector(existing.id, {
                    displayName: displayName.trim() || undefined,
                    credentials: Object.keys(credentials).length ? credentials : undefined,
                })
                : await createConnector({
                    provider,
                    instanceKind: selfManaged ? "self-hosted" : "gitlab.com",
                    baseUrl: selfManaged ? baseUrl.trim() : "",
                    displayName: displayName.trim() || (selfManaged && host ? host : name),
                    credentials,
                });
            setClientId("");
            setClientSecret("");
            toast.success(existing ? "Code host updated." : `${saved.displayName} is ready for account linking.`);
            onSaved(saved);
        } catch (caught) {
            setError(describe(caught, "The code host could not be saved."));
        } finally {
            setSaving(false);
        }
    };

    const remove = async () => {
        if (!existing) return;
        setRemoving(true);
        try {
            await deleteConnector(existing.id);
            toast.success(`${existing.displayName} removed.`);
            setConfirmRemove(false);
            onRemoved(existing.id);
        } catch (caught) {
            toast.error(describe(caught, "The code host could not be removed."));
        } finally {
            setRemoving(false);
        }
    };

    return (
        <form
            className="space-y-6"
            onSubmit={(event) => { event.preventDefault(); if (canSave && !saving) void save(); }}
        >
            <div className="flex items-center gap-3">
                <CodeHostMark provider={provider} />
                <div>
                    <h4 className="font-medium">{existing ? existing.displayName : `Add ${name}`}</h4>
                    <p className="text-sm text-muted-foreground">
                        People sign in with {name} to link their accounts. Issue publishing is not available for {name} yet.
                    </p>
                </div>
            </div>

            <fieldset className="space-y-3" disabled={Boolean(existing)}>
                <legend className="text-sm font-medium">Where it lives</legend>
                {provider === "gitlab" && (
                    <div className="grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label="GitLab instance">
                        {[
                            { value: false, title: "GitLab.com", hint: "The hosted service" },
                            { value: true, title: "Self-managed", hint: "Your organisation's GitLab" },
                        ].map((option) => (
                            <button
                                key={option.title}
                                type="button"
                                role="radio"
                                aria-checked={selfManaged === option.value}
                                onClick={() => setSelfManaged(option.value)}
                                className={cn(
                                    "rounded-lg border p-3 text-left text-sm transition-colors disabled:opacity-60",
                                    selfManaged === option.value ? "border-primary bg-primary/5" : "hover:bg-muted/50",
                                )}
                            >
                                <span className="block font-medium">{option.title}</span>
                                <span className="text-muted-foreground">{option.hint}</span>
                            </button>
                        ))}
                    </div>
                )}
                {selfManaged && (
                    <div className="space-y-1.5">
                        <Label htmlFor="code-host-url">Server address</Label>
                        <div className="flex gap-2">
                            <Input
                                id="code-host-url"
                                inputMode="url"
                                placeholder={provider === "gitea" ? "https://codeberg.org" : "https://gitlab.example.com"}
                                value={baseUrl}
                                onChange={(event) => setBaseUrl(event.target.value)}
                                aria-invalid={Boolean(baseUrl.trim()) && !host}
                            />
                            {provider === "gitea" && !existing && (
                                <Button type="button" variant="outline" onClick={() => setBaseUrl("https://codeberg.org")}>
                                    Codeberg
                                </Button>
                            )}
                        </div>
                        {baseUrl.trim() && !host ? (
                            <p className="text-xs text-destructive">Enter the full https:// address.</p>
                        ) : (
                            <p className="text-xs text-muted-foreground">The address people open in their browser.</p>
                        )}
                    </div>
                )}
            </fieldset>

            <div className="space-y-1.5">
                <Label htmlFor="code-host-name">Name shown to people</Label>
                <Input
                    id="code-host-name"
                    placeholder={selfManaged && host ? host : name}
                    value={displayName}
                    onChange={(event) => setDisplayName(event.target.value)}
                />
            </div>

            <section className="space-y-3 rounded-lg border bg-muted/20 p-4 text-sm" aria-labelledby="register-app">
                <h5 id="register-app" className="font-medium">
                    {existing ? "OAuth application" : `Register Prism on ${host ?? name}`}
                </h5>
                {!existing && (
                    <ol className="list-decimal space-y-2 pl-5 text-muted-foreground">
                        <li>
                            Open{" "}
                            {registerUrl ? (
                                <a href={registerUrl} target="_blank" rel="noopener noreferrer"
                                    className="inline-flex items-center gap-0.5 text-primary underline-offset-2 hover:underline">
                                    Applications on {host}<ExternalLink className="size-3" aria-hidden="true" />
                                </a>
                            ) : "the Applications page of your server"}
                            {provider === "gitlab" && selfManaged && " (or Admin → Applications for an instance-wide app)"}
                            {" "}and create a new application named <span className="text-foreground">Prism</span>.
                        </li>
                        <li>Use this redirect URI:</li>
                    </ol>
                )}
                <div className="flex items-center gap-2">
                    <code className="min-w-0 flex-1 truncate rounded border bg-background px-2 py-1.5 font-mono text-xs"
                        title={callbackUrl ?? undefined}>
                        {callbackUrl ?? "Loading…"}
                    </code>
                    <Button type="button" variant="outline" size="sm" disabled={!callbackUrl} onClick={() => void copyCallback()}
                        aria-label="Copy redirect URI">
                        {copied ? <Check className="size-4" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}
                    </Button>
                </div>
                {!existing && (
                    <ol start={3} className="list-decimal space-y-2 pl-5 text-muted-foreground">
                        {provider === "gitlab" ? (
                            <li>Keep <span className="text-foreground">Confidential</span> on and tick only the <code className="font-mono text-foreground">read_user</code> scope.</li>
                        ) : (
                            <li>Keep <span className="text-foreground">Confidential client</span> on.</li>
                        )}
                        <li>Paste the application ID and secret it shows you.</li>
                    </ol>
                )}
                <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                        <Label htmlFor="code-host-client-id">{provider === "gitlab" ? "Application ID" : "Client ID"}</Label>
                        <Input id="code-host-client-id" autoComplete="off" value={clientId}
                            placeholder={existing?.oauthClientConfigured ? "Stored — enter to replace" : ""}
                            onChange={(event) => setClientId(event.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="code-host-client-secret">{provider === "gitlab" ? "Secret" : "Client secret"}</Label>
                        <Input id="code-host-client-secret" type="password" autoComplete="new-password" value={clientSecret}
                            placeholder={existing?.oauthClientConfigured ? "Stored — enter to replace" : ""}
                            onChange={(event) => setClientSecret(event.target.value)} />
                    </div>
                </div>
                <p className="text-xs text-muted-foreground">
                    Stored encrypted on the server and never shown again.
                </p>
            </section>

            {error && <p className="text-sm text-destructive" role="alert">{error}</p>}

            <div className="flex items-center gap-2">
                <Button type="submit" disabled={!canSave || saving}>
                    {saving ? "Saving…" : existing ? "Save changes" : `Add ${name}`}
                </Button>
                {existing && (
                    <Button type="button" variant="ghost" className="ml-auto text-destructive"
                        onClick={() => setConfirmRemove(true)}>
                        Remove code host
                    </Button>
                )}
            </div>

            {existing && (
                <ConfirmDialog
                    open={confirmRemove}
                    onOpenChange={setConfirmRemove}
                    title={`Remove ${existing.displayName}?`}
                    description={`Everyone who linked an account on ${existing.host || existing.displayName} is disconnected, and the stored OAuth application is deleted. Add it again at any time.`}
                    confirmLabel="Remove"
                    requireHold
                    busy={removing}
                    busyLabel="Removing…"
                    onConfirm={() => void remove()}
                />
            )}
        </form>
    );
}
