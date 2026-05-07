import {
    useState, useEffect, useRef, useCallback, useLayoutEffect,
} from "react";
import {
    X, Loader2, AlertCircle, ChevronLeft, ChevronRight,
    Plus, Minus, RefreshCw, MapPin, Cpu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ECadViewerElement } from "@/types/ecad-viewer";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PcbItem {
    type: string;
    uuid: string;
    x: number;
    y: number;
    // footprint fields
    reference?: string;
    value?: string;
    lib_id?: string;
    layer?: string;
    // zone fields
    net_name?: string;
    name?: string;
    net?: string;
    // gr_text
    text?: string;
    // segment
    start_x?: number;
    start_y?: number;
    end_x?: number;
    end_y?: number;
    width?: number;
    // via
    size?: number;
    drill?: number;
}

interface FieldChange {
    old: string | number | null;
    new: string | number | null;
}

interface ChangedItem {
    item: PcbItem;
    changes: Record<string, FieldChange>;
}

interface PcbDiff {
    added: PcbItem[];
    removed: PcbItem[];
    changed: ChangedItem[];
}

interface BoardData {
    filename: string;
    old_content: string | null;
    new_content: string | null;
    diff: PcbDiff;
}

interface PcbDiffData {
    commit1: string;
    commit2: string;
    boards: BoardData[];
}

interface DiffMarker {
    kind: "added" | "removed" | "changed";
    item: PcbItem;
    changes?: Record<string, FieldChange>;
}

interface PcbDiffViewerProps {
    projectId: string;
    commit1: string; // newer
    commit2: string; // older
    onClose: () => void;
    embedded?: boolean;
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

function itemLabel(item: PcbItem): string {
    if (item.reference) return item.reference;
    if (item.text) return item.text.slice(0, 24) + (item.text.length > 24 ? "…" : "");
    if (item.net_name) return item.net_name;
    if (item.name) return item.name;
    return item.type;
}

function fieldLabel(key: string): string {
    return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// World-space half-extents (mm) per PCB item type
function _boxHalfExtent(type: string): { hw: number; hh: number } {
    switch (type) {
        case "footprint": return { hw: 3,   hh: 3   };
        case "zone":      return { hw: 5,   hh: 5   };
        case "via":       return { hw: 0.5, hh: 0.5 };
        case "gr_text":   return { hw: 3,   hh: 1.5 };
        case "segment":   return { hw: 1,   hh: 1   };
        default:          return { hw: 2,   hh: 2   };
    }
}

// ---------------------------------------------------------------------------
// EcadViewerHost (local copy, PCB-specific viewerKey prefix)
// ---------------------------------------------------------------------------

interface EcadViewerHostProps {
    viewerKey: string;
    files: { filename: string; content: string }[];
    viewerRef: React.RefObject<ECadViewerElement | null>;
}

function EcadViewerHost({ viewerKey, files, viewerRef }: EcadViewerHostProps) {
    const hostRef = useRef<ECadViewerElement | null>(null);

    const attach = useCallback((node: ECadViewerElement | null) => {
        hostRef.current = node;
        (viewerRef as React.MutableRefObject<ECadViewerElement | null>).current = node;
    }, [viewerRef]);

    useLayoutEffect(() => {
        const viewer = hostRef.current;
        if (!viewer || files.length === 0) return;

        let cancelled = false;
        (async () => {
            await customElements.whenDefined("ecad-blob");
            if (cancelled || !hostRef.current) return;

            const el = hostRef.current;
            el.querySelectorAll("ecad-blob").forEach((b) => b.remove());

            for (const { filename, content } of files) {
                const blob = document.createElement("ecad-blob") as HTMLElement & {
                    filename?: string; content?: string;
                };
                blob.filename = filename;
                blob.content = content;
                el.appendChild(blob);
            }

            const withLoader = el as ECadViewerElement & { load_src?: () => Promise<void> };
            if (typeof withLoader.load_src === "function") {
                await withLoader.load_src();
            }
        })();

        return () => { cancelled = true; };
    }, [viewerKey, files]);

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
// Overlay
// ---------------------------------------------------------------------------

interface OverlayProps {
    markers: DiffMarker[];
    viewerRef: React.RefObject<ECadViewerElement | null>;
    onMarkerClick: (marker: DiffMarker) => void;
    activeUuid: string | null;
}

function DiffOverlay({ markers, viewerRef, onMarkerClick, activeUuid }: OverlayProps) {
    const boxRefs = useRef<Map<string, HTMLDivElement>>(new Map());
    const rafRef  = useRef<number | null>(null);
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
        const onDown  = () => { draggingRef.current = true;  startLoop(); };
        const onUp    = () => { draggingRef.current = false; startLoop(); };
        const onWheel = () => startLoop();
        window.addEventListener("mousedown", onDown);
        window.addEventListener("mouseup",   onUp);
        window.addEventListener("wheel",     onWheel, { passive: true });
        window.addEventListener("resize",    onUp);
        startLoop();
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
// PCB camera sync (uses kc-board-viewer instead of kc-schematic-viewer)
// ---------------------------------------------------------------------------

function syncPcbCamera(from: ECadViewerElement, to: ECadViewerElement) {
    try {
        const rect = from.getBoundingClientRect();
        if (!rect.width || !rect.height) return;

        const s0 = from.getScreenLocation(0, 0);
        const s1 = from.getScreenLocation(10, 0);
        if (!s0 || !s1) return;
        const pxPerMm = Math.abs(s1.x - s0.x) / 10;
        if (pxPerMm === 0) return;

        const worldCx = (rect.width  / 2 - s0.x) / pxPerMm;
        const worldCy = (rect.height / 2 - s0.y) / pxPerMm;
        const halfW   = (rect.width  / 2) / pxPerMm;
        const halfH   = (rect.height / 2) / pxPerMm;

        type BoardViewer = HTMLElement & {
            viewer?: { viewport?: { camera?: { bbox: unknown }; }; draw?: () => void; };
        };
        const findBoardViewer = (root: ShadowRoot | Document): BoardViewer | null => {
            const direct = root.querySelector("kc-board-viewer") as BoardViewer | null;
            if (direct) return direct;
            for (const el of root.querySelectorAll("*")) {
                if ((el as HTMLElement).shadowRoot) {
                    const found = findBoardViewer((el as HTMLElement).shadowRoot!);
                    if (found) return found;
                }
            }
            return null;
        };

        const boardEl = to.shadowRoot ? findBoardViewer(to.shadowRoot) : null;
        const camera = boardEl?.viewer?.viewport?.camera;
        if (camera) {
            camera.bbox = {
                x: worldCx - halfW, y: worldCy - halfH,
                w: halfW * 2,       h: halfH * 2,
            };
            boardEl!.viewer!.draw?.();
        } else {
            to.zoomToLocation(worldCx, worldCy);
        }
    } catch { /* ignore */ }
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function PcbDiffViewer({
    projectId,
    commit1,
    commit2,
    onClose,
    embedded = false,
}: PcbDiffViewerProps) {
    const [data, setData] = useState<PcbDiffData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [showing, setShowing] = useState<"new" | "old">("new");
    const [activeMarker, setActiveMarker] = useState<DiffMarker | null>(null);

    const [showOverlay, setShowOverlay] = useState(true);
    const [showAdded, setShowAdded] = useState(true);
    const [showRemoved, setShowRemoved] = useState(true);
    const [showChanged, setShowChanged] = useState(true);

    const newViewerRef = useRef<ECadViewerElement | null>(null);
    const oldViewerRef = useRef<ECadViewerElement | null>(null);
    const viewerRef = showing === "new" ? newViewerRef : oldViewerRef;

    const handleToggle = useCallback((next: "new" | "old") => {
        const fromRef = next === "new" ? oldViewerRef : newViewerRef;
        const toRef   = next === "new" ? newViewerRef : oldViewerRef;
        if (fromRef.current && toRef.current) {
            syncPcbCamera(fromRef.current, toRef.current);
        }
        setShowing(next);
    }, []);

    const [activeBoard, setActiveBoard] = useState<string>("");

    useEffect(() => {
        setLoading(true);
        setError(null);
        const params = new URLSearchParams({ commit1, commit2 });
        fetch(`/api/projects/${projectId}/pcb-diff?${params}`)
            .then((r) => {
                if (!r.ok) throw new Error(`HTTP ${r.status}`);
                return r.json() as Promise<PcbDiffData>;
            })
            .then((d) => {
                setData(d);
                if (d.boards.length > 0) setActiveBoard(d.boards[0].filename);
                setLoading(false);
            })
            .catch((e: unknown) => {
                setError(e instanceof Error ? e.message : "Failed to load diff");
                setLoading(false);
            });
    }, [projectId, commit1, commit2]);

    const activeBoardData = data?.boards.find(b => b.filename === activeBoard) ?? null;

    // Build markers — skip segments and vias (too numerous to overlay usefully)
    const OVERLAY_TYPES = new Set(["footprint", "zone", "gr_text", "gr_circle", "gr_rect", "gr_arc", "gr_line"]);

    const allMarkers: DiffMarker[] = [];
    if (activeBoardData) {
        for (const item of activeBoardData.diff.added)
            if (OVERLAY_TYPES.has(item.type)) allMarkers.push({ kind: "added", item });
        for (const item of activeBoardData.diff.removed)
            if (OVERLAY_TYPES.has(item.type)) allMarkers.push({ kind: "removed", item });
        for (const { item, changes } of activeBoardData.diff.changed)
            if (OVERLAY_TYPES.has(item.type)) allMarkers.push({ kind: "changed", item, changes });
    }

    const visibleMarkers = !showOverlay ? [] : allMarkers.filter((m) => {
        if (m.kind === "added"   && !showAdded)   return false;
        if (m.kind === "removed" && !showRemoved)  return false;
        if (m.kind === "changed" && !showChanged)  return false;
        if (m.kind === "added"   && showing !== "new") return false;
        if (m.kind === "removed" && showing !== "old") return false;
        return true;
    });

    const totalChanges = allMarkers.length;

    const boardChangeCounts = data
        ? Object.fromEntries(data.boards.map(b => [
            b.filename,
            b.diff.added.length + b.diff.removed.length + b.diff.changed.length,
          ]))
        : {};

    const zoomToMarker = useCallback((marker: DiffMarker) => {
        const viewer = viewerRef.current;
        if (!viewer) return;
        try {
            type BoardViewer = HTMLElement & {
                viewer?: { viewport?: { camera?: { bbox: unknown }; }; draw?: () => void; };
            };
            const findBoardViewer = (root: ShadowRoot | Document): BoardViewer | null => {
                const d = root.querySelector("kc-board-viewer") as BoardViewer | null;
                if (d) return d;
                for (const el of root.querySelectorAll("*")) {
                    if ((el as HTMLElement).shadowRoot) {
                        const f = findBoardViewer((el as HTMLElement).shadowRoot!);
                        if (f) return f;
                    }
                }
                return null;
            };
            const { hw, hh } = _boxHalfExtent(marker.item.type);
            const pad = 15;
            const boardEl = viewer.shadowRoot ? findBoardViewer(viewer.shadowRoot) : null;
            if (boardEl?.viewer?.viewport?.camera) {
                boardEl.viewer.viewport.camera.bbox = {
                    x: marker.item.x - hw - pad, y: marker.item.y - hh - pad,
                    w: (hw + pad) * 2,            h: (hh + pad) * 2,
                };
                boardEl.viewer.draw?.();
            } else {
                viewer.zoomToLocation(marker.item.x, marker.item.y);
            }
        } catch { /* ignore */ }
    }, [viewerRef]);

    const handleMarkerClick = useCallback((m: DiffMarker) => {
        setActiveMarker(prev => prev?.item.uuid === m.item.uuid ? null : m);
        zoomToMarker(m);
        if (m.kind === "added"   && showing !== "new") handleToggle("new");
        if (m.kind === "removed" && showing !== "old") handleToggle("old");
    }, [zoomToMarker, showing, handleToggle]);

    return (
        <div className={embedded ? "h-full bg-background flex flex-col" : "fixed inset-0 z-50 bg-background flex flex-col"}>
            {/* Header — hidden when embedded (modal owns the chrome) */}
            {!embedded && (
                <div className="flex items-center gap-3 px-4 py-3 border-b bg-background/95 backdrop-blur shrink-0">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
                        <X className="h-4 w-4" />
                    </Button>
                    <div className="flex-1">
                        <h2 className="text-sm font-semibold">Interactive PCB Diff</h2>
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
                                const counts = {
                                    added:   activeBoardData?.diff.added.filter(i => OVERLAY_TYPES.has(i.type)).length   ?? 0,
                                    removed: activeBoardData?.diff.removed.filter(i => OVERLAY_TYPES.has(i.type)).length ?? 0,
                                    changed: activeBoardData?.diff.changed.filter(({ item }) => OVERLAY_TYPES.has(item.type)).length ?? 0,
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

                    {/* Board selector (multi-board projects) */}
                    {data && data.boards.length > 1 && (
                        <div className="px-3 pb-2 shrink-0">
                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5 px-1">Boards</p>
                            <div className="space-y-0.5">
                                {data.boards.map((board) => {
                                    const count = boardChangeCounts[board.filename] ?? 0;
                                    const isActive = board.filename === activeBoard;
                                    const boardStatus = !board.old_content ? "added" : !board.new_content ? "removed" : null;
                                    return (
                                        <button
                                            key={board.filename}
                                            onClick={() => { setActiveBoard(board.filename); setActiveMarker(null); }}
                                            className={`w-full text-left flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-colors ${isActive ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted/60 text-muted-foreground"}`}
                                        >
                                            {boardStatus && (
                                                <span
                                                    className="shrink-0 text-[9px] font-bold px-1 py-0.5 rounded leading-none"
                                                    style={{
                                                        backgroundColor: `${KIND_COLOR[boardStatus]}22`,
                                                        color: KIND_COLOR[boardStatus],
                                                        border: `1px solid ${KIND_COLOR[boardStatus]}66`,
                                                    }}
                                                >
                                                    {boardStatus === "added" ? "+" : "−"}
                                                </span>
                                            )}
                                            <span className="truncate flex-1">{board.filename.replace(/\.kicad_pcb$/, "")}</span>
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

                    {/* Navigable item list */}
                    <div className="flex-1 overflow-y-auto py-2">
                        {!data && !loading && (
                            <p className="text-xs text-muted-foreground px-4 py-2">No data</p>
                        )}
                        {data && totalChanges === 0 && (
                            <p className="text-xs text-muted-foreground px-4 py-4 text-center">No PCB changes detected</p>
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

                    {/* Active item detail */}
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
                                {activeMarker.item.layer && (
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Layer</span>
                                        <span className="font-mono">{activeMarker.item.layer}</span>
                                    </div>
                                )}
                                {activeMarker.item.net_name && (
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Net</span>
                                        <span className="font-mono">{activeMarker.item.net_name}</span>
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
                                <p className="text-sm text-muted-foreground">Parsing PCB diff…</p>
                            </div>
                        </div>
                    )}
                    {error && (
                        <div className="absolute inset-0 flex items-center justify-center z-40">
                            <div className="flex flex-col items-center gap-3 text-center">
                                <AlertCircle className="h-8 w-8 text-destructive" />
                                <p className="text-sm text-destructive">{error}</p>
                                <p className="text-xs text-muted-foreground">No PCB file found for this project/commit pair.</p>
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
                                    viewerKey={`pcb-diff-new-${data.commit1}-${data.commit2}`}
                                    files={data.boards
                                        .filter(b => b.new_content)
                                        .map(b => ({ filename: b.filename, content: b.new_content! }))}
                                    viewerRef={newViewerRef}
                                />
                            </div>
                            <div
                                className="absolute inset-0"
                                style={{ visibility: showing === "old" ? "visible" : "hidden", pointerEvents: showing === "old" ? "auto" : "none" }}
                            >
                                <EcadViewerHost
                                    viewerKey={`pcb-diff-old-${data.commit1}-${data.commit2}`}
                                    files={data.boards
                                        .filter(b => b.old_content)
                                        .map(b => ({ filename: b.filename, content: b.old_content! }))}
                                    viewerRef={oldViewerRef}
                                />
                            </div>
                            <DiffOverlay
                                markers={visibleMarkers}
                                viewerRef={viewerRef}
                                onMarkerClick={handleMarkerClick}
                                activeUuid={activeMarker?.item.uuid ?? null}
                            />
                            {/* Board not present overlay */}
                            {activeBoardData && (
                                (showing === "new" && !activeBoardData.new_content) ||
                                (showing === "old" && !activeBoardData.old_content)
                            ) && (
                                <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-30 pointer-events-none">
                                    <div className="flex flex-col items-center gap-2 text-center">
                                        {showing === "new" ? (
                                            <>
                                                <span className="text-2xl font-bold" style={{ color: KIND_COLOR.removed }}>−</span>
                                                <p className="text-sm font-medium">Board removed</p>
                                                <p className="text-xs text-muted-foreground">This board does not exist in the new version</p>
                                            </>
                                        ) : (
                                            <>
                                                <span className="text-2xl font-bold" style={{ color: KIND_COLOR.added }}>+</span>
                                                <p className="text-sm font-medium">Board added</p>
                                                <p className="text-xs text-muted-foreground">This board does not exist in the old version</p>
                                            </>
                                        )}
                                    </div>
                                </div>
                            )}
                            {totalChanges === 0 && (
                                <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-background/90 border rounded-full px-4 py-1.5 text-xs text-muted-foreground shadow z-30">
                                    No PCB changes detected between these commits
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
