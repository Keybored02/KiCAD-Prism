import type { Finding, HarnessEnd, SystemDocument, SystemHarness, SystemInstance, SystemLink } from "@/types/system";

/**
 * SB2-99: lookups by id over a system document and its findings, built once per object and
 * shared by every component that reads them (no `Array.find` by id per row per render).
 * Documents and findings are replaced, never mutated, so the object is the cache key.
 */
export interface DocumentIndex {
  instances: ReadonlyMap<string, SystemInstance>;
  links: ReadonlyMap<string, SystemLink>;
  harnesses: ReadonlyMap<string, SystemHarness>;
  /** Harness end id → the end and its harness. */
  ends: ReadonlyMap<string, { harness: SystemHarness; end: HarnessEnd }>;
}

export interface FindingIndex {
  byInstance: ReadonlyMap<string, readonly Finding[]>;
  byLink: ReadonlyMap<string, readonly Finding[]>;
  errors: number;
  warnings: number;
}

const documents = new WeakMap<SystemDocument, DocumentIndex>();
const findingSets = new WeakMap<readonly Finding[], FindingIndex>();
const NONE: readonly Finding[] = [];

export function documentIndex(document: SystemDocument): DocumentIndex {
  let index = documents.get(document);
  if (!index) {
    index = {
      instances: new Map(document.instances.map((instance) => [instance.id, instance])),
      links: new Map(document.links.map((link) => [link.id, link])),
      harnesses: new Map((document.harnesses ?? []).map((harness) => [harness.id, harness])),
      ends: new Map((document.harnesses ?? []).flatMap((harness) => harness.ends.map((end) => [end.id, { harness, end }] as const))),
    };
    documents.set(document, index);
  }
  return index;
}

export function findingIndex(findings: readonly Finding[]): FindingIndex {
  let index = findingSets.get(findings);
  if (!index) {
    const byInstance = new Map<string, Finding[]>();
    const byLink = new Map<string, Finding[]>();
    let errors = 0;
    let warnings = 0;
    for (const finding of findings) {
      if (finding.instanceId) (byInstance.get(finding.instanceId) ?? byInstance.set(finding.instanceId, []).get(finding.instanceId)!).push(finding);
      if (finding.linkId) (byLink.get(finding.linkId) ?? byLink.set(finding.linkId, []).get(finding.linkId)!).push(finding);
      if (finding.severity === "error") errors += 1;
      else if (finding.severity === "warning") warnings += 1;
    }
    index = { byInstance, byLink, errors, warnings };
    findingSets.set(findings, index);
  }
  return index;
}

export const instanceFindings = (findings: readonly Finding[], instanceId: string) =>
  findingIndex(findings).byInstance.get(instanceId) ?? NONE;

export const linkFindings = (findings: readonly Finding[], linkId: string) =>
  findingIndex(findings).byLink.get(linkId) ?? NONE;
