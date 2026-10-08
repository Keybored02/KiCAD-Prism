export type LayerRole = "silk" | "paste" | "mask" | "copper" | "outline" | "drill" | "other";
export type LayerSide = "top" | "bottom" | "inner" | "both";

export interface FabricationLayer {
    id: string;
    name: string;
    function: string;
    role: LayerRole;
    side: LayerSide;
    colour: string;
    file: string;
    kind: "gerber" | "excellon";
    warnings: string[];
}

export interface DrillTool {
    diameter: number;
    plated: boolean;
    function: string;
    hits: number;
    slots: number;
    file: string;
}

export interface FabricationView {
    present: boolean;
    /** Everything drawn, [minX, minY, maxX, maxY] in board millimetres. */
    bounds: [number, number, number, number] | null;
    /** The board profile, or the drawn extent when the package has none. */
    board: [number, number, number, number] | null;
    size: { width: number; height: number } | null;
    copperLayers: number;
    layers: FabricationLayer[];
    drill: {
        tools: DrillTool[];
        holes: number;
        slots: number;
        smallest: number | null;
    };
}

/**
 * Where a package's data comes from. The viewer knows nothing about Release
 * Studio or the Assets Portal; each supplies its own two URLs.
 */
export interface FabricationSource {
    /** Identity of the package. A new key is a new viewer. */
    key: string;
    viewUrl: string;
    layerUrl: (layerId: string) => string;
}
