import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog, useConfirmTarget } from "@/components/ui/confirm-dialog";
import { toast } from "sonner";
import { Trash2, RefreshCw } from "lucide-react";
import { fetchApi, readApiError } from "@/lib/api";

/**
 * Agent tokens: the tokens a KiCad desktop agent holds to act on Prism as a
 * user. Every user sees and revokes their own; an admin can switch to every
 * user's and revoke any of them. The one backend endpoint honours `all_users`
 * only for admins, so a non-admin who somehow set the flag still sees just their
 * own, this UI just does not offer it to them.
 */

interface AgentToken {
    jti: string;
    email: string;
    label: string;
    scopes: string[];
    created_at: string | null;
    expires_at: number;
    last_used_at: string | null;
}

function formatIso(value: string | null): string {
    if (!value) return "Never";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "Unknown" : date.toLocaleString();
}

function formatEpoch(seconds: number): string {
    if (!seconds) return "Unknown";
    const date = new Date(seconds * 1000);
    return Number.isNaN(date.getTime()) ? "Unknown" : date.toLocaleString();
}

export function AgentTokensSettings({ isAdmin }: { isAdmin: boolean }) {
    const [tokens, setTokens] = useState<AgentToken[]>([]);
    const [loading, setLoading] = useState(false);
    const [allUsers, setAllUsers] = useState(false);
    // Holds the whole token so the confirm dialog can name it.
    const revokeTarget = useConfirmTarget<AgentToken>();

    const loadTokens = useCallback(async () => {
        setLoading(true);
        try {
            // Only ask for everyone's when an admin has chosen to. The server
            // ignores the flag for non-admins, but not sending it keeps intent honest.
            const query = isAdmin && allUsers ? "?all_users=true" : "";
            const response = await fetchApi(`/api/agent/tokens${query}`);
            if (!response.ok) {
                throw new Error(await readApiError(response, "Failed to load agent tokens"));
            }
            setTokens((await response.json()) as AgentToken[]);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to load agent tokens");
        } finally {
            setLoading(false);
        }
    }, [isAdmin, allUsers]);

    useEffect(() => {
        void loadTokens();
    }, [loadTokens]);

    const revokeToken = async (token: AgentToken) => {
        revokeTarget.clear();
        try {
            const response = await fetchApi(`/api/agent/tokens/${encodeURIComponent(token.jti)}`, {
                method: "DELETE",
            });
            if (!response.ok) {
                throw new Error(await readApiError(response, "Failed to revoke token"));
            }
            toast.success("Agent token revoked");
            await loadTokens();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to revoke token");
        }
    };

    // Admins get an email column when viewing everyone's; otherwise it is dead space.
    const showEmail = isAdmin && allUsers;
    const columns = showEmail
        ? "grid-cols-[1.5fr_1.5fr_1fr_1fr_auto]"
        : "grid-cols-[2fr_1fr_1fr_auto]";

    return (
        <div className="space-y-6">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h3 className="text-lg font-medium">Agent tokens</h3>
                    <p className="text-sm text-muted-foreground">
                        Tokens a KiCad agent uses to act on Prism as you. Revoking one signs that
                        machine out immediately.
                    </p>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => void loadTokens()}
                    aria-label="Refresh agent tokens"
                    title="Refresh"
                >
                    <RefreshCw className="h-4 w-4" />
                </Button>
            </div>

            {isAdmin && (
                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                    <input
                        type="checkbox"
                        checked={allUsers}
                        onChange={(event) => setAllUsers(event.target.checked)}
                        aria-label="Show tokens for all users"
                    />
                    Show tokens for all users
                </label>
            )}

            <div className="rounded-lg border overflow-hidden">
                <div
                    className={`grid ${columns} border-b bg-muted/30 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground`}
                >
                    <div>Device</div>
                    {showEmail && <div>User</div>}
                    <div>Last used</div>
                    <div>Expires</div>
                    <div />
                </div>
                {loading ? (
                    <div className="p-4 text-sm text-muted-foreground">Loading tokens…</div>
                ) : tokens.length === 0 ? (
                    <div className="p-4 text-sm text-muted-foreground">
                        No agent tokens. Sign in from the KiCad agent to create one.
                    </div>
                ) : (
                    tokens.map((token) => (
                        <div
                            key={token.jti}
                            className={`grid ${columns} items-center border-b px-4 py-2 gap-2`}
                        >
                            <div className="min-w-0">
                                <div className="truncate text-sm">{token.label || "Unnamed agent"}</div>
                                <div className="truncate text-xs text-muted-foreground">
                                    {token.scopes.join(", ")}
                                </div>
                            </div>
                            {showEmail && (
                                <div className="truncate text-sm text-muted-foreground">{token.email}</div>
                            )}
                            <div className="text-sm text-muted-foreground">
                                {formatIso(token.last_used_at)}
                            </div>
                            <div className="text-sm text-muted-foreground">
                                {formatEpoch(token.expires_at)}
                            </div>
                            <div className="flex justify-end">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => revokeTarget.request(token)}
                                    aria-label={`Revoke token ${token.label || token.jti}`}
                                    title="Revoke token"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <ConfirmDialog
                open={revokeTarget.open}
                onOpenChange={(next) => {
                    if (!next) revokeTarget.clear();
                }}
                title="Revoke agent token"
                description={
                    revokeTarget.target
                        ? `${revokeTarget.target.label || "This agent"} stops working on Prism immediately. Signing in again from that machine creates a new token.`
                        : ""
                }
                confirmLabel="Hold to revoke"
                requireHold
                onConfirm={() => {
                    if (revokeTarget.target) void revokeToken(revokeTarget.target);
                }}
            />
        </div>
    );
}
