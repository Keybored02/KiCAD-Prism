/**
 * Base, ours and theirs, side by side, showing the same part of the board.
 *
 * Three viewers rather than a toggle, because the question a merge asks is "what did each
 * of us do to this?", and answering it by flipping between two views makes the reader
 * hold one in their head. The existing commit diff toggles for good reasons - two views,
 * full width each - but three versions is a comparison, not a before-and-after.
 *
 * The panes pan and zoom together. That is the entire value: if the reader has to
 * re-find the same footprint in each pane, the comparison costs more than it gives.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { EcadViewerHost } from "@/components/ecad-viewer-shared";
import type { CameraState, ECadViewerElement } from "@/types/ecad-viewer";
import type { MergeSide } from "@/lib/merge-agent";

export interface PaneContent {
    side: MergeSide;
    label: string;
    filename: string;
    content: string | null;
    detail?: string;
}

/** How close two cameras have to be before we stop propagating. */
/**
 * How close two cameras have to be before we stop propagating.
 *
 * Position is in board millimetres and zoom is a ratio, so they need different
 * thresholds. Using one value for both is what broke panning: at 1e-4 a zoom step
 * always looked like a change while a small pan looked identical, so zoom synced and
 * pan did not.
 *
 * Position is deliberately tight. A pan of a hundredth of a millimetre is still a pan,
 * and a follower pane that ignores it drifts a little further out of step with every
 * gesture until the three views no longer show the same place.
 */
const POSITION_EPSILON = 1e-6;
const ZOOM_EPSILON = 1e-9;

/** Temporary: trace camera events while pane syncing is being diagnosed. */
const DEBUG = true;

function sameCamera(a: CameraState | null, b: CameraState | null): boolean {
    if (!a || !b) return false;
    return (
        Math.abs(a.x - b.x) < POSITION_EPSILON &&
        Math.abs(a.y - b.y) < POSITION_EPSILON &&
        Math.abs(a.zoom - b.zoom) < ZOOM_EPSILON &&
        Math.abs(a.rotation - b.rotation) < POSITION_EPSILON
    );
}

export function MergePanes({
    panes,
    focusKey,
    focusAt,
}: {
    panes: PaneContent[];
    /** A decision key to centre in every pane. Changing it re-focuses. */
    focusKey?: string;
    /**
     * Where the focused object is, in board coordinates.
     *
     * Needed because only some objects have a uuid the viewer can look up. Tracks,
     * vias and arcs are keyed by their own geometry (`seg:140.6,80.7-...`), which
     * means `focusItem` has nothing to resolve and clicking one would do nothing at
     * all. Falling back to the coordinates works for everything.
     */
    focusAt?: { x: number; y: number } | null;
}) {
    const viewers = useRef<Map<MergeSide, ECadViewerElement | null>>(new Map());

    // Guards against the obvious failure of linked cameras: pane A moves, writes to B,
    // B fires its own camerachange, writes back to A, and the two oscillate forever.
    // Whoever the user is actually driving holds the lock; everyone else is a follower
    // until they stop.
    const driving = useRef<MergeSide | null>(null);
    const releaseTimer = useRef<number | undefined>(undefined);

    const [linked, setLinked] = useState(true);
    const linkedRef = useRef(linked);
    useEffect(() => { linkedRef.current = linked; }, [linked]);

    const propagate = useCallback((from: MergeSide) => {
        if (!linkedRef.current) return;
        if (driving.current && driving.current !== from) return;

        const source = viewers.current.get(from);
        const camera = source?.camera ?? null;
        // Take the lock only once we know there is something to propagate. Claiming it
        // before this check leaves it held forever when a viewer has no camera yet
        // (which is the case during load), and every later pan is then ignored as
        // "somebody else is driving".
        if (!camera) return;

        driving.current = from;
        try {
            for (const [side, viewer] of viewers.current) {
                if (side === from || !viewer) continue;
                // Skip a pane that already agrees. Writing an identical camera still
                // fires camerachange on some builds, which is the loop we are avoiding.
                if (sameCamera(viewer.camera ?? null, camera)) continue;
                try {
                    viewer.camera = camera;
                } catch {
                    // One pane refusing must not stop the others, and must not leave
                    // the lock held.
                }
            }
        } finally {
            // Hold the lock briefly past the last event so the followers' own
            // camerachange events - which arrive a frame or two later - do not take
            // over and start writing back. `finally` so a throw above can never strand
            // it: a stuck lock silently disables syncing for the rest of the session.
            window.clearTimeout(releaseTimer.current);
            releaseTimer.current = window.setTimeout(() => {
                driving.current = null;
            }, 120);
        }
    }, []);

    useEffect(() => () => window.clearTimeout(releaseTimer.current), []);

    // One STABLE callback per side, created once. Returning a fresh closure per render
    // (the obvious `attach(side)` shape) makes EcadViewerHost see a changed `onViewer`
    // prop every time and re-run its attach effect, so listeners pile up: five
    // attachments for three panes, and the duplicates fight each other over the
    // re-entrancy lock until nothing propagates at all.
    const attachers = useRef<Map<MergeSide, (node: ECadViewerElement | null) => void>>(
        new Map(),
    );

    const attach = useCallback(
        (side: MergeSide) => {
            const existing = attachers.current.get(side);
            if (existing) return existing;

            const fn = (node: ECadViewerElement | null) => {
                const previous = viewers.current.get(side);
                if (previous && previous !== node) {
                    const old = (
                        previous as unknown as { __prismCameraHandler?: EventListener }
                    ).__prismCameraHandler;
                    if (old) previous.removeEventListener("camerachange", old);
                }

                if (!node) {
                    viewers.current.delete(side);
                    return;
                }

                // Already wired: the host re-ran its effect with the same element.
                if (
                    (node as unknown as { __prismCameraHandler?: EventListener })
                        .__prismCameraHandler
                ) {
                    viewers.current.set(side, node);
                    return;
                }

                const handler = () => {
                    if (DEBUG) console.log("[panes] camerachange from", side, node.camera);
                    propagate(side);
                };
                node.addEventListener("camerachange", handler);
                if (DEBUG) console.log("[panes] listener attached to", side);
                (
                    node as unknown as { __prismCameraHandler?: EventListener }
                ).__prismCameraHandler = handler;
                viewers.current.set(side, node);
            };

            attachers.current.set(side, fn);
            return fn;
        },
        [propagate],
    );

    // Centre one object in every pane. An object may legitimately be missing from a
    // pane (that IS the change), so each is asked independently and a failure in one
    // must not stop the others.
    useEffect(() => {
        if (!focusKey && !focusAt) return;
        let cancelled = false;

        // A synthesized key is geometry, not an id, so there is nothing for the viewer
        // to look up. Recognising that here avoids a pointless round trip per pane.
        const lookupable = Boolean(focusKey) && !focusKey!.includes(":");

        (async () => {
            for (const [, viewer] of viewers.current) {
                if (cancelled || !viewer) continue;
                try {
                    await viewer.ready;
                    if (cancelled) continue;

                    let landed = null;
                    if (lookupable) {
                        // select:true so the object is highlighted, not merely centred.
                        // Being shown WHERE something is without being shown WHICH
                        // thing it is leaves the reader hunting.
                        landed = await viewer.focusItem?.(focusKey!, { select: true });
                    }

                    // Either it has no id we can resolve, or this side does not have
                    // the object at all (which is frequently the change itself). Centre
                    // the spot so the reader can see what is or is not there.
                    if (!landed && focusAt) {
                        viewer.zoomToLocation?.(focusAt.x, focusAt.y);
                    }
                } catch {
                    // Missing from this side, or a viewer build without the method.
                    // Neither is worth interrupting the user over.
                    if (focusAt) {
                        try {
                            viewer.zoomToLocation?.(focusAt.x, focusAt.y);
                        } catch {
                            /* nothing more to try */
                        }
                    }
                }
            }
        })();

        return () => { cancelled = true; };
    }, [focusKey, focusAt]);

    return (
        <div className="flex h-full min-h-0 flex-col">
            <div className="flex shrink-0 items-center justify-end px-3 py-1.5">
                <label className="flex cursor-pointer items-center gap-1.5 text-xs text-muted-foreground">
                    <input
                        type="checkbox"
                        checked={linked}
                        onChange={e => setLinked(e.target.checked)}
                        className="h-3 w-3 accent-primary"
                    />
                    Pan and zoom together
                </label>
            </div>

            <div className="grid min-h-0 flex-1 grid-cols-3 gap-px bg-border">
                {panes.map(pane => (
                    <Pane
                        key={pane.side}
                        pane={pane}
                        onViewer={attach(pane.side)}
                        focusAt={focusAt}
                    />
                ))}
            </div>
        </div>
    );
}

/**
 * A ring drawn over the focused object, tracking it as the view moves.
 *
 * Centring the camera is not enough on a dense board: it tells the reader WHERE to look
 * but not WHICH of the twenty things in view is the one they clicked. The viewer's own
 * selection only works for objects with a real id, and tracks do not have one, so this
 * marks the spot regardless.
 *
 * Positioned from world coordinates every frame the camera moves, using the same
 * `getScreenLocation` + container-offset approach as the commit diff overlay.
 */
function FocusMarker({
    viewer,
    at,
    containerRef,
}: {
    viewer: ECadViewerElement | null;
    at: { x: number; y: number } | null;
    containerRef: React.RefObject<HTMLDivElement | null>;
}) {
    const [point, setPoint] = useState<{ x: number; y: number } | null>(null);

    useEffect(() => {
        if (!viewer || !at) {
            setPoint(null);
            return;
        }

        let raf = 0;
        let stop = false;

        const place = () => {
            const container = containerRef.current;
            if (!container || stop) return;
            try {
                const screen = viewer.getScreenLocation?.(at.x, at.y);
                if (!screen) {
                    setPoint(null);
                    return;
                }
                // getScreenLocation is canvas-relative; shift into container space.
                const viewerRect = viewer.getBoundingClientRect();
                const containerRect = container.getBoundingClientRect();
                setPoint({
                    x: screen.x + (viewerRect.left - containerRect.left),
                    y: screen.y + (viewerRect.top - containerRect.top),
                });
            } catch {
                setPoint(null);
            }
        };

        // A short rAF burst after each move rather than a permanent loop: the camera
        // settles within a few frames, and an unbounded loop across three panes is
        // 180fps of work for a static marker.
        const kick = () => {
            let frames = 0;
            const tick = () => {
                place();
                if (++frames < 20 && !stop) raf = requestAnimationFrame(tick);
            };
            cancelAnimationFrame(raf);
            raf = requestAnimationFrame(tick);
        };

        kick();
        viewer.addEventListener("camerachange", kick);
        return () => {
            stop = true;
            cancelAnimationFrame(raf);
            viewer.removeEventListener("camerachange", kick);
        };
    }, [viewer, at, containerRef]);

    if (!point) return null;

    return (
        <div
            className="pointer-events-none absolute z-20"
            style={{ left: point.x, top: point.y, transform: "translate(-50%, -50%)" }}
        >
            <div className="h-9 w-9 animate-pulse rounded-full border-2 border-sky-400 shadow-[0_0_0_9999px_rgba(0,0,0,0.12)]" />
        </div>
    );
}

function Pane({
    pane,
    onViewer,
    focusAt,
}: {
    pane: PaneContent;
    onViewer: (node: ECadViewerElement | null) => void;
    focusAt?: { x: number; y: number } | null;
}) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const [viewer, setViewer] = useState<ECadViewerElement | null>(null);

    const attach = useCallback(
        (node: ECadViewerElement | null) => {
            setViewer(node);
            onViewer(node);
        },
        [onViewer],
    );

    return (
        <div className="flex min-w-0 flex-col bg-background">
            <div className="flex shrink-0 items-baseline gap-2 border-b px-3 py-1.5">
                <span className="text-xs font-semibold uppercase tracking-wide">
                    {pane.label}
                </span>
                {pane.detail && (
                    <span className="truncate text-xs text-muted-foreground">{pane.detail}</span>
                )}
            </div>

            <div className="relative min-h-0 flex-1" ref={containerRef}>
                {pane.content === null ? (
                    <div className="flex h-full items-center justify-center">
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                ) : pane.content === "" ? (
                    <div className="flex h-full items-center justify-center px-4 text-center text-sm text-muted-foreground">
                        Not in this version
                    </div>
                ) : (
                    <>
                        <EcadViewerHost
                            // Keyed by side and filename only. The content of one side
                            // never changes during a merge - these are commits, not a
                            // live preview - so there is no reason to force a remount,
                            // and doing so would throw away the camera the user set.
                            viewerKey={`merge-${pane.side}-${pane.filename}`}
                            files={[{ filename: pane.filename, content: pane.content }]}
                            onViewer={attach}
                            showLayersButton={false}
                        />
                        <FocusMarker
                            viewer={viewer}
                            at={focusAt ?? null}
                            containerRef={containerRef}
                        />
                    </>
                )}
            </div>
        </div>
    );
}
