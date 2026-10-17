import type { SupplyPartGroup } from "@/types/supply";

const PACKAGING: Record<string, string> = {
  cut_tape: "cut tape", custom_reel: "custom reel", tape_reel: "full reel", tube_tray: "tube or tray", smallest: "smallest order",
};

/** "42 parts · 3 at risk · 1 out": only the counts that are not zero. */
export function counts(group: SupplyPartGroup): string {
  const stats = group.stats;
  const parts = [`${group.count.toLocaleString()} ${group.count === 1 ? "part" : "parts"}`];
  if (stats) {
    const add = (n: number, text: string) => { if (n > 0) parts.push(`${n} ${text}`); };
    add(stats.at_risk, "at risk");
    add(stats.out, "out");
    add(stats.end_of_life, "end of life");
    add(stats.one_distributor, "one distributor");
    add(stats.runs_out_soon, "run out < 2 w");
  }
  return parts.join(" · ");
}

/** What a tracked project is followed for: the designs and the packaging. */
export function trackedLine(group: SupplyPartGroup): string {
  const stats = group.stats;
  const variants = stats?.variants ?? [];
  const designs = stats?.all_variants ? "all designs" : variants.length > 1 ? `base + ${variants.length - 1} ${variants.length === 2 ? "variant" : "variants"}` : "base";
  return ["Tracked", designs, stats?.packaging ? PACKAGING[stats.packaging] : ""].filter(Boolean).join(" · ");
}
