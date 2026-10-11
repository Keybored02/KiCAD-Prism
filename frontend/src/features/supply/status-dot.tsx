import { cn } from "@/lib/utils";
import type { SupplyStatus } from "@/types/supply";
import { STATUS_LABEL } from "./supply-format";

const TONE: Record<SupplyStatus, string> = {
  ok: "bg-success",
  warning: "bg-warning",
  error: "bg-destructive",
  fatal: "bg-destructive ring-2 ring-destructive/40",
  unknown: "bg-muted-foreground/40",
};

/** The status of a part as a dot, with the words for anyone who cannot see the colour. */
export function StatusDot({ status, className }: { status: SupplyStatus; className?: string }) {
  return (
    <span
      role="img"
      aria-label={STATUS_LABEL[status]}
      title={STATUS_LABEL[status]}
      className={cn("inline-block h-2.5 w-2.5 shrink-0 rounded-full", TONE[status], className)}
    />
  );
}
