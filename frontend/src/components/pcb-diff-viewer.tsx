import {
    useState, useEffect, useRef, useCallback, useLayoutEffect,
} from "react";
import {
    X, Loader2, AlertCircle, ChevronLeft, ChevronRight,
    Plus, Minus, RefreshCw, MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ECadViewerElement } from "@/types/ecad-viewer";
import { EcadInfoPanel, useEcadInfoPanel } from "@/components/ecad-info-panel";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PcbItem {
    type: string;
    uuid: string;
    x: number;
    y: number;
    reference?: string;
    value?: string;
    lib_id?: string;
    layer?: string;
    net_name?: string;
    name?: string;
    net?: string;
    text?: string;
    start_x?: number;
    start_y?: number;
    end_x?: number;
    end_y?: number;
    width?: number;
    size?: number;
    drill?: number;
    polygon_points?: [number, number][];
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

type GroupCategory = "components" | "nets" | "zones" | "graphics";

interface GroupedMarker {
    id: string;
    category: GroupCategory;
    kind: "added" | "removed" | "changed";
    label: string;
    members: DiffMarker[];
    // merged world-space bbox for overlay
    bboxMinX: number;
    bboxMinY: number;
    bboxMaxX: number;
    bboxMaxY: number;
    // zone polygon in world coords (only set for zone groups)
    polygonPoints?: [number, number][];
}

interface PcbDiffViewerProps {
    projectId: string;
    commit1: string;
    commit2: string;
    onClose: () => void;
    embedded?: boolean;
    onCrossProbe?: (reference: string) => void;
    crossProbeTarget?: string; // reference to navigate to when switching from schematic
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
    if (item.reference) return `${item.reference}${item.value ? ` (${item.value})` : ""}`;
    if (item.text) return item.text.slice(0, 24) + (item.text.length > 24 ? "…" : "");
    if (item.net_name) return item.net_name;
    if (item.name) return item.name;
    if (item.type === "segment") return `Wire${item.layer ? ` ${item.layer}` : ""}`;
    if (item.type === "via") return `Via${item.net ? ` ${item.net}` : ""}`;
    return item.type;
}

function fieldLabel(key: string): string {
    return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

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
// Marker grouping
// ---------------------------------------------------------------------------

function _mergedKind(members: DiffMarker[]): "added" | "removed" | "changed" {
    const kinds = new Set(members.map(m => m.kind));
    if (kinds.size > 1) return "changed"; // mixed → rerouted/modified
    return members[0].kind;
}

function _bboxFromMembers(members: DiffMarker[]): { minX: number; minY: number; maxX: number; maxY: number } {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const m of members) {
        const item = m.item;
        if (item.type === "segment" && item.start_x != null) {
            const pad = (item.width ?? 0.2) / 2;
            minX = Math.min(minX, item.start_x - pad, item.end_x! - pad);
            minY = Math.min(minY, item.start_y! - pad, item.end_y! - pad);
            maxX = Math.max(maxX, item.start_x + pad, item.end_x! + pad);
            maxY = Math.max(maxY, item.start_y! + pad, item.end_y! + pad);
        } else {
            const hw = item.type === "footprint" ? 3 : item.type === "zone" ? 5 : item.type === "via" ? 0.5 : 2;
            const hh = item.type === "gr_text" ? 1.5 : hw;
            minX = Math.min(minX, item.x - hw); minY = Math.min(minY, item.y - hh);
            maxX = Math.max(maxX, item.x + hw); maxY = Math.max(maxY, item.y + hh);
        }
    }
    return { minX, minY, maxX, maxY };
}

const GRAPHIC_TYPES = new Set(["gr_text", "gr_line", "gr_circle", "gr_rect", "gr_arc"]);

function groupMarkers(raw: DiffMarker[]): GroupedMarker[] {
    const result: GroupedMarker[] = [];
    let gid = 0;
    const nextId = () => `g${gid++}`;

    // ── Components (footprints) — one group per UUID, keep kind as-is ──
    for (const m of raw) {
        if (m.item.type !== "footprint") continue;
        const { minX, minY, maxX, maxY } = _bboxFromMembers([m]);
        const ref = m.item.reference || m.item.lib_id || "?";
        const val = m.item.value ? ` (${m.item.value})` : "";
        result.push({
            id: nextId(), category: "components", kind: m.kind,
            label: `${ref}${val}`,
            members: [m], bboxMinX: minX, bboxMinY: minY, bboxMaxX: maxX, bboxMaxY: maxY,
        });
    }

    // ── Nets (segments + vias) — group by net name across all kinds ──
    const netMap = new Map<string, DiffMarker[]>();
    for (const m of raw) {
        if (m.item.type !== "segment" && m.item.type !== "via") continue;
        const key = m.item.net ?? "(no net)";
        const arr = netMap.get(key) ?? [];
        arr.push(m);
        netMap.set(key, arr);
    }
    for (const [net, members] of netMap) {
        const { minX, minY, maxX, maxY } = _bboxFromMembers(members);
        const kind = _mergedKind(members);
        const segCount  = members.filter(m => m.item.type === "segment").length;
        const viaCount  = members.filter(m => m.item.type === "via").length;
        const parts = [];
        if (segCount)  parts.push(`${segCount} wire${segCount > 1 ? "s" : ""}`);
        if (viaCount)  parts.push(`${viaCount} via${viaCount > 1 ? "s" : ""}`);
        const netLabel = net === "(no net)" ? "No net" : net;
        result.push({
            id: nextId(), category: "nets", kind,
            label: `${netLabel} — ${parts.join(", ")}`,
            members, bboxMinX: minX, bboxMinY: minY, bboxMaxX: maxX, bboxMaxY: maxY,
        });
    }

    // ── Zones — one group per UUID ──
    for (const m of raw) {
        if (m.item.type !== "zone") continue;
        const pts = m.item.polygon_points;
        let minX: number, minY: number, maxX: number, maxY: number;
        if (pts && pts.length > 0) {
            minX = Math.min(...pts.map(p => p[0]));
            minY = Math.min(...pts.map(p => p[1]));
            maxX = Math.max(...pts.map(p => p[0]));
            maxY = Math.max(...pts.map(p => p[1]));
        } else {
            ({ minX, minY, maxX, maxY } = _bboxFromMembers([m]));
        }
        const label = m.item.net_name
            ? `${m.item.net_name} pour`
            : m.item.name || "Zone";
        result.push({
            id: nextId(), category: "zones", kind: m.kind,
            label, members: [m],
            bboxMinX: minX, bboxMinY: minY, bboxMaxX: maxX, bboxMaxY: maxY,
            polygonPoints: pts && pts.length > 0 ? pts : undefined,
        });
    }

    // ── Graphics — group by layer ──
    const gfxMap = new Map<string, DiffMarker[]>();
    for (const m of raw) {
        if (!GRAPHIC_TYPES.has(m.item.type)) continue;
        const key = m.item.layer ?? "(no layer)";
        const arr = gfxMap.get(key) ?? [];
        arr.push(m);
        gfxMap.set(key, arr);
    }
    for (const [layer, members] of gfxMap) {
        const { minX, minY, maxX, maxY } = _bboxFromMembers(members);
        const kind = _mergedKind(members);
        const n = members.length;
        result.push({
            id: nextId(), category: "graphics", kind,
            label: `${layer} — ${n} item${n > 1 ? "s" : ""}`,
            members, bboxMinX: minX, bboxMinY: minY, bboxMaxX: maxX, bboxMaxY: maxY,
        });
    }

    return result;
}

// ---------------------------------------------------------------------------
// EcadViewerHost
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

    const filesKey = files.map(f => f.filename).join("|");

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
                if (cancelled) return;
                const blob = document.createElement("ecad-blob") as HTMLElement & {
                    filename?: string; content?: string;
                };
                blob.filename = filename;
                blob.content = content;
                el.appendChild(blob);
            }

            if (cancelled) return;
            const withLoader = el as ECadViewerElement & { load_src?: () => Promise<void> };
            if (typeof withLoader.load_src === "function") {
                await withLoader.load_src();
            }
        })();

        return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [viewerKey, filesKey]);

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
    groups: GroupedMarker[];
    viewerRef: React.RefObject<ECadViewerElement | null>;
    containerRef: React.RefObject<HTMLDivElement | null>;
    getBoardEl: (host: ECadViewerElement) => BoardEl | null;
    onGroupClick: (group: GroupedMarker) => void;
    activeId: string | null;
    kickRef?: React.MutableRefObject<((frames?: number) => void) | null>;
}

function DiffOverlay({ groups, viewerRef, containerRef, getBoardEl, onGroupClick, activeId, kickRef }: OverlayProps) {
    const boxRefs  = useRef<Map<string, HTMLDivElement>>(new Map());
    const polyRefs = useRef<Map<string, SVGPolygonElement>>(new Map());
    const rafRef   = useRef<number | null>(null);
    const framesLeftRef = useRef(0);

    const updatePositions = useCallback((): boolean => {
        const viewer = viewerRef.current;
        const container = containerRef.current;
        if (!viewer || !container) return false;
        try {
            const containerRect = container.getBoundingClientRect();
            if (!containerRect.width) return false;

            // getScreenLocation returns canvas-relative coords (world_to_screen without adding
            // the canvas bounding rect offset). To convert to container-relative coords we need
            // to add the canvas offset relative to our container.
            // We derive that offset by calling getScreenLocation for a known world point and
            // comparing to worldToScreen on the internal viewer.
            type InternalViewer = { worldToScreen?: (x: number, y: number) => { x: number; y: number } };
            const boardEl = getBoardEl(viewer) as (HTMLElement & { viewer?: InternalViewer }) | null;
            const worldToScreen = boardEl?.viewer?.worldToScreen?.bind(boardEl.viewer);

            // If worldToScreen is available use it (viewport-absolute) minus container offset.
            // Otherwise fall back to getScreenLocation (canvas-relative) minus the canvas offset
            // relative to the container.
            let toContainerPt: (wx: number, wy: number) => { x: number; y: number };
            if (worldToScreen) {
                toContainerPt = (wx, wy) => {
                    const s = worldToScreen(wx, wy);
                    return { x: s.x - containerRect.left, y: s.y - containerRect.top };
                };
            } else if (viewer.getScreenLocation) {
                // getScreenLocation is canvas-relative. Find canvas offset by checking the
                // ecad-viewer element's own bounding rect vs the container rect.
                const viewerRect = viewer.getBoundingClientRect();
                const dx = viewerRect.left - containerRect.left;
                const dy = viewerRect.top  - containerRect.top;
                toContainerPt = (wx, wy) => {
                    const s = viewer.getScreenLocation(wx, wy);
                    if (!s) return { x: -9999, y: -9999 };
                    return { x: s.x + dx, y: s.y + dy };
                };
            } else {
                return false;
            }

            let anyVisible = false;
            const SCREEN_PAD = 4;
            for (const g of groups) {
                if (g.polygonPoints) {
                    const poly = polyRefs.current.get(g.id);
                    if (!poly) continue;
                    const pts = g.polygonPoints.map(([wx, wy]) => {
                        const s = toContainerPt(wx, wy);
                        return `${s.x},${s.y}`;
                    });
                    poly.setAttribute("points", pts.join(" "));
                    poly.style.display = "";
                    anyVisible = true;
                } else {
                    const el = boxRefs.current.get(g.id);
                    if (!el) continue;
                    const tl = toContainerPt(g.bboxMinX, g.bboxMinY);
                    const br = toContainerPt(g.bboxMaxX, g.bboxMaxY);
                    const left = Math.min(tl.x, br.x) - SCREEN_PAD;
                    const top  = Math.min(tl.y, br.y) - SCREEN_PAD;
                    const w    = Math.abs(br.x - tl.x) + SCREEN_PAD * 2;
                    const h    = Math.abs(br.y - tl.y) + SCREEN_PAD * 2;
                    const vis  = left + w > 0 && left < containerRect.width && top + h > 0 && top < containerRect.height;
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
            }
            return anyVisible || groups.length === 0;
        } catch { return false; }
    }, [viewerRef, containerRef, getBoardEl, groups]);

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

    useEffect(() => {
        if (kickRef) kickRef.current = kick;
        return () => { if (kickRef) kickRef.current = null; };
    }, [kick, kickRef]);

    useEffect(() => {
        const onDown  = () => kick(180);
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

    useEffect(() => { kick(30); }, [groups, kick]);

    // Build a unique stripe pattern id per (kind, activeId) combination so
    // active zones get a denser/brighter stripe than inactive ones.
    const stripeIds = {
        added:   "diff-stripe-added",
        removed: "diff-stripe-removed",
        changed: "diff-stripe-changed",
    };

    return (
        <div className="absolute inset-0 z-20 pointer-events-none overflow-hidden">
            {/* SVG layer for zone polygons */}
            <svg className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
                <defs>
                    {(["added", "removed", "changed"] as const).map((kind) => {
                        const color = KIND_COLOR[kind];
                        return (
                            <pattern
                                key={kind}
                                id={stripeIds[kind]}
                                patternUnits="userSpaceOnUse"
                                width="8" height="8"
                                patternTransform="rotate(45)"
                            >
                                <rect width="8" height="8" fill={`${color}22`} />
                                <line x1="0" y1="0" x2="0" y2="8"
                                    stroke={color} strokeWidth="3" strokeOpacity="0.6" />
                            </pattern>
                        );
                    })}
                </defs>
                {groups.filter(g => g.polygonPoints).map((g) => {
                    const color = KIND_COLOR[g.kind];
                    const isActive = g.id === activeId;
                    return (
                        <polygon
                            key={g.id}
                            ref={(node) => {
                                if (node) polyRefs.current.set(g.id, node as SVGPolygonElement);
                                else polyRefs.current.delete(g.id);
                            }}
                            // pointer-events: stroke → only the outline catches clicks,
                            // so pads/traces inside the zone remain clickable.
                            style={{ display: "none", cursor: "pointer", pointerEvents: "stroke" }}
                            fill={`url(#${stripeIds[g.kind]})`}
                            stroke={color}
                            strokeWidth={isActive ? 4 : 3}
                            strokeOpacity={isActive ? 1 : 0.7}
                            filter={isActive ? `drop-shadow(0 0 4px ${color})` : undefined}
                            onClick={() => onGroupClick(g)}
                        />
                    );
                })}
            </svg>

            {/* Div boxes for everything else.
                The visual box is pointer-events:none so clicks pass through to
                the canvas below (lets the user click pads/traces inside the box).
                A thin "frame" overlay catches clicks only on the border. */}
            {groups.filter(g => !g.polygonPoints).map((g) => {
                const color = KIND_COLOR[g.kind];
                const isActive = g.id === activeId;
                const HIT = 6; // px — clickable frame thickness
                return (
                    <div
                        key={g.id}
                        ref={(node) => {
                            if (node) boxRefs.current.set(g.id, node);
                            else boxRefs.current.delete(g.id);
                        }}
                        className="absolute pointer-events-none"
                        style={{
                            display: "none",
                            border: `2px solid ${color}`,
                            borderRadius: 3,
                            backgroundColor: `${color}1A`,
                            outline: "1.5px solid rgba(0,0,0,0.7)",
                            outlineOffset: "1px",
                            boxShadow: isActive
                                ? `0 0 0 3px ${color}99, 0 0 8px 2px ${color}66`
                                : `0 0 0 1.5px rgba(0,0,0,0.5)`,
                        }}
                    >
                        {/* clickable border-only frame */}
                        {(["top", "right", "bottom", "left"] as const).map((side) => (
                            <div
                                key={side}
                                onClick={(e) => { e.stopPropagation(); onGroupClick(g); }}
                                className="absolute pointer-events-auto cursor-pointer"
                                style={{
                                    top:    side === "bottom" ? "auto" : -HIT / 2,
                                    bottom: side === "top"    ? "auto" : -HIT / 2,
                                    left:   side === "right"  ? "auto" : -HIT / 2,
                                    right:  side === "left"   ? "auto" : -HIT / 2,
                                    height: side === "top" || side === "bottom" ? HIT : "auto",
                                    width:  side === "left" || side === "right" ? HIT : "auto",
                                }}
                            />
                        ))}
                    </div>
                );
            })}
        </div>
    );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

type Vec2   = { x: number; y: number; set: (x: number, y: number) => void };
type Camera = { center: Vec2; zoom: number; bbox: unknown };
type LayerLike = { name: string; visible: boolean };
type LayerSet  = { in_ui_order?: () => Iterable<LayerLike> };
type InteractiveItem = {
    bbox?: unknown;
    line?: unknown;
    item?: unknown;
};
type InnerViewer = {
    viewport?: { camera?: Camera };
    draw?: () => void;
    renderer?: { ctx2d?: unknown; gl?: unknown };
    layers?: LayerSet;
    layer_visibility_ctrl?: { visibilities?: Map<string, boolean> } | null;
    find_items_under_pos?: (p: { x: number; y: number }) => InteractiveItem[];
    __padPriorityPatched?: boolean;
};
type BoardEl = HTMLElement & { viewer?: InnerViewer };

export function PcbDiffViewer({
    projectId,
    commit1,
    commit2,
    onClose,
    embedded = false,
    onCrossProbe,
    crossProbeTarget,
}: PcbDiffViewerProps) {
    const [data, setData] = useState<PcbDiffData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [showing, setShowing] = useState<"new" | "old">("new");
    const [activeGroup, setActiveGroup] = useState<GroupedMarker | null>(null);

    const [showOverlay, setShowOverlay] = useState(true);
    const [showAdded, setShowAdded] = useState(true);
    const [showRemoved, setShowRemoved] = useState(true);
    const [showChanged, setShowChanged] = useState(true);

    const newViewerRef = useRef<ECadViewerElement | null>(null);
    const oldViewerRef = useRef<ECadViewerElement | null>(null);
    const viewerRef = showing === "new" ? newViewerRef : oldViewerRef;
    const overlayKickRef = useRef<((frames?: number) => void) | null>(null);
    const viewerContainerRef = useRef<HTMLDivElement | null>(null);

    const boardElCache = useRef<WeakMap<ECadViewerElement, BoardEl>>(new WeakMap());

    const getBoardEl = useCallback((host: ECadViewerElement): BoardEl | null => {
        const cached = boardElCache.current.get(host);
        if (cached?.viewer?.viewport?.camera) return cached;
        const walk = (root: ShadowRoot | Element): BoardEl | null => {
            const sr = (root as HTMLElement).shadowRoot;
            const searchRoot = sr ?? root;
            const el = (searchRoot as ShadowRoot).querySelector?.("kc-board-viewer") as BoardEl | null;
            if (el?.viewer?.viewport?.camera) return el;
            for (const child of (searchRoot as ShadowRoot).querySelectorAll?.("*") ?? []) {
                if ((child as HTMLElement).shadowRoot) {
                    const f = walk(child as HTMLElement);
                    if (f) return f;
                }
            }
            return el ?? null;
        };
        const result = host.shadowRoot ? walk(host) : null;
        if (result?.viewer?.viewport?.camera) boardElCache.current.set(host, result);
        return result;
    }, []);

    const getCamera = useCallback((host: ECadViewerElement): Camera | null => {
        return getBoardEl(host)?.viewer?.viewport?.camera ?? null;
    }, [getBoardEl]);

    const safeDraw = useCallback((host: ECadViewerElement) => {
        const inner = getBoardEl(host)?.viewer;
        if (inner?.renderer?.gl) inner.draw?.();
    }, [getBoardEl]);

    // Ensure the BoardViewer has a populated layer-visibility map so pad
    // hit-testing works. The built-in source for `layer_visibility` is the
    // Layers panel widget, which may not have rendered yet when our diff view
    // mounts — leaving the map empty and causing every pad to fail the
    // visibility check inside `find_items_under_pos`.
    useEffect(() => {
        if (!data) return;
        let stopped = false;

        const ensureFor = (host: ECadViewerElement | null) => {
            if (!host) return false;
            const inner = getBoardEl(host)?.viewer;
            if (!inner) return false;
            const existing = inner.layer_visibility_ctrl;
            const map = existing?.visibilities;
            const layers = inner.layers?.in_ui_order ? Array.from(inner.layers.in_ui_order()) : [];
            if (layers.length === 0) return false;
            if (!map || map.size === 0) {
                const fresh = new Map<string, boolean>();
                for (const l of layers) fresh.set(l.name, l.visible !== false);
                inner.layer_visibility_ctrl = {
                    ...(existing ?? {}),
                    visibilities: fresh,
                } as { visibilities: Map<string, boolean> };
            }

            // Re-rank picking results so pads beat wires / lines when both
            // sit under the click. Original order: tracks/vias/pads mixed by
            // creation order, with pads frequently after the wire that ends
            // on them — so the wire wins the click. We bubble pads to the
            // front (and lines to the back) to make pad selection reliable.
            if (!inner.__padPriorityPatched && typeof inner.find_items_under_pos === "function") {
                const orig = inner.find_items_under_pos.bind(inner);
                inner.find_items_under_pos = (p) => {
                    const out = orig(p) as InteractiveItem[];
                    if (!out || out.length < 2) return out;
                    return [...out].sort((a, b) => priority(a) - priority(b));
                };
                inner.__padPriorityPatched = true;
            }
            return true;
        };

        // Lower priority value = picked sooner. Pads first, then anything that's
        // not a wire, then wires last.
        const priority = (it: InteractiveItem): number => {
            // PadInteractiveItem extends BoxInteractiveItem (has bbox) and is
            // NOT a footprint (footprints also have bbox). The reliable
            // discriminator: lines have `.line`, pads have `.bbox` + their
            // `is_on_layer` only matches Cu. We can't read is_on_layer easily,
            // but pads have a `.bbox` whose underlying item is a Pad (small).
            // Simpler: anything with a `.line` getter is a wire — push it last.
            if ((it as { line?: unknown }).line !== undefined) return 2;
            // Pads: have a `.bbox` and the underlying `.item` is small. But
            // footprints also have `.bbox`. We rank pads above footprints by
            // checking the underlying item type via duck-typing — pads have
            // a `number` field, footprints don't.
            const inner = (it as { item?: { number?: unknown; reference?: unknown } }).item;
            if (inner && (inner.number != null) && inner.reference == null) return 0;
            return 1;
        };

        const tick = () => {
            if (stopped) return;
            const a = ensureFor(newViewerRef.current);
            const b = ensureFor(oldViewerRef.current);
            if (!a || !b) window.setTimeout(tick, 250);
        };
        tick();

        return () => { stopped = true; };
    }, [data, getBoardEl]);

    // Impose a camera position on the active viewer until user interacts.
    const imposeCamRef = useRef<{ zoom: number; cx: number; cy: number } | null>(null);

    const showingRef = useRef(showing);
    useEffect(() => { showingRef.current = showing; }, [showing]);

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

    const handleToggle = useCallback((next: "new" | "old") => {
        if (next === showing) return;
        const fromRef = showing === "new" ? newViewerRef : oldViewerRef;
        const toRef   = showing === "new" ? oldViewerRef : newViewerRef;
        const cam = fromRef.current ? getCamera(fromRef.current) : null;
        if (cam) {
            const state = { zoom: cam.zoom, cx: cam.center.x, cy: cam.center.y };
            imposeCamRef.current = state;
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

    const [activeBoard, setActiveBoard] = useState<string>("");

    const viewerRefsArr = useRef([newViewerRef, oldViewerRef]).current;
    const { detail: selectedDetail, clear: clearSelectedDetail } = useEcadInfoPanel({
        containerRef: viewerContainerRef,
        viewerRefs: viewerRefsArr,
    });

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

    const rawMarkers: DiffMarker[] = [];
    if (activeBoardData) {
        for (const item of activeBoardData.diff.added)
            rawMarkers.push({ kind: "added", item });
        for (const item of activeBoardData.diff.removed)
            rawMarkers.push({ kind: "removed", item });
        for (const { item, changes } of activeBoardData.diff.changed)
            rawMarkers.push({ kind: "changed", item, changes });
    }
    const allGroups = groupMarkers(rawMarkers);

    const visibleGroups = !showOverlay ? [] : allGroups.filter((g) => {
        if (g.kind === "added"   && !showAdded)   return false;
        if (g.kind === "removed" && !showRemoved)  return false;
        if (g.kind === "changed" && !showChanged)  return false;
        if (g.kind === "added"   && showing !== "new") return false;
        if (g.kind === "removed" && showing !== "old") return false;
        return true;
    });

    const totalChanges = allGroups.length;

    const boardChangeCounts = data
        ? Object.fromEntries(data.boards.map(b => [
            b.filename,
            b.diff.added.length + b.diff.removed.length + b.diff.changed.length,
          ]))
        : {};

    const zoomToGroup = useCallback((g: GroupedMarker) => {
        const viewer = viewerRef.current;
        if (!viewer) return;
        try {
            const boardEl = getBoardEl(viewer);
            const camera  = boardEl?.viewer?.viewport?.camera;
            if (!camera) return;
            const pad = 10;
            camera.bbox = {
                x: g.bboxMinX - pad, y: g.bboxMinY - pad,
                w: (g.bboxMaxX - g.bboxMinX) + pad * 2,
                h: (g.bboxMaxY - g.bboxMinY) + pad * 2,
            };
            imposeCamRef.current = { zoom: camera.zoom, cx: camera.center.x, cy: camera.center.y };
            safeDraw(viewer);
        } catch { /* ignore */ }
        overlayKickRef.current?.(40);
    }, [viewerRef, getBoardEl, safeDraw]);

    const handleGroupClick = useCallback((g: GroupedMarker) => {
        setActiveGroup(prev => prev?.id === g.id ? null : g);
        zoomToGroup(g);
        if (g.kind === "added"   && showing !== "new") handleToggle("new");
        if (g.kind === "removed" && showing !== "old") handleToggle("old");
    }, [zoomToGroup, showing, handleToggle]);

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

    // Navigate to a reference when cross-probed from the schematic diff viewer
    useEffect(() => {
        if (!crossProbeTarget) return;
        const doProbe = () => {
            const viewer = (showing === "new" ? newViewerRef : oldViewerRef).current;
            if (!viewer) return false;
            viewer.setCrossProbeEnabled?.(true);
            const result = viewer.requestCrossProbe({
                sourceContext: "SCH",
                targetContext: "PCB",
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

            <div className="flex flex-1 overflow-hidden">

                {/* ── Left sidebar ── */}
                <div className="w-56 shrink-0 border-r flex flex-col bg-background overflow-hidden">

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
                                    added:   activeBoardData?.diff.added.length   ?? 0,
                                    removed: activeBoardData?.diff.removed.length ?? 0,
                                    changed: activeBoardData?.diff.changed.length ?? 0,
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
                                            onClick={() => { setActiveBoard(board.filename); setActiveGroup(null); }}
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

                    <div className="flex-1 overflow-y-auto py-2">
                        {!data && !loading && (
                            <p className="text-xs text-muted-foreground px-4 py-2">No data</p>
                        )}
                        {data && totalChanges === 0 && (
                            <p className="text-xs text-muted-foreground px-4 py-4 text-center">No PCB changes detected</p>
                        )}
                        {data && (
                            [
                                { cat: "components" as GroupCategory, label: "Components" },
                                { cat: "nets"       as GroupCategory, label: "Nets"       },
                                { cat: "zones"      as GroupCategory, label: "Zones"      },
                                { cat: "graphics"   as GroupCategory, label: "Graphics"   },
                            ].map(({ cat, label }) => {
                                const groups = allGroups.filter(g => g.category === cat);
                                if (groups.length === 0) return null;
                                return (
                                    <div key={cat} className="mb-2">
                                        <p className="text-[10px] uppercase tracking-wider px-3 py-1 sticky top-0 bg-background font-medium text-muted-foreground">
                                            {label}
                                        </p>
                                        {groups.map((g) => {
                                            const isActive = activeGroup?.id === g.id;
                                            const color = KIND_COLOR[g.kind];
                                            return (
                                                <button
                                                    key={g.id}
                                                    onClick={() => handleGroupClick(g)}
                                                    className={`w-full text-left flex items-center gap-2 px-3 py-1.5 text-xs transition-colors hover:bg-muted/60 ${isActive ? "bg-muted" : ""}`}
                                                >
                                                    <span
                                                        className="w-2 h-2 rounded-sm shrink-0 border"
                                                        style={{ backgroundColor: `${color}55`, borderColor: color }}
                                                    />
                                                    <span className="truncate font-medium">{g.label}</span>
                                                    <span
                                                        className="ml-auto shrink-0 text-[9px] font-bold px-1 py-0.5 rounded leading-none"
                                                        style={{ backgroundColor: `${color}22`, color, border: `1px solid ${color}66` }}
                                                    >
                                                        {KIND_LABEL[g.kind]}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {activeGroup && (
                        <div className="border-t shrink-0 max-h-64 overflow-y-auto">
                            <div className="flex items-center justify-between px-3 py-2 bg-muted/30">
                                <span className="text-xs font-semibold" style={{ color: KIND_COLOR[activeGroup.kind] }}>
                                    {activeGroup.label}
                                </span>
                                <button onClick={() => setActiveGroup(null)} className="text-muted-foreground hover:text-foreground">
                                    <X className="h-3 w-3" />
                                </button>
                            </div>
                            <div className="px-3 py-2 space-y-1 text-xs">
                                {activeGroup.members.map((m, i) => (
                                    <div key={i} className="space-y-1">
                                        <div className="flex items-center gap-1.5">
                                            <span
                                                className="w-1.5 h-1.5 rounded-full shrink-0"
                                                style={{ backgroundColor: KIND_COLOR[m.kind] }}
                                            />
                                            <span className="font-medium">{itemLabel(m.item)}</span>
                                            <span className="ml-auto text-muted-foreground">{KIND_LABEL[m.kind]}</span>
                                        </div>
                                        {m.changes && Object.entries(m.changes).map(([field, { old: ov, new: nv }]) => (
                                            <div key={field} className="ml-3 rounded border bg-muted/30 p-1.5 space-y-1">
                                                <p className="font-medium text-muted-foreground">{fieldLabel(field)}</p>
                                                <div className="flex items-center gap-1 font-mono text-[11px]">
                                                    <span className="text-red-500 line-through truncate max-w-[80px]">{String(ov ?? "–")}</span>
                                                    <ChevronRight className="h-2.5 w-2.5 text-muted-foreground shrink-0" />
                                                    <span className="text-green-500 truncate max-w-[80px]">{String(nv ?? "–")}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Viewer area ── */}
                <div ref={viewerContainerRef} className="flex-1 relative overflow-hidden" style={{ isolation: "isolate" }}>
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
                                style={{ opacity: showing === "new" ? 1 : 0, pointerEvents: showing === "new" ? "auto" : "none" }}
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
                                style={{ opacity: showing === "old" ? 1 : 0, pointerEvents: showing === "old" ? "auto" : "none" }}
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
                                groups={visibleGroups}
                                viewerRef={viewerRef}
                                containerRef={viewerContainerRef}
                                getBoardEl={getBoardEl}
                                onGroupClick={handleGroupClick}
                                activeId={activeGroup?.id ?? null}
                                kickRef={overlayKickRef}
                            />
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
                            <EcadInfoPanel detail={selectedDetail} onClose={clearSelectedDetail} />
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
