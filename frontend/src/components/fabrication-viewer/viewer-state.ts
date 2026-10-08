import type { FabricationLayer } from "./types";

export type ViewSide = "top" | "bottom";

export interface ViewerState {
    side: ViewSide;
    visible: ReadonlySet<string>;
}

export type ViewerAction =
    | { type: "side"; side: ViewSide; layers: FabricationLayer[] }
    | { type: "toggle"; id: string }
    | { type: "preset"; layers: FabricationLayer[] }
    | { type: "all"; layers: FabricationLayer[] }
    | { type: "none" };

/**
 * What a reviewer wants first: the side's copper and legend, the board profile
 * and the holes. Mask and paste are openings, which read as noise until asked for.
 */
export function presetFor(layers: FabricationLayer[], side: ViewSide): Set<string> {
    const ids = new Set<string>();
    for (const layer of layers) {
        const onSide = layer.side === side;
        const wanted =
            ((layer.role === "copper" || layer.role === "silk") && onSide)
            || layer.role === "outline"
            || layer.role === "drill";
        if (wanted) ids.add(layer.id);
    }
    return ids;
}

/** A package opened on one file: that layer, with the profile to place it. */
export function focusedOn(layers: FabricationLayer[], file: string): Set<string> {
    const target = layers.find((layer) => layer.file === file);
    if (!target) return new Set();
    const ids = new Set<string>([target.id]);
    for (const layer of layers) {
        if (layer.role === "outline") ids.add(layer.id);
    }
    return ids;
}

/** Bottom-only packages and single-file focus open on the side that has the layer. */
export function sideOf(layers: FabricationLayer[], file?: string): ViewSide {
    const target = file ? layers.find((layer) => layer.file === file) : undefined;
    if (target) return target.side === "bottom" ? "bottom" : "top";
    const hasTop = layers.some((layer) => layer.side === "top" && layer.role === "copper");
    const hasBottom = layers.some((layer) => layer.side === "bottom" && layer.role === "copper");
    return !hasTop && hasBottom ? "bottom" : "top";
}

export function initialState(layers: FabricationLayer[], focusFile?: string): ViewerState {
    const side = sideOf(layers, focusFile);
    const focus = focusFile ? focusedOn(layers, focusFile) : new Set<string>();
    return {
        side,
        visible: focus.size > 0 ? focus : presetFor(layers, side),
    };
}

export function viewerReducer(state: ViewerState, action: ViewerAction): ViewerState {
    switch (action.type) {
        case "side":
            return action.side === state.side
                ? state
                : { side: action.side, visible: presetFor(action.layers, action.side) };
        case "toggle": {
            const visible = new Set(state.visible);
            if (!visible.delete(action.id)) visible.add(action.id);
            return { ...state, visible };
        }
        case "preset":
            return { ...state, visible: presetFor(action.layers, state.side) };
        case "all":
            return { ...state, visible: new Set(action.layers.map((layer) => layer.id)) };
        case "none":
            return { ...state, visible: new Set() };
        default:
            return state;
    }
}
