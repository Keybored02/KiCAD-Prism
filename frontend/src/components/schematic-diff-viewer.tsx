import {
    useState, useEffect, useRef, useCallback,
} from "react";
import {
    X, Loader2, AlertCircle, ChevronLeft, ChevronRight,
    Plus, Minus, RefreshCw, MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ECadViewerElement } from "@/types/ecad-viewer";
import {
    EcadInfoPanel,
    EcadViewerHost,
    useEcadInfoPanel,
} from "@/components/ecad-viewer-shared";
import { categorise, CATEGORY_META } from "@/lib/diff-grouping";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SchItem {
    type: string;
    uuid: string;
    x: number;
    y: number;
    // symbol fields
    reference?: string;
    value?: string;
    footprint?: string;
    lib_id?: string;
    rotation?: number;
    mirror?: string;
    unit?: number;
    in_bom?: boolean;
    on_board?: boolean;
    dnp?: boolean;
    // label/text/sheet fields
    text?: string;
    sheet_file?: string;
    sheet_name?: string;
    // wire/bus/junction geometry
    start_x?: number;
    start_y?: number;
    end_x?: number;
    end_y?: number;
    net?: string;
}

interface FieldChange {
    old: string | number | null;
    new: string | number | null;
}

interface ChangedItem {
    item: SchItem;
    changes: Record<string, FieldChange>;
}

interface SchDiff {
    added: SchItem[];
    removed: SchItem[];
    changed: ChangedItem[];
}

interface SheetData {
    filename: string;
    old_content: string | null;
    new_content: string | null;
    diff: SchDiff;
}

interface SchematicDiffData {
    commit1: string;
    commit2: string;
    sheets: SheetData[];
}

interface DiffMarker {
    kind: "added" | "removed" | "changed";
    item: SchItem;
    changes?: Record<string, FieldChange>;
}

interface SchematicDiffViewerProps {
    projectId: string;
    commit1: string; // newer
    commit2: string; // older
    onClose: () => void;
    embedded?: boolean;
    onCrossProbe?: (reference: string) => void;
    crossProbeTarget?: string; // reference to navigate to when switching from PCB
    /** Item id (uuid) to focus on when the diff loads. */
    focusItemId?: string;
    /** When true, hide the OLD/NEW toggle for single-commit history views. */
    singleCommit?: boolean;
}

// ---------------------------------------------------------------------------
// Colours
// ---------------------------------------------------------------------------

const KIND_COLOR: Record<DiffMarker["kind"], string> = {
    added: "#22c55e",
    removed: "#ef4444",
    changed: "#f59e0b",
};

const KIND_LABEL: Record<DiffMarker["kind"], string> = {
    added: "Added",
    removed: "Removed",
    changed: "Changed",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function itemLabel(item: SchItem): string {
    if (item.reference) return item.reference;
    if (item.text) return item.text.slice(0, 24) + (item.text.length > 24 ? "…" : "");
    if (item.sheet_name) return item.sheet_name;
    return item.type;
}

function fieldLabel(key: string): string {
    const LABELS: Record<string, string> = {
        lib_id: "Library ID",
        in_bom: "In BOM",
        on_board: "On Board",
        dnp: "DNP",
    };
    return LABELS[key] ?? key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatFieldValue(field: string, value: unknown): string {
    if (value == null || value === "") return "–";
    if (typeof value === "boolean") return value ? "yes" : "no";
    return String(value);
}

// ---------------------------------------------------------------------------
// EcadViewerHost (inline version so we don't import visualizer internals)
// ---------------------------------------------------------------------------


// ---------------------------------------------------------------------------
// Overlay: colour-coded pins using getScreenLocation
// ---------------------------------------------------------------------------

interface OverlayProps {
    markers: DiffMarker[];
    viewerRef: React.RefObject<ECadViewerElement | null>;
    onMarkerClick: (marker: DiffMarker) => void;
    activeUuid: string | null;
    kickRef?: React.MutableRefObject<((frames?: number) => void) | null>;
}

// World-space half-extents (mm) per item type for the bounding box
function _boxHalfExtent(type: string): { hw: number; hh: number } {
    switch (type) {
        case "symbol": return { hw: 5, hh: 4 };
        case "sheet":  return { hw: 6, hh: 5 };
        default:       return { hw: 3, hh: 1.5 }; // labels, text
    }
}

function DiffOverlay({ markers, viewerRef, onMarkerClick, activeUuid, kickRef }: OverlayProps) {
    const boxRefs = useRef<Map<string, HTMLDivElement>>(new Map());
    const rafRef  = useRef<number | null>(null);
    // How many more consecutive frames to keep running after the last trigger
    const framesLeftRef = useRef(0);

    const updatePositions = useCallback((): boolean => {
        const viewer = viewerRef.current;
        if (!viewer?.getScreenLocation) return false;
        try {
            const rect = viewer.getBoundingClientRect();
            if (!rect.width) return false;
            let anyVisible = false;
            for (const m of markers) {
                const el = boxRefs.current.get(m.item.uuid);
                if (!el) continue;
                const { hw, hh } = _boxHalfExtent(m.item.type);
                const tl = viewer.getScreenLocation(m.item.x - hw, m.item.y - hh);
                const br = viewer.getScreenLocation(m.item.x + hw, m.item.y + hh);
                if (!tl || !br) { el.style.display = "none"; continue; }
                const left = Math.min(tl.x, br.x);
                const top  = Math.min(tl.y, br.y);
                const w    = Math.abs(br.x - tl.x);
                const h    = Math.abs(br.y - tl.y);
                const vis  = left + w > 0 && left < rect.width && top + h > 0 && top < rect.height;
                if (vis) {
                    el.style.display = "";
                    el.style.left   = `${left}px`;
                    el.style.top    = `${top}px`;
                    el.style.width  = `${w}px`;
                    el.style.height = `${h}px`;
                    anyVisible = true;
                } else {
                    el.style.display = "none";
                }
            }
            return anyVisible || markers.length === 0;
        } catch { return false; }
    }, [viewerRef, markers]);

    const tick = useCallback(() => {
        const done = updatePositions();
        if (framesLeftRef.current > 0 || !done) {
            if (framesLeftRef.current > 0) framesLeftRef.current--;
            rafRef.current = requestAnimationFrame(tick);
        } else {
            rafRef.current = null;
        }
    }, [updatePositions]);

    const kick = useCallback((frames = 30) => {
        framesLeftRef.current = Math.max(framesLeftRef.current, frames);
        if (rafRef.current === null) {
            rafRef.current = requestAnimationFrame(tick);
        }
    }, [tick]);

    // Expose kick to parent so zoom/toggle can trigger overlay refresh
    useEffect(() => {
        if (kickRef) kickRef.current = kick;
        return () => { if (kickRef) kickRef.current = null; };
    }, [kick, kickRef]);

    useEffect(() => {
        // mousedown starts a generous frame budget that easily covers a drag
        // mouseup tops it up for a few final settling frames
        // wheel kicks for inertial wheel events
        // No global mousemove listener — that fires too often and wastes work
        const onDown  = () => kick(180); // ~3s at 60fps; covers most drags without re-arming
        const onUp    = () => kick(20);
        const onWheel = () => kick(20);
        window.addEventListener("mousedown", onDown);
        window.addEventListener("mouseup",   onUp);
        window.addEventListener("wheel",     onWheel, { passive: true });
        window.addEventListener("resize",    onUp);
        return () => {
            window.removeEventListener("mousedown", onDown);
            window.removeEventListener("mouseup",   onUp);
            window.removeEventListener("wheel",     onWheel);
            window.removeEventListener("resize",    onUp);
            if (rafRef.current !== null) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
        };
    }, [kick]);

    // On mount / markers change: run enough frames to catch async ecad-viewer load
    useEffect(() => { kick(30); }, [markers, kick]);

    // Hook into the underlying viewer's on_viewport_change so the overlay
    // refreshes whenever the camera moves — including the post-load auto-fit,
    // which doesn't emit a DOM panzoom event and would otherwise leave boxes
    // stranded at stale coordinates until the user interacts.
    useEffect(() => {
        let stopped = false;
        const findInner = (host: HTMLElement): (Record<string, unknown> & { on_viewport_change?: () => void; __overlayKickHooked?: boolean }) | null => {
            const sr = host.shadowRoot;
            const root: ShadowRoot | HTMLElement = sr ?? host;
            const candidate = (root as ShadowRoot).querySelector?.("kc-schematic-app, kc-schematic-viewer") as (HTMLElement & { viewer?: Record<string, unknown> }) | null;
            const inner = candidate?.viewer;
            if (inner && typeof inner.on_viewport_change === "function") return inner as Record<string, unknown> & { on_viewport_change: () => void };
            for (const child of (root as ShadowRoot).querySelectorAll?.("*") ?? []) {
                if ((child as HTMLElement).shadowRoot) {
                    const f = findInner(child as HTMLElement);
                    if (f) return f;
                }
            }
            return null;
        };
        const tryHook = () => {
            if (stopped) return;
            const host = viewerRef.current;
            const inner = host ? findInner(host as unknown as HTMLElement) : null;
            if (!inner) {
                window.setTimeout(tryHook, 200);
                return;
            }
            if (inner.__overlayKickHooked) return;
            const orig = (inner.on_viewport_change as () => void).bind(inner);
            inner.on_viewport_change = function () {
                orig();
                kick(2);
            };
            inner.__overlayKickHooked = true;
        };
        tryHook();
        return () => { stopped = true; };
    }, [viewerRef, kick]);

    return (
        <div className="absolute inset-0 z-20 pointer-events-none overflow-hidden">
            {markers.map((m) => {
                const color = KIND_COLOR[m.kind];
                const isActive = m.item.uuid === activeUuid;
                const HIT = 6; // px — edge strip thickness, interior click-through
                return (
                    <div
                        key={m.item.uuid}
                        ref={(node) => {
                            if (node) boxRefs.current.set(m.item.uuid, node);
                            else boxRefs.current.delete(m.item.uuid);
                        }}
                        className="absolute"
                        style={{
                            display: "none",
                            border: `2px solid ${color}`,
                            borderRadius: 3,
                            backgroundColor: `${color}1A`,
                            boxShadow: isActive ? `0 0 0 2px ${color}66, inset 0 0 0 1px ${color}44` : undefined,
                            pointerEvents: "none",
                        }}
                    >
                        {/* top strip */}
                        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: HIT, pointerEvents: "auto", cursor: "pointer" }} onClick={() => onMarkerClick(m)} />
                        {/* bottom strip */}
                        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: HIT, pointerEvents: "auto", cursor: "pointer" }} onClick={() => onMarkerClick(m)} />
                        {/* left strip */}
                        <div style={{ position: "absolute", top: HIT, bottom: HIT, left: 0, width: HIT, pointerEvents: "auto", cursor: "pointer" }} onClick={() => onMarkerClick(m)} />
                        {/* right strip */}
                        <div style={{ position: "absolute", top: HIT, bottom: HIT, right: 0, width: HIT, pointerEvents: "auto", cursor: "pointer" }} onClick={() => onMarkerClick(m)} />
                    </div>
                );
            })}
        </div>
    );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function SchematicDiffViewer({
    projectId,
    commit1,
    commit2,
    onClose,
    embedded = false,
    onCrossProbe,
    crossProbeTarget,
    focusItemId,
    singleCommit = false,
}: SchematicDiffViewerProps) {
    const [data, setData] = useState<SchematicDiffData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // "new" = commit1 (newer), "old" = commit2 (older)
    const [showing, setShowing] = useState<"new" | "old">("new");
    const [activeMarker, setActiveMarker] = useState<DiffMarker | null>(null);

    // Visibility toggles
    const [showOverlay, setShowOverlay] = useState(true);
    const [showAdded, setShowAdded] = useState(true);
    const [showRemoved, setShowRemoved] = useState(true);
    const [showChanged, setShowChanged] = useState(true);

    // Two always-mounted viewers — swapping visibility preserves pan/zoom state
    const newViewerRef = useRef<ECadViewerElement | null>(null);
    const oldViewerRef = useRef<ECadViewerElement | null>(null);
    const viewerRef = showing === "new" ? newViewerRef : oldViewerRef;
    const syncRafRef = useRef<number | null>(null);
    const overlayKickRef = useRef<((frames?: number) => void) | null>(null);

    // Camera shape we touch directly — avoids the bbox setter's viewport-dependent math
    type Vec2 = { x: number; y: number; set: (x: number, y: number) => void };
    type Camera = { center: Vec2; zoom: number };
    type InnerViewer = {
        viewport?: { camera?: Camera };
        draw?: () => void;
        zoom_fit_item?: (uuid: string) => void;
        zoom_fit_top_item?: () => void;
    };
    type SchEl = HTMLElement & { viewer?: InnerViewer };
    const schElCache = useRef<WeakMap<ECadViewerElement, SchEl>>(new WeakMap());

    const getSchEl = useCallback((host: ECadViewerElement): SchEl | null => {
        const cached = schElCache.current.get(host);
        if (cached?.viewer?.viewport?.camera) return cached;
        // Depth-first walk through shadow DOMs looking for kc-schematic-app (preferred) or kc-schematic-viewer
        const walk = (root: ShadowRoot | Element): SchEl | null => {
            const sr = (root as HTMLElement).shadowRoot;
            const searchRoot: ShadowRoot | Element = sr ?? root;
            // Prefer kc-schematic-app — it has the canonical zoom_fit_item used by cross-probe
            const app = (searchRoot as ShadowRoot).querySelector?.("kc-schematic-app") as SchEl | null;
            if (app?.viewer?.viewport?.camera) return app;
            const viewer = (searchRoot as ShadowRoot).querySelector?.("kc-schematic-viewer") as SchEl | null;
            if (viewer?.viewer?.viewport?.camera) return viewer;
            // Recurse into children's shadow roots
            for (const el of (searchRoot as ShadowRoot).querySelectorAll?.("*") ?? []) {
                if ((el as HTMLElement).shadowRoot) {
                    const f = walk(el as HTMLElement);
                    if (f) return f;
                }
            }
            return app ?? viewer ?? null;
        };
        const result = host.shadowRoot ? walk(host) : null;
        if (result?.viewer?.viewport?.camera) schElCache.current.set(host, result);
        return result;
    }, []);

    const getCamera = useCallback((host: ECadViewerElement): Camera | null => {
        return getSchEl(host)?.viewer?.viewport?.camera ?? null;
    }, [getSchEl]);

    // Safe draw: only call draw() when the renderer's ctx2d is initialized.
    // ctx2d is set in setup() — if it's missing, the canvas isn't ready and draw() would crash.
    const safeDraw = useCallback((host: ECadViewerElement) => {
        const inner = getSchEl(host)?.viewer as (InnerViewer & { renderer?: { ctx2d?: unknown } }) | undefined;
        if (inner?.renderer?.ctx2d) inner.draw?.();
    }, [getSchEl]);

    // Camera we want to impose on the active viewer after a toggle or item click.
    // Released when the viewer fires a "panzoom" event (user panned/zoomed interactively).
    const imposeCamRef = useRef<{ zoom: number; cx: number; cy: number } | null>(null);

    const handleToggle = useCallback((next: "new" | "old") => {
        if (next === showing) return;
        const fromRef = showing === "new" ? newViewerRef : oldViewerRef;
        const toRef   = showing === "new" ? oldViewerRef : newViewerRef;
        const cam = fromRef.current ? getCamera(fromRef.current) : null;
        if (cam) {
            const state = { zoom: cam.zoom, cx: cam.center.x, cy: cam.center.y };
            imposeCamRef.current = state;
            // Pre-write camera into target viewer and queue a repaint BEFORE the visibility
            // flip, so our rAF is ahead of the viewer's own ResizeObserver-triggered draw().
            const toHost = toRef.current;
            const toCam  = toHost ? getCamera(toHost) : null;
            if (toCam && toHost) {
                toCam.zoom = state.zoom;
                toCam.center.set(state.cx, state.cy);
                safeDraw(toHost);
            }
        }
        setShowing(next);
    }, [showing, getCamera, safeDraw]);

    const showingRef = useRef(showing);
    useEffect(() => { showingRef.current = showing; }, [showing]);

    // Ref attached to the viewer container div — used to detect user interaction for impose release.
    const viewerContainerRef = useRef<HTMLDivElement | null>(null);

    const viewerRefsArr = useRef([newViewerRef, oldViewerRef]).current;
    const { detail: selectedDetail, clear: clearSelectedDetail } = useEcadInfoPanel({
        containerRef: viewerContainerRef,
        viewerRefs: viewerRefsArr,
    });

    // Continuous loop: whenever imposeCamRef is set, keep writing it to the active viewer.
    // Released when the user interacts with the viewer area (pointerdown or wheel).
    useEffect(() => {
        let raf = 0;
        const tick = () => {
            const impose = imposeCamRef.current;
            if (impose) {
                const activeRef = showingRef.current === "new" ? newViewerRef : oldViewerRef;
                const host = activeRef.current;
                const cam = host ? getCamera(host) : null;
                if (cam && host) {
                    cam.zoom = impose.zoom;
                    cam.center.set(impose.cx, impose.cy);
                    safeDraw(host);
                }
            }
            raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);

        // pointerdown and wheel on the viewer container release the impose lock.
        // These events compose through shadow DOM so they reach the host container.
        const release = () => { imposeCamRef.current = null; };
        const container = viewerContainerRef.current;
        container?.addEventListener("pointerdown", release);
        container?.addEventListener("wheel", release, { passive: true });

        return () => {
            if (raf) cancelAnimationFrame(raf);
            container?.removeEventListener("pointerdown", release);
            container?.removeEventListener("wheel", release);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [getCamera, safeDraw]);

    const [activeSheet, setActiveSheet] = useState<string>("");

    // Cancel pending rAFs on unmount
    useEffect(() => () => {
        if (syncRafRef.current !== null) cancelAnimationFrame(syncRafRef.current);
    }, []);

    // Fetch diff data
    useEffect(() => {
        setLoading(true);
        setError(null);
        const params = new URLSearchParams({ commit1, commit2 });
        fetch(`/api/projects/${projectId}/schematic-diff?${params}`)
            .then((r) => {
                if (!r.ok) throw new Error(`HTTP ${r.status}`);
                return r.json() as Promise<SchematicDiffData>;
            })
            .then((d) => {
                setData(d);
                if (d.sheets.length > 0) setActiveSheet(d.sheets[0].filename);
                setLoading(false);
            })
            .catch((e: unknown) => {
                setError(e instanceof Error ? e.message : "Failed to load diff");
                setLoading(false);
            });
    }, [projectId, commit1, commit2]);

    const activeSheetData = data?.sheets.find(s => s.filename === activeSheet) ?? null;

    // All markers for the active sheet (for the sidebar list)
    const allMarkers: DiffMarker[] = [];
    if (activeSheetData) {
        for (const item of activeSheetData.diff.added)   allMarkers.push({ kind: "added",   item });
        for (const item of activeSheetData.diff.removed)  allMarkers.push({ kind: "removed", item });
        for (const { item, changes } of activeSheetData.diff.changed) allMarkers.push({ kind: "changed", item, changes });
    }

    // Filtered markers shown on the overlay
    const visibleMarkers = !showOverlay ? [] : allMarkers.filter((m) => {
        if (m.kind === "added"   && !showAdded)   return false;
        if (m.kind === "removed" && !showRemoved)  return false;
        if (m.kind === "changed" && !showChanged)  return false;
        if (m.kind === "added"   && showing !== "new") return false;
        if (m.kind === "removed" && showing !== "old") return false;
        return true;
    });

    const totalChanges = allMarkers.length;

    // Total changes across ALL sheets (for sheet selector badges)
    const sheetChangeCounts = data
        ? Object.fromEntries(data.sheets.map(s => [
            s.filename,
            s.diff.added.length + s.diff.removed.length + s.diff.changed.length,
          ]))
        : {};

    // Navigate to a marker without triggering the viewer's selection highlight.
    // zoom_fit_item internally calls paint_selected which draws a blue box on the entity —
    // instead we replicate just the camera move and clear any existing selection.
    const zoomToMarkerOn = useCallback((marker: DiffMarker, target: "new" | "old") => {
        const ref = target === "new" ? newViewerRef : oldViewerRef;
        const viewer = ref.current;
        if (!viewer) return;
        try {
            const schEl = getSchEl(viewer);
            const inner = schEl?.viewer as (InnerViewer & {
                schematic_renderer?: { get_item_bbox?: (uuid: string) => unknown };
                paint_selected?: (bbox?: unknown) => void;
            }) | undefined;
            const camera = inner?.viewport?.camera;
            if (!inner || !camera) return;

            // Try to get the item's bbox from the renderer map
            const bbox = inner.schematic_renderer?.get_item_bbox?.(marker.item.uuid) as
                ({ grow?: (n: number) => unknown } | undefined);

            if (bbox) {
                // Replicate zoom_fit_item but skip paint_selected
                const grown = bbox.grow?.(20) ?? bbox;
                camera.bbox = grown as never;
            } else {
                // UUID not indexed — manually center on item position
                camera.zoom = 20;
                camera.center.set(marker.item.x, marker.item.y);
            }

            // Clear any existing selection highlight
            inner.paint_selected?.();

            // Clear any prior impose so the bbox fit is allowed to settle.
            imposeCamRef.current = null;
            safeDraw(viewer);
        } catch { /* ignore */ }
        overlayKickRef.current?.(40);
    }, [getSchEl, safeDraw]);

    const handleMarkerClick = useCallback((m: DiffMarker) => {
        setActiveMarker(prev => prev?.item.uuid === m.item.uuid ? null : m);
        const targetSide: "new" | "old" =
            m.kind === "added"   ? "new" :
            m.kind === "removed" ? "old" :
            showing;
        if (targetSide !== showing) {
            handleToggle(targetSide);
            // Defer until after React flushes the showing change.
            requestAnimationFrame(() => zoomToMarkerOn(m, targetSide));
        } else {
            zoomToMarkerOn(m, targetSide);
        }
    }, [zoomToMarkerOn, showing, handleToggle]);

    // Focus a specific item on first data load (or when focusItemId changes).
    // Walks all sheets to find the matching uuid; switches sheet first, then
    // runs the standard click flow once the marker is in scope.
    const focusedIdRef = useRef<string | undefined>(undefined);
    useEffect(() => {
        if (!data || !focusItemId) return;
        if (focusedIdRef.current === focusItemId) return;

        // Find which sheet contains the requested uuid.
        let foundSheet: string | null = null;
        let foundMarker: DiffMarker | null = null;
        for (const s of data.sheets) {
            const inAdded   = s.diff.added.find(i => i.uuid === focusItemId);
            const inRemoved = s.diff.removed.find(i => i.uuid === focusItemId);
            const inChanged = s.diff.changed.find(c => c.item.uuid === focusItemId);
            if (inAdded)   { foundSheet = s.filename; foundMarker = { kind: "added",   item: inAdded };   break; }
            if (inRemoved) { foundSheet = s.filename; foundMarker = { kind: "removed", item: inRemoved }; break; }
            if (inChanged) { foundSheet = s.filename; foundMarker = { kind: "changed", item: inChanged.item, changes: inChanged.changes }; break; }
        }
        if (!foundSheet || !foundMarker) return;
        focusedIdRef.current = focusItemId;
        if (foundSheet !== activeSheet) setActiveSheet(foundSheet);
        const marker = foundMarker;
        const t = window.setTimeout(() => handleMarkerClick(marker), 250);
        return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data, focusItemId]);

    // Fire onCrossProbe when the user selects an item.
    // kicanvas:select bubbles+composed so it reaches the container div.
    const onCrossProbeRef = useRef(onCrossProbe);
    useEffect(() => { onCrossProbeRef.current = onCrossProbe; }, [onCrossProbe]);
    useEffect(() => {
        const container = viewerContainerRef.current;
        if (!container) return;
        const handler = (e: Event) => {
            const item = (e as CustomEvent<{ item: unknown }>).detail?.item as Record<string, unknown> | null;
            if (!item) return;
            const ref = (item.reference ?? item.Reference ?? item.designator) as string | undefined;
            if (ref && /^[A-Za-z]+\d+/.test(ref)) onCrossProbeRef.current?.(ref);
        };
        container.addEventListener("kicanvas:select", handler);
        return () => container.removeEventListener("kicanvas:select", handler);
    }, []);

    // Navigate to a reference when cross-probed from the PCB diff viewer
    useEffect(() => {
        if (!crossProbeTarget) return;
        const doProbe = () => {
            const viewer = (showing === "new" ? newViewerRef : oldViewerRef).current;
            if (!viewer) return false;
            viewer.setCrossProbeEnabled?.(true);
            const result = viewer.requestCrossProbe({
                sourceContext: "PCB",
                targetContext: "SCH",
                mode: "select",
                kind: "designator",
                value: crossProbeTarget,
                designator: crossProbeTarget,
            });
            return result?.resolved !== false || result.reason !== "target-not-available";
        };
        if (!doProbe()) {
            const t = setTimeout(doProbe, 400);
            return () => clearTimeout(t);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [crossProbeTarget]);

    return (
        <div className={embedded ? "h-full bg-background flex flex-col" : "fixed inset-0 z-50 bg-background flex flex-col"}>
            {/* Header — hidden when embedded (modal owns the chrome) */}
            {!embedded && (
                <div className="flex items-center gap-3 px-4 py-3 border-b bg-background/95 backdrop-blur shrink-0">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
                        <X className="h-4 w-4" />
                    </Button>
                    <div className="flex-1">
                        <h2 className="text-sm font-semibold">Interactive Schematic Diff</h2>
                        <p className="text-xs text-muted-foreground font-mono">
                            {commit2.slice(0, 7)} → {commit1.slice(0, 7)}
                        </p>
                    </div>
                </div>
            )}

            {/* Body: sidebar + viewer */}
            <div className="flex flex-1 overflow-hidden">

                {/* ── Left sidebar ── */}
                <div className="w-56 shrink-0 border-r flex flex-col bg-background overflow-hidden">

                    {/* OLD / NEW toggle */}
                    {data && !singleCommit && (
                        <div className="px-3 pt-3 pb-2 shrink-0">
                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5 px-1">Version</p>
                            <div className="flex rounded-md border overflow-hidden text-xs font-medium w-full">
                                <button
                                    className={`flex-1 py-1.5 transition-colors ${showing === "old" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                                    onClick={() => handleToggle("old")}
                                >
                                    <ChevronLeft className="inline h-3 w-3 mr-0.5" />OLD
                                </button>
                                <button
                                    className={`flex-1 py-1.5 transition-colors ${showing === "new" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                                    onClick={() => handleToggle("new")}
                                >
                                    NEW<ChevronRight className="inline h-3 w-3 ml-0.5" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Filter toggles */}
                    {data && (
                        <div className="px-3 pt-2 pb-2 shrink-0 space-y-1">
                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5 px-1">Show</p>
                            <button
                                onClick={() => setShowOverlay(v => !v)}
                                className={`flex items-center justify-between w-full px-2 py-1 rounded text-xs border transition-colors ${showOverlay ? "border-border text-foreground" : "border-border text-muted-foreground opacity-50"}`}
                            >
                                <span className="flex items-center gap-1.5">
                                    <RefreshCw className="h-3 w-3" />
                                    Highlights
                                </span>
                                <span className="text-[10px] font-mono">{showOverlay ? "on" : "off"}</span>
                            </button>
                            {(["added", "removed", "changed"] as const).map((kind) => {
                                const counts = {
                                    added:   activeSheetData?.diff.added.length   ?? 0,
                                    removed: activeSheetData?.diff.removed.length ?? 0,
                                    changed: activeSheetData?.diff.changed.length ?? 0,
                                };
                                const active = kind === "added" ? showAdded : kind === "removed" ? showRemoved : showChanged;
                                const toggle = kind === "added" ? () => setShowAdded(v => !v) : kind === "removed" ? () => setShowRemoved(v => !v) : () => setShowChanged(v => !v);
                                const Icon   = kind === "added" ? Plus : kind === "removed" ? Minus : RefreshCw;
                                return (
                                    <button
                                        key={kind}
                                        onClick={toggle}
                                        className={`flex items-center justify-between w-full px-2 py-1 rounded text-xs border transition-opacity ${active ? "opacity-100" : "opacity-40"}`}
                                        style={{ borderColor: KIND_COLOR[kind], color: KIND_COLOR[kind] }}
                                    >
                                        <span className="flex items-center gap-1.5">
                                            <Icon className="h-3 w-3" />
                                            {KIND_LABEL[kind]}
                                        </span>
                                        <span className="font-mono font-semibold">{counts[kind]}</span>
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {/* Sheet selector */}
                    {data && data.sheets.length > 1 && (
                        <div className="px-3 pb-2 shrink-0">
                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5 px-1">Sheets</p>
                            <div className="space-y-0.5">
                                {data.sheets.map((sheet) => {
                                    const count = sheetChangeCounts[sheet.filename] ?? 0;
                                    const isActive = sheet.filename === activeSheet;
                                    const sheetStatus = !sheet.old_content ? "added" : !sheet.new_content ? "removed" : null;
                                    return (
                                        <button
                                            key={sheet.filename}
                                            onClick={() => {
                                                setActiveSheet(sheet.filename);
                                                setActiveMarker(null);
                                                newViewerRef.current?.switchPage?.(sheet.filename);
                                                oldViewerRef.current?.switchPage?.(sheet.filename);
                                            }}
                                            className={`w-full text-left flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-colors ${isActive ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted/60 text-muted-foreground"}`}
                                        >
                                            {sheetStatus && (
                                                <span
                                                    className="shrink-0 text-[9px] font-bold px-1 py-0.5 rounded leading-none"
                                                    style={{
                                                        backgroundColor: `${KIND_COLOR[sheetStatus]}22`,
                                                        color: KIND_COLOR[sheetStatus],
                                                        border: `1px solid ${KIND_COLOR[sheetStatus]}66`,
                                                    }}
                                                    title={sheetStatus === "added" ? "Sheet added in new version" : "Sheet removed in new version"}
                                                >
                                                    {sheetStatus === "added" ? "+" : "−"}
                                                </span>
                                            )}
                                            <span className="truncate flex-1">{sheet.filename.replace(/\.kicad_sch$/, "")}</span>
                                            {count > 0 && (
                                                <span className="ml-auto shrink-0 text-[10px] font-mono font-semibold px-1 rounded bg-muted">{count}</span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    <div className="border-t mx-3 shrink-0" />

                    {/* Navigable item list — grouped by unified category. */}
                    <div className="flex-1 overflow-y-auto py-2">
                        {!data && !loading && (
                            <p className="text-xs text-muted-foreground px-4 py-2">No data</p>
                        )}
                        {data && totalChanges === 0 && (
                            <p className="text-xs text-muted-foreground px-4 py-4 text-center">No changes detected</p>
                        )}
                        {data && (() => {
                            // Build categorised groups from the visible markers list.
                            // SchItem matches the GroupableItem shape (type + identity fields) so we pass through directly.
                            const groups = categorise(visibleMarkers.map(m => ({ kind: m.kind, item: m.item })));
                            // Reverse-lookup so a clicked sub-row routes back to its DiffMarker.
                            const markerByUuid = new Map(allMarkers.map(m => [m.item.uuid, m] as const));
                            // Group the buckets by category so we render a single
                            // category header (e.g. "Nets") and list all sub-groups
                            // beneath it, instead of repeating the header per net.
                            const categories = Array.from(new Set(groups.map(g => g.category)))
                                .sort((a, b) => CATEGORY_META[a].order - CATEGORY_META[b].order as number);
                            return categories.map((catKey) => {
                                const catGroups = groups.filter(g => g.category === catKey);
                                const catLabel = CATEGORY_META[catKey].label;
                                const total = catGroups.reduce((s, g) => s + g.members.length, 0);
                                return (
                                    <div key={catKey} className="mb-1">
                                        <p
                                            className="text-[10px] uppercase tracking-wider px-3 py-1 sticky top-0 bg-background font-medium flex items-center gap-2"
                                        >
                                            <span>{catLabel}</span>
                                            <span className="ml-auto font-mono text-[10px] opacity-70">{total}</span>
                                        </p>
                                        {catGroups.map((group) => (
                                            <div key={group.id}>
                                                {group.members.map((member) => {
                                                    const it = member.item;
                                                    const m = markerByUuid.get(it.uuid);
                                                    if (!m) return null;
                                                    const isActive = activeMarker?.item.uuid === it.uuid;
                                                    return (
                                                        <button
                                                            key={it.uuid}
                                                            onClick={() => handleMarkerClick(m)}
                                                            className={`w-full text-left flex items-center gap-2 px-3 py-1.5 text-xs transition-colors hover:bg-muted/60 ${isActive ? "bg-muted" : ""}`}
                                                        >
                                                            <span
                                                                className="w-2 h-2 rounded-full shrink-0"
                                                                style={{ backgroundColor: KIND_COLOR[member.kind] }}
                                                            />
                                                            <span className="truncate font-medium">{itemLabel(it)}</span>
                                                            <MapPin className="h-2.5 w-2.5 shrink-0 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100" />
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        ))}
                                    </div>
                                );
                            });
                        })()}
                    </div>

                    {/* Active item detail — inline at bottom of sidebar */}
                    {activeMarker && (
                        <div className="border-t shrink-0 max-h-64 overflow-y-auto">
                            <div className="flex items-center justify-between px-3 py-2 bg-muted/30">
                                <span className="text-xs font-semibold" style={{ color: KIND_COLOR[activeMarker.kind] }}>
                                    {KIND_LABEL[activeMarker.kind]}
                                </span>
                                <button onClick={() => setActiveMarker(null)} className="text-muted-foreground hover:text-foreground">
                                    <X className="h-3 w-3" />
                                </button>
                            </div>
                            <div className="px-3 py-2 space-y-2 text-xs">
                                <div>
                                    <p className="font-semibold">{itemLabel(activeMarker.item)}</p>
                                    <p className="text-muted-foreground">{activeMarker.item.type}</p>
                                </div>
                                {activeMarker.item.value && (
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Value</span>
                                        <span className="font-mono">{activeMarker.item.value}</span>
                                    </div>
                                )}
                                {activeMarker.item.footprint && (
                                    <div>
                                        <span className="text-muted-foreground">Footprint</span>
                                        <p className="font-mono truncate">{activeMarker.item.footprint}</p>
                                    </div>
                                )}
                                {activeMarker.item.text && (
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Text</span>
                                        <span className="font-mono">{activeMarker.item.text}</span>
                                    </div>
                                )}
                                {activeMarker.changes && Object.entries(activeMarker.changes).map(([field, { old: ov, new: nv }]) => (
                                    <div key={field} className="rounded border bg-muted/30 p-1.5 space-y-1">
                                        <p className="font-medium text-muted-foreground">{fieldLabel(field)}</p>
                                        <div className="flex items-center gap-1 font-mono text-[11px]">
                                            <span className="text-red-500 line-through truncate max-w-[80px]">{formatFieldValue(field, ov)}</span>
                                            <ChevronRight className="h-2.5 w-2.5 text-muted-foreground shrink-0" />
                                            <span className="text-green-500 truncate max-w-[80px]">{formatFieldValue(field, nv)}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Viewer area ── */}
                <div ref={viewerContainerRef} className="flex-1 relative overflow-hidden">
                    {loading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-40">
                            <div className="flex flex-col items-center gap-3">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                <p className="text-sm text-muted-foreground">Parsing schematic diff…</p>
                            </div>
                        </div>
                    )}
                    {error && (
                        <div className="absolute inset-0 flex items-center justify-center z-40">
                            <div className="flex flex-col items-center gap-3 text-center">
                                <AlertCircle className="h-8 w-8 text-destructive" />
                                <p className="text-sm text-destructive">{error}</p>
                                <p className="text-xs text-muted-foreground">No schematic file found for this project/commit pair.</p>
                            </div>
                        </div>
                    )}
                    {data && (
                        <>
                            <div
                                className="absolute inset-0"
                                style={{ opacity: showing === "new" ? 1 : 0, pointerEvents: showing === "new" ? "auto" : "none" }}
                            >
                                <EcadViewerHost
                                    viewerKey={`sch-diff-new-${data.commit1}-${data.commit2}`}
                                    files={data.sheets
                                        .filter(s => s.new_content)
                                        .map(s => ({ filename: s.filename, content: s.new_content! }))}
                                    viewerRef={newViewerRef}
                                />
                            </div>
                            <div
                                className="absolute inset-0"
                                style={{ opacity: showing === "old" ? 1 : 0, pointerEvents: showing === "old" ? "auto" : "none" }}
                            >
                                <EcadViewerHost
                                    viewerKey={`sch-diff-old-${data.commit1}-${data.commit2}`}
                                    files={data.sheets
                                        .filter(s => s.old_content)
                                        .map(s => ({ filename: s.filename, content: s.old_content! }))}
                                    viewerRef={oldViewerRef}
                                />
                            </div>
                            <DiffOverlay
                                markers={visibleMarkers}
                                viewerRef={viewerRef}
                                onMarkerClick={handleMarkerClick}
                                activeUuid={activeMarker?.item.uuid ?? null}
                                kickRef={overlayKickRef}
                            />
                            {/* Sheet not present in the currently-showing version */}
                            {activeSheetData && (
                                (showing === "new" && !activeSheetData.new_content) ||
                                (showing === "old" && !activeSheetData.old_content)
                            ) && (
                                <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-30 pointer-events-none">
                                    <div className="flex flex-col items-center gap-2 text-center">
                                        {showing === "new" ? (
                                            <>
                                                <span className="text-2xl font-bold" style={{ color: KIND_COLOR.removed }}>−</span>
                                                <p className="text-sm font-medium">Sheet removed</p>
                                                <p className="text-xs text-muted-foreground">This sheet does not exist in the new version</p>
                                            </>
                                        ) : (
                                            <>
                                                <span className="text-2xl font-bold" style={{ color: KIND_COLOR.added }}>+</span>
                                                <p className="text-sm font-medium">Sheet added</p>
                                                <p className="text-xs text-muted-foreground">This sheet does not exist in the old version</p>
                                            </>
                                        )}
                                    </div>
                                </div>
                            )}
                            {totalChanges === 0 && (
                                <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-background/90 border rounded-full px-4 py-1.5 text-xs text-muted-foreground shadow z-30">
                                    No schematic changes detected between these commits
                                </div>
                            )}
                            <EcadInfoPanel detail={selectedDetail} onClose={clearSelectedDetail} />
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
