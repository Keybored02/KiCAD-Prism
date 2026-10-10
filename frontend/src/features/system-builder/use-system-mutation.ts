import { useCallback, useState } from "react";
import { toast } from "sonner";

import { StaleSystemError } from "@/lib/systems-api";

import { invalidateReads } from "./use-keyed-read";

/** SB2-98: the shared read of a system's git link and latest snapshot. */
export const repositoryReadKey = (systemId: string) => `repository:${systemId}`;
/** Mutations (by label) that change the git link or the snapshots; edits never do. */
const REPOSITORY_LABELS = new Set(["snapshot", "publish", "git-link", "git-fetch", "git-unlink", "git-retry"]);

/**
 * Runs one system mutation at a time and re-reads the document afterwards.
 *
 * A 412 means someone else changed the system since it was read: the edit is
 * not retried blindly; the document is reloaded so the user sees the current
 * state and can redo the change deliberately. SB2-98: the mutation stays busy
 * until that re-read lands, so the next edit never sends the old ETag.
 */
export function useSystemMutation(reload: () => Promise<void>) {
  const [busy, setBusy] = useState<string | null>(null);

  const run = useCallback(
    async <T,>(label: string, action: () => Promise<T>, success?: string): Promise<T | undefined> => {
      setBusy(label);
      try {
        const result = await action();
        if (success) {
          toast.success(success);
        }
        return result;
      } catch (error) {
        if (error instanceof StaleSystemError) {
          toast.warning("This system changed elsewhere. It has been reloaded; please try again.");
        } else {
          toast.error(error instanceof Error ? error.message : "The change failed");
        }
        return undefined;
      } finally {
        if (REPOSITORY_LABELS.has(label)) invalidateReads("repository:");
        await reload();
        setBusy(null);
      }
    },
    [reload],
  );

  return { busy, run };
}

export type Mutate = ReturnType<typeof useSystemMutation>["run"];
