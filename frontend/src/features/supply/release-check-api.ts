import { fetchJson } from "@/lib/api";
import type { ReleaseCheck } from "@/types/supply";

// Apart from supply-api so Release Studio does not pull in the whole supply client.

export function getReleaseCheck(projectId: string, commit: string, signal?: AbortSignal): Promise<ReleaseCheck> {
  const query = commit ? `?commit=${encodeURIComponent(commit)}` : "";
  return fetchJson<ReleaseCheck>(
    `/api/supply/projects/${encodeURIComponent(projectId)}/release-check${query}`,
    { signal },
    "Could not check the BOM",
  );
}
