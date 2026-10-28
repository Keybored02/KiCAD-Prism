import { useCallback } from "react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { SupplyBuildAnswer } from "@/types/supply";
import { getBuildAnswers } from "./supply-api";
import { useLoaded } from "./use-loaded";

/** The words of a build answer, the same fixed set on every card: Unconfirmed, Short · N parts, Buildable N. */
export function buildAnswerText(answer: SupplyBuildAnswer): { text: string; tone: "good" | "bad" | "open" } {
  if (answer.unchecked > 0 || answer.boards === null) return { text: "Unconfirmed", tone: "open" };
  if (answer.short > 0) return { text: `Short · ${answer.short} ${answer.short === 1 ? "part" : "parts"}`, tone: "bad" };
  return { text: `Buildable ${answer.boards.toLocaleString()}`, tone: "good" };
}

const TONE = { good: "border-success/50 text-success", bad: "border-destructive/50 text-destructive", open: "border-warning/50 text-warning" } as const;

/** A tracked project's card chip. */
export function ProjectSupplyChip({ answer }: { answer: SupplyBuildAnswer | undefined }) {
  if (!answer) return null;
  const { text, tone } = buildAnswerText(answer);
  return <Badge variant="outline" className={cn("ml-auto shrink-0 text-[10px] font-normal", TONE[tone])}>{text}{answer.test_data ? " · Test data" : ""}</Badge>;
}

/** Every visible tracked project's build answer, for the workspace cards; none without supply access. */
export function useBuildAnswers(enabled: boolean): Record<string, SupplyBuildAnswer> {
  const fetcher = useCallback((signal: AbortSignal) => getBuildAnswers(signal), []);
  const loaded = useLoaded(enabled ? "build-answers" : null, fetcher, "Could not load the build answers", "supply");
  return (enabled && loaded.data) || {};
}
