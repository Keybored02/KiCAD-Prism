import { useMemo, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import type { TrackerConnector } from "@/types/trackers";
import type { ConnectorCredentialFields } from "./connector-settings";
import { FormSection, SectionHeading } from "./connector-settings-section";
import { credentialRotationHint } from "./connector-installation-settings";
import { CopyField } from "./copy-field";

/** The server-provided URL takes precedence because it uses PUBLIC_BASE_URL. */
export function connectorWebhookPublicUrl(connectorId: string, origin = "", provider = "github"): string {
    const base = (origin || "https://prism.example").replace(/\/$/, "");
    return `${base}/api/trackers/webhooks/${encodeURIComponent(provider)}/${encodeURIComponent(connectorId)}`;
}

interface ConnectorDeliverySettingsProps {
    connector: TrackerConnector | null;
    credentials: ConnectorCredentialFields;
    setCredentials: Dispatch<SetStateAction<ConnectorCredentialFields>>;
    prismOrigin?: string;
}

export function ConnectorDeliverySettings({
    connector,
    credentials,
    setCredentials,
    prismOrigin,
}: ConnectorDeliverySettingsProps) {
    const [oauthOpen, setOauthOpen] = useState(Boolean(connector?.oauthClientConfigured));

    const webhookUrl = useMemo(() => {
        if (!connector?.id) return null;
        return connector.webhookUrl ?? connectorWebhookPublicUrl(connector.id, prismOrigin, connector.provider);
    }, [connector?.id, connector?.provider, connector?.webhookUrl, prismOrigin]);

    const oauthCallbackUrl = useMemo(() => {
        if (!webhookUrl) return null;
        try {
            return `${new URL(webhookUrl).origin}/api/trackers/oauth/callback`;
        } catch {
            return null;
        }
    }, [webhookUrl]);

    return (
        <>
            <FormSection
                step={3}
                title="Webhook"
                description="Optional. Updates arrive instantly instead of every few minutes."
                trailing={connector?.webhookConfigured ? <Badge variant="success">Configured</Badge> : <Badge variant="secondary">Optional</Badge>}
            >
                {connector?.id ? (
                    <CopyField
                        label="Webhook URL"
                        value={webhookUrl}
                        copyLabel="Copy webhook URL"
                        hint="Events: Issues, Issue comment"
                    />
                ) : (
                    <p className="text-[11px] text-muted-foreground">Available after the connection is created.</p>
                )}
                <div className="space-y-1.5">
                    <Label htmlFor="tracker-webhook-secret">Webhook secret</Label>
                    <Input
                        id="tracker-webhook-secret"
                        type="password"
                        value={credentials.webhookSecret}
                        onChange={(event) =>
                            setCredentials((prev) => ({ ...prev, webhookSecret: event.target.value }))
                        }
                        placeholder={connector?.webhookConfigured ? credentialRotationHint(true) : "The same secret as on GitHub"}
                        autoComplete="off"
                    />
                </div>
            </FormSection>

            <Separator />

            <Collapsible open={oauthOpen} onOpenChange={setOauthOpen}>
                <div className="flex items-start justify-between gap-3">
                    <SectionHeading
                        step={4}
                        title="Account linking"
                        description="Optional. Lets people connect their GitHub account."
                        trailing={connector?.oauthClientConfigured ? <Badge variant="success">Enabled</Badge> : <Badge variant="secondary">Optional</Badge>}
                    />
                    <CollapsibleTrigger asChild>
                        <Button type="button" variant="ghost" size="icon-sm" aria-label={oauthOpen ? "Hide account linking fields" : "Show account linking fields"}>
                            {oauthOpen ? <ChevronUp aria-hidden="true" /> : <ChevronDown aria-hidden="true" />}
                        </Button>
                    </CollapsibleTrigger>
                </div>
                <CollapsibleContent className="mt-3 space-y-3">
                    <CopyField label="Callback URL" value={oauthCallbackUrl} copyLabel="Copy callback URL" />
                    <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1.5">
                            <Label htmlFor="tracker-oauth-client-id">OAuth Client ID</Label>
                            <Input
                                id="tracker-oauth-client-id"
                                value={credentials.oauthClientId}
                                onChange={(event) =>
                                    setCredentials((prev) => ({ ...prev, oauthClientId: event.target.value }))
                                }
                                placeholder={connector?.oauthClientConfigured ? credentialRotationHint(true) : "Iv23li…"}
                                autoComplete="off"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="tracker-oauth-client-secret">OAuth Client Secret</Label>
                            <Input
                                id="tracker-oauth-client-secret"
                                type="password"
                                value={credentials.oauthClientSecret}
                                onChange={(event) =>
                                    setCredentials((prev) => ({ ...prev, oauthClientSecret: event.target.value }))
                                }
                                placeholder={connector?.oauthClientConfigured ? credentialRotationHint(true) : ""}
                                autoComplete="off"
                            />
                        </div>
                    </div>
                </CollapsibleContent>
            </Collapsible>
        </>
    );
}
