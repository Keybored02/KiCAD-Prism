import { Box, Cable, Layers, RectangleHorizontal, type LucideIcon } from "lucide-react";

import type { SystemInstance } from "@/types/system";

/** What a block on the canvas (or a row in the outline) is (D-P2-50). */
export type BlockKind = "board" | "module" | "subsystem" | "harness";

/** How a connection is made, for its colour (D-P2-50). */
export type ConnectionKind = "b2b" | "harness" | "link";

interface KindStyle {
  label: string;
  icon: LucideIcon;
  /** Literal class names, so Tailwind keeps them. */
  text: string;
  bar: string;
  tint: string;
  border: string;
}

export const BLOCK_STYLE: Record<BlockKind, KindStyle> = {
  board: { label: "Board", icon: RectangleHorizontal, text: "text-kind-board", bar: "bg-kind-board", tint: "bg-kind-board/15", border: "border-kind-board/50" },
  module: { label: "Module", icon: Box, text: "text-kind-module", bar: "bg-kind-module", tint: "bg-kind-module/15", border: "border-kind-module/50" },
  subsystem: { label: "Subsystem", icon: Layers, text: "text-kind-subsystem", bar: "bg-kind-subsystem", tint: "bg-kind-subsystem/15", border: "border-kind-subsystem/50" },
  harness: { label: "Harness", icon: Cable, text: "text-kind-harness", bar: "bg-kind-harness", tint: "bg-kind-harness/15", border: "border-kind-harness/50" },
};

export const CONNECTION_STYLE: Record<ConnectionKind, { label: string; stroke: string; width: number; dash?: string }> = {
  b2b: { label: "Board-to-board", stroke: "hsl(var(--kind-board))", width: 3 },
  harness: { label: "Harness", stroke: "hsl(var(--kind-harness))", width: 2 },
  link: { label: "Link", stroke: "hsl(var(--kind-link))", width: 1.5 },
};

export function blockKind(instance: Pick<SystemInstance, "kind">): BlockKind {
  if (instance.kind === "module") return "module";
  if (instance.kind === "assembly") return "subsystem";
  return "board";
}
