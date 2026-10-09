import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { getSystemNet } from "@/lib/systems-api";
import type { PrismSystemSceneEmphasisResult } from "@/types/prism-semantic-viewer";
import type { SystemNetDetail, SystemNetSummary } from "@/types/system";

/**
 * SB2-31: the system nets highlighted in the 3D view. A net over 200 pins
 * waits in `confirmLarge` until confirmed (D-P2-8). Group ids hold while the
 * system's connectivity does, so highlighted nets are re-read when `netsKey` changes (SB2-98).
 */
export function useNetHighlight(systemId: string, netsKey: string) {
  const [highlighted, setHighlighted] = useState<SystemNetDetail[]>([]);
  const [results, setResults] = useState<ReadonlyMap<string, PrismSystemSceneEmphasisResult>>(new Map());
  const [adding, setAdding] = useState<string | null>(null);
  const [confirmLarge, setConfirmLarge] = useState<SystemNetSummary | null>(null);
  const latest = useRef(highlighted);
  useEffect(() => {
    latest.current = highlighted;
  }, [highlighted]);

  useEffect(() => {
    const current = latest.current;
    if (current.length === 0) return;
    let cancelled = false;
    void Promise.all(current.map((net) => getSystemNet(systemId, net.groupId).catch(() => null))).then((nets) => {
      if (!cancelled) setHighlighted(nets.filter((net): net is SystemNetDetail => net !== null));
    });
    return () => {
      cancelled = true;
    };
  }, [systemId, netsKey]);

  const add = async (net: SystemNetSummary, confirmed = false) => {
    if (net.large && !confirmed) {
      setConfirmLarge(net);
      return;
    }
    setConfirmLarge(null);
    setAdding(net.groupId);
    try {
      const detail = await getSystemNet(systemId, net.groupId);
      setHighlighted((list) => (list.some((item) => item.groupId === detail.groupId) ? list : [...list, detail]));
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Could not load the net");
    } finally {
      setAdding(null);
    }
  };

  return {
    highlighted,
    results,
    adding,
    confirmLarge,
    add,
    remove: (groupId: string) => setHighlighted((list) => list.filter((net) => net.groupId !== groupId)),
    clear: () => setHighlighted([]),
    cancelLarge: () => setConfirmLarge(null),
    /** Record what the view lit (from `setNetEmphasis` or the element's `emphasis` event). */
    report: (report: readonly PrismSystemSceneEmphasisResult[]) => setResults((previous) => {
      const next = new Map(report.map((result) => [result.key, result]));
      return sameResults(previous, next) ? previous : next;
    }),
  };
}

function sameResults(a: ReadonlyMap<string, PrismSystemSceneEmphasisResult>, b: ReadonlyMap<string, PrismSystemSceneEmphasisResult>) {
  return a.size === b.size && [...b].every(([key, value]) => JSON.stringify(a.get(key)) === JSON.stringify(value));
}
