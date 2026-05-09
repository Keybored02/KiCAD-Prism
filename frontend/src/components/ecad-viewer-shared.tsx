import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { X, Check, X as XIcon, ChevronRight } from "lucide-react";
import type { ECadViewerElement } from "@/types/ecad-viewer";

// ---------------------------------------------------------------------------
// Hide built-in info panels
// ---------------------------------------------------------------------------
//
// ecad-viewer renders <kc-board-properties-panel> / <kc-schematic-properties-panel>
// as absolutely-positioned children inside its shadow DOM. We hide them via
// CSS injected into every shadow root we can reach so our React panel takes over.

const HIDE_CSS = `
    kc-board-properties-panel,
    kc-schematic-properties-panel {
        display: none !important;
    }
`;

function injectHideStyles(host: HTMLElement) {
    const seen = new WeakSet<ShadowRoot>();
    const walk = (root: HTMLElement) => {
        const sr = root.shadowRoot;
        if (sr && !seen.has(sr)) {
            seen.add(sr);
            const sheet = new CSSStyleSheet();
            sheet.replaceSync(HIDE_CSS);
            try {
                sr.adoptedStyleSheets = [...sr.adoptedStyleSheets, sheet];
            } catch {
                const style = document.createElement("style");
                style.textContent = HIDE_CSS;
                sr.appendChild(style);
            }
            for (const el of sr.querySelectorAll("*")) {
                if ((el as HTMLElement).shadowRoot) walk(el as HTMLElement);
            }
        }
    };
    walk(host);
}

// ---------------------------------------------------------------------------
// Extract user-friendly properties from a selected item
// ---------------------------------------------------------------------------

export interface ItemDetail {
    title: string;
    subtitle?: string;
    fields: { label: string; value: string }[];
    /** Nested key/value groups rendered as collapsible dropdowns. */
    groups?: { label: string; entries: { label: string; value: string }[] }[];
}

type Anyish = Record<string, unknown> & {
    typeId?: string;
    constructor?: { name?: string };
};

function fmt(n: unknown, digits = 3): string {
    if (typeof n !== "number" || !isFinite(n)) return String(n ?? "–");
    return n.toFixed(digits).replace(/\.?0+$/, "");
}

function getAt(item: Anyish): { x?: number; y?: number; rot?: number } {
    const at = item.at as Anyish | undefined;
    if (!at) return {};
    const pos = at.position as Anyish | undefined;
    return {
        x: typeof at.x === "number" ? (at.x as number) : pos ? (pos.x as number) : undefined,
        y: typeof at.y === "number" ? (at.y as number) : pos ? (pos.y as number) : undefined,
        rot: typeof at.rotation === "number" ? (at.rotation as number) : undefined,
    };
}

export function extractItemDetail(rawItem: unknown): ItemDetail | null {
    if (!rawItem || typeof rawItem !== "object") return null;
    const item = rawItem as Anyish;
    const typeId = item.typeId || item.constructor?.name || "";

    if (typeof window !== "undefined") {
        // Dev aid — inspect this in DevTools to see what's actually on the item.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).__lastEcadSelection = item;
        console.debug("[ecad-info-panel] selection", typeId, item);
    }

    const at = getAt(item);
    const posStr =
        at.x !== undefined && at.y !== undefined
            ? `${fmt(at.x)}, ${fmt(at.y)}${at.rot ? ` @ ${fmt(at.rot, 1)}°` : ""}`
            : undefined;

    // Always walk every readable field. We curate which ones to surface (and in what
    // order) below; nothing is hard-coded by typeId.
    const all = collectAllFields(item);
    if (posStr && !all.has("at") && !all.has("position")) all.set("position", posStr);

    // Extract dict-like sub-objects as collapsible groups.
    const groups = collectGroups(item);

    // Pick a title/subtitle from whatever the item exposes (captured before we
    // move standard props into the dropdown).
    const refRaw = all.get("reference");
    const numRaw = all.get("number");
    const textRaw = all.get("text");
    const nameRaw = all.get("name");
    const netNameRaw = all.get("net_name");
    const valRaw = all.get("value");

    let title = refRaw ?? numRaw ?? textRaw ?? nameRaw ?? netNameRaw ?? typeId ?? "Item";
    if (numRaw && !refRaw) title = `Pad ${numRaw}`;
    const subtitle = refRaw ? valRaw : (netNameRaw && nameRaw ? netNameRaw : undefined);

    // Footprint: only show a fixed set of fields at top level; everything else
    // (including KiCad-8 standard props) is rolled into a single "Properties" dropdown.
    const isFootprint = item.pads != null || item.library_link != null
        || typeId === "Footprint" || typeId === "KCFootprint";

    // Line/trace: has start+end. Show everything but hide the raw endpoint coords —
    // they're noisy and the diff overlay already conveys position visually.
    const isLine = item.start != null && item.end != null;

    // Pad: has a `number` field and a parent footprint reference.
    const isPad = item.number != null && (item.shape != null || item.pintype != null || typeId === "Pad");

    // KiCad properties (Reference, Value, Footprint, Datasheet, …) from
    // `properties` / `properties_kicad_8` — merged and deduped by label.
    const propsGroup = groups.find(g => g.label === "Properties");
    if (propsGroup) groups.splice(groups.indexOf(propsGroup), 1);
    const propsEntries = propsGroup?.entries ?? [];

    let rawFields: { label: string; value: string }[];
    if (isFootprint) {
        rawFields = [
            ...pickFields(all, FOOTPRINT_TOP_FIELDS),
            ...curateFields(all),
            ...propsEntries,
        ];
    } else if (isPad) {
        if (!all.has("layer")) {
            const parent = item.parent as Anyish | undefined;
            const flat = flattenValue(parent?.layer);
            if (flat) all.set("layer", flat);
        }
        rawFields = [...pickFields(all, PAD_TOP_FIELDS), ...curateFields(all), ...propsEntries];
    } else {
        if (isLine) { all.delete("start"); all.delete("end"); }
        rawFields = [...curateFields(all), ...propsEntries];
    }

    // Deduplicate: keep first occurrence of each label (case-insensitive).
    // Also skip rows whose label+value exactly matches a prior row.
    const seenLabel = new Set<string>();
    const fields = rawFields.filter(f => {
        const key = f.label.toLowerCase();
        if (seenLabel.has(key)) return false;
        seenLabel.add(key);
        return true;
    });

    return {
        title: String(title),
        subtitle: subtitle ? String(subtitle) : undefined,
        fields,
        groups: groups.length > 0 ? groups : undefined,
    };
}

// Footprint top-level fields, in display order.
// [item-key, displayLabel]
const FOOTPRINT_TOP_FIELDS: [string, string][] = [
    ["reference", "Reference"],
    ["value",     "Value"],
    ["layer",     "Layer"],
    ["footprint", "Footprint"],
    ["locked",    "Locked"],
];

const PAD_TOP_FIELDS: [string, string][] = [
    ["number", "Number"],
    ["layer",  "Layer"],
    ["net",    "Net"],
    ["size",   "Size"],
    ["drill",  "Drill"],
];


function pickFields(all: Map<string, string>, spec: [string, string][]): ItemDetail["fields"] {
    const out: ItemDetail["fields"] = [];
    for (const [key, label] of spec) {
        const v = all.get(key);
        if (v) {
            out.push({ label, value: v });
            all.delete(key);
        }
    }
    return out;
}


// Flatten a KiCad property entry {name, value, shown_text?, text?} to a display string.
// Tries .value first; if empty falls back to .shown_text / .text getters (KiCad 8 Qn objects).
function flattenPropValue(v: Anyish): string | null {
    // Try .value first (most common path).
    const fromValue = flattenValue(v?.value);
    if (fromValue) return fromValue;
    // KiCad 8 Qn: shown_text is a getter that calls fr(this.value, this.parent)
    // and may return a non-empty string even when .value itself is "".
    try {
        const shown = (v as Record<string, unknown>)?.shown_text;
        if (typeof shown === "string" && shown.trim()) return shown.trim().slice(0, 80);
    } catch { /* getter may throw */ }
    try {
        const text = (v as Record<string, unknown>)?.text;
        if (typeof text === "string" && text.trim()) return text.trim().slice(0, 80);
    } catch { /* getter may throw */ }
    return null;
}

// Pull dict-like objects off the item. Both KiCad 7 (`properties` dict/Map)
// and KiCad 8 (`properties_kicad_8` array of {name,value}) are collected and
// merged into a single "Properties" group, then promoted inline into fields.
const GROUP_KEYS = ["properties", "properties_kicad_8"];

function collectGroups(item: Anyish): NonNullable<ItemDetail["groups"]> {
    // Merge all GROUP_KEYS into one "Properties" group so KiCad 7 and KiCad 8
    // sources appear as a single flat list.
    const merged: { label: string; value: string }[] = [];

    for (const key of GROUP_KEYS) {
        const raw = item[key];
        if (!raw || typeof raw !== "object") continue;

        if (raw instanceof Map) {
            for (const [, v] of raw as Map<unknown, unknown>) {
                const label = (v as Anyish)?.name as string | undefined;
                const flat = flattenPropValue(v as Anyish);
                if (label && flat) merged.push({ label, value: flat });
            }
        } else if (Array.isArray(raw)) {
            for (const v of raw) {
                const label = (v as Anyish)?.name as string | undefined;
                const flat = flattenPropValue(v as Anyish);
                if (label && flat) merged.push({ label, value: flat });
            }
        } else {
            for (const k of Object.keys(raw as object)) {
                const entry = (raw as Record<string, unknown>)[k];
                // If the entry is an object with a .value field (e.g. Qn in properties map),
                // read its value; otherwise flatten directly.
                const rawVal = entry && typeof entry === "object" && "value" in (entry as object)
                    ? (entry as Anyish).value
                    : entry;
                const flat = flattenPropValue({ value: rawVal } as Anyish) ?? flattenValue(rawVal);
                if (flat) merged.push({ label: k, value: flat });
            }
        }
    }

    return merged.length > 0 ? [{ label: "Properties", entries: merged }] : [];
}

// ---------------------------------------------------------------------------
// Field curation
// ---------------------------------------------------------------------------
//
// PRIORITY_KEYS lists keys we consider "important" — they're shown first,
// in this order. Anything else readable is shown after, alphabetised. Edit
// this list to tune what surfaces at the top.

const PRIORITY_KEYS: string[] = [
    // identity
    "reference", "value", "number", "text", "name", "net_name",
    "lib_id", "library_link", "footprint",
    // location
    "layer", "layers", "position", "rotation",
    // electrical
    "net", "pintype", "pinfunction", "type", "shape",
    // geometry
    "start", "end", "width", "size", "drill", "routed_length",
    "min_thickness", "priority", "fill",
    // descriptive
    "descr", "tags",
];

const HIDDEN_KEYS = new Set([
    "typeId", "parent", "children", "items", "tokens", "nodes",
    "uuid", "tstamp", "constructor", "shadowRoot",
    "renderer", "viewer", "viewport", "bbox", "attr", "properties",
    "properties_kicad_8",
    "clearance", "solder_paste_margin", "solder_paste_ratio", "zone_connect",
    // footprint internals — too noisy for the panel
]);

function curateFields(all: Map<string, string>): ItemDetail["fields"] {
    const out: ItemDetail["fields"] = [];
    const consumed = new Set<string>();
    for (const k of PRIORITY_KEYS) {
        if (all.has(k) && !consumed.has(k)) {
            out.push({ label: prettyLabel(k), value: all.get(k)! });
            consumed.add(k);
        }
    }
    const rest = [...all.keys()]
        .filter(k => !consumed.has(k) && !HIDDEN_KEYS.has(k))
        .sort();
    for (const k of rest) {
        out.push({ label: prettyLabel(k), value: all.get(k)! });
    }
    return out;
}

function prettyLabel(k: string): string {
    return k.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

function collectAllFields(item: Anyish): Map<string, string> {
    const seen = new Map<string, string>();
    const visit = (obj: unknown) => {
        if (!obj || typeof obj !== "object") return;
        for (const k of Object.keys(obj as object)) {
            if (HIDDEN_KEYS.has(k) || k.startsWith("#") || k.startsWith("_")) continue;
            if (seen.has(k)) continue;
            const v = (obj as Record<string, unknown>)[k];
            if (typeof v === "function") continue;
            const flat = flattenValue(v);
            if (flat) seen.set(k, flat);
        }
    };
    visit(item);
    let proto: object | null = Object.getPrototypeOf(item);
    let hops = 0;
    while (proto && hops < 4 && proto !== Object.prototype) {
        for (const k of Object.getOwnPropertyNames(proto)) {
            if (k === "constructor" || HIDDEN_KEYS.has(k) || k.startsWith("#") || k.startsWith("_")) continue;
            if (seen.has(k)) continue;
            const desc = Object.getOwnPropertyDescriptor(proto, k);
            if (!desc?.get) continue;
            try {
                const v = (item as Record<string, unknown>)[k];
                if (typeof v === "function") continue;
                const flat = flattenValue(v);
                if (flat) seen.set(k, flat);
            } catch { /* getter threw, ignore */ }
        }
        proto = Object.getPrototypeOf(proto);
        hops++;
    }
    return seen;
}

export const BOOL_TRUE = "bool:true";
export const BOOL_FALSE = "bool:false";

function flattenValue(v: unknown, depth = 0): string | null {
    if (v == null) return null;
    if (typeof v === "boolean") return v ? BOOL_TRUE : BOOL_FALSE;
    if (typeof v === "string") {
        const trimmed = v.trim();
        if (trimmed === "") return null;
        const s = trimmed.toLowerCase();
        if (s === "true" || s === "yes")  return BOOL_TRUE;
        if (s === "false" || s === "no") return BOOL_FALSE;
        return trimmed.length > 80 ? trimmed.slice(0, 77) + "…" : trimmed;
    }
    if (typeof v === "number") return fmt(v);
    if (Array.isArray(v)) {
        if (v.length === 0) return null;
        if (depth > 0) return `[${v.length}]`;
        const parts = v.map(x => flattenValue(x, depth + 1)).filter(Boolean);
        if (parts.length === 0) return `[${v.length}]`;
        return parts.slice(0, 4).join(", ") + (parts.length > 4 ? " …" : "");
    }
    if (typeof v === "object") {
        if (depth > 1) return null;
        const o = v as Record<string, unknown>;
        // Common shapes: {x,y}, {position:{x,y}}, {name}, {diameter}
        if ("name" in o && typeof o.name === "string") return o.name;
        if ("x" in o && "y" in o) return `${fmt(o.x as number)}, ${fmt(o.y as number)}`;
        if ("position" in o) return flattenValue(o.position, depth + 1);
        if ("diameter" in o) return `${fmt(o.diameter as number)} mm`;
        return null;
    }
    return null;
}

// ---------------------------------------------------------------------------
// React panel + select-listening hook
// ---------------------------------------------------------------------------

interface UseEcadInfoPanelOpts {
    /** The container that wraps the ecad-viewer; events bubble through it. */
    containerRef: React.RefObject<HTMLElement | null>;
    /** Refs to viewer hosts whose shadow DOM should have the built-in panel hidden. */
    viewerRefs: React.RefObject<ECadViewerElement | null>[];
}

export function useEcadInfoPanel({ containerRef, viewerRefs }: UseEcadInfoPanelOpts) {
    const [detail, setDetail] = useState<ItemDetail | null>(null);

    // Inject hide-css repeatedly (shadow DOM may not exist yet on mount).
    useEffect(() => {
        let cancelled = false;
        const tryInject = () => {
            for (const r of viewerRefs) {
                if (r.current) injectHideStyles(r.current as unknown as HTMLElement);
            }
        };
        tryInject();
        const id = window.setInterval(() => {
            if (cancelled) return;
            tryInject();
        }, 500);
        const stop = window.setTimeout(() => {
            window.clearInterval(id);
        }, 8000);
        return () => {
            cancelled = true;
            window.clearInterval(id);
            window.clearTimeout(stop);
        };
    }, [viewerRefs]);

    // Listen for selection events. Attach to both the container and each viewer
    // element directly so it works even when containerRef.current is null on
    // first mount (e.g. the visualizer's lazy-loaded tab).
    useEffect(() => {
        const handler = (e: Event) => {
            const item = (e as CustomEvent<{ item: unknown }>).detail?.item;
            if (!item) { setDetail(null); return; }
            setDetail(extractItemDetail(item));
        };
        const targets = [
            containerRef.current,
            ...viewerRefs.map(r => r.current as HTMLElement | null),
        ].filter(Boolean) as HTMLElement[];
        for (const t of targets) t.addEventListener("kicanvas:select", handler);
        return () => { for (const t of targets) t.removeEventListener("kicanvas:select", handler); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [containerRef, ...viewerRefs.map(r => r.current)]);

    return { detail, clear: () => setDetail(null) };
}

function renderFieldValue(value: string) {
    if (value === BOOL_TRUE)  return <Check className="inline h-3 w-3 text-green-500" />;
    if (value === BOOL_FALSE) return <XIcon className="inline h-3 w-3 text-red-500" />;
    if (/^https?:\/\/\S+/.test(value) || /^www\.\S+\.\S+/.test(value)) {
        const href = value.startsWith("http") ? value : `https://${value}`;
        return (
            <a href={href} target="_blank" rel="noopener noreferrer"
                className="text-primary underline underline-offset-2 hover:opacity-80 break-all"
                onClick={e => e.stopPropagation()}
            >
                {value}
            </a>
        );
    }
    return value;
}

interface EcadInfoPanelProps {
    detail: ItemDetail | null;
    onClose: () => void;
    /** Where to anchor the panel inside the viewer container. Default: top-right. */
    position?: "top-right" | "top-left" | "bottom-right" | "bottom-left";
}

const POSITION_CLASSES: Record<NonNullable<EcadInfoPanelProps["position"]>, string> = {
    "top-right":    "top-3 right-3",
    "top-left":     "top-3 left-3",
    "bottom-right": "bottom-3 right-3",
    "bottom-left":  "bottom-3 left-3",
};

function FieldRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="py-1 border-b border-border/40 last:border-b-0">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground/80 leading-tight">
                {label}
            </div>
            <div className="font-mono text-[11px] break-all leading-snug">
                {renderFieldValue(value)}
            </div>
        </div>
    );
}

export function EcadInfoPanel({ detail, onClose, position = "top-right" }: EcadInfoPanelProps) {
    const wasOpen = useRef(false);
    useEffect(() => { wasOpen.current = !!detail; }, [detail]);
    if (!detail) return null;
    return (
        <div className={`absolute ${POSITION_CLASSES[position]} z-30 w-80 max-w-[calc(100%-1.5rem)] max-h-[70%] flex flex-col rounded-xl border bg-background/90 shadow-xl backdrop-blur-md overflow-hidden`}>
            <div className="flex items-center gap-2 px-3 py-2.5 border-b bg-muted/30 shrink-0">
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate leading-tight">{detail.title}</p>
                    {detail.subtitle && (
                        <p className="text-xs text-muted-foreground truncate">{detail.subtitle}</p>
                    )}
                </div>
                <button
                    onClick={onClose}
                    className="shrink-0 rounded p-1 text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                >
                    <X className="h-3.5 w-3.5" />
                </button>
            </div>
            <div className="overflow-y-auto px-3 py-1.5 text-xs">
                {detail.fields.length === 0 && !detail.groups?.length ? (
                    <p className="text-muted-foreground italic py-1">No additional properties</p>
                ) : (
                    <>
                        {detail.fields.map((f, i) => (
                            <FieldRow key={i} label={f.label} value={f.value} />
                        ))}
                        {detail.groups?.map((g, gi) => (
                            <details key={`g${gi}`} className="group rounded border bg-muted/20 mt-2 overflow-hidden">
                                <summary className="flex items-center gap-1 px-2 py-1.5 cursor-pointer select-none text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground">
                                    <ChevronRight className="h-3 w-3 transition-transform group-open:rotate-90" />
                                    <span>{g.label}</span>
                                    <span className="ml-auto font-mono">{g.entries.length}</span>
                                </summary>
                                <div className="px-2 pb-1.5">
                                    {g.entries.map((e, ei) => (
                                        <FieldRow key={ei} label={e.label} value={e.value} />
                                    ))}
                                </div>
                            </details>
                        ))}
                    </>
                )}
            </div>
        </div>
    );
}

// ---------------------------------------------------------------------------
// EcadViewerHost — unified ecad-viewer mounter
// ---------------------------------------------------------------------------
//
// Single source of truth for embedding <ecad-viewer> with a list of files.
// Used by the diff viewers (sch + pcb) and the standard project visualizer.
// Supports both ref-object and callback styles for capturing the viewer node.

export interface EcadViewerFile {
    filename: string;
    content: string;
}

export interface EcadViewerHostProps {
    /** Re-creates the underlying <ecad-viewer> element when this changes. */
    viewerKey: string;
    files: EcadViewerFile[];
    /** Ref-object form. Either this OR onViewer (or both) may be provided. */
    viewerRef?: React.RefObject<ECadViewerElement | null>;
    /** Callback form. Fires with the live node and with null on detach. */
    onViewer?: (node: ECadViewerElement | null) => void;
    showHeader?: boolean;
    headerSections?: string;
}

export function EcadViewerHost({
    viewerKey,
    files,
    viewerRef,
    onViewer,
    showHeader = false,
    headerSections,
}: EcadViewerHostProps) {
    const hostRef = useRef<ECadViewerElement | null>(null);

    const attach = useCallback((node: ECadViewerElement | null) => {
        hostRef.current = node;
        if (viewerRef) {
            (viewerRef as React.MutableRefObject<ECadViewerElement | null>).current = node;
        }
        onViewer?.(node);
    }, [viewerRef, onViewer]);

    // Stable signature so we only re-load when files actually change.
    const filesKey = files.map(f => f.filename).join("|");

    useLayoutEffect(() => {
        const viewer = hostRef.current;
        if (!viewer || files.length === 0) return;

        let cancelled = false;
        // Passthrough state that we need available to the outer cleanup.
        let passthroughAttached = false;
        let passthroughHandler: EventListener | null = null;
        let passthroughPollId: number | undefined;

        (async () => {
            await customElements.whenDefined("ecad-blob");
            if (cancelled || !hostRef.current) return;

            const el = hostRef.current;
            el.querySelectorAll("ecad-blob").forEach((b) => b.remove());

            for (const { filename, content } of files) {
                if (cancelled) return;
                const blob = document.createElement("ecad-blob") as HTMLElement & {
                    filename?: string; content?: string;
                };
                blob.filename = filename;
                blob.content = content;
                el.appendChild(blob);
            }

            if (cancelled) return;
            const withLoader = el as ECadViewerElement & { load_src?: () => Promise<void> | void };
            if (typeof withLoader.load_src === "function") {
                await withLoader.load_src();
            }

            // Some selection events are generated inside the viewer's shadow DOM
            // and may not cross the shadow boundary. Add a best-effort
            // passthrough that listens inside the shadow root and re-dispatches
            // the event on the host element with `composed: true` so outer
            // listeners (like useEcadInfoPanel) reliably receive it.
            const tryAttachPassthrough = (): boolean => {
                const sr = (el as HTMLElement).shadowRoot as ShadowRoot | null;
                if (!sr) return false;
                passthroughHandler = (e: Event) => {
                    try {
                        const detail = (e as CustomEvent)?.detail;
                        const rebroadcast = new CustomEvent("kicanvas:select", { detail, bubbles: true, composed: true });
                        el.dispatchEvent(rebroadcast);
                    } catch {
                        // best-effort; ignore
                    }
                };
                sr.addEventListener("kicanvas:select", passthroughHandler as EventListener);
                passthroughAttached = true;
                return true;
            };

            // Try immediately, then poll briefly in case viewer internals attach later.
            if (!tryAttachPassthrough()) {
                passthroughPollId = window.setInterval(() => {
                    if (passthroughAttached) return;
                    tryAttachPassthrough();
                }, 250);
                // Stop polling after a short timeout.
                window.setTimeout(() => { if (passthroughPollId) { window.clearInterval(passthroughPollId); passthroughPollId = undefined; } }, 5000);
            }
        })();

        return () => {
            cancelled = true;
            try {
                if (passthroughPollId) {
                    window.clearInterval(passthroughPollId);
                    passthroughPollId = undefined;
                }
                const el = hostRef.current;
                if (el && passthroughAttached && passthroughHandler) {
                    const sr = (el as HTMLElement).shadowRoot as ShadowRoot | null;
                    if (sr) sr.removeEventListener("kicanvas:select", passthroughHandler as EventListener);
                }
            } catch { /* swallow cleanup errors */ }
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [viewerKey, filesKey]);

    const props: Record<string, string> = { "show-header": showHeader ? "true" : "false" };
    if (headerSections) props["header-sections"] = headerSections;

    return (
        <ecad-viewer
            ref={attach}
            style={{ width: "100%", height: "100%" }}
            key={viewerKey}
            {...props}
        />
    );
}

// ---------------------------------------------------------------------------
// useBoardClickFix — PCB-only patches for reliable selection
// ---------------------------------------------------------------------------
//
// Two issues with kicanvas/ecad-viewer's BoardViewer hit-testing:
//   1. `find_items_under_pos` early-returns nothing when its layer-visibility
//      map is empty. The map is sourced from a Layers panel widget that may
//      not be rendered to the DOM yet when our viewer mounts — so all pads
//      fail the visibility check and the click falls through to the footprint.
//   2. When a wire ends on a pad, the wire's hit comes before the pad's in
//      the result list, so `r[0]` selects the wire instead of the pad.
//
// This hook polls the viewer until it's ready, populates a fallback
// visibility map, and monkey-patches `find_items_under_pos` to bubble pads
// to the front (and lines to the back).
//
// Schematic viewers do not need this; only call from PCB sites.

type LayerLike = { name: string; visible: boolean };
type LayerSet  = { in_ui_order?: () => Iterable<LayerLike> };
type InteractiveItem = {
    bbox?: unknown;
    line?: unknown;
    item?: unknown;
};
type InnerBoardViewer = {
    viewport?: unknown;
    layers?: LayerSet;
    /**
     * NOTE: kicanvas exposes this as a SETTER ONLY (no public getter). Reading
     * it always returns undefined; the underlying `#r` field is private. Use
     * `layer_visibility` (getter, returns the Map or null) to detect whether
     * a real ctrl has been installed by the Layers panel.
     */
    layer_visibility_ctrl?: { visibilities?: Map<string, boolean>; clear_highlight?: () => void } | null;
    layer_visibility?: Map<string, boolean> | null;
    find_items_under_pos?: (p: { x: number; y: number }) => InteractiveItem[];
    __padPriorityPatched?: boolean;
    __stubCtrlInstalled?: boolean;
};
type BoardEl = HTMLElement & { viewer?: InnerBoardViewer };

/** Walk the shadow DOM to find the live BoardViewer element. */
export function findBoardEl(host: ECadViewerElement | null): BoardEl | null {
    if (!host?.shadowRoot) return null;
    const walk = (root: ShadowRoot | Element): BoardEl | null => {
        const sr = (root as HTMLElement).shadowRoot;
        const searchRoot = sr ?? root;
        const el = (searchRoot as ShadowRoot).querySelector?.("kc-board-viewer") as BoardEl | null;
        if (el?.viewer) return el;
        for (const child of (searchRoot as ShadowRoot).querySelectorAll?.("*") ?? []) {
            if ((child as HTMLElement).shadowRoot) {
                const f = walk(child as HTMLElement);
                if (f) return f;
            }
        }
        return el ?? null;
    };
    return walk(host);
}

interface UseBoardClickFixOpts {
    /** Refs to the PCB viewer hosts that should be patched. */
    viewerRefs: React.RefObject<ECadViewerElement | null>[];
    /** Set this to a value that changes when the viewer reloads (e.g. data). */
    rebindKey?: unknown;
}

export function useBoardClickFix({ viewerRefs, rebindKey }: UseBoardClickFixOpts) {
    useEffect(() => {
        let stopped = false;

        const ensureFor = (host: ECadViewerElement | null): boolean => {
            if (!host) return false;
            const inner = findBoardEl(host)?.viewer;
            if (!inner) return false;
            const layers = inner.layers?.in_ui_order ? Array.from(inner.layers.in_ui_order()) : [];
            if (layers.length === 0) return false;

            // (1) Ensure the layer_visibility map exists.
            //
            // The ctrl is private (`#r`, setter only). We can't read it directly,
            // but we CAN read its visibilities map via the public getter
            // `inner.layer_visibility`. If that returns a non-empty Map, the
            // real Layers panel ctrl is installed — leave it alone.
            //
            // If it's null/empty, we install a stub. The stub MUST include a
            // no-op `clear_highlight` because kicanvas's `highlight_net()` calls
            // `this.#r.clear_highlight()` before painting (double-click net
            // highlight would otherwise throw and silently fail).
            const visMap = inner.layer_visibility;
            const ctrlMissing = !visMap || visMap.size === 0;
            if (ctrlMissing && !inner.__stubCtrlInstalled) {
                const fresh = new Map<string, boolean>();
                for (const l of layers) fresh.set(l.name, l.visible !== false);
                inner.layer_visibility_ctrl = {
                    visibilities: fresh,
                    clear_highlight: () => { /* no-op — real Layers panel handles this when present */ },
                };
                inner.__stubCtrlInstalled = true;
            }

            // (2) Bubble pads to the front of pick results.
            if (!inner.__padPriorityPatched && typeof inner.find_items_under_pos === "function") {
                const orig = inner.find_items_under_pos.bind(inner);
                inner.find_items_under_pos = (p) => {
                    const out = orig(p) as InteractiveItem[];
                    if (!out || out.length < 2) return out;
                    return [...out].sort((a, b) => priority(a) - priority(b));
                };
                inner.__padPriorityPatched = true;
            }
            return true;
        };

        const priority = (it: InteractiveItem): number => {
            if ((it as { line?: unknown }).line !== undefined) return 2;
            const inner = (it as { item?: { number?: unknown; reference?: unknown } }).item;
            if (inner && inner.number != null && inner.reference == null) return 0;
            return 1;
        };

        const tick = () => {
            if (stopped) return;
            const allOk = viewerRefs.every(r => ensureFor(r.current));
            if (!allOk) window.setTimeout(tick, 250);
        };
        tick();

        return () => { stopped = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [rebindKey]);
}
