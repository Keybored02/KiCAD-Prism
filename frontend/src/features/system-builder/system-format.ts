import type { SystemInstance } from "@/types/system";

export function shortSha(commit: string | null | undefined): string {
  return commit ? commit.slice(0, 8) : "—";
}

export type Tone = "ok" | "info" | "warning" | "error" | "muted";

export interface BoardStatus {
  label: string;
  tone: Tone;
  detail: string;
}

/**
 * One headline status for a board, most urgent first: restricted, source
 * lost, interface failed or pending, then the baseline against its branch.
 */
export function boardStatus(instance: SystemInstance): BoardStatus {
  if (instance.kind === "assembly" || instance.kind === "module") {
    const ref = instance.catalog;
    if (instance.resolution === "unresolved" || !ref) {
      return { label: "Catalog unavailable", tone: "error", detail: "The pinned catalog revision could not be read." };
    }
    const version = ref.version ? `v${ref.version}` : "revision";
    if (instance.updateAvailable) {
      return { label: "Update available", tone: "warning", detail: `A newer released revision than ${version} exists.` };
    }
    return ref.releaseStatus === "released"
      ? { label: `${version} released`, tone: "ok", detail: `Pinned to ${version}, released.` }
      : { label: `${version} unreleased`, tone: "warning", detail: `Pinned to ${version}, which QA has not released.` };
  }
  if (instance.restricted) {
    return { label: "Restricted", tone: "muted", detail: "You cannot see this board's project." };
  }
  if (instance.resolution === "unresolved") {
    return { label: "Source missing", tone: "error", detail: "The project was deleted or its baseline is unreachable." };
  }
  const iface = instance.interface;
  if (iface?.status === "failed") {
    return { label: "Extraction failed", tone: "error", detail: iface.errorCode ?? "The board interface could not be read." };
  }
  if (iface?.status === "pending") {
    return { label: "Reading board", tone: "info", detail: "The board interface is being extracted." };
  }
  if (!instance.trackedRef) {
    return { label: "Fixed commit", tone: "muted", detail: "Not tracking a branch." };
  }
  if (!instance.tipCheckedAt) {
    return { label: "Not checked", tone: "muted", detail: `Tracking ${instance.trackedRef}; not checked yet.` };
  }
  if (instance.tipCommit === null) {
    return { label: "Branch missing", tone: "warning", detail: `origin/${instance.trackedRef} was not found.` };
  }
  if (instance.updateAvailable) {
    return {
      label: instance.pinned ? "Update available" : "Changes pending",
      tone: "warning",
      detail: `${instance.trackedRef} is at ${shortSha(instance.tipCommit)}; the baseline is ${shortSha(instance.baselineCommit)}.`,
    };
  }
  return { label: "Up to date", tone: "ok", detail: `Baseline matches ${instance.trackedRef}.` };
}

export const TONE_BADGE: Record<Tone, "success" | "info" | "warning" | "destructive" | "outline"> = {
  ok: "success",
  info: "info",
  warning: "warning",
  error: "destructive",
  muted: "outline",
};

/** "just now", "5 min ago", "3 h ago", "8 d ago". */
export function timeAgo(iso: string): string {
  const minutes = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  return hours < 48 ? `${hours} h ago` : `${Math.round(hours / 24)} d ago`;
}
