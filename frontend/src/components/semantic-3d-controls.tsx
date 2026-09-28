import { useEffect, useMemo, useState } from "react";
import { Box, Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
    ControlHeading,
    PcbLayerList,
    RailCheckbox,
    RailSectionSwitch,
    RailSlider,
    ViewerSideRail,
} from "./ecad-viewer-controls";
import type {
    PrismSemanticLayerPreset,
    PrismSemanticViewerElement,
    PrismSemanticViewState,
} from "@/types/prism-semantic-viewer";

const layerPresets: readonly (readonly [PrismSemanticLayerPreset, string])[] = [
    ["all", "Show all"],
    ["none", "Hide all"],
    ["outer", "Outer copper"],
    ["inner", "Inner copper"],
];

/**
 * The PCB 3D side menu. Same frame and parts as the Schematic/PCB menu; the
 * viewer runs with `hide-panel` and this drives it through its element API.
 */
export function Semantic3dControls({
    viewer,
    onVisibleWidthChange,
}: {
    viewer: PrismSemanticViewerElement | null;
    onVisibleWidthChange?: (width: number) => void;
}) {
    const [section, setSection] = useState<"layers" | "settings">("layers");
    const [viewState, setViewState] = useState<PrismSemanticViewState | null>(null);
    const [query, setQuery] = useState("");

    useEffect(() => {
        if (!viewer) return;
        setViewState(viewer.getViewState?.() ?? null);
        const onChange = (event: Event) => {
            setViewState((event as CustomEvent<PrismSemanticViewState>).detail);
        };
        viewer.addEventListener("prism-semantic-viewer:viewstatechange", onChange);
        return () => viewer.removeEventListener("prism-semantic-viewer:viewstatechange", onChange);
    }, [viewer]);

    // viewState is a dependency on purpose: hidden components drop out of results.
    const results = useMemo(
        () => (viewState && query.trim() ? viewer?.search?.(query) : undefined),
        [query, viewer, viewState],
    );
    const layers = useMemo(
        () => (viewState?.layers ?? []).map((layer) => ({ ...layer, highlighted: false })),
        [viewState],
    );
    const layerIdByName = useMemo(
        () => new Map((viewState?.layers ?? []).map((layer) => [layer.name, layer.id])),
        [viewState],
    );
    const hasResults = Boolean(results?.nets.length || results?.components.length);

    return (
        <ViewerSideRail
            ariaLabel="3D display controls"
            icon={<Box className="size-4" />}
            title="Board 3D"
            onVisibleWidthChange={onVisibleWidthChange}
        >
            <div className="shrink-0 space-y-2 border-b p-3">
                <div className="relative">
                    <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Find net or component…"
                        aria-label="Find net or component"
                        className="h-8 pl-8 pr-8 text-xs"
                    />
                    {query && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-0.5 top-1/2 size-7 -translate-y-1/2 text-muted-foreground"
                            onClick={() => setQuery("")}
                            aria-label="Clear search"
                        >
                            <X className="size-3.5" />
                        </Button>
                    )}
                </div>
                {query.trim() && (
                    <div className="max-h-56 overflow-y-auto" aria-label="Search results">
                        {results?.nets.map((net) => (
                            <SearchResult
                                key={`net-${net.id}`}
                                title={net.name}
                                detail={net.netClass || "Net"}
                                onSelect={() => viewer?.selectNet?.(net.id)}
                            />
                        ))}
                        {results?.components.map((item) => (
                            <SearchResult
                                key={`feature-${item.featureId}`}
                                title={item.designator}
                                detail={item.value}
                                onSelect={() => viewer?.selectFeature?.(item.featureId)}
                            />
                        ))}
                        {!hasResults && (
                            <p className="px-2 py-3 text-center text-xs text-muted-foreground">No matches</p>
                        )}
                    </div>
                )}
                <div className="grid grid-cols-4 gap-1">
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-7 px-1 text-[11px]"
                        disabled={!viewState?.hasSelection}
                        onClick={() => viewer?.frameSelection?.()}
                    >
                        Frame
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-7 px-1 text-[11px]"
                        disabled={!viewState?.hasNet}
                        onClick={() => viewer?.showNetLayers?.()}
                        title="Show only the layers the selected net uses"
                    >
                        Net layers
                    </Button>
                    <Button
                        variant={viewState?.isolateNet ? "secondary" : "outline"}
                        size="sm"
                        className="h-7 px-1 text-[11px]"
                        disabled={!viewState?.hasNet}
                        aria-pressed={Boolean(viewState?.isolateNet)}
                        onClick={() => viewer?.setNetIsolation?.(!viewState?.isolateNet)}
                        title="Isolate the selected net (I)"
                    >
                        Isolate
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-7 px-1 text-[11px]"
                        disabled={!viewState?.hasSelection}
                        onClick={() => viewer?.clearSelection?.()}
                    >
                        Clear
                    </Button>
                </div>
            </div>

            <RailSectionSwitch
                value={section}
                onChange={setSection}
                options={[["layers", "Layers"], ["settings", "Settings"]]}
            />

            {section === "layers" ? (
                <>
                    <div className="border-b p-3">
                        <Select
                            onValueChange={(value) => viewer?.applyLayerPreset?.(value as PrismSemanticLayerPreset)}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Layer preset" />
                            </SelectTrigger>
                            <SelectContent>
                                {layerPresets.map(([value, label]) => (
                                    <SelectItem key={value} value={value}>{label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <ScrollArea className="themed-scrollbar min-h-0 flex-1">
                        <div className="p-2">
                            <PcbLayerList
                                layers={layers}
                                onToggleVisibility={(name, visible) => {
                                    const id = layerIdByName.get(name);
                                    if (id !== undefined) viewer?.setLayerVisible?.(id, visible);
                                }}
                            />
                            {!layers.length && (
                                <p className="px-2 py-8 text-center text-xs text-muted-foreground">Layers are loading…</p>
                            )}
                        </div>
                    </ScrollArea>
                </>
            ) : (
                <ScrollArea className="min-h-0 flex-1">
                    <div className="space-y-5 p-4">
                        <ControlHeading>View</ControlHeading>
                        <div className="grid grid-cols-2 gap-1">
                            {([["3d", "3D"], ["layer", "Layers"]] as const).map(([mode, label]) => (
                                <Button
                                    key={mode}
                                    variant={viewState?.mode === mode ? "secondary" : "ghost"}
                                    size="sm"
                                    className="h-8 text-xs"
                                    aria-pressed={viewState?.mode === mode}
                                    onClick={() => viewer?.setViewMode?.(mode)}
                                >
                                    {label}
                                </Button>
                            ))}
                        </div>
                        <Separator />
                        <ControlHeading>Visibility</ControlHeading>
                        <RailCheckbox
                            label="Board substrate"
                            checked={viewState?.showBoard ?? true}
                            onChange={(checked) => viewer?.setShowBoard?.(checked)}
                        />
                        <RailCheckbox
                            label="Components"
                            checked={viewState?.showComponents ?? true}
                            onChange={(checked) => viewer?.setShowComponents?.(checked)}
                        />
                        <Separator />
                        <RailSlider
                            label="Stackup separation"
                            value={viewState?.separation ?? 0}
                            onChange={(value) => viewer?.setSeparation?.(value)}
                        />
                    </div>
                </ScrollArea>
            )}
        </ViewerSideRail>
    );
}

function SearchResult({
    title,
    detail,
    onSelect,
}: {
    title: string;
    detail: string;
    onSelect: () => void;
}) {
    return (
        <button
            type="button"
            className={cn(
                "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-xs transition-colors hover:bg-accent",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
            )}
            onClick={onSelect}
        >
            <span className="min-w-0 flex-1 truncate font-medium">{title}</span>
            <span className="max-w-[45%] shrink-0 truncate text-[10px] text-muted-foreground">{detail}</span>
        </button>
    );
}
