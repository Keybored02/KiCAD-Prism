import {
    useState, useEffect, useRef, useCallback, useLayoutEffect,
} from "react";
import {
    X, Loader2, AlertCircle, ChevronLeft, ChevronRight,
    Plus, Minus, RefreshCw, MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ECadViewerElement } from "@/types/ecad-viewer";

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
    // label/text/sheet fields
    text?: string;
    sheet_file?: string;
    sheet_name?: string;
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

interface SchematicDiffData {
    commit1: string;
    commit2: string;
    sch_filename: string;
    old_content: string;
    new_content: string;
    diff: SchDiff;
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
    return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// ---------------------------------------------------------------------------
// EcadViewerHost (inline version so we don't import visualizer internals)
// ---------------------------------------------------------------------------

interface EcadViewerHostProps {
    viewerKey: string;
    filename: string;
    content: string;
    viewerRef: React.RefObject<ECadViewerElement | null>;
}

function EcadViewerHost({ viewerKey, filename, content, viewerRef }: EcadViewerHostProps) {
    const hostRef = useRef<ECadViewerElement | null>(null);

    const attach = useCallback((node: ECadViewerElement | null) => {
        hostRef.current = node;
        (viewerRef as React.MutableRefObject<ECadViewerElement | null>).current = node;
    }, [viewerRef]);

    useLayoutEffect(() => {
        const viewer = hostRef.current;
        if (!viewer || !content) return;

        let cancelled = false;
        (async () => {
            await customElements.whenDefined("ecad-blob");
            if (cancelled || !hostRef.current) return;

            const el = hostRef.current;
            el.querySelectorAll("ecad-blob").forEach((b) => b.remove());

            const blob = document.createElement("ecad-blob") as HTMLElement & {
                filename?: string; content?: string;
            };
            blob.filename = filename;
            blob.content = content;
            el.appendChild(blob);

            const withLoader = el as ECadViewerElement & { load_src?: () => Promise<void> };
            if (typeof withLoader.load_src === "function") {
                await withLoader.load_src();
            }
        })();

        return () => { cancelled = true; };
    }, [viewerKey, filename, content]);

    return (
        <ecad-viewer
            ref={attach}
            style={{ width: "100%", height: "100%" }}
            show-header="false"
            key={viewerKey}
        />
    );
}

// ---------------------------------------------------------------------------
// Overlay: colour-coded pins using getScreenLocation
// ---------------------------------------------------------------------------

interface OverlayProps {
    markers: DiffMarker[];
    viewerRef: React.RefObject<ECadViewerElement | null>;
    onMarkerClick: (marker: DiffMarker) => void;
    activeUuid: string | null;
}

// World-space half-extents (mm) per item type for the bounding box
function _boxHalfExtent(type: string): { hw: number; hh: number } {
    switch (type) {
        case "symbol": return { hw: 5, hh: 4 };
        case "sheet":  return { hw: 6, hh: 5 };
        default:       return { hw: 3, hh: 1.5 }; // labels, text
    }
}

function DiffOverlay({ markers, viewerRef, onMarkerClick, activeUuid }: OverlayProps) {
    const boxRefs = useRef<Map<string, HTMLDivElement>>(new Map());
    const rafRef = useRef<number | null>(null);
    const draggingRef = useRef(false);

    const updatePositions = useCallback(() => {
        const viewer = viewerRef.current;
        if (!viewer?.getScreenLocation) return;
        try {
            const rect = viewer.getBoundingClientRect();
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
                } else {
                    el.style.display = "none";
                }
            }
        } catch { /* viewer transiently unavailable */ }
    }, [viewerRef, markers]);

    // Continuous RAF loop — runs every frame while dragging, single frame otherwise
    const loopRef = useRef<number | null>(null);
    const runLoop = useCallback(() => {
        updatePositions();
        if (draggingRef.current) {
            loopRef.current = requestAnimationFrame(runLoop);
        } else {
            loopRef.current = null;
        }
    }, [updatePositions]);

    const startLoop = useCallback(() => {
        if (loopRef.current === null) {
            loopRef.current = requestAnimationFrame(runLoop);
        }
    }, [runLoop]);

    useEffect(() => {
        const onDown = () => { draggingRef.current = true; startLoop(); };
        const onUp   = () => { draggingRef.current = false; startLoop(); }; // one final frame
        const onWheel = () => startLoop();
        window.addEventListener("mousedown", onDown);
        window.addEventListener("mouseup",   onUp);
        window.addEventListener("wheel",     onWheel, { passive: true });
        window.addEventListener("resize",    onUp);
        startLoop(); // initial position
        return () => {
            window.removeEventListener("mousedown", onDown);
            window.removeEventListener("mouseup",   onUp);
            window.removeEventListener("wheel",     onWheel);
            window.removeEventListener("resize",    onUp);
            if (loopRef.current !== null) { cancelAnimationFrame(loopRef.current); loopRef.current = null; }
            if (rafRef.current  !== null) { cancelAnimationFrame(rafRef.current);  rafRef.current  = null; }
        };
    }, [startLoop]);

    useEffect(() => { startLoop(); }, [markers, startLoop]);

    return (
        <div className="absolute inset-0 z-20 pointer-events-none overflow-hidden">
            {markers.map((m) => {
                const color = KIND_COLOR[m.kind];
                const isActive = m.item.uuid === activeUuid;
                return (
                    <div
                        key={m.item.uuid}
                        ref={(node) => {
                            if (node) boxRefs.current.set(m.item.uuid, node);
                            else boxRefs.current.delete(m.item.uuid);
                        }}
                        className="absolute pointer-events-auto cursor-pointer"
                        style={{
                            display: "none",
                            border: `2px solid ${color}`,
                            borderRadius: 3,
                            backgroundColor: `${color}22`,
                            boxShadow: isActive ? `0 0 0 2px ${color}66, inset 0 0 0 1px ${color}44` : undefined,
                            transition: "box-shadow 0.15s",
                        }}
                        onClick={() => onMarkerClick(m)}
                    />
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

    const syncCamera = useCallback((from: ECadViewerElement, to: ECadViewerElement) => {
        try {
            const rect = from.getBoundingClientRect();
            if (!rect.width || !rect.height) return;

            // Sample two world points to compute pixels-per-mm scale
            const s0 = from.getScreenLocation(0, 0);
            const s1 = from.getScreenLocation(10, 0);
            if (!s0 || !s1) return;
            const pxPerMm = Math.abs(s1.x - s0.x) / 10;
            if (pxPerMm === 0) return;

            // World coordinates of the screen centre
            const worldCx = (rect.width  / 2 - s0.x) / pxPerMm;
            const worldCy = (rect.height / 2 - s0.y) / pxPerMm;
            const halfW   = (rect.width  / 2) / pxPerMm;
            const halfH   = (rect.height / 2) / pxPerMm;

            // Apply to target viewer via kc-schematic-viewer's camera
            type SchViewer = HTMLElement & {
                viewer?: {
                    viewport?: {
                        camera?: { bbox: unknown; draw?: () => void };
                    };
                    draw?: () => void;
                };
            };
            // Walk shadow roots to find kc-schematic-viewer
            const findSchViewer = (root: ShadowRoot | Document): SchViewer | null => {
                const direct = root.querySelector("kc-schematic-viewer") as SchViewer | null;
                if (direct) return direct;
                for (const el of root.querySelectorAll("*")) {
                    if ((el as HTMLElement).shadowRoot) {
                        const found = findSchViewer((el as HTMLElement).shadowRoot!);
                        if (found) return found;
                    }
                }
                return null;
            };

            const schEl = to.shadowRoot ? findSchViewer(to.shadowRoot) : null;
            const camera = schEl?.viewer?.viewport?.camera;
            if (camera) {
                camera.bbox = {
                    x: worldCx - halfW, y: worldCy - halfH,
                    w: halfW * 2,       h: halfH * 2,
                };
                schEl!.viewer!.draw?.();
            } else {
                // Fallback: center-only (no zoom sync)
                to.zoomToLocation(worldCx, worldCy);
            }
        } catch { /* ignore */ }
    }, []);

    const handleToggle = useCallback((next: "new" | "old") => {
        const fromRef = next === "new" ? oldViewerRef : newViewerRef;
        const toRef   = next === "new" ? newViewerRef : oldViewerRef;
        if (fromRef.current && toRef.current) {
            syncCamera(fromRef.current, toRef.current);
        }
        setShowing(next);
    }, [syncCamera]);

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
            .then((d) => { setData(d); setLoading(false); })
            .catch((e: unknown) => {
                setError(e instanceof Error ? e.message : "Failed to load diff");
                setLoading(false);
            });
    }, [projectId, commit1, commit2]);

    // All markers regardless of filter (for the sidebar list)
    const allMarkers: DiffMarker[] = [];
    if (data) {
        for (const item of data.diff.added)   allMarkers.push({ kind: "added",   item });
        for (const item of data.diff.removed)  allMarkers.push({ kind: "removed", item });
        for (const { item, changes } of data.diff.changed) allMarkers.push({ kind: "changed", item, changes });
    }

    // Filtered markers shown on the overlay
    const visibleMarkers = !showOverlay ? [] : allMarkers.filter((m) => {
        if (m.kind === "added"   && !showAdded)   return false;
        if (m.kind === "removed" && !showRemoved)  return false;
        if (m.kind === "changed" && !showChanged)  return false;
        // added items only exist in new view; removed only in old view
        if (m.kind === "added"   && showing !== "new") return false;
        if (m.kind === "removed" && showing !== "old") return false;
        return true;
    });

    const totalChanges = allMarkers.length;

    // Zoom the viewer to a marker's world position
    const zoomToMarker = useCallback((marker: DiffMarker) => {
        const viewer = viewerRef.current;
        if (!viewer) return;
        try {
            type SchViewer = HTMLElement & {
                viewer?: { viewport?: { camera?: { bbox: unknown }; }; draw?: () => void; };
            };
            const findSchViewer = (root: ShadowRoot | Document): SchViewer | null => {
                const d = root.querySelector("kc-schematic-viewer") as SchViewer | null;
                if (d) return d;
                for (const el of root.querySelectorAll("*")) {
                    if ((el as HTMLElement).shadowRoot) {
                        const f = findSchViewer((el as HTMLElement).shadowRoot!);
                        if (f) return f;
                    }
                }
                return null;
            };
            const { hw, hh } = _boxHalfExtent(marker.item.type);
            const pad = 20;
            const schEl = viewer.shadowRoot ? findSchViewer(viewer.shadowRoot) : null;
            if (schEl?.viewer?.viewport?.camera) {
                schEl.viewer.viewport.camera.bbox = {
                    x: marker.item.x - hw - pad, y: marker.item.y - hh - pad,
                    w: (hw + pad) * 2,            h: (hh + pad) * 2,
                };
                schEl.viewer.draw?.();
            } else {
                viewer.zoomToLocation(marker.item.x, marker.item.y);
            }
        } catch { /* ignore */ }
    }, [viewerRef]);

    const handleMarkerClick = useCallback((m: DiffMarker) => {
        setActiveMarker(prev => prev?.item.uuid === m.item.uuid ? null : m);
        zoomToMarker(m);
        // Switch to the right view if needed
        if (m.kind === "added"   && showing !== "new") handleToggle("new");
        if (m.kind === "removed" && showing !== "old") handleToggle("old");
    }, [zoomToMarker, showing, handleToggle]);

    return (
        <div className="fixed inset-0 z-50 bg-background flex flex-col">
            {/* Header */}
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

            {/* Body: sidebar + viewer */}
            <div className="flex flex-1 overflow-hidden">

                {/* ── Left sidebar ── */}
                <div className="w-56 shrink-0 border-r flex flex-col bg-background overflow-hidden">

                    {/* OLD / NEW toggle */}
                    {data && (
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
                        <div className="px-3 pb-2 shrink-0 space-y-1">
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
                                const counts = { added: data.diff.added.length, removed: data.diff.removed.length, changed: data.diff.changed.length };
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

                    <div className="border-t mx-3 shrink-0" />

                    {/* Navigable item list */}
                    <div className="flex-1 overflow-y-auto py-2">
                        {!data && !loading && (
                            <p className="text-xs text-muted-foreground px-4 py-2">No data</p>
                        )}
                        {data && totalChanges === 0 && (
                            <p className="text-xs text-muted-foreground px-4 py-4 text-center">No changes detected</p>
                        )}
                        {data && (["added", "removed", "changed"] as const).map((kind) => {
                            const items = allMarkers.filter(m => m.kind === kind);
                            if (items.length === 0) return null;
                            return (
                                <div key={kind} className="mb-1">
                                    <p
                                        className="text-[10px] uppercase tracking-wider px-3 py-1 sticky top-0 bg-background font-medium"
                                        style={{ color: KIND_COLOR[kind] }}
                                    >
                                        {KIND_LABEL[kind]} ({items.length})
                                    </p>
                                    {items.map((m) => {
                                        const isActive = activeMarker?.item.uuid === m.item.uuid;
                                        return (
                                            <button
                                                key={m.item.uuid}
                                                onClick={() => handleMarkerClick(m)}
                                                className={`w-full text-left flex items-center gap-2 px-3 py-1.5 text-xs transition-colors hover:bg-muted/60 ${isActive ? "bg-muted" : ""}`}
                                            >
                                                <span
                                                    className="w-2 h-2 rounded-full shrink-0"
                                                    style={{ backgroundColor: KIND_COLOR[m.kind] }}
                                                />
                                                <span className="truncate font-medium">{itemLabel(m.item)}</span>
                                                <MapPin className="h-2.5 w-2.5 shrink-0 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100" />
                                            </button>
                                        );
                                    })}
                                </div>
                            );
                        })}
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
                                            <span className="text-red-500 line-through truncate max-w-[80px]">{String(ov ?? "–")}</span>
                                            <ChevronRight className="h-2.5 w-2.5 text-muted-foreground shrink-0" />
                                            <span className="text-green-500 truncate max-w-[80px]">{String(nv ?? "–")}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Viewer area ── */}
                <div className="flex-1 relative overflow-hidden">
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
                                style={{ visibility: showing === "new" ? "visible" : "hidden", pointerEvents: showing === "new" ? "auto" : "none" }}
                            >
                                <EcadViewerHost
                                    viewerKey={`sch-diff-new-${data.commit1}-${data.commit2}`}
                                    filename={data.sch_filename}
                                    content={data.new_content}
                                    viewerRef={newViewerRef}
                                />
                            </div>
                            <div
                                className="absolute inset-0"
                                style={{ visibility: showing === "old" ? "visible" : "hidden", pointerEvents: showing === "old" ? "auto" : "none" }}
                            >
                                <EcadViewerHost
                                    viewerKey={`sch-diff-old-${data.commit1}-${data.commit2}`}
                                    filename={data.sch_filename}
                                    content={data.old_content}
                                    viewerRef={oldViewerRef}
                                />
                            </div>
                            <DiffOverlay
                                markers={visibleMarkers}
                                viewerRef={viewerRef}
                                onMarkerClick={handleMarkerClick}
                                activeUuid={activeMarker?.item.uuid ?? null}
                            />
                            {totalChanges === 0 && (
                                <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-background/90 border rounded-full px-4 py-1.5 text-xs text-muted-foreground shadow z-30">
                                    No schematic changes detected between these commits
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
