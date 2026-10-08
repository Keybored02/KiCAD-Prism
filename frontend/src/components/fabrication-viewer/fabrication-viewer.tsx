import { useMemo, useReducer, useState } from "react";

import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

import { BoardCanvas, toRect, withMargin } from "./board-canvas";
import { DrillTable } from "./drill-table";
import { LayerList } from "./layer-list";
import type { FabricationSource, FabricationView } from "./types";
import { useFabricationView, useLayerImages } from "./use-fabrication-data";
import { initialState, viewerReducer, type ViewSide } from "./viewer-state";

const SIDES: { side: ViewSide; label: string }[] = [
    { side: "top", label: "Top" },
    { side: "bottom", label: "Bottom" },
];

function Summary({ view }: { view: FabricationView }) {
    const parts = [
        view.size ? `${view.size.width.toFixed(1)} x ${view.size.height.toFixed(1)} mm` : null,
        view.copperLayers ? `${view.copperLayers} copper layers` : null,
        view.drill.holes ? `${view.drill.holes} holes` : null,
    ].filter(Boolean);
    return <span className="text-xs text-muted-foreground">{parts.join("  |  ")}</span>;
}

function LoadedViewer({ source, view, focusFile }: {
    source: FabricationSource;
    view: FabricationView;
    focusFile?: string;
}) {
    const [state, dispatch] = useReducer(viewerReducer, undefined, () => initialState(view.layers, focusFile));
    const [tab, setTab] = useState("board");
    const shown = useMemo(
        () => view.layers.filter((layer) => state.visible.has(layer.id)),
        [view.layers, state.visible],
    );
    const shownIds = useMemo(() => shown.map((layer) => layer.id), [shown]);
    const images = useLayerImages(source, shownIds);
    const drawn = view.bounds ? toRect(view.bounds) : null;
    const fitted = view.board ? toRect(view.board) : drawn;
    const board = fitted ? withMargin(fitted) : null;

    return (
        <div className="flex h-full min-h-0 flex-1 flex-col gap-2 p-3">
            <div className="flex flex-wrap items-center gap-3">
                <Tabs value={tab} onValueChange={setTab} className="gap-0">
                    <TabsList variant="line" aria-label="Fabrication views">
                        <TabsTrigger value="board" className="px-2 text-sm">Board</TabsTrigger>
                        <TabsTrigger value="drill" className="px-2 text-sm">
                            Drill ({view.drill.holes})
                        </TabsTrigger>
                    </TabsList>
                </Tabs>
                {tab === "board" && (
                    <div className="flex" role="group" aria-label="Board side">
                        {SIDES.map(({ side, label }) => (
                            <Button
                                key={side}
                                size="xs"
                                variant={state.side === side ? "default" : "outline"}
                                aria-pressed={state.side === side}
                                onClick={() => dispatch({ type: "side", side, layers: view.layers })}
                            >
                                {label}
                            </Button>
                        ))}
                    </div>
                )}
                <Summary view={view} />
            </div>
            {tab === "board" ? (
                <div className={cn("flex min-h-0 flex-1 gap-2")}>
                    <LayerList
                        layers={view.layers}
                        visible={state.visible}
                        onToggle={(id) => dispatch({ type: "toggle", id })}
                        onPreset={() => dispatch({ type: "preset", layers: view.layers })}
                        onAll={() => dispatch({ type: "all", layers: view.layers })}
                        onNone={() => dispatch({ type: "none" })}
                    />
                    {board && drawn ? (
                        <BoardCanvas
                            board={board}
                            drawn={drawn}
                            layers={shown}
                            images={images}
                            mirrored={state.side === "bottom"}
                        />
                    ) : (
                        <p className="p-3 text-sm text-muted-foreground">
                            The layers in this package have no geometry to draw.
                        </p>
                    )}
                </div>
            ) : (
                <DrillTable drill={view.drill} />
            )}
        </div>
    );
}

/**
 * A fabrication package as a board: layers with toggles, top and bottom, pan and
 * zoom, and the drill table. Source-agnostic; key it on `source.key`.
 */
export function FabricationViewer({ source, focusFile }: {
    source: FabricationSource;
    /** Open on one file's layer instead of the default selection. */
    focusFile?: string;
}) {
    const loaded = useFabricationView(source);
    if (loaded.status === "loading") {
        return <p className="p-3 text-sm text-muted-foreground">Loading fabrication package...</p>;
    }
    if (loaded.status === "error") {
        return <p role="alert" className="p-3 text-sm text-destructive">{loaded.message}</p>;
    }
    return <LoadedViewer source={source} view={loaded.view} focusFile={focusFile} />;
}
