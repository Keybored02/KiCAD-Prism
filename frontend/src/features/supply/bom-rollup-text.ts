import type { SupplyBomRollup } from "@/types/supply";
import type { BomLineDetail } from "./bom-supply";
import { formatPrice } from "./supply-format";

export interface RollupSentence {
  text: string;
  tone: "plain" | "warn" | "bad";
}

const plural = (count: number, one: string, many: string) => `${count.toLocaleString()} ${count === 1 ? one : many}`;

/** What the rollup of a lookup says about a build, as short sentences. */
export function rollupSentences(rollup: SupplyBomRollup, build: number, lines: readonly BomLineDetail[]): RollupSentence[] {
  const sentences: RollupSentence[] = [];

  if (rollup.can_build === null) {
    sentences.push({ text: rollup.tracked > 0 ? "No stock data yet" : "No parts tracked yet", tone: "warn" });
  } else if (rollup.can_build >= build) {
    sentences.push({ text: `Stock covers ${plural(build, "board", "boards")}`, tone: "plain" });
  } else {
    const limiting = lines.find((line) => line.key === rollup.limited_by)?.mpn;
    sentences.push({
      text: `Can build ${rollup.can_build.toLocaleString()} of ${build.toLocaleString()}${limiting ? `, limited by ${limiting}` : ""}`,
      tone: "bad",
    });
  }

  if (rollup.cost_build !== null && rollup.currency) {
    const each = rollup.cost_per_board ? ` (${formatPrice(rollup.cost_per_board, rollup.currency)} each)` : "";
    const unpriced = rollup.tracked - rollup.priced;
    sentences.push({
      text: `${formatPrice(rollup.cost_build, rollup.currency)} for ${plural(build, "board", "boards")}${each}${unpriced > 0 ? `, ${plural(unpriced, "line", "lines")} unpriced` : ""}`,
      tone: "plain",
    });
  } else if (rollup.priced > 0) {
    sentences.push({ text: "Prices are in more than one currency, so no total", tone: "warn" });
  }

  if (rollup.at_risk > 0) sentences.push({ text: `${rollup.at_risk.toLocaleString()} at risk`, tone: "bad" });
  if (rollup.short > 0) sentences.push({ text: `${rollup.short.toLocaleString()} short for this build`, tone: "bad" });
  if (rollup.not_tracked > 0) sentences.push({ text: `${rollup.not_tracked.toLocaleString()} not tracked`, tone: "warn" });
  return sentences;
}
