import type { Dispatch, SetStateAction } from "react";
import { Check, Github, Gitlab, SquareKanban, Workflow, type LucideIcon } from "lucide-react";

import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { TrackerConnector } from "@/types/trackers";

import type { TrackerSettingsDraft } from "./project-tracker-settings-model";

interface TrackerOption {
    id: string;
    name: string;
    icon: LucideIcon;
    available: boolean;
}

/**
 * Issue trackers a project can publish to. Only GitHub Issues works today;
 * the rest are listed so nobody reads this dialog as "git hosts only".
 */
const TRACKERS: TrackerOption[] = [
    { id: "github", name: "GitHub Issues", icon: Github, available: true },
    { id: "gitlab", name: "GitLab Issues", icon: Gitlab, available: false },
    { id: "jira", name: "Jira", icon: SquareKanban, available: false },
    { id: "linear", name: "Linear", icon: Workflow, available: false },
];

interface ProjectTrackerChoiceProps {
    draft: TrackerSettingsDraft;
    setDraft: Dispatch<SetStateAction<TrackerSettingsDraft | null>>;
    connectors: TrackerConnector[];
    isAdmin: boolean;
}

export function ProjectTrackerChoice({ draft, setDraft, connectors, isAdmin }: ProjectTrackerChoiceProps) {
    const current = connectors.find((connector) => connector.id === draft.connectorId);
    return (
        <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" role="radiogroup" aria-label="Issue tracker">
                {TRACKERS.map((tracker) => {
                    const selected = tracker.id === "github";
                    const Icon = tracker.icon;
                    return (
                        <div
                            key={tracker.id}
                            role="radio"
                            aria-checked={selected}
                            aria-disabled={!tracker.available}
                            data-tracker-option={tracker.id}
                            className={cn(
                                "relative flex flex-col gap-1.5 px-3 py-2.5 ring-1 ring-foreground/10",
                                selected && "bg-primary/5 ring-primary/40",
                                !tracker.available && "text-muted-foreground",
                            )}
                        >
                            <span className="flex items-center justify-between">
                                <Icon className="size-4" aria-hidden="true" />
                                {selected ? <Check className="size-3.5 text-primary" aria-hidden="true" /> : null}
                                {!tracker.available ? <span className="text-[10px] uppercase tracking-wide">Soon</span> : null}
                            </span>
                            <span className="text-xs font-medium">{tracker.name}</span>
                        </div>
                    );
                })}
            </div>
            {isAdmin && connectors.length > 1 ? (
                <div className="flex items-center gap-3">
                    <Label htmlFor="tracker-connector" className="shrink-0 text-xs text-muted-foreground">Connection</Label>
                    <Select value={draft.connectorId} onValueChange={(connectorId) => setDraft((prev) => {
                        if (!prev || prev.connectorId === connectorId) return prev;
                        // An override must be picked again from the new installation.
                        return prev.useOverride
                            ? { ...prev, connectorId, containerPath: "", remoteContainerId: "" }
                            : { ...prev, connectorId };
                    })}>
                        <SelectTrigger id="tracker-connector" size="sm" className="w-full max-w-64"><SelectValue placeholder="Select a connection" /></SelectTrigger>
                        <SelectContent>
                            {connectors.map((connector) => <SelectItem key={connector.id} value={connector.id}>{connector.displayName}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
            ) : current ? (
                <p className="text-xs text-muted-foreground" data-testid="tracker-connection">Via {current.displayName}</p>
            ) : null}
        </div>
    );
}
