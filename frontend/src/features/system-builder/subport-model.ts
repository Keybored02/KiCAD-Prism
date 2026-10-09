import type { LinkEnd, Subport, SystemDocument, SystemInstance } from "@/types/system";

/**
 * Sub-ports (CONTRACTS_P2 §22): `J6.PWR` = some pads of J6; the pads left over stay on J6.
 * The diagram and layout key each end by a composite of the connector's `portKey` and the
 * sub-port's ID, so a split connector draws as one port per sub-port plus its remainder.
 */
const SEPARATOR = "#";

export function endKey(portKey: string, subportId?: string | null): string {
  return subportId ? `${portKey}${SEPARATOR}${subportId}` : portKey;
}

export function splitEndKey(key: string): { portKey: string; subportId: string | null } {
  const at = key.lastIndexOf(`${SEPARATOR}spt_`);
  return at < 0 ? { portKey: key, subportId: null } : { portKey: key.slice(0, at), subportId: key.slice(at + 1) };
}

export function subportLabel(reference: string, name: string | null | undefined): string {
  return name ? `${reference}.${name}` : reference;
}

/** The sub-ports carved out of `portKey` on `instance`, by name. */
export function subportsOf(instance: SystemInstance | undefined, portKey: string | null | undefined): Subport[] {
  if (!instance?.subports || !portKey) return [];
  return instance.subports.filter((sub) => sub.portKey === portKey)
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** The pads an end may use: its sub-port's, or for the remainder every pad no sub-port holds. */
export function endPads(pads: readonly string[], subports: readonly Subport[], subportId: string | null | undefined): Set<string> {
  if (subportId) {
    return new Set(subports.find((sub) => sub.id === subportId)?.pads ?? []);
  }
  const taken = new Set(subports.flatMap((sub) => sub.pads ?? []));
  return new Set(pads.filter((pad) => !taken.has(pad)));
}

/** A link end's connector as the ICD names it: `J6.PWR`, or `J6` for a whole connector or its remainder. */
export function endReference(end: Pick<LinkEnd, "port" | "subport">): string | null {
  return end.port ? subportLabel(end.port.reference, end.subport?.name) : null;
}

/** The pads `end` of a link may use, or null when the connector is not split. */
export function linkEndPads(document: SystemDocument, end: LinkEnd, pads: readonly string[]): Set<string> | null {
  const instance = document.instances.find((candidate) => candidate.id === end.instanceId);
  const subports = subportsOf(instance, end.port?.portKey);
  return subports.length ? endPads(pads, subports, end.subport?.id) : null;
}
