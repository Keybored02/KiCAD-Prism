import * as React from "react";
import { useEffect, useRef, useCallback } from "react";
import { Check, MessageSquare } from "lucide-react";
import type { Comment } from "@/types/comments";
import type { ECadViewerElement } from "@/types/ecad-viewer";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface CommentOverlayProps {
    comments: Comment[];
    viewerRef: React.RefObject<ECadViewerElement | null>;
    onPinClick?: (comment: Comment) => void;
    showResolved?: boolean;
}

/**
 * CommentOverlay renders comment pin markers as an overlay on top of the ecad-viewer.
 * Pin positions are updated by directly mutating DOM styles (no setState) so that
 * pan/zoom does not trigger React re-renders.
 */
export function CommentOverlay({
    comments,
    viewerRef,
    onPinClick,
    showResolved = true,
}: CommentOverlayProps) {
    // Refs to each pin's wrapper div, keyed by comment id
    const pinRefs = useRef<Map<string, HTMLDivElement>>(new Map());
    const rafRef = useRef<number | null>(null);

    const visibleComments = showResolved
        ? comments
        : comments.filter((c) => c.status === "OPEN");

    // Directly move pins in the DOM without going through React state
    const updatePositions = useCallback(() => {
        const viewer = viewerRef.current;
        if (!viewer?.getScreenLocation) return;

        try {
            const rect = viewer.getBoundingClientRect();
            for (const comment of visibleComments) {
                const el = pinRefs.current.get(comment.id);
                if (!el) continue;

                const screenPos = viewer.getScreenLocation(comment.location.x, comment.location.y);
                if (!screenPos) {
                    el.style.display = "none";
                    continue;
                }

                const visible =
                    screenPos.x >= 0 && screenPos.x <= rect.width &&
                    screenPos.y >= 0 && screenPos.y <= rect.height;

                if (visible) {
                    el.style.display = "";
                    el.style.left = `${screenPos.x}px`;
                    el.style.top = `${screenPos.y}px`;
                } else {
                    el.style.display = "none";
                }
            }
        } catch {
            // Viewer internals can be transiently unavailable; ignore.
        }
    }, [viewerRef, visibleComments]);

    const scheduleUpdate = useCallback(() => {
        if (rafRef.current !== null) return; // already scheduled
        rafRef.current = requestAnimationFrame(() => {
            rafRef.current = null;
            updatePositions();
        });
    }, [updatePositions]);

    useEffect(() => {
        const viewer = viewerRef.current;
        if (!viewer) return;

        viewer.addEventListener("panzoom", scheduleUpdate);
        viewer.addEventListener("mouseup", scheduleUpdate);
        viewer.addEventListener("wheel", scheduleUpdate);
        window.addEventListener("resize", scheduleUpdate);

        scheduleUpdate();

        return () => {
            viewer.removeEventListener("panzoom", scheduleUpdate);
            viewer.removeEventListener("mouseup", scheduleUpdate);
            viewer.removeEventListener("wheel", scheduleUpdate);
            window.removeEventListener("resize", scheduleUpdate);
            if (rafRef.current !== null) {
                cancelAnimationFrame(rafRef.current);
                rafRef.current = null;
            }
        };
    }, [viewerRef, scheduleUpdate]);

    // Re-run positions whenever comments list changes
    useEffect(() => {
        scheduleUpdate();
    }, [visibleComments, scheduleUpdate]);

    return (
        <TooltipProvider>
            <div className="absolute inset-0 z-20 pointer-events-none overflow-hidden">
                {visibleComments.map((comment) => {
                    const isResolved = comment.status === "RESOLVED";

                    return (
                        <div
                            key={comment.id}
                            ref={(node) => {
                                if (node) pinRefs.current.set(comment.id, node);
                                else pinRefs.current.delete(comment.id);
                            }}
                            className="absolute pointer-events-auto cursor-pointer transform -translate-x-1/2 -translate-y-1/2"
                            style={{ display: "none" }}
                            onClick={() => onPinClick?.(comment)}
                        >
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div
                                        className={`
                                            group relative flex items-center justify-center
                                            w-8 h-8 rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.2)] border-2 border-white
                                            transition-all duration-200 hover:scale-110 hover:-translate-y-1
                                            ${isResolved
                                                ? "bg-emerald-500 text-white"
                                                : "bg-primary text-primary-foreground"}
                                        `}
                                    >
                                        {isResolved ? (
                                            <Check className="w-4 h-4" strokeWidth={3} />
                                        ) : (
                                            <span className="font-bold text-xs">
                                                {comment.replies.length > 0 ? (
                                                    <div className="flex items-center justify-center">
                                                        <span className="text-[10px]">{comment.replies.length + 1}</span>
                                                    </div>
                                                ) : (
                                                    <MessageSquare className="w-3.5 h-3.5 fill-current" />
                                                )}
                                            </span>
                                        )}
                                        {!isResolved && (
                                            <span className="absolute inline-flex h-full w-full rounded-full bg-primary opacity-20 animate-ping duration-1000"></span>
                                        )}
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="max-w-[200px] p-3">
                                    <div className="flex flex-col gap-1">
                                        <div className="flex justify-between items-center text-xs text-muted-foreground">
                                            <span className="font-semibold text-foreground">{comment.author}</span>
                                            <span>{new Date(comment.timestamp).toLocaleDateString()}</span>
                                        </div>
                                        <p className="text-sm line-clamp-2">{comment.content}</p>
                                        {comment.replies.length > 0 && (
                                            <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                                <MessageSquare className="w-3 h-3" />
                                                {comment.replies.length} replies
                                            </div>
                                        )}
                                    </div>
                                </TooltipContent>
                            </Tooltip>
                        </div>
                    );
                })}
            </div>
        </TooltipProvider>
    );
}
