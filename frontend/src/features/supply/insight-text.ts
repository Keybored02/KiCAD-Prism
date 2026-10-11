import type { SupplyInsight } from "@/types/supply";

const CONFIDENCE_LABEL: Record<SupplyInsight["confidence"], string> = {
  none: "No confidence yet",
  low: "Low confidence",
  medium: "Medium confidence",
  high: "High confidence",
};

export function confidenceLabel(insight: SupplyInsight): string {
  return CONFIDENCE_LABEL[insight.confidence];
}

function inDays(days: number): string {
  return days === 1 ? "about 1 day" : `about ${days.toLocaleString()} days`;
}

/** What the readings are based on, so a projection can be judged. */
export function insightBasis(insight: SupplyInsight): string {
  const { points, span_days: span, points_in_run: run } = insight.inputs;
  const days = span === 1 ? "1 day" : `${span} days`;
  return `${points} daily readings over ${days}; ${run} since the last restock or change of listings.`;
}

/** The sentences that go with a projection. Empty when there is nothing honest to say. */
export function insightLines(insight: SupplyInsight): string[] {
  if (insight.confidence === "none") return [];
  const lines: string[] = [];
  if (insight.trend === "falling" && insight.decrease_per_day !== null) {
    const rate = Math.round(insight.decrease_per_day).toLocaleString();
    lines.push(`Observed net decrease: ${rate} a day.`);
    if (insight.days_to_zero !== null) lines.push(`At that rate it reaches zero in ${inDays(insight.days_to_zero)}.`);
    if (insight.days_to_threshold !== null) lines.push(`It reaches your threshold in ${inDays(insight.days_to_threshold)}.`);
  } else if (insight.trend === "rising") {
    lines.push("Stock is rising.");
  } else if (insight.trend === "steady") {
    lines.push("Stock is steady.");
  } else {
    lines.push("Too few readings since the last restock to say how fast stock is falling.");
  }
  if (insight.restocks > 0) {
    const times = insight.restocks === 1 ? "once" : `${insight.restocks} times`;
    let restock = `Restocked ${times} in this history`;
    if (insight.restock_interval_days !== null) restock += `, about every ${insight.restock_interval_days} days`;
    const next = insight.restock_expected_in_days;
    if (next !== null) restock += next >= 0 ? `. Next expected in ${inDays(next)}` : `. Expected ${Math.abs(next)} days ago, not seen yet`;
    lines.push(`${restock}.`);
  }
  return lines;
}
