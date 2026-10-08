import { useMemo, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, Layers3 } from "lucide-react";

import { PcbLayerList } from "@/components/ecad-viewer-controls";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { EcadPcbLayerState } from "@/types/ecad-viewer";

import { STATUS_COLOUR, STATUS_LABEL, STATUS_ORDER } from "./part-status";
import type { FabricationLayer, PartStatus, PlacementView } from "./types";
import { LAYER_PRESETS, type LayerPreset } from "./viewer-state";

/** The Visualizer rail's own sizes, so the two read as one control. */
const DEFAULT_WIDTH = 256;
const MIN_WIDTH = 200;
const MAX_WIDTH = 420;
const COLLAPSED_WIDTH = 44;

/**
 * Layers as the shared list wants them. It keys rows by name, so two layers that
 * read the same are told apart by their file.
 */
export function toListLayers(
    layers: FabricationLayer[],
    visible: ReadonlySet<string>,
    highlighted: string | null,
): { rows: EcadPcbLayerState[]; idByName: Map<string, string> } {
    const counts = new Map<string, number>();
    for (const layer of layers) counts.set(layer.name, (counts.get(layer.name) ?? 0) + 1);
    const idByName = new Map<string, string>();
    const rows = layers.map((layer) => {
        const name = (counts.get(layer.name) ?? 0) > 1 ? `${layer.name} (${layer.file})` : layer.name;
        idByName.set(name, layer.id);
        return {
            name,
            color: layer.colour,
            visible: visible.has(layer.id),
            highlighted: layer.id === highlighted,
        };
    });
    return { rows, idByName };
}

function ControlHeading({ children }: { children: ReactNode }) {
    return (
        <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {children}
        </h3>
    );
}

function LayersSection({ layers, visible, highlighted, onToggle, onHighlight, onPreset }: {
    layers: FabricationLayer[];
    visible: ReadonlySet<string>;
    highlighted: string | null;
    onToggle: (id: string) => void;
    onHighlight: (id: string) => void;
    onPreset: (preset: LayerPreset) => void;
}) {
    const { rows, idByName } = useMemo(
        () => toListLayers(layers, visible, highlighted),
        [layers, visible, highlighted],
    );
    return (
        <>
            <div className="border-b p-3">
                <Select onValueChange={(value) => onPreset(value as LayerPreset)}>
                    <SelectTrigger className="w-full" aria-label="Layer preset">
                        <SelectValue placeholder="Layer preset" />
                    </SelectTrigger>
                    <SelectContent>
                        {LAYER_PRESETS.map(([value, label]) => (
                            <SelectItem key={value} value={value}>{label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <ScrollArea className="themed-scrollbar min-h-0 flex-1">
                <div className="p-2">
                    <PcbLayerList
                        layers={rows}
                        onToggleVisibility={(name) => {
                            const id = idByName.get(name);
                            if (id) onToggle(id);
                        }}
                        onHighlight={(name) => {
                            const id = idByName.get(name);
                            if (id) onHighlight(id);
                        }}
                    />
                </div>
            </ScrollArea>
        </>
    );
}

function PartsSection({ placement, showParts, hiddenStatuses, onToggleParts, onToggleStatus }: {
    placement: PlacementView;
    showParts: boolean;
    hiddenStatuses: ReadonlySet<PartStatus>;
    onToggleParts: () => void;
    onToggleStatus: (status: PartStatus) => void;
}) {
    const counts: Record<PartStatus, number> = {
        ok: 0,
        "no-bom": 0,
        "not-in-bom": 0,
        "dnp-placed": 0,
        "not-placed": placement.counts.notPlaced,
    };
    for (const part of placement.parts) counts[part.status] += 1;
    // Parts the position file does not hold have no marker to hide.
    const filterable = STATUS_ORDER.filter(
        (status) => counts[status] > 0 && status !== "not-placed" && status !== "no-bom",
    );
    return (
        <ScrollArea className="themed-scrollbar min-h-0 flex-1">
            <div className="space-y-5 p-4">
                <ControlHeading>Markers</ControlHeading>
                <label className="flex cursor-pointer items-center justify-between gap-3 text-xs">
                    <span>Show part markers</span>
                    <Checkbox checked={showParts} onCheckedChange={onToggleParts} />
                </label>
                <ControlHeading>Check results</ControlHeading>
                {placement.hasBom ? null : (
                    <p className="text-xs text-muted-foreground">No BOM was found, so parts are not checked.</p>
                )}
                {filterable.map((status) => (
                    <label key={status} className="flex cursor-pointer items-center justify-between gap-3 text-xs">
                        <span className="flex min-w-0 items-center gap-2">
                            <span
                                aria-hidden
                                className="size-2 shrink-0 rounded-full"
                                style={{ backgroundColor: STATUS_COLOUR[status] }}
                            />
                            <span className="truncate">{STATUS_LABEL[status]}</span>
                            <span className="font-mono text-[10px] text-muted-foreground">{counts[status]}</span>
                        </span>
                        <Checkbox
                            checked={!hiddenStatuses.has(status)}
                            onCheckedChange={() => onToggleStatus(status)}
                            aria-label={`Show ${STATUS_LABEL[status]}`}
                        />
                    </label>
                ))}
            </div>
        </ScrollArea>
    );
}

/**
 * The layer rail, built like the Visualizer's: a "Board display" header with a
 * collapse handle, a section switch, then the same preset menu and layer list.
 * The second section holds what only a package with parts has: marker filters.
 */
export function LayersRail({
    layers,
    visible,
    highlighted,
    placement,
    showParts,
    hiddenStatuses,
    onToggle,
    onHighlight,
    onPreset,
    onToggleParts,
    onToggleStatus,
}: {
    layers: FabricationLayer[];
    visible: ReadonlySet<string>;
    highlighted: string | null;
    placement: PlacementView | null;
    showParts: boolean;
    hiddenStatuses: ReadonlySet<PartStatus>;
    onToggle: (id: string) => void;
    onHighlight: (id: string) => void;
    onPreset: (preset: LayerPreset) => void;
    onToggleParts: () => void;
    onToggleStatus: (status: PartStatus) => void;
}) {
    const [open, setOpen] = useState(true);
    const [width, setWidth] = useState(DEFAULT_WIDTH);
    const [resizing, setResizing] = useState(false);
    const [section, setSection] = useState<"layers" | "parts">("layers");

    const onResizePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
        event.preventDefault();
        const pointerId = event.pointerId;
        const startX = event.clientX;
        const startWidth = width;
        const target = event.currentTarget;
        setResizing(true);
        target.setPointerCapture(pointerId);
        const onMove = (move: PointerEvent) => {
            setWidth(Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startWidth + (move.clientX - startX))));
        };
        const onUp = () => {
            setResizing(false);
            target.releasePointerCapture(pointerId);
            target.removeEventListener("pointermove", onMove);
            target.removeEventListener("pointerup", onUp);
        };
        target.addEventListener("pointermove", onMove);
        target.addEventListener("pointerup", onUp);
    };

    return (
        <aside
            className={cn(
                "relative flex shrink-0 flex-col overflow-hidden border-r bg-background/95",
                !resizing && "transition-[width] duration-200",
            )}
            style={{ width: open ? width : COLLAPSED_WIDTH }}
            aria-label="Board display"
        >
            <div className="flex h-10 shrink-0 items-center border-b">
                <div className="flex min-w-0 flex-1 items-center gap-2 pl-3 text-xs font-medium">
                    {open && (
                        <>
                            <Layers3 className="size-4 shrink-0" />
                            <span className="truncate">Board display</span>
                        </>
                    )}
                </div>
                <div className="flex w-11 shrink-0 justify-center">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        onClick={() => setOpen((value) => !value)}
                        aria-label={open ? "Collapse board display" : "Expand board display"}
                        aria-expanded={open}
                    >
                        {open ? <ChevronLeft className="size-4" /> : <ChevronRight className="size-4" />}
                    </Button>
                </div>
            </div>
            {open && placement && (
                <div className="grid grid-cols-2 border-b p-2">
                    <Button
                        variant={section === "layers" ? "secondary" : "ghost"}
                        size="sm"
                        className="h-8 text-xs"
                        onClick={() => setSection("layers")}
                    >
                        Layers
                    </Button>
                    <Button
                        variant={section === "parts" ? "secondary" : "ghost"}
                        size="sm"
                        className="h-8 text-xs"
                        onClick={() => setSection("parts")}
                    >
                        Parts & filters
                    </Button>
                </div>
            )}
            {open && (section === "layers" || !placement) && (
                <LayersSection
                    layers={layers}
                    visible={visible}
                    highlighted={highlighted}
                    onToggle={onToggle}
                    onHighlight={onHighlight}
                    onPreset={onPreset}
                />
            )}
            {open && section === "parts" && placement && (
                <PartsSection
                    placement={placement}
                    showParts={showParts}
                    hiddenStatuses={hiddenStatuses}
                    onToggleParts={onToggleParts}
                    onToggleStatus={onToggleStatus}
                />
            )}
            {open && (
                <div
                    className="absolute inset-y-0 right-0 z-10 w-1.5 cursor-col-resize touch-none hover:bg-primary/20"
                    onPointerDown={onResizePointerDown}
                    role="separator"
                    aria-orientation="vertical"
                    aria-label="Resize board display"
                />
            )}
        </aside>
    );
}
