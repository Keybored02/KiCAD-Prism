import type { InstanceCatalogRef } from "@/types/system";

export const STAGE: Record<string, string> = {
  open: "open", in_progress: "in progress", qa_review: "in QA review", done: "approved", released: "released", archived: "archived",
};

const stage = (status: string | null | undefined) => (status ? STAGE[status] ?? status : "");

/**
 * SB2-122: where a subsystem's revision sits in the release chain, on one line:
 * `v2 · released · v3 released · v4 in QA review` (this one, a newer release, a newer one on its way).
 */
export function releaseChain(ref: InstanceCatalogRef | null | undefined): { text: string; newerReleased: number | null } {
  if (!ref?.version) return { text: "—", newerReleased: null };
  const parts = [`v${ref.version}${ref.releaseStatus ? ` · ${stage(ref.releaseStatus)}` : ""}`];
  const released = ref.latestReleasedVersion ?? null;
  const newerReleased = released !== null && released > ref.version ? released : null;
  if (newerReleased) parts.push(`v${newerReleased} released`);
  const newest = ref.newestVersion ?? null;
  if (newest !== null && newest > Math.max(ref.version, released ?? 0) && ref.newestReleaseStatus !== "released") {
    parts.push(`v${newest} ${stage(ref.newestReleaseStatus)}`.trim());
  }
  return { text: parts.join(" · "), newerReleased };
}
