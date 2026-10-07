import { useState } from "react";
import { ChevronRight, Focus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { PcbLayerList, RailSlider } from "./ecad-viewer-controls";
import type {
    PrismSemanticLayerPreset,
    PrismSemanticViewerElement,
    PrismSystemBoardViewState,
} from "@/types/prism-semantic-viewer";

export const LAYER_PRESETS: readonly (readonly [PrismSemanticLayerPreset, string])[] = [
    ["all", "Show all"],
    ["none", "Hide all"],
    ["outer", "Outer copper"],
    ["inner", "Inner copper"],
];

const STAND_IN_LABELS: Record<string, string> = {
    restricted: "Restricted",
    loading: "Loading",
    building: "Building",
    missing: "No 3D view",
    failed: "Failed",
};

/**
 * The System 3D tab's Layers: one section per placed board (D-P2-26), each
 * with the board 3D tab's stackup separation, preset and layer list, acting
 * on that placement only. The board holding the selection opens and is marked.
 */
export function BoardLayerSections({
    viewer,
    boards,
    selectedBoard,
}: {
    viewer: PrismSemanticViewerElement | null;
    boards: readonly PrismSystemBoardViewState[];
    selectedBoard: string | null;
}) {
    // Sections the reviewer opened or closed; the selected board opens by default.
    const [toggled, setToggled] = useState<ReadonlyMap<string, boolean>>(new Map());
    const isOpen = (key: string) => toggled.get(key) ?? key === selectedBoard;

    return (
        <div className="flex flex-col">
            {boards.map((board) => {
                const open = isOpen(board.key);
                const shown = board.layers.filter((layer) => layer.visible).length;
                return (
                    <section
                        key={board.key}
                        aria-label={`${board.name} layers`}
                        className={cn("border-b", board.key === selectedBoard && "bg-accent/40")}
                    >
                        <div className="flex items-center gap-1 px-2 py-1.5">
                            <button
                                type="button"
                                aria-expanded={open}
                                className="flex min-w-0 flex-1 items-center gap-1.5 text-left text-xs font-medium"
                                onClick={() => setToggled((current) => new Map(current).set(board.key, !open))}
                            >
                                <ChevronRight className={cn("size-3.5 shrink-0 transition-transform", open && "rotate-90")} aria-hidden />
                                <span className="truncate">{board.name}</span>
                            </button>
                            {board.standIn ? (
                                <Badge variant="outline" className="h-5 px-1.5 text-[10px]">
                                    {STAND_IN_LABELS[board.standIn] ?? board.standIn}
                                </Badge>
                            ) : (
                                <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">
                                    {shown}/{board.layers.length}
                                </span>
                            )}
                            <Button
                                variant="ghost"
                                size="icon-sm"
                                aria-label={`Frame ${board.name}`}
                                title={`Frame ${board.name}`}
                                onClick={() => viewer?.frameBoard?.(board.key)}
                            >
                                <Focus className="size-3.5" aria-hidden />
                            </Button>
                        </div>
                        {open && board.layers.length > 0 && (
                            <div className="space-y-1 px-2 pb-2">
                                <div className="px-1 pb-1">
                                    <RailSlider
                                        label="Stackup separation"
                                        value={board.separation}
                                        onChange={(value) => viewer?.setSeparation?.(value, board.key)}
                                    />
                                </div>
                                <Select
                                    onValueChange={(value) =>
                                        viewer?.applyLayerPreset?.(value as PrismSemanticLayerPreset, board.key)}
                                >
                                    <SelectTrigger className="h-7 w-full text-xs" aria-label={`${board.name} layer preset`}>
                                        <SelectValue placeholder="Layer preset" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {LAYER_PRESETS.map(([value, label]) => (
                                            <SelectItem key={value} value={value}>{label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <PcbLayerList
                                    layers={board.layers.map((layer) => ({ ...layer, highlighted: false }))}
                                    onToggleVisibility={(name, visible) => {
                                        const layer = board.layers.find((item) => item.name === name);
                                        if (layer) viewer?.setLayerVisible?.(layer.id, visible, board.key);
                                    }}
                                />
                            </div>
                        )}
                        {open && board.layers.length === 0 && (
                            <p className="px-3 pb-2 text-[11px] text-muted-foreground">
                                {board.standIn ? "No layers: the board is drawn as a box." : "Layers are loading…"}
                            </p>
                        )}
                    </section>
                );
            })}
            {!boards.length && (
                <p className="px-2 py-8 text-center text-xs text-muted-foreground">Boards are loading…</p>
            )}
        </div>
    );
}
