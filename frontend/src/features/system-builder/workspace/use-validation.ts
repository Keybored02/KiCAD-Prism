import { useEffect, useState } from "react";

import { getValidation } from "@/lib/systems-api";
import type { Finding, ValidationReport } from "@/types/system";

/** The system's findings at `etag`: re-read whenever the version moves (P1 §7.2). */
export function useValidation(systemId: string, etag: string): { findings: Finding[]; report: ValidationReport | null } {
  const [report, setReport] = useState<{ etag: string; body: ValidationReport } | null>(null);
  useEffect(() => {
    let cancelled = false;
    getValidation(systemId)
      .then(({ body }) => !cancelled && setReport({ etag, body }))
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [systemId, etag]);
  const current = report?.etag === etag ? report.body : null;
  return { findings: current?.findings ?? [], report: current };
}

/** Findings that concern one harness (they name it in their detail). */
export function harnessFindings(findings: Finding[], harnessId: string): Finding[] {
  return findings.filter((finding) => (finding.detail as { harnessId?: string } | null)?.harnessId === harnessId);
}
