import { Loader2 } from "lucide-react";
import { useEffect, useRef } from "react";

/** Asks for the next page when it scrolls into view. Renders nothing once there is no more. */
export function LoadMore({ hasMore, loading, onLoad }: { hasMore: boolean; loading: boolean; onLoad: () => void }) {
  const spot = useRef<HTMLDivElement | null>(null);
  const ask = useRef(onLoad);
  useEffect(() => { ask.current = onLoad; });
  useEffect(() => {
    const node = spot.current;
    if (!node || !hasMore || typeof IntersectionObserver === "undefined") return undefined;
    const watcher = new IntersectionObserver((entries) => { if (entries.some((entry) => entry.isIntersecting)) ask.current(); }, { rootMargin: "200px" });
    watcher.observe(node);
    return () => watcher.disconnect();
  }, [hasMore, loading]);
  if (!hasMore) return null;
  return (
    <div ref={spot} className="flex h-10 items-center justify-center text-xs text-muted-foreground" role="status" aria-label="Loading more parts">
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
    </div>
  );
}
