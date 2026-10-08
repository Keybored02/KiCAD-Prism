/**
 * Pure mapping between the system document and the diagram canvas (D10):
 * one node per board instance, one row per linked port, one edge per link.
 * Placement, row order and wire lanes come from `system-layout.ts`. Kept free
 * of React Flow so it can be tested without a canvas.
 */

import type { LayoutPositions } from "@/lib/systems-api";
import type { HarnessEnd, SystemDocument, SystemHarness, SystemInstance, SystemLink, SystemOccurrence } from "@/types/system";

import { documentIndex } from "./document-index";
import { endKey, endReference, splitEndKey, subportLabel, subportsOf } from "./subport-model";
import {
  BOARD_WIDTH,
  HEADER_HEIGHT,
  ROW_HEIGHT,
  boardHeight,
  layoutSystem,
  routeWires,
  rowKey,
  type LayoutBoardInput,
  type LayoutLinkInput,
  type LayoutRow,
  type Side,
  type Wire,
} from "./system-layout";

export { BOARD_WIDTH as NODE_WIDTH, HEADER_HEIGHT, ROW_HEIGHT };
export type { Side };

export interface DiagramRow {
  /** `null` for link ends whose port cannot be shown (restricted, or gone). */
  portKey: string | null;
  reference: string;
  /** Other ends, as "OBC-1 J14". Empty for an unlinked port. */
  partners: string[];
  linked: boolean;
  /** A linked port that is no longer exposed at the baseline. */
  orphan: boolean;
  /** The export name when this port is published to parent systems (CONTRACTS_P2 §4). */
  exportName?: string;
}

export interface DiagramNodeData extends Record<string, unknown> {
  instance: SystemInstance;
  rows: DiagramRow[];
  /** Unlinked exposed ports not drawn as rows until the board is expanded. */
  hiddenCount: number;
  expanded: boolean;
}

export interface DiagramNode {
  id: string;
  position: { x: number; y: number };
  height: number;
  data: DiagramNodeData;
}

/** One end of a harness as a row on its node (CONTRACTS_P2 §17.2). */
export interface HarnessEndRow {
  endId: string;
  label: string;
  /** The mating block: "Generic · 20 pins", or the catalog part. */
  block: string;
  /** "OBC-1 J14", "restricted", or null while the end mates nothing. */
  partner: string | null;
  wires: number;
}

export interface HarnessNodeData extends Record<string, unknown> {
  harness: SystemHarness;
  rows: HarnessEndRow[];
}

export interface HarnessDiagramNode {
  id: string;
  position: { x: number; y: number };
  height: number;
  data: HarnessNodeData;
}

export interface DiagramEdgeData extends Record<string, unknown> {
  wire: Pick<Wire, "kind" | "lane" | "loopOffset">;
  label: string;
  harness: string | null;
  /** CONTRACTS_P2 §16: mated connectors draw heavier. */
  b2b: boolean;
  /** A harness end's cable from the board port to the harness node (§17); clicking opens the harness. */
  harnessId: string | null;
}

export interface DiagramEdge {
  id: string;
  source: string;
  sourceHandle: string;
  target: string;
  targetHandle: string;
  data: DiagramEdgeData;
}

/** A handle for a link end whose port the board cannot show; its row reads "restricted". */
export const FALLBACK_HANDLE = "__board__";

export function handleId(side: Side, portKey: string | null): string {
  return `${side}:${portKey ?? FALLBACK_HANDLE}`;
}

export function portKeyOf(handle: string | null | undefined): string | null {
  if (!handle || handle.length < 3 || handle[1] !== ":") {
    return null;
  }
  const key = handle.slice(2);
  return key === FALLBACK_HANDLE ? null : key;
}

export function nodeHeight(rowCount: number, hiddenCount: number, expanded = false): number {
  return boardHeight(rowCount + (expanded ? hiddenCount : 0), hiddenCount);
}

/** Ports a board may show: exposed ones, plus any a link still uses. */
function drawablePorts(document: SystemDocument, instance: SystemInstance) {
  if (instance.ports === null) {
    return { ports: [], orphans: new Set<string>() };
  }
  const exposed: { portKey: string; reference: string }[] = [];
  for (const port of instance.ports) {
    if (!port.exposed) continue;
    exposed.push({ portKey: port.portKey, reference: port.reference });
    // A split connector (CONTRACTS_P2 §22): its remainder above, then one port per sub-port.
    for (const sub of subportsOf(instance, port.portKey)) {
      exposed.push({ portKey: endKey(port.portKey, sub.id), reference: subportLabel(port.reference, sub.name) });
    }
  }
  const known = new Set(exposed.map((port) => port.portKey));
  const orphans = new Set<string>();
  for (const link of document.links) {
    for (const end of [link.a, link.b]) {
      const key = end.port ? endKey(end.port.portKey, end.subport?.id) : null;
      if (end.instanceId === instance.id && end.port && key && !known.has(key)) {
        known.add(key);
        orphans.add(key);
        exposed.push({ portKey: key, reference: endReference(end) ?? end.port.reference });
      }
    }
  }
  return { ports: exposed, orphans };
}

function linkEnd(document: SystemDocument, link: SystemLink, end: "a" | "b") {
  const instance = documentIndex(document).instances.get(link[end].instanceId);
  const port = instance?.ports === null ? null : link[end].port;
  return {
    board: link[end].instanceId,
    portKey: port ? endKey(port.portKey, link[end].subport?.id) : null,
    reference: port ? endReference(link[end]) : null,
  };
}

export const endLabel = (end: HarnessEnd) => `End ${end.ordinal + 1}`;

export function endWireCount(harness: SystemHarness, endId: string): number {
  return harness.wires.filter((wire) => wire.from.end === endId || wire.to.end === endId).length;
}

/**
 * Boards, plus each harness as a board whose ports are its ends and whose
 * mated ends are links (§17): the layout places and routes them like boards.
 */
export function layoutInputs(document: SystemDocument): { boards: LayoutBoardInput[]; links: LayoutLinkInput[] } {
  const harnesses = document.harnesses ?? [];
  return {
    boards: [
      ...document.instances.map((instance) => ({
        id: instance.id,
        label: instance.label,
        ports: drawablePorts(document, instance).ports,
      })),
      ...harnesses.map((harness) => ({
        id: harness.id,
        label: harness.name,
        ports: harness.ends.map((end) => ({ portKey: end.id, reference: endLabel(end) })),
      })),
    ],
    links: [
      ...document.links.map((link) => ({
        id: link.id,
        name: link.name,
        a: linkEnd(document, link, "a"),
        b: linkEnd(document, link, "b"),
        rowCount: link.rows.length,
      })),
      ...harnesses.flatMap((harness) => harness.ends.flatMap((end) => {
        const mates = end.mates;
        if (!mates) return [];
        const instance = documentIndex(document).instances.get(mates.instanceId);
        const port = instance?.ports === null ? null : mates.port;
        return [{
          id: end.id,
          name: harness.name,
          a: { board: mates.instanceId, portKey: port?.portKey ?? null, reference: port?.reference ?? null },
          b: { board: harness.id, portKey: end.id, reference: endLabel(end) },
          rowCount: endWireCount(harness, end.id),
        }];
      })),
    ],
  };
}

export function edgeLabel(link: SystemLink): string {
  const ends = [endReference(link.a) ?? "restricted", endReference(link.b) ?? "restricted"].join(" ↔ ");
  const name = link.name || ends;
  return `${name} · ${link.rows.length} ${link.rows.length === 1 ? "pin" : "pins"}`;
}

function partnerText(row: LayoutRow): string[] {
  return row.partners.map((partner) => `${partner.boardLabel} ${partner.reference ?? "restricted"}`);
}

/**
 * Nodes and edges for the canvas. Saved `positions` win; boards without one
 * take the default layout. `expanded` boards also list their unlinked ports.
 */
export function buildDiagram(
  document: SystemDocument,
  positions: LayoutPositions,
  expanded: ReadonlySet<string> = new Set(),
): { nodes: DiagramNode[]; harnesses: HarnessDiagramNode[]; edges: DiagramEdge[] } {
  const inputs = layoutInputs(document);
  const layout = layoutSystem(inputs.boards, inputs.links, positions);
  const nodes = document.instances.map((instance) => {
    const placed = layout.get(instance.id)!;
    const { orphans } = drawablePorts(document, instance);
    const open = expanded.has(instance.id);
    const exported = new Map<string, string>();
    for (const entry of document.exports ?? []) {
      if (entry.instanceId === instance.id && entry.portKey !== null) exported.set(endKey(entry.portKey, entry.subportId), entry.name);
    }
    const rows: DiagramRow[] = placed.rows.map((row) => ({
      portKey: row.portKey,
      reference: row.reference,
      partners: partnerText(row),
      linked: true,
      orphan: row.portKey !== null && orphans.has(row.portKey),
    }));
    // Exported ports are always shown: they are this board's connections to the parent system.
    const hidden = placed.hiddenPorts.filter((port) => !exported.has(port.portKey));
    for (const port of placed.hiddenPorts) {
      if (exported.has(port.portKey)) {
        rows.push({ portKey: port.portKey, reference: port.reference, partners: [], linked: false, orphan: false,
          exportName: exported.get(port.portKey) });
      }
    }
    if (open) {
      for (const port of hidden) {
        rows.push({ portKey: port.portKey, reference: port.reference, partners: [], linked: false, orphan: false });
      }
    }
    return {
      id: instance.id,
      position: { x: placed.x, y: placed.y },
      height: nodeHeight(placed.rows.length + placed.hiddenPorts.length - hidden.length, hidden.length, open),
      data: { instance, rows, hiddenCount: hidden.length, expanded: open },
    };
  });
  const labelsOf = new Map(document.instances.map((instance) => [instance.id, instance.label]));
  const harnessNodes = (document.harnesses ?? []).map((harness) => {
    const placed = layout.get(harness.id)!;
    const byEnd = new Map(harness.ends.map((end) => [end.id, end]));
    const order = [...placed.rows.map((row) => row.portKey), ...placed.hiddenPorts.map((port) => port.portKey)];
    const rows: HarnessEndRow[] = order.flatMap((endId) => {
      const end = endId ? byEnd.get(endId) : undefined;
      if (!end) return [];
      const mates = end.mates;
      const partner = !mates ? null : mates.redacted || !mates.port
        ? "restricted" : `${labelsOf.get(mates.instanceId) ?? "?"} ${mates.port.reference}`;
      return [{ endId: end.id, label: endLabel(end), block: end.part ? "Catalog part" : `Generic · ${end.pinCount} pins`,
        partner, wires: endWireCount(harness, end.id) }];
    });
    return { id: harness.id, position: { x: placed.x, y: placed.y }, height: boardHeight(rows.length + 1, 0), data: { harness, rows } };
  });
  const labels = new Map(document.links.map((link) => [link.id, link]));
  const edges = routeWires(layout, inputs.links).map((wire) => {
    const ofEnd = documentIndex(document).ends.get(wire.linkId);
    if (ofEnd) {
      const { harness, end } = ofEnd;
      const handle = (side: Wire["source"]) => handleId(side.side, side.rowKey === rowKey(null) ? null : side.rowKey);
      const count = endWireCount(harness, end.id);
      return {
        id: end.id, source: wire.source.board, sourceHandle: handle(wire.source),
        target: wire.target.board, targetHandle: handle(wire.target),
        data: { wire: { kind: wire.kind, lane: wire.lane, loopOffset: wire.loopOffset },
          label: `${harness.name} · ${endLabel(end)} · ${count} ${count === 1 ? "wire" : "wires"}`,
          harness: harness.label, b2b: false, harnessId: harness.id },
      };
    }
    const link = labels.get(wire.linkId)!;
    const handle = (end: Wire["source"]) => handleId(end.side, end.rowKey === rowKey(null) ? null : end.rowKey);
    return {
      id: wire.linkId,
      source: wire.source.board,
      sourceHandle: handle(wire.source),
      target: wire.target.board,
      targetHandle: handle(wire.target),
      data: {
        wire: { kind: wire.kind, lane: wire.lane, loopOffset: wire.loopOffset },
        label: edgeLabel(link),
        harness: link.harness,
        b2b: link.type === "b2b",
        harnessId: null,
      },
    };
  });
  return { nodes, harnesses: harnessNodes, edges };
}

export interface ConnectionLike {
  source: string | null;
  sourceHandle?: string | null;
  target: string | null;
  targetHandle?: string | null;
}

/** The link a dragged connection asks for, or why it cannot be one. */
export function connectionToLink(
  connection: ConnectionLike,
): { a: PortEnd; b: PortEnd } | { error: string } {
  const { source, target } = connection;
  const sourceKey = portKeyOf(connection.sourceHandle);
  const targetKey = portKeyOf(connection.targetHandle);
  if (!source || !target || !sourceKey || !targetKey) {
    return { error: "Connect one port to another." };
  }
  const a = splitEndKey(sourceKey);
  const b = splitEndKey(targetKey);
  if (source === target && a.portKey === b.portKey) {
    return { error: "A link needs two different ports." };
  }
  return { a: portEnd(source, a), b: portEnd(target, b) };
}

/** A link end request: the connector, and its sub-port when the handle names one (CONTRACTS_P2 §22.2). */
function portEnd(instanceId: string, key: { portKey: string; subportId: string | null }): PortEnd {
  return key.subportId ? { instanceId, portKey: key.portKey, subportId: key.subportId } : { instanceId, portKey: key.portKey };
}

/** What a subsystem holds, for its in-place contents panel (from `GET …/hierarchy`). */
export interface InsideEntry {
  path: string;
  label: string;
  kind: string;
  depth: number;
  restricted: boolean;
}

/** The occurrences under subsystem instance `instanceId` of the root, in hierarchy order. */
export function subsystemContents(occurrences: SystemOccurrence[], instanceId: string): InsideEntry[] {
  const prefix = `/${instanceId}/`;
  return occurrences.flatMap((o) => (o.path.startsWith(prefix)
    ? [{ path: o.path, label: o.labels[o.labels.length - 1], kind: o.kind, depth: o.depth, restricted: o.restricted }]
    : []));
}

/**
 * The diagram's link mode (CONTRACTS_P2 §16.2): **B** arms the next drawn link
 * as board-to-board, **H** makes it a harness; the same key or Esc disarms.
 */
export type LinkMode = "b2b" | "harness" | null;

export function nextLinkMode(key: string, current: LinkMode, typing: boolean): LinkMode {
  if (typing) return current;
  if (key === "Escape") return null;
  const lower = key.toLowerCase();
  const wanted: LinkMode = lower === "b" ? "b2b" : lower === "h" ? "harness" : null;
  if (!wanted) return current;
  return current === wanted ? null : wanted;
}

/** The handle on a harness node that adds an end when dragged to a port. */
export const ADD_END_HANDLE = "__add_end__";

type PortEnd = { instanceId: string; portKey: string; subportId?: string };

/** What a drawn connection means once harnesses are on the canvas (§17.2). */
export type ConnectionIntent =
  | { kind: "link"; a: PortEnd; b: PortEnd }
  | { kind: "harness"; a: PortEnd; b: PortEnd }
  | { kind: "add_end"; harnessId: string; port: PortEnd }
  | { kind: "mate_end"; harnessId: string; endId: string; port: PortEnd }
  | { kind: "error"; error: string };

export function connectionIntent(connection: ConnectionLike, document: SystemDocument, mode: LinkMode): ConnectionIntent {
  const harnesses = new Map((document.harnesses ?? []).map((harness) => [harness.id, harness]));
  const { source, target } = connection;
  if (!source || !target) return { kind: "error", error: "Connect one port to another." };
  const sourceHarness = harnesses.get(source);
  const targetHarness = harnesses.get(target);
  if (sourceHarness && targetHarness) return { kind: "error", error: "Connect a harness to a board port, not to another harness." };
  if (sourceHarness || targetHarness) {
    const harness = (sourceHarness ?? targetHarness)!;
    const endKey = portKeyOf(sourceHarness ? connection.sourceHandle : connection.targetHandle);
    const boardId = sourceHarness ? target : source;
    const handleKey = portKeyOf(sourceHarness ? connection.targetHandle : connection.sourceHandle);
    if (!handleKey) return { kind: "error", error: "Drag the harness to a board port." };
    // A harness end mates the whole connector, split or not (CONTRACTS_P2 §22.2).
    const port = { instanceId: boardId, portKey: splitEndKey(handleKey).portKey };
    if (endKey === ADD_END_HANDLE) return { kind: "add_end", harnessId: harness.id, port };
    const end = endKey ? documentIndex(document).ends.get(endKey)?.end : undefined;
    if (!end) return { kind: "error", error: "Drag from a harness end." };
    if (end.mates) return { kind: "error", error: `${endLabel(end)} already mates a connector.` };
    return { kind: "mate_end", harnessId: harness.id, endId: end.id, port };
  }
  const request = connectionToLink(connection);
  if ("error" in request) return { kind: "error", error: request.error };
  if (mode === "harness") {
    // Its ends mate whole connectors (CONTRACTS_P2 §22.2).
    const whole = (end: PortEnd) => ({ instanceId: end.instanceId, portKey: end.portKey });
    return { kind: "harness", a: whole(request.a), b: whole(request.b) };
  }
  return { kind: "link", ...request };
}
