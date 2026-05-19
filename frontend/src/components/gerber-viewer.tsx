import { useEffect, useRef, useState } from "react";
import { createIntegratedViewer, renderGerbersZip } from "gerbers-renderer";
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

    useEffect(() => {
        const controller = new AbortController();
        let disposed = false;

        const load = async () => {
            setStatus("loading");
            setErrorMsg(null);

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

                if (!hostRef.current) return;

                // Dispose previous viewer instance if any
                viewerRef.current?.dispose();
                viewerRef.current = null;

                const viewer = createIntegratedViewer(hostRef.current);
                viewerRef.current = viewer;
                viewer.setData({ boardGeom: result.boardGeom, layers: result.layers });
                viewer.setSideMode("top");
                // Show the host div first so the canvas has real dimensions,
                // then call fit() after a rAF so the layout has settled.
                setStatus("ready");
                requestAnimationFrame(() => {
                    if (!disposed) viewer.fit();
                });
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
                {/* Viewer host — always in the DOM so it has layout when fit() is called */}
                <div ref={hostRef} className="absolute inset-0" />
            </div>
        </div>
    );
}
