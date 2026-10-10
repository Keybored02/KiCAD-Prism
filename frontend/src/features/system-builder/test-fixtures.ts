import type { HarnessEnd, SystemDocument, SystemExport, SystemHarness, SystemInstance, SystemLink, SystemPort } from "@/types/system";

export function port(reference: string, patch: Partial<SystemPort> = {}): SystemPort {
  return {
    portKey: `key-${reference}`, memberKeys: [`key-${reference}`], reference, libId: "Connector:Conn", footprint: null,
    value: "Conn", dnp: false, candidate: true, candidateReason: "refdes", override: null, exposed: true, pinCount: 4,
    ...patch,
  };
}

export function instance(label: string, patch: Partial<SystemInstance> = {}): SystemInstance {
  return {
    id: `sin_${label}`, label, restricted: false, projectId: `prj_${label}`, projectName: label.toLowerCase(),
    baselineCommit: "a".repeat(40), trackedRef: "main", pinned: false, resolution: "resolved",
    tipCommit: "a".repeat(40), tipCheckedAt: "2026-09-29T10:00:00Z", updateAvailable: false,
    interface: { status: "ready", digest: "sha256:x", hasPcb: true, jobId: null, errorCode: null },
    ports: [port("J1"), port("J2")],
    ...patch,
  };
}

export function link(id: string, a: string, aRef: string, b: string, bRef: string, rows = 0): SystemLink {
  const end = (instanceId: string, reference: string) => ({
    instanceId, redacted: false, resolved: true, exposed: true,
    port: { portKey: `key-${reference}`, memberKeys: [`key-${reference}`], reference, libId: null, footprint: null, pinCount: 4 },
  });
  return {
    id, name: id, harness: null, updatedAt: "", a: end(a, aRef), b: end(b, bRef),
    rows: Array.from({ length: rows }, (_, i) => ({
      id: `${id}-r${i}`, pinA: String(i + 1), pinB: String(i + 1), signal: `S${i}`, source: "manual" as const,
      netA: [`/N${i}`], netB: [`/N${i}`], observedA: null, observedB: null, redacted: false, redactedEnds: [],
    })),
  };
}

export function systemDocument(
  instances: SystemInstance[], links: SystemLink[] = [], exports: SystemExport[] = [],
): SystemDocument {
  return {
    system: {
      id: "sys_1", kind: "system", name: "Stack", description: "", folderId: null, version: 1, etag: '"sys:sys_1:1"',
      instanceCount: instances.length, openReviewCount: 0, createdBy: "user:a", createdAt: "", updatedAt: "",
    },
    instances, links, exports, openReviewCount: 0, findingCounts: { error: 0, warning: 1, info: 0, notEvaluated: 0 },
  };
}

export function exportOf(name: string, instanceId: string, reference: string, patch: Partial<SystemExport> = {}): SystemExport {
  return {
    id: `sxp_${name}`, name, description: "", instanceId, portKey: `key-${reference}`,
    port: { portKey: `key-${reference}`, memberKeys: [`key-${reference}`], reference, libId: null, footprint: null, pinCount: 4 },
    childExportId: null, resolved: true, redacted: false, updatedAt: "", ...patch,
  };
}

/** A harness end mating `reference` on `instanceId` (or nothing), with pads `1…pins`. */
export function harnessEnd(id: string, ordinal: number, mates: { instanceId: string; reference: string } | null, pins = 4): HarnessEnd {
  return {
    id, ordinal, part: null, pinCount: pins, pinMap: null, bootMm: null,
    pins: Array.from({ length: pins }, (_, i) => String(i + 1)),
    matePads: mates ? Array.from({ length: pins }, (_, i) => String(i + 1)) : [],
    mates: mates && { instanceId: mates.instanceId, portKey: `key-${mates.reference}`, resolved: true, redacted: false,
      port: { portKey: `key-${mates.reference}`, reference: mates.reference, libId: null, footprint: null, pinCount: pins } },
  };
}

export function harness(id: string, ends: HarnessEnd[], wires: [string, string, string, string][] = [], patch: Partial<SystemHarness> = {}): SystemHarness {
  return {
    id, name: id, label: null, cutLengthMm: null, serviceAllowancePct: null, linkable: false, ends, updatedAt: "",
    wires: wires.map(([fromEnd, fromPin, toEnd, toPin], i) => ({
      id: `${id}-w${i}`, from: { end: fromEnd, pin: fromPin }, to: { end: toEnd, pin: toPin }, signal: `S${i}`,
      gaugeAwg: null, colour: null, label: null, netFrom: [`/N${i}`], netTo: [`/N${i}`], redactedEnds: [],
    })),
    ...patch,
  };
}
