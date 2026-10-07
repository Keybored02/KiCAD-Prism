import type React from "react";
import type { PrismSelection } from "@/types/prism-selection";

export interface PrismSemanticViewerSelectionDetail {
    selection: PrismSelection | null;
}

export interface PrismRendererSelection {
    reference?: string;
    pin?: string;
    netName?: string;
    netUid?: string;
    netCode?: number;
    featureId?: number;
}

/** One placement of the loaded board; `key` (the occurrence path) returns on picks and selections. */
export interface PrismViewerOccurrence {
    matrix: readonly number[];
    key: string;
}

export interface PrismViewerPick {
    kind: "none" | "feature" | "board" | "gizmo";
    occurrenceIndex: number;
    occurrenceKey: string | null;
    featureId: number;
    /** What a click there would select (reference, pin, net), when it hits a feature. */
    selection: Record<string, unknown> | null;
}

export interface PrismViewerStats {
    occurrences: number;
    /** Occurrences per level of detail in the last culled frame. */
    lod: { full: number; board: number; box: number; culled: number };
    triangles: number;
    draws: number;
    gpuMemoryBytes: number;
    /** SB2-26: the GPU budget, the component tier and the browser asset cache. */
    gpuBudgetBytes: number;
    componentTier: "idle" | "loading" | "loaded";
    componentEvictions: number;
    tileEvictions: number;
    cache: {
        enabled: boolean;
        files?: number;
        bytes?: number;
        hits?: number;
        misses?: number;
        networkBytes?: number;
        cachedBytes?: number;
    };
    frameIntervalMs: number;
    frameIntervalP95Ms: number;
    frameCpuMs: number;
    frameCpuP95Ms: number;
    fps: number;
}

export interface PrismSemanticLayerState {
    id: number;
    name: string;
    color: string;
    visible: boolean;
}

/** PCB 3D controls the host renders when it sets `hide-panel`. */
export interface PrismSemanticViewState {
    /** "layer" is the stacked flat layer view. */
    mode: "3d" | "layer";
    layers: PrismSemanticLayerState[];
    showBoard: boolean;
    showComponents: boolean;
    /** Boxes standing in for footprints without a 3D model. */
    showPlaceholders: boolean;
    realisticColors: boolean;
    /** 0..1 */
    separation: number;
    isolateNet: boolean;
    hasNet: boolean;
    /** mode="system" (SB2-31e): a layer section per placed board, in placement order. */
    boards?: PrismSystemBoardViewState[];
    /** mode="system": the placement path the selection belongs to, or null. */
    selectedBoard?: string | null;
}

/** One placed board of a system scene and its copper layers (D-P2-26). */
export interface PrismSystemBoardViewState {
    /** The placement (occurrence) path. */
    key: string;
    name: string;
    /** Why the board draws as a box (restricted, loading, building, missing, failed), or null. */
    standIn: string | null;
    layers: PrismSemanticLayerState[];
}

/** `prism-semantic-viewer:contextmenu`: a right-click without a drag. */
export interface PrismSemanticContextMenuDetail {
    clientX: number;
    clientY: number;
    /** Component under the cursor, if any. */
    reference?: string;
    value?: string;
}

export type PrismSemanticLayerPreset = "all" | "none" | "outer" | "inner";

export interface PrismSemanticViewerElement extends HTMLElement {
    setSelection: (selection: PrismRendererSelection | null) => void;
    /**
     * Replace the highlighted nets: every listed net renders emphasised
     * alongside the inspected selection. Safe before ready and after reloads.
     */
    setHighlightedNets?: (nets: readonly PrismRendererSelection[]) => void;
    /**
     * Replaces the hidden component set (VAR-18). Safe before ready and after
     * reloads; ambiguous or unknown references stay visible.
     */
    setHiddenComponents: (references: string[]) => void;
    /**
     * Draw the loaded board once per occurrence (System Builder SB2-23):
     * column-major 4×4 model matrices in the bundle's runtime units (metres).
     * Geometry uploads once; `null` restores the one-board view exactly.
     * Safe before ready and after reloads.
     */
    setOccurrences?: (
        occurrences: readonly (readonly number[] | PrismViewerOccurrence)[] | null,
    ) => void;
    /** What is under a client point, without selecting it (SB2-24). Null before ready. */
    pickAt?: (clientX: number, clientY: number) => Promise<PrismViewerPick | null>;
    /** Client coordinates of a component's centre on one occurrence, or null off screen. */
    projectComponent?: (reference: string, occurrenceKey?: string) => { x: number; y: number } | null;
    /** Client coordinates of a board-local runtime point (metres) on one occurrence. */
    projectPoint?: (point: readonly [number, number, number], occurrenceKey?: string) => { x: number; y: number } | null;
    /** Show the scene stats overlay (SB2-25); the backquote key toggles it. */
    setStatsOverlay?: (visible: boolean) => void;
    /** The numbers behind the stats overlay, or null before ready. */
    getStats?: () => PrismViewerStats | null;
    /** Force a level of detail on every occurrence (0 full, 1 board, 2 box), or null for automatic. */
    setLodOverride?: (lod: 0 | 1 | 2 | null) => void;
    /** GPU memory budget in bytes (default 1.5 GB); over it, tiers no occurrence needs are evicted. */
    setGpuBudget?: (bytes: number) => void;
    /** Every component reference on the board; empty until the viewer is ready. */
    getComponentReferences?: () => string[];
    resize: () => void;
    /** Null until the viewer is ready. Changes arrive as `prism-semantic-viewer:viewstatechange`. */
    getViewState?: () => PrismSemanticViewState | null;
    setViewMode?: (mode: PrismSemanticViewState["mode"]) => void;
    /** In a system scene, `placement` names one placed board (every placement of the selected board when omitted). */
    setLayerVisible?: (layerId: number, visible: boolean, placement?: string | null) => void;
    applyLayerPreset?: (preset: PrismSemanticLayerPreset, placement?: string | null) => void;
    setShowBoard?: (visible: boolean) => void;
    setShowComponents?: (visible: boolean) => void;
    setShowPlaceholders?: (visible: boolean) => void;
    setRealisticColors?: (enabled: boolean) => void;
    setSeparation?: (value: number) => void;
    showNetLayers?: () => void;
    setNetIsolation?: (enabled: boolean) => void;
    /** mode="system" (SB2-31e): the system to show, a `prism.system_scene.a0` descriptor. Safe before ready. */
    setSystemScene?: (descriptor: unknown) => void;
    /** mode="system": light system nets on every board they reach; the report also arrives as `prism-semantic-viewer:emphasis`. */
    setNetEmphasis?: (sets: readonly PrismSystemSceneEmphasisSet[]) => PrismSystemSceneEmphasisResult[];
    /** mode="system": frame a lit set's copper (or all), on one placement or all; false when nothing is lit there. */
    frameNetEmphasis?: (key?: string | null, occurrence?: string | null) => boolean;
    /** mode="system": frame one placed board. */
    frameBoard?: (key: string) => boolean;
}

/** What a click in the system scene selected (SB2-27). */
export interface PrismSystemSceneSelection {
    kind: "board" | "component" | "feature";
    occurrence: string;
    displayPath: string;
    instanceId: string;
    restricted: boolean;
    /** Why the board is drawn as a box: restricted, loading, building, missing, failed. */
    standIn: string | null;
    featureId?: number;
    reference?: string | null;
}

export interface PrismSystemSceneStatus {
    boards: number;
    loaded: number;
    loading: number;
    restricted: number;
    building: number;
    missing: number;
    failed: number;
    unknown: number;
    /** Boards without a known box yet (no PCB or interface): not drawn. */
    unplaced: number;
}

export interface PrismScenePose {
    translationMm: [number, number, number];
    /** Unit quaternion x, y, z, w (canonical, w ≥ 0). */
    rotation: [number, number, number, number];
}

/** `prism-system-scene:move` (SB2-29). "commit" asks the host to save `target.pose`. */
export interface PrismSystemSceneMoveState {
    /** "sync": the host gave a re-read scene (a save landed, or bundles changed). */
    phase?: "mode" | "target" | "preview" | "commit" | "cancel" | "sync";
    allowed: boolean;
    enabled: boolean;
    space: "world" | "local";
    dragging: boolean;
    target: {
        occurrence: string;
        instanceId: string;
        displayPath: string;
        kind: string;
        restricted: boolean;
        pose: PrismScenePose;
        source: "default" | "manual" | "auto";
        /** The pose shown is a preview that is not saved yet. */
        unsaved: boolean;
    } | null;
}

/** A system net to light (SB2-31): board nets by occurrence path. */
export interface PrismSystemSceneEmphasisSet {
    key: string;
    /** "#rrggbb"; omitted takes the next palette colour. */
    color?: string;
    members: readonly { occurrence: string; net: string }[];
}

/** What a set lit (`setNetEmphasis`'s return and `prism-system-scene:emphasis`). */
export interface PrismSystemSceneEmphasisResult {
    key: string;
    color: string;
    lit: number;
    unresolved: { occurrence: string; net: string; reason: "not-drawn" | "loading" | "restricted" | "unknown-net" }[];
}

export interface PrismSystemSceneElement extends HTMLElement {
    setScene(descriptor: unknown): void;
    select(path: string | null, featureId?: number): PrismSystemSceneSelection | null;
    frameAll(): void;
    frameOccurrence(path: string): void;
    pickAt(clientX: number, clientY: number): Promise<unknown>;
    projectOccurrence(path: string): { x: number; y: number } | null;
    setStatsOverlay(visible: boolean): void;
    setLabelsVisible(visible: boolean): void;
    setGpuBudget(bytes: number | null): void;
    getStats(): Record<string, unknown> | null;
    setMoveAllowed(allowed: boolean): void;
    setMoveMode(enabled: boolean): void;
    setMoveSpace(space: "world" | "local"): void;
    /** Show a pose for the move target without saving it; null shows the saved pose. */
    previewPose(pose: PrismScenePose | null): void;
    cancelMove(): void;
    getMoveState(): PrismSystemSceneMoveState | null;
    setHelpVisible(visible: boolean): void;
    /** Highlight system nets; an empty list clears. Null before WebGPU starts. */
    setNetEmphasis(sets: readonly PrismSystemSceneEmphasisSet[]): PrismSystemSceneEmphasisResult[] | null;
    /** Frame a highlighted set's copper (by key, or all), on one occurrence (by path) or all; false when nothing is lit there. */
    frameNetEmphasis(key?: string | null, occurrence?: string | null): boolean;
    /** Only the highlighted copper draws (the I key); returns the state in force. */
    setNetIsolation(enabled: boolean): boolean;
}

declare global {
    interface HTMLElementTagNameMap {
        "prism-semantic-viewer": PrismSemanticViewerElement;
        "prism-system-scene": PrismSystemSceneElement;
    }

    namespace JSX {
        interface IntrinsicElements {
            "prism-semantic-viewer": React.DetailedHTMLProps<
                React.HTMLAttributes<PrismSemanticViewerElement> & {
                    "bundle-url"?: string;
                    workspace?: "pcb" | "stackup";
                    active?: string;
                    "hide-panel"?: string;
                },
                PrismSemanticViewerElement
            >;
            "prism-system-scene": React.DetailedHTMLProps<
                React.HTMLAttributes<PrismSystemSceneElement>,
                PrismSystemSceneElement
            >;
        }
    }
}

export {};
