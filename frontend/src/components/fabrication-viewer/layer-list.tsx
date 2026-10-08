import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

import type { FabricationLayer } from "./types";

const GROUPS: { title: string; match: (layer: FabricationLayer) => boolean }[] = [
    { title: "Top", match: (l) => l.side === "top" && l.role !== "other" },
    { title: "Inner", match: (l) => l.side === "inner" },
    { title: "Bottom", match: (l) => l.side === "bottom" && l.role !== "other" },
    { title: "Board", match: (l) => l.role === "outline" || l.role === "drill" },
    { title: "Other", match: (l) => l.role === "other" },
];

/** Each layer in the first group that claims it, so none is listed twice. */
export function groupLayers(layers: FabricationLayer[]) {
    const placed = new Set<string>();
    return GROUPS.map(({ title, match }) => {
        const members = layers.filter((layer) => !placed.has(layer.id) && match(layer));
        for (const layer of members) placed.add(layer.id);
        return { title, layers: members };
    }).filter((group) => group.layers.length > 0);
}

export function LayerList({
    layers,
    visible,
    onToggle,
    onPreset,
    onAll,
    onNone,
}: {
    layers: FabricationLayer[];
    visible: ReadonlySet<string>;
    onToggle: (id: string) => void;
    onPreset: () => void;
    onAll: () => void;
    onNone: () => void;
}) {
    return (
        <div className="flex min-h-0 w-56 shrink-0 flex-col rounded border" aria-label="Layers">
            <div className="flex items-center gap-1 border-b px-2 py-1.5">
                <span className="mr-auto text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Layers
                </span>
                <Button size="xs" variant="ghost" onClick={onPreset}>Default</Button>
                <Button size="xs" variant="ghost" onClick={onAll}>All</Button>
                <Button size="xs" variant="ghost" onClick={onNone}>None</Button>
            </div>
            <div className="themed-scrollbar min-h-0 flex-1 overflow-y-auto">
                {groupLayers(layers).map((group) => (
                    <div key={group.title}>
                        <h5 className="sticky top-0 bg-background px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                            {group.title}
                        </h5>
                        {group.layers.map((layer) => (
                            <label
                                key={layer.id}
                                className="flex cursor-pointer items-center gap-2 px-2 py-1 text-xs hover:bg-muted/40"
                                title={layer.file}
                            >
                                <Checkbox
                                    checked={visible.has(layer.id)}
                                    onCheckedChange={() => onToggle(layer.id)}
                                    aria-label={layer.name}
                                />
                                <span
                                    aria-hidden
                                    className="h-3 w-3 shrink-0 rounded-sm border border-white/20"
                                    style={{ backgroundColor: layer.colour }}
                                />
                                <span className="min-w-0 flex-1 truncate">{layer.name}</span>
                                {layer.warnings.length > 0 && (
                                    <AlertTriangle
                                        className="h-3 w-3 shrink-0 text-warning"
                                        aria-label={layer.warnings.join("; ")}
                                    />
                                )}
                            </label>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}
