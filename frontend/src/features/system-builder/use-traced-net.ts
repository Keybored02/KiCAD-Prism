import { useEffect, useState } from "react";

import { traceSystemNet } from "@/lib/systems-api";
import type { PrismSystemViewerSelection } from "@/types/prism-semantic-viewer";
import type { SystemNetDetail } from "@/types/system";

export interface TracedNet {
  /** The board the click landed on (the trace starts there). */
  origin: string;
  /** The board net clicked. */
  boardNet: string;
  loading: boolean;
  /** The system net, or null when the net stays on its board. */
  net: SystemNetDetail | null;
  error: string | null;
  /** Over 200 pins and not confirmed yet: lit only on the clicked board (D-P2-8). */
  waiting: boolean;
}

interface Read {
  key: string;
  net: SystemNetDetail | null;
  error: string | null;
}

/** The board net a selection is on: a net, or a pad's net, on one placement. */
function tracedFrom(selection: PrismSystemViewerSelection | null): { origin: string; boardNet: string } | null {
  if (!selection || selection.kind === "board" || !selection.occurrence) return null;
  if (selection.kind !== "net" && selection.kind !== "terminal") return null;
  return selection.netName ? { origin: selection.occurrence, boardNet: selection.netName } : null;
}

/**
 * SB2-32 (D-P2-28): clicking a trace selects its system net. The selection's
 * board net is resolved on the server to the system net it belongs to, re-read
 * whenever the system changes. A net over 200 pins waits for `light` (D-P2-8).
 */
export function useTracedNet(systemId: string, netsKey: string, selection: PrismSystemViewerSelection | null) {
  const from = tracedFrom(selection);
  const key = from ? `${netsKey}\n${from.origin}\n${from.boardNet}` : null;
  const [read, setRead] = useState<Read | null>(null);
  const [confirmed, setConfirmed] = useState<ReadonlySet<string>>(new Set());

  useEffect(() => {
    if (!key) return;
    const [, origin, boardNet] = key.split("\n");
    const controller = new AbortController();
    traceSystemNet(systemId, origin, boardNet, controller.signal)
      .then((net) => setRead({ key, net, error: null }))
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;
        setRead({ key, net: null, error: cause instanceof Error ? cause.message : "Could not trace the net" });
      });
    return () => controller.abort();
  }, [systemId, key]);

  const current = read && read.key === key ? read : null;
  const traced: TracedNet | null = from ? {
    ...from,
    loading: !current,
    net: current?.net ?? null,
    error: current?.error ?? null,
    waiting: Boolean(current?.net?.large && !confirmed.has(current.net.groupId)),
  } : null;

  return {
    traced,
    /** Light a large net on every board after all. */
    light: (groupId: string) => setConfirmed((set) => new Set(set).add(groupId)),
  };
}
