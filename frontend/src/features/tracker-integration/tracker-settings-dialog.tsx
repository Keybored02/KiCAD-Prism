import { useCallback, useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { listConnectors } from "@/lib/trackers-client";
import type { TrackerConnector } from "@/types/trackers";

import { ConnectorSettings } from "./connector-settings";
import { ProjectTrackerSettingsPanel } from "./project-tracker-settings";

interface TrackerSettingsDialogProps {
    projectId: string;
    isAdmin: boolean;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function TrackerSettingsDialog({ projectId, isAdmin, open, onOpenChange }: TrackerSettingsDialogProps) {
    const [connectors, setConnectors] = useState<TrackerConnector[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [listError, setListError] = useState<string | null>(null);
    const [listVersion, setListVersion] = useState(0);
    const [settingsVersion, setSettingsVersion] = useState(0);

    useEffect(() => {
        if (!open || !isAdmin) return;
        let cancelled = false;
        void listConnectors()
            .then((rows) => {
                if (cancelled) return;
                setConnectors(rows);
                setSelectedId((current) => current && rows.some((row) => row.id === current)
                    ? current : rows[0]?.id ?? null);
                setListError(null);
            })
            .catch((error: unknown) => {
                if (!cancelled) setListError(error instanceof Error ? error.message : "Connections could not be loaded.");
            });
        return () => { cancelled = true; };
    }, [open, isAdmin, listVersion]);

    const onConnectorChange = useCallback((next: TrackerConnector) => {
        setConnectors((current) => current.some((row) => row.id === next.id)
            ? current.map((row) => row.id === next.id ? next : row)
            : [...current, next]);
        setSelectedId(next.id);
        setSettingsVersion((value) => value + 1);
    }, []);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
                <DialogTitle>Issue publishing</DialogTitle>
                <DialogDescription>
                    Publish Prism discussions to a connected issue tracker. Comments remain in Prism even if a connection is unavailable.
                </DialogDescription>
                {isAdmin ? (
                    <Tabs defaultValue="project">
                        <TabsList>
                            <TabsTrigger value="project">This project</TabsTrigger>
                            <TabsTrigger value="connections">Connections</TabsTrigger>
                        </TabsList>
                        <TabsContent value="project" className="pt-4">
                            <ProjectTrackerSettingsPanel
                                key={`${projectId}:${settingsVersion}`}
                                projectId={projectId}
                                isAdmin
                                chromeless
                            />
                        </TabsContent>
                        <TabsContent value="connections" className="space-y-4 pt-4">
                            {listError && (
                                <div className="flex items-center justify-between gap-3 text-sm text-destructive" role="alert">
                                    <span>{listError}</span>
                                    <Button type="button" size="sm" variant="outline" onClick={() => setListVersion((value) => value + 1)}>
                                        <RefreshCw className="size-4" aria-hidden="true" /> Retry
                                    </Button>
                                </div>
                            )}
                            <div className="flex flex-wrap items-center gap-2">
                                <label htmlFor="tracker-connection" className="text-sm">Connection</label>
                                <select
                                    id="tracker-connection"
                                    className="rounded border bg-background px-2 py-1 text-sm"
                                    value={selectedId ?? ""}
                                    onChange={(event) => setSelectedId(event.target.value || null)}
                                >
                                    <option value="">New connection</option>
                                    {connectors.map((connector) => (
                                        <option key={connector.id} value={connector.id}>{connector.displayName || connector.id}</option>
                                    ))}
                                </select>
                                <Button type="button" size="sm" variant="outline" onClick={() => setSelectedId(null)}>
                                    Add connection
                                </Button>
                            </div>
                            <ConnectorSettings
                                key={selectedId ?? "new"}
                                connectorId={selectedId}
                                isAdmin
                                onConnectorChange={onConnectorChange}
                            />
                        </TabsContent>
                    </Tabs>
                ) : (
                    <ProjectTrackerSettingsPanel projectId={projectId} isAdmin={false} chromeless />
                )}
            </DialogContent>
        </Dialog>
    );
}
