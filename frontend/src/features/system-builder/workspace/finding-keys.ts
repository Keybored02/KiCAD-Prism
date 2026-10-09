import type { Finding } from "@/types/system";

function findingKey(finding: Finding): string {
  // The detail tells apart findings of one rule at one place (a harness's segments, each occurrence).
  return [finding.rule, finding.instanceId, finding.linkId, finding.rowId, finding.end, finding.reference, finding.pin,
    JSON.stringify(finding.detail ?? null)].join("|");
}

/** A React key per finding: identical findings, if a report ever repeats one, are numbered rather than merged. */
export function findingKeys(findings: Finding[]): string[] {
  const seen = new Map<string, number>();
  return findings.map((finding) => {
    const key = findingKey(finding);
    const count = seen.get(key) ?? 0;
    seen.set(key, count + 1);
    return count ? `${key}#${count}` : key;
  });
}
