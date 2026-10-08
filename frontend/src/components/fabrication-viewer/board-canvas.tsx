import { useEffect, useRef, useState } from "react";
import { Maximize2, ZoomIn, ZoomOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    paneLayout,
    useBoardViewport,
    type BoardRect,
} from "@/components/design-comparison/fabrication-viewport";

import type { LayerImage } from "./use-fabrication-data";
import type { FabricationLayer } from "./types";

const ZOOM_STEP = 1.5;

export function toRect(box: readonly [number, number, number, number]): BoardRect {
    return { x: box[0], y: box[1], width: box[2] - box[0], height: box[3] - box[1] };
}

/** Breathing room around the board when fitted, as a share of each side. */
const FIT_MARGIN = 0.04;

/**
 * The rectangle the view fits to. Fitting the profile exactly puts its outer
 * edges on the pane border, where they are clipped away.
 */
export function withMargin(rect: BoardRect, margin = FIT_MARGIN): BoardRect {
    const dx = rect.width * margin;
    const dy = rect.height * margin;
    return { x: rect.x - dx, y: rect.y - dy, width: rect.width + 2 * dx, height: rect.height + 2 * dy };
}

function usePaneSize() {
    const ref = useRef<HTMLDivElement | null>(null);
    const [size, setSize] = useState({ width: 0, height: 0 });
    useEffect(() => {
        const element = ref.current;
        if (!element || typeof ResizeObserver === "undefined") return undefined;
        const observer = new ResizeObserver(([entry]) => {
            if (entry) setSize({ width: entry.contentRect.width, height: entry.contentRect.height });
        });
        observer.observe(element);
        return () => observer.disconnect();
    }, []);
    return { ref, size };
}

/**
 * The visible layers stacked on one board rectangle, with pan and zoom.
 *
 * Layers are screen-blended over a dark pane: every SVG has a black background,
 * which is the identity for that blend, so overlapping layers add up in colour
 * and nothing hides what is under it.
 */
export function BoardCanvas({
    board,
    drawn,
    layers,
    images,
    mirrored,
}: {
    board: BoardRect;
    drawn: BoardRect;
    /** Visible layers, in the order they are listed. */
    layers: FabricationLayer[];
    images: Record<string, LayerImage>;
    mirrored: boolean;
}) {
    const { view, reset, zoomBy, handlers } = useBoardViewport(board, { mirrorX: mirrored });
    const { ref, size } = usePaneSize();
    const layout = size.width && size.height ? paneLayout(drawn, board, view, size) : null;
    const loading = layers.some((layer) => images[layer.id]?.status === "loading");
    const failed = layers.filter((layer) => images[layer.id]?.status === "error");

    return (
        <div className="relative min-h-0 min-w-0 flex-1">
            <div
                ref={ref}
                data-testid="board-pane"
                className="absolute inset-0 cursor-grab touch-none overflow-hidden rounded border bg-[#0b0f14] active:cursor-grabbing"
                {...handlers}
            >
                <div
                    className="absolute inset-0"
                    style={mirrored ? { transform: "scaleX(-1)" } : undefined}
                >
                    {layout && (
                        <div
                            className="absolute"
                            style={{
                                width: layout.width,
                                height: layout.height,
                                left: layout.left,
                                top: layout.top,
                            }}
                        >
                            {layers.map((layer) => {
                                const image = images[layer.id];
                                if (image?.status !== "ready") return null;
                                return (
                                    <img
                                        key={layer.id}
                                        src={image.url}
                                        alt={layer.name}
                                        draggable={false}
                                        className="pointer-events-none absolute inset-0 h-full w-full select-none"
                                        style={{ mixBlendMode: "screen" }}
                                    />
                                );
                            })}
                        </div>
                    )}
                </div>
                {layers.length === 0 && (
                    <p className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">
                        No layers shown
                    </p>
                )}
                {loading && (
                    <p className="absolute left-2 top-2 text-[10px] uppercase tracking-wider text-muted-foreground">
                        Loading layers
                    </p>
                )}
                {failed.length > 0 && (
                    <p role="alert" className="absolute left-2 top-2 text-xs text-destructive">
                        Could not load {failed.map((layer) => layer.name).join(", ")}
                    </p>
                )}
            </div>
            <div className="absolute bottom-2 right-2 flex gap-1">
                <Button size="icon-xs" variant="secondary" aria-label="Zoom in" onClick={() => zoomBy(ZOOM_STEP)}>
                    <ZoomIn className="h-3.5 w-3.5" />
                </Button>
                <Button size="icon-xs" variant="secondary" aria-label="Zoom out" onClick={() => zoomBy(1 / ZOOM_STEP)}>
                    <ZoomOut className="h-3.5 w-3.5" />
                </Button>
                <Button size="icon-xs" variant="secondary" aria-label="Fit board" onClick={reset}>
                    <Maximize2 className="h-3.5 w-3.5" />
                </Button>
            </div>
        </div>
    );
}
