import { useMemo, useReducer, useState } from "react";
import { X } from "lucide-react";

import { useBoardViewport } from "@/components/design-comparison/fabrication-viewport";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { BoardCanvas, toRect, withMargin } from "./board-canvas";
import { DrillTable } from "./drill-table";
import { LayerList } from "./layer-list";
import { PartMarkers } from "./part-markers";
import { PlacementPanel } from "./placement-panel";
import type { FabricationSource, FabricationView, PlacementPart } from "./types";
import { useFabricationView, useLayerImages } from "./use-fabrication-data";
import { usePlacement } from "./use-placement";
import { initialState, viewerReducer, type ViewSide } from "./viewer-state";

const SIDES: { side: ViewSide; label: string }[] = [
    { side: "top", label: "Top" },
    { side: "bottom", label: "Bottom" },
];

/** Half the width of the square framed around a picked part, in millimetres. */
const PICK_FRAME_MM = 2;

function Summary({ view }: { view: FabricationView }) {
    const parts = [
        view.size ? `${view.size.width.toFixed(1)} x ${view.size.height.toFixed(1)} mm` : null,
        view.copperLayers ? `${view.copperLayers} copper layers` : null,
        view.drill.holes ? `${view.drill.holes} holes` : null,
    ].filter(Boolean);
    return <span className="text-xs text-muted-foreground">{parts.join("  |  ")}</span>;
}

function PickedPart({ part, onClear }: { part: PlacementPart; onClear: () => void }) {
    return (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded border px-3 py-1.5 text-xs">
            <span className="font-mono font-semibold">{part.ref}</span>
            <span>{part.value || "-"}</span>
            <span className="text-muted-foreground">{part.package}</span>
            <span className="text-muted-foreground">
                {part.side}, x {part.x.toFixed(2)} y {part.y.toFixed(2)}, {part.rotation} deg
            </span>
            <Button size="icon-xs" variant="ghost" className="ml-auto" aria-label="Clear selection" onClick={onClear}>
                <X className="h-3 w-3" />
            </Button>
        </div>
    );
}

function LoadedViewer({ source, view, focusFile }: {
    source: FabricationSource;
    view: FabricationView;
    focusFile?: string;
}) {
    const [state, dispatch] = useReducer(viewerReducer, undefined, () => initialState(view.layers, focusFile));
    const [tab, setTab] = useState("board");
    const placement = usePlacement(source);
    const parts = placement.status === "ready" ? placement.data : null;

    const shown = useMemo(
        () => view.layers.filter((layer) => state.visible.has(layer.id)),
        [view.layers, state.visible],
    );
    const shownIds = useMemo(() => shown.map((layer) => layer.id), [shown]);
    const images = useLayerImages(source, shownIds);

    const drawn = view.bounds ? toRect(view.bounds) : null;
    const fitted = view.board ? toRect(view.board) : drawn;
    const board = fitted ? withMargin(fitted) : null;
    const mirrored = state.side === "bottom";
    const viewport = useBoardViewport(board, { mirrorX: mirrored });

    const sideParts = useMemo(
        () => (parts && state.showParts ? parts.parts.filter((part) => part.side === state.side) : []),
        [parts, state.showParts, state.side],
    );
    const picked = parts?.parts.find((part) => part.ref === state.selected) ?? null;

    const pick = (part: PlacementPart) => {
        dispatch({ type: "select", ref: part.ref, side: part.side, layers: view.layers });
        viewport.frame({
            x: part.x - PICK_FRAME_MM,
            y: part.y - PICK_FRAME_MM,
            width: PICK_FRAME_MM * 2,
            height: PICK_FRAME_MM * 2,
        });
    };

    return (
        <div className="flex h-full min-h-0 flex-1 flex-col gap-2 p-3">
            <div className="flex flex-wrap items-center gap-3">
                <Tabs value={tab} onValueChange={setTab} className="gap-0">
                    <TabsList variant="line" aria-label="Fabrication views">
                        <TabsTrigger value="board" className="px-2 text-sm">Board</TabsTrigger>
                        <TabsTrigger value="drill" className="px-2 text-sm">
                            Drill ({view.drill.holes})
                        </TabsTrigger>
                        {placement.status !== "absent" && placement.status !== "loading" && (
                            <TabsTrigger value="placement" className="px-2 text-sm">
                                Placement{parts ? ` (${parts.counts.placed})` : ""}
                            </TabsTrigger>
                        )}
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
                {tab === "board" && parts && (
                    <Button
                        size="xs"
                        variant={state.showParts ? "default" : "outline"}
                        aria-pressed={state.showParts}
                        onClick={() => dispatch({ type: "parts" })}
                    >
                        Parts
                    </Button>
                )}
                <Summary view={view} />
            </div>
            {tab === "board" && picked && (
                <PickedPart
                    part={picked}
                    onClear={() => dispatch({ type: "select", ref: null, layers: view.layers })}
                />
            )}
            {tab === "board" && (
                <div className="flex min-h-0 flex-1 gap-2">
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
                            mirrored={mirrored}
                            viewport={viewport}
                            overlay={sideParts.length > 0
                                ? (pxPerMm) => (
                                    <PartMarkers
                                        parts={sideParts}
                                        drawn={drawn}
                                        pxPerMm={pxPerMm}
                                        selected={state.selected}
                                        mirrored={mirrored}
                                        onSelect={pick}
                                    />
                                )
                                : undefined}
                        />
                    ) : (
                        <p className="p-3 text-sm text-muted-foreground">
                            The layers in this package have no geometry to draw.
                        </p>
                    )}
                </div>
            )}
            {tab === "drill" && <DrillTable drill={view.drill} />}
            {/* Kept mounted so its search and filters survive a look at the board. */}
            {placement.status === "error" && tab === "placement" && (
                <p role="alert" className="p-3 text-sm text-destructive">{placement.message}</p>
            )}
            {parts && (
                <div className={tab === "placement" ? "flex min-h-0 flex-1 flex-col" : "hidden"}>
                    <PlacementPanel
                        view={parts}
                        selected={state.selected}
                        onSelect={(part) => {
                            pick(part);
                            setTab("board");
                        }}
                    />
                </div>
            )}
        </div>
    );
}

/**
 * A fabrication package as a board: layers with toggles, top and bottom, pan and
 * zoom, the drill table, and the pick-and-place parts when the source has them.
 * Source-agnostic; key it on `source.key`.
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
