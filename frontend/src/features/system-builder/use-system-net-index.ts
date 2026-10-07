import { useEffect, useState } from "react";

import { listSystemNetMembers } from "@/lib/systems-api";
import type { SystemNetListed } from "@/types/system";

/** Board net → its system net: keys are `occurrence\nnet`. */
export type SystemNetIndex = ReadonlyMap<string, SystemNetListed>;

export const boardNetKey = (occurrence: string, net: string) => `${occurrence}\n${net}`;

/** Index the listed nets by each visible board net they hold. */
export function indexSystemNets(groups: readonly SystemNetListed[]): SystemNetIndex {
  const index = new Map<string, SystemNetListed>();
  for (const group of groups) {
    for (const member of group.members ?? []) index.set(boardNetKey(member.occurrence, member.net), group);
  }
  return index;
}

/**
 * SB2-33: which system net each board net belongs to, for the search to show
 * one result per system net. Read once per system version; a failed read
 * leaves the search on board nets alone.
 */
export function useSystemNetIndex(systemId: string, etag: string): SystemNetIndex {
  const [read, setRead] = useState<{ key: string; index: SystemNetIndex } | null>(null);
  const key = `${systemId}\n${etag}`;
  useEffect(() => {
    const controller = new AbortController();
    listSystemNetMembers(systemId, controller.signal)
      .then((list) => setRead({ key, index: indexSystemNets(list.groups) }))
      .catch(() => undefined);
    return () => controller.abort();
  }, [systemId, key]);
  // Keep the last version's index until the new one arrives.
  return read?.index ?? EMPTY;
}

const EMPTY: SystemNetIndex = new Map();
