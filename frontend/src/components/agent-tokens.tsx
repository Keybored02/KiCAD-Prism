import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ConfirmDialog, useConfirmTarget } from "@/components/ui/confirm-dialog";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";
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

    // Admins see whose token each row is when viewing everyone's.
    const showEmail = isAdmin && allUsers;

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium">Agent tokens</h3>
                <p className="text-sm text-muted-foreground">
                    Tokens a KiCad agent uses to act on Prism as you. Revoking one signs that
                    machine out immediately.
                </p>
            </div>

            <div className="space-y-3 border rounded-lg p-4 bg-card">
                <div className="flex items-start justify-between gap-3">
                    <div className="space-y-0.5">
                        <Label className="text-base">Your agent tokens</Label>
                        <p className="text-sm text-muted-foreground">
                            Sign in from the KiCad agent to create one.
                        </p>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => void loadTokens()}
                        disabled={loading}
                    >
                        <RefreshCw className="h-4 w-4" />
                        Refresh
                    </Button>
                </div>

                {isAdmin && (
                    <label className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Checkbox
                            checked={allUsers}
                            onCheckedChange={(checked) => setAllUsers(checked === true)}
                            aria-label="Show tokens for all users"
                        />
                        Show tokens for all users
                    </label>
                )}

                {loading ? (
                    <div className="h-16 bg-muted animate-pulse rounded-md" />
                ) : tokens.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic">
                        No agent tokens yet.
                    </p>
                ) : (
                    <div className="divide-y rounded-md border">
                        {tokens.map((token) => (
                            <div key={token.jti} className="p-3">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="font-medium truncate">
                                            {token.label || "Unnamed agent"}
                                        </p>
                                        <p className="text-xs text-muted-foreground truncate">
                                            {showEmail ? `${token.email} · ` : ""}
                                            {token.scopes.join(", ")}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            Last used {formatIso(token.last_used_at)} · Expires{" "}
                                            {formatEpoch(token.expires_at)}
                                        </p>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="shrink-0"
                                        onClick={() => revokeTarget.request(token)}
                                        aria-label={`Revoke token ${token.label || token.jti}`}
                                    >
                                        Revoke
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
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
