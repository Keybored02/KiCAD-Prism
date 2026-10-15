import { AlertTriangle, Ban, Banknote, Boxes, Clock, EyeOff, Eye, Layers, HeartPulse, ShieldCheck, ShieldQuestion, Star, Hourglass, PackageMinus, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import type { JlcClass, SupplyLifecycle } from "@/types/supply";
import type { RollupKind, RollupSentence } from "./bom-rollup-text";
import { formatAgo, LIFECYCLE_LABEL } from "./supply-format";

/** One vocabulary of small icons for lists, tables, bars and cards. Each carries its words as the accessible name and tooltip. */
function Glyph({ icon: Icon, label, className }: { icon: LucideIcon; label: string; className?: string }) {
  return <Icon role="img" aria-label={label} className={cn("inline h-4 w-4 shrink-0", className)}><title>{label}</title></Icon>;
}

const LIFECYCLE_ICON: Record<Exclude<SupplyLifecycle, "active" | "unknown">, { icon: LucideIcon; tone: string }> = {
  nrnd: { icon: AlertTriangle, tone: "text-warning" },
  last_time_buy: { icon: Hourglass, tone: "text-warning" },
  obsolete: { icon: Ban, tone: "text-destructive" },
};

/** Lifecycle as an icon. Active and unknown show nothing. */
export function LifecycleIcon({ lifecycle }: { lifecycle: SupplyLifecycle }) {
  if (lifecycle === "active" || lifecycle === "unknown") return null;
  const { icon, tone } = LIFECYCLE_ICON[lifecycle];
  return <Glyph icon={icon} label={LIFECYCLE_LABEL[lifecycle]} className={tone} />;
}

/** How long ago the part was read, as a clock; the age is its words. Nothing before the first read. */
export function DataAgeIcon({ fetchedAt }: { fetchedAt: string | null }) {
  const age = formatAgo(fetchedAt);
  if (!age) return null;
  return <Glyph icon={Clock} label={`Read ${age}`} className="text-muted-foreground" />;
}

/** The part is tracked, and at which tier. */
export function TrackedIcon({ tier }: { tier?: number | null }) {
  return <Glyph icon={Eye} label={tier ? `Tracked, tier ${tier}` : "Tracked"} className="text-muted-foreground" />;
}

const ROLLUP_ICON: Record<RollupKind, LucideIcon> = {
  build: Boxes,
  cost: Banknote,
  risk: AlertTriangle,
  health: HeartPulse,
  short: PackageMinus,
  untracked: EyeOff,
};

const TONE_CLASS = { plain: "", warn: "text-warning", bad: "text-destructive" } as const;

/** A rollup finding as a chip: an icon and a number, with the sentence as its tooltip and its text for screen readers. */
export function RollupChip({ sentence }: { sentence: RollupSentence }) {
  const Icon = ROLLUP_ICON[sentence.kind];
  return (
    <span title={sentence.text} className={cn("inline-flex items-center gap-1 tabular-nums", TONE_CLASS[sentence.tone])}>
      <Icon aria-hidden className="h-3.5 w-3.5" />
      <span aria-hidden>{sentence.short}</span>
      <span className="sr-only">{sentence.text}</span>
    </span>
  );
}

/** A BOM row holds several different parts. */
export function MixedIcon() {
  return <Glyph icon={Layers} label="Mixed: several different parts" className="text-muted-foreground" />;
}

/** Whether a connector's terms of use were reviewed; the who and when are the tooltip. */
export function TermsIcon({ reviewedBy, reviewedAt }: { reviewedBy: string; reviewedAt: string }) {
  return reviewedAt
    ? <Glyph icon={ShieldCheck} label={`Terms reviewed by ${reviewedBy} on ${reviewedAt}`} className="text-success" />
    : <Glyph icon={ShieldQuestion} label="Terms not reviewed" className="text-warning" />;
}

/** The part is waiting for room in a distributor's budget. */
export function WaitingIcon() {
  return <Glyph icon={Hourglass} label="Waiting for room" className="text-warning" />;
}

/** JLCPCB's class of a part: Basic parts carry no setup fee, Extended ones do; a star marks the preferred list. Nothing when JLCPCB has no answer. */
export function JlcIcon({ jlc }: { jlc: JlcClass | null | undefined }) {
  if (!jlc || (!jlc.library && !jlc.preferred)) return null;
  const label = `JLCPCB ${jlc.library ? jlc.library.toLowerCase() : "listed"}${jlc.preferred ? ", preferred" : ""}`;
  return (
    <span role="img" aria-label={label} title={label} className="inline-flex shrink-0 items-center gap-0.5 rounded border px-1 text-[10px] font-semibold leading-4 text-muted-foreground">
      {jlc.library === "Basic" ? "B" : jlc.library === "Extended" ? "E" : "J"}
      {jlc.preferred ? <Star aria-hidden className="h-2.5 w-2.5 fill-current" /> : null}
    </span>
  );
}
