import { useEffect, useRef, useState } from "react";
import { createIntegratedViewer, renderGerbersZip, type RenderResult } from "gerbers-renderer";
// Resolved via vite.config.ts alias — the package exports map doesn't expose this path.
import "gerbers-renderer/dist/gerbers-renderer.css";

interface GerberViewerProps {
    projectId: string;
}

type Side = "top" | "bottom";

export function GerberViewer({ projectId }: GerberViewerProps) {
    const hostRef = useRef<HTMLDivElement | null>(null);
    const [status, setStatus] = useState<"loading" | "ready" | "empty" | "error">("loading");
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [side, setSide] = useState<Side>("top");
    const viewerRef = useRef<ReturnType<typeof createIntegratedViewer> | null>(null);
    // Holds render result until the host div has non-zero dimensions
    const pendingResultRef = useRef<RenderResult | null>(null);

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

                if (res.status === 404) {
                    setStatus("empty");
                    return;
                }
                if (!res.ok) {
                    throw new Error(`Server error ${res.status}`);
                }

                const buffer = await res.arrayBuffer();
                if (controller.signal.aborted || disposed) return;

                const blob = new Blob([buffer], { type: "application/zip" });
                const result = await renderGerbersZip(blob);
                if (controller.signal.aborted || disposed) return;

                pendingResultRef.current = result;

                // Wait until the host div has real layout dimensions before
                // calling setData/fit — the canvas would be 0×0 if called while hidden.
                const host = hostRef.current;
                if (!host) return;

                const tryMount = () => {
                    if (disposed) return;
                    const { width, height } = host.getBoundingClientRect();
                    if (width === 0 || height === 0) return; // observer will retry

                    const pending = pendingResultRef.current;
                    if (!pending) return;
                    pendingResultRef.current = null;

                    viewerRef.current?.dispose();
                    viewerRef.current = null;

                    const viewer = createIntegratedViewer(host);
                    viewerRef.current = viewer;
                    viewer.setData({ boardGeom: pending.boardGeom, layers: pending.layers });
                    viewer.setSideMode("top");
                    setStatus("ready");
                    // fit() needs one more frame for the canvas resize inside setData to settle
                    requestAnimationFrame(() => { if (!disposed) viewer.fit(); });
                };

                // Try immediately, then observe for when the tab becomes visible
                tryMount();
                const ro = new ResizeObserver(() => {
                    if (pendingResultRef.current) tryMount();
                });
                ro.observe(host);
                // Clean up observer once mounted or on abort
                const cleanup = () => ro.disconnect();
                controller.signal.addEventListener("abort", cleanup);
                // Also clean up when pendingResult is consumed (mounted successfully)
                const checkDone = setInterval(() => {
                    if (!pendingResultRef.current || disposed) {
                        clearInterval(checkDone);
                        ro.disconnect();
                    }
                }, 200);

            } catch (err: unknown) {
                if (controller.signal.aborted || disposed) return;
                const msg = err instanceof Error ? err.message : String(err);
                setErrorMsg(msg);
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

    const toggleSide = () => {
        const next: Side = side === "top" ? "bottom" : "top";
        setSide(next);
        viewerRef.current?.setSideMode(next);
    };

    return (
        <div className="absolute inset-0 flex flex-col bg-background">
            {/* Toolbar */}
            <div className="flex items-center gap-2 px-3 py-1.5 border-b bg-background/95 backdrop-blur shrink-0">
                <span className="text-xs text-muted-foreground font-medium">Gerber Viewer</span>
                {status === "ready" && (
                    <button
                        onClick={toggleSide}
                        className="ml-auto text-xs px-3 py-1 rounded border border-border/60 bg-muted/40 hover:bg-muted transition-colors"
                    >
                        {side === "top" ? "Top Side" : "Bottom Side"}
                    </button>
                )}
            </div>

            {/* Content */}
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
                {/* Viewer host — always in DOM with real layout so ResizeObserver fires */}
                <div ref={hostRef} className="absolute inset-0" />
            </div>
        </div>
    );
}
