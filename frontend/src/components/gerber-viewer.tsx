import { useEffect, useRef, useState, useCallback } from "react";
import JSZip from "jszip";
import { createIntegratedViewer, renderGerbersFiles, type RenderResult, type ViewerLayers } from "gerbers-renderer";
// Resolved via vite.config.ts alias — the package exports map doesn't expose this path.
import "gerbers-renderer/dist/gerbers-renderer.css";
import { Maximize2, Eye, EyeOff } from "lucide-react";

interface GerberViewerProps {
    projectId: string;
}

type Side = "top" | "bottom";
type GridUnits = "mm" | "in";

// Only the layers the library actually renders (renderGerbersFiles populates these keys).
// top_mask / bottom_mask / outline are detected but never written to the layers output.
interface LayerDef {
    key: keyof ViewerLayers;
    passId: string;
    label: string;
    color: string;
    side: "top" | "bottom" | "both";
    order: number;
}

const LAYER_DEFS: LayerDef[] = [
    { key: "top_copper",    passId: "layer:top-copper",    label: "Top Copper",     color: "#f59e0b", side: "top",    order: 25 },
    { key: "top_silk",      passId: "layer:top-silk",      label: "Top Silkscreen", color: "#f9fafb", side: "top",    order: 35 },
    { key: "bottom_copper", passId: "layer:bottom-copper", label: "Bottom Copper",  color: "#38bdf8", side: "bottom", order: 10 },
    { key: "bottom_silk",   passId: "layer:bottom-silk",   label: "Bottom Silk",    color: "#e5e7eb", side: "bottom", order: 20 },
    { key: "drills",        passId: "layer:drills",        label: "Drills",         color: "#ef4444", side: "both",   order: 40 },
];

// Build a render pass mirroring the L() factory inside createIntegratedViewer
function makeImagePass(
    passId: string,
    order: number,
    url: string,
    boardGeomRef: React.MutableRefObject<{ width_in: number; height_in: number } | null>,
    requestRender: (reason: string) => void,
) {
    const img = new Image();
    img.src = url;
    img.addEventListener("load", () => requestRender(`image-loaded-${passId}`));
    return {
        id: passId,
        order,
        enabled: () => true,
        draw: (ctx: { ctx: CanvasRenderingContext2D; xform: { getWorldToScreenMatrix: () => number[] } }) => {
            if (!img.complete) return;
            const board = boardGeomRef.current;
            const mm = 25.4;
            const w = (board?.width_in  ?? 1) * mm;
            const h = (board?.height_in ?? 1) * mm;
            const m = ctx.xform.getWorldToScreenMatrix();
            ctx.ctx.setTransform(m[0], m[3], m[1], m[4], m[2], m[5]);
            ctx.ctx.drawImage(img, 0, 0, w, h);
        },
    };
}

// Unzip the gerber archive client-side and return a filename→Uint8Array map
async function unzipGerbers(arrayBuffer: ArrayBuffer): Promise<Record<string, Uint8Array>> {
    const zip = await JSZip.loadAsync(arrayBuffer);
    const out: Record<string, Uint8Array> = {};
    await Promise.all(
        Object.entries(zip.files).map(async ([name, file]) => {
            if (!file.dir) {
                out[name] = await file.async("uint8array");
            }
        })
    );
    return out;
}

export function GerberViewer({ projectId }: GerberViewerProps) {
    const hostRef = useRef<HTMLDivElement | null>(null);
    const [status, setStatus] = useState<"loading" | "ready" | "empty" | "error">("loading");
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [side, setSide] = useState<Side>("top");
    const [gridOn, setGridOn] = useState(false);
    const [gridUnits, setGridUnits] = useState<GridUnits>("mm");
    const [layerVis, setLayerVis] = useState<Record<string, boolean>>(() =>
        Object.fromEntries(LAYER_DEFS.map(l => [l.passId, true]))
    );
    // Available layers (only keys that actually came back from renderGerbersFiles)
    const [availableLayers, setAvailableLayers] = useState<LayerDef[]>([]);

    const viewerRef = useRef<ReturnType<typeof createIntegratedViewer> | null>(null);
    const pendingResultRef = useRef<RenderResult | null>(null);
    const layersRef = useRef<ViewerLayers>({});
    const boardGeomRef = useRef<{ width_in: number; height_in: number } | null>(null);

    const toggleLayer = useCallback((passId: string) => {
        const viewer = viewerRef.current;
        if (!viewer) return;
        setLayerVis(prev => {
            const next = !prev[passId];
            if (!next) {
                viewer.viewer.removePass(passId);
            } else {
                const def = LAYER_DEFS.find(l => l.passId === passId);
                if (!def) return prev;
                const url = layersRef.current[def.key];
                if (!url) return prev;
                const pass = makeImagePass(passId, def.order, url, boardGeomRef, r => viewer.viewer.requestRender(r));
                viewer.viewer.addPass(pass);
            }
            return { ...prev, [passId]: next };
        });
    }, []);

    const soloLayer = useCallback((passId: string) => {
        const viewer = viewerRef.current;
        if (!viewer) return;
        setLayerVis(prev => {
            const next: Record<string, boolean> = {};
            for (const def of LAYER_DEFS) {
                const on = def.passId === passId;
                next[def.passId] = on;
                if (on && !prev[def.passId]) {
                    const url = layersRef.current[def.key];
                    if (url) viewer.viewer.addPass(makeImagePass(def.passId, def.order, url, boardGeomRef, r => viewer.viewer.requestRender(r)));
                } else if (!on && prev[def.passId]) {
                    viewer.viewer.removePass(def.passId);
                }
            }
            return next;
        });
    }, []);

    const showAll = useCallback(() => {
        const viewer = viewerRef.current;
        if (!viewer) return;
        setLayerVis(prev => {
            const next: Record<string, boolean> = {};
            for (const def of LAYER_DEFS) {
                next[def.passId] = true;
                if (!prev[def.passId]) {
                    const url = layersRef.current[def.key];
                    if (url) viewer.viewer.addPass(makeImagePass(def.passId, def.order, url, boardGeomRef, r => viewer.viewer.requestRender(r)));
                }
            }
            return next;
        });
    }, []);

    const hideAll = useCallback(() => {
        const viewer = viewerRef.current;
        if (!viewer) return;
        setLayerVis(prev => {
            const next: Record<string, boolean> = {};
            for (const def of LAYER_DEFS) {
                next[def.passId] = false;
                if (prev[def.passId]) viewer.viewer.removePass(def.passId);
            }
            return next;
        });
    }, []);

    useEffect(() => {
        const controller = new AbortController();
        let disposed = false;

        const load = async () => {
            setStatus("loading");
            setErrorMsg(null);
            pendingResultRef.current = null;

            try {
                const res = await fetch(`/api/projects/${projectId}/gerbers`, {
                    signal: controller.signal,
                });
                if (res.status === 404) { setStatus("empty"); return; }
                if (!res.ok) throw new Error(`Server error ${res.status}`);

                const arrayBuffer = await res.arrayBuffer();
                if (controller.signal.aborted || disposed) return;

                // Unzip client-side so we can inspect filenames
                const files = await unzipGerbers(arrayBuffer);
                if (controller.signal.aborted || disposed) return;

                console.log("[GerberViewer] files in ZIP:", Object.keys(files));

                const result = await renderGerbersFiles(files);
                if (controller.signal.aborted || disposed) return;

                console.log("[GerberViewer] layers returned:", Object.keys(result.layers).filter(k => !!(result.layers as Record<string,unknown>)[k]));

                pendingResultRef.current = result;

                // Determine which LAYER_DEFS actually have data
                const available = LAYER_DEFS.filter(def => !!result.layers[def.key]);
                setAvailableLayers(available);
                setLayerVis(Object.fromEntries(LAYER_DEFS.map(l => [l.passId, !!result.layers[l.key]])));

                const host = hostRef.current;
                if (!host) return;

                const tryMount = () => {
                    if (disposed) return;
                    const { width, height } = host.getBoundingClientRect();
                    if (width === 0 || height === 0) return;

                    const pending = pendingResultRef.current;
                    if (!pending) return;
                    pendingResultRef.current = null;

                    viewerRef.current?.dispose();
                    viewerRef.current = null;

                    layersRef.current = pending.layers;
                    boardGeomRef.current = pending.boardGeom?.board
                        ? { width_in: pending.boardGeom.board.width_in, height_in: pending.boardGeom.board.height_in }
                        : null;

                    const viewer = createIntegratedViewer(host, { showDownloadButton: false });
                    viewerRef.current = viewer;

                    // Hide the built-in header and expand the viewer body
                    const header = host.querySelector<HTMLElement>(".viewer-header");
                    if (header) header.style.display = "none";
                    const body = host.querySelector<HTMLElement>(".viewer-body");
                    if (body) { body.style.inset = "0"; body.style.top = "0"; }

                    // Override the library's hardcoded backgrounds to match the project theme.
                    // Use getComputedStyle(body) so we get the resolved RGB value directly,
                    // avoiding HSL space-separated CSS variable parsing issues.
                    const bgCss = getComputedStyle(document.body).backgroundColor;
                    const canvas = host.querySelector<HTMLCanvasElement>("#render-canvas");
                    const root   = host.querySelector<HTMLElement>(".board-viewer-root");
                    const vport  = host.querySelector<HTMLElement>("#board-viewport");
                    if (root)  root.style.background  = bgCss;
                    if (vport) vport.style.background = bgCss;
                    if (canvas) {
                        canvas.style.background = bgCss;
                        const ctx = canvas.getContext("2d");
                        if (ctx) {
                            // The library draws a full-canvas fillRect every frame with #f5f5f5.
                            // Intercept it and use the theme color instead.
                            const LIB_BG = "rgb(245, 245, 245)"; // #f5f5f5 normalised by browser
                            const origFillRect = ctx.fillRect.bind(ctx);
                            ctx.fillRect = function(x: number, y: number, w: number, h: number) {
                                const saved = ctx.fillStyle;
                                if (saved === "#f5f5f5" || saved === LIB_BG) {
                                    ctx.fillStyle = bgCss;
                                    origFillRect(x, y, w, h);
                                    ctx.fillStyle = saved;
                                    return;
                                }
                                origFillRect(x, y, w, h);
                            };
                        }
                    }

                    viewer.setData({ boardGeom: pending.boardGeom, layers: pending.layers });
                    viewer.setSideMode("top");
                    setStatus("ready");
                    requestAnimationFrame(() => { if (!disposed) viewer.fit(); });
                };

                tryMount();
                const ro = new ResizeObserver(() => { if (pendingResultRef.current) tryMount(); });
                ro.observe(host);
                const checkDone = setInterval(() => {
                    if (!pendingResultRef.current || disposed) { clearInterval(checkDone); ro.disconnect(); }
                }, 200);
                controller.signal.addEventListener("abort", () => { clearInterval(checkDone); ro.disconnect(); });

            } catch (err: unknown) {
                if (controller.signal.aborted || disposed) return;
                setErrorMsg(err instanceof Error ? err.message : String(err));
                setStatus("error");
            }
        };

        void load();
        return () => {
            disposed = true;
            controller.abort();
            pendingResultRef.current = null;
            viewerRef.current?.dispose();
            viewerRef.current = null;
        };
    }, [projectId]);

    const handleSideChange = (next: Side) => {
        setSide(next);
        viewerRef.current?.setSideMode(next);
    };

    const handleGridToggle = () => {
        const next = !gridOn;
        setGridOn(next);
        const toggle = hostRef.current?.querySelector<HTMLInputElement>("#grid-toggle");
        if (toggle) { toggle.checked = next; toggle.dispatchEvent(new Event("change")); }
    };

    const handleUnitsChange = (next: GridUnits) => {
        setGridUnits(next);
        const sel = hostRef.current?.querySelector<HTMLSelectElement>("#grid-units");
        if (sel) { sel.value = next; sel.dispatchEvent(new Event("change")); }
    };

    // Sidebar shows layers for current side that the library actually rendered
    const sidebarLayers = availableLayers.filter(l => l.side === "both" || l.side === side);
    const allOn = sidebarLayers.every(l => layerVis[l.passId]);

    return (
        <div className="absolute inset-0 flex flex-col bg-background">

            {/* ── Toolbar ── */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 border-b bg-background/95 backdrop-blur shrink-0">
                {/* Side */}
                <div className="flex rounded-md border overflow-hidden text-xs font-medium">
                    {(["top", "bottom"] as Side[]).map(s => (
                        <button key={s} onClick={() => handleSideChange(s)}
                            className={`px-3 py-1.5 transition-colors capitalize ${side === s ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground"}`}>
                            {s}
                        </button>
                    ))}
                </div>

                <div className="w-px h-4 bg-border mx-0.5" />

                {/* Grid */}
                <button onClick={handleGridToggle}
                    className={`text-xs px-2.5 py-1.5 rounded border transition-colors ${gridOn ? "bg-primary/10 border-primary/40 text-primary" : "border-border/60 text-muted-foreground hover:bg-muted"}`}>
                    Grid
                </button>

                {/* Units */}
                <div className="flex rounded-md border overflow-hidden text-xs font-medium">
                    {(["mm", "in"] as GridUnits[]).map(u => (
                        <button key={u} onClick={() => handleUnitsChange(u)}
                            className={`px-2.5 py-1.5 transition-colors ${gridUnits === u ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground"}`}>
                            {u}
                        </button>
                    ))}
                </div>

                <div className="w-px h-4 bg-border mx-0.5" />

                {/* Fit */}
                <button onClick={() => viewerRef.current?.fit()}
                    className="text-xs px-2.5 py-1.5 rounded border border-border/60 text-muted-foreground hover:bg-muted transition-colors flex items-center gap-1.5">
                    <Maximize2 className="h-3 w-3" />
                    Fit
                </button>
            </div>

            {/* ── Body ── */}
            <div className="flex flex-1 overflow-hidden">

                {/* ── Left sidebar ── */}
                {status === "ready" && sidebarLayers.length > 0 && (
                    <div className="w-48 shrink-0 border-r flex flex-col bg-background overflow-hidden">
                        <div className="px-3 pt-3 pb-1 shrink-0 flex items-center justify-between">
                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Layers</p>
                            <button
                                onClick={allOn ? hideAll : showAll}
                                className="text-[10px] text-muted-foreground hover:text-foreground transition-colors">
                                {allOn ? "Hide all" : "Show all"}
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto py-1">
                            {sidebarLayers.map(def => {
                                const on = layerVis[def.passId] ?? true;
                                const soloActive = sidebarLayers.filter(l => layerVis[l.passId]).length === 1 && on;
                                return (
                                    <div key={def.passId}
                                        className="group flex items-center gap-2 px-2 py-1 mx-1 rounded hover:bg-muted/60 transition-colors">
                                        {/* Swatch */}
                                        <button
                                            onClick={() => toggleLayer(def.passId)}
                                            className="shrink-0 w-3 h-3 rounded-sm border transition-opacity"
                                            style={{ backgroundColor: on ? def.color : "transparent", borderColor: def.color, opacity: on ? 1 : 0.4 }}
                                            title={on ? "Hide" : "Show"}
                                        />
                                        {/* Label */}
                                        <span
                                            onClick={() => toggleLayer(def.passId)}
                                            className={`flex-1 text-xs cursor-pointer select-none transition-opacity ${on ? "text-foreground" : "text-muted-foreground opacity-50"}`}>
                                            {def.label}
                                        </span>
                                        {/* Solo */}
                                        <button
                                            onClick={() => soloActive ? showAll() : soloLayer(def.passId)}
                                            className="opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity shrink-0"
                                            title={soloActive ? "Show all" : "Solo"}>
                                            {soloActive
                                                ? <Eye className="h-3 w-3 text-primary" />
                                                : <EyeOff className="h-3 w-3 text-muted-foreground" />}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* ── Canvas ── */}
                <div className="flex-1 relative overflow-hidden">
                    {status === "loading" && (
                        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">
                            Loading gerbers...
                        </div>
                    )}
                    {status === "empty" && (
                        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">
                            No gerber files found for this project.
                        </div>
                    )}
                    {status === "error" && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-destructive text-sm">
                            <span>Failed to load gerbers</span>
                            {errorMsg && <span className="text-xs text-muted-foreground">{errorMsg}</span>}
                        </div>
                    )}
                    <div ref={hostRef} className="absolute inset-0" />
                </div>
            </div>
        </div>
    );
}
