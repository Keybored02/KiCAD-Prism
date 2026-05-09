import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { X, Check, X as XIcon, ChevronRight } from "lucide-react";
import type { ECadViewerElement } from "@/types/ecad-viewer";

// ---------------------------------------------------------------------------
// Theme kicanvas viewer chrome
// ---------------------------------------------------------------------------
//
// ecad-viewer renders <kc-board-properties-panel> / <kc-schematic-properties-panel>
// as absolutely-positioned children inside its shadow DOM. We hide them via
// CSS injected into every shadow root we can reach so our React panel takes over
// and the built-in layer/object menus pick up the project theme.

const VIEWER_BASE_CSS = `
    kc-board-properties-panel,
    kc-schematic-properties-panel {
        display: none !important;
    }

    kc-ui-toggle-menu {
        --button-menu-bg: hsl(var(--background));
        --button-menu-fg: hsl(var(--foreground));
        --button-menu-hover-bg: hsl(var(--accent));
        --button-menu-hover-fg: hsl(var(--accent-foreground));
        --button-menu-disabled-bg: hsl(var(--muted));
        --button-menu-disabled-fg: hsl(var(--muted-foreground));
    }

    kc-ui-dropdown {
        --dropdown-bg: hsl(var(--popover));
        --dropdown-fg: hsl(var(--popover-foreground));
        --dropdown-hover-bg: hsl(var(--accent));
        --dropdown-hover-fg: hsl(var(--accent-foreground));
        --dropdown-active-bg: hsl(var(--accent));
        --dropdown-active-fg: hsl(var(--accent-foreground));
    }

    kc-ui-menu.dropdown {
        --list-item-bg: hsl(var(--popover));
        --list-item-fg: hsl(var(--popover-foreground));
        --list-item-hover-bg: hsl(var(--accent));
        --list-item-hover-fg: hsl(var(--accent-foreground));
        --list-item-active-bg: hsl(var(--accent));
        --list-item-active-fg: hsl(var(--accent-foreground));
        --list-item-disabled-bg: hsl(var(--muted));
        --list-item-disabled-fg: hsl(var(--muted-foreground));
    }
`;

function viewerThemeCssForRoot(rootTag: string): string {
    switch (rootTag) {
        case "ecad-viewer":
            return `
                :host {
                    --panel-bg: hsl(var(--card));
                    --panel-fg: hsl(var(--card-foreground));
                    --panel-title-bg: hsl(var(--background));
                    --panel-title-fg: hsl(var(--foreground));
                    --panel-line: hsl(var(--border));
                    --grid-outline: hsl(var(--border));
                    --list-item-bg: hsl(var(--card));
                    --list-item-fg: hsl(var(--card-foreground));
                    --list-item-hover-bg: hsl(var(--accent));
                    --list-item-hover-fg: hsl(var(--accent-foreground));
                    --list-item-active-bg: hsl(var(--accent));
                    --list-item-active-fg: hsl(var(--accent-foreground));
                    --list-item-disabled-bg: hsl(var(--muted));
                    --list-item-disabled-fg: hsl(var(--muted-foreground));
                    --dropdown-bg: hsl(var(--popover));
                    --dropdown-fg: hsl(var(--popover-foreground));
                    --tab-button-bg: transparent;
                    --tab-button-hover-bg: hsl(var(--muted));
                    --tab-button-selected-bg: hsl(var(--accent));
                    --tab-button-ck-bg: hsl(var(--accent));
                    --tab-button-color: hsl(var(--foreground));
                    --button-menu-bg: hsl(var(--background));
                    --button-menu-fg: hsl(var(--foreground));
                    --button-menu-hover-bg: hsl(var(--accent));
                    --button-menu-hover-fg: hsl(var(--accent-foreground));
                    --button-menu-disabled-bg: hsl(var(--muted));
                    --button-menu-disabled-fg: hsl(var(--muted-foreground));
                }

                tab-header {
                    display: block;
                }

                tab-header .horizontal-bar {
                    display: flex;
                    align-items: flex-end;
                    gap: 0.15rem;
                    padding: 0 0.5rem;
                    border-bottom: 1px solid hsl(var(--border));
                    background: color-mix(in oklab, hsl(var(--background)) 88%, transparent);
                    backdrop-filter: blur(8px);
                }

                tab-header .bar-section {
                    display: flex;
                    align-items: flex-end;
                    gap: 0.15rem;
                }

                tab-button {
                    margin-bottom: -1px;
                }

                tab-button.beginning,
                tab-button.tab {
                    border-top-left-radius: 0.7rem;
                    border-top-right-radius: 0.7rem;
                }

                tab-button.end {
                    margin-left: auto;
                    border-top-left-radius: 0.7rem;
                    border-top-right-radius: 0.7rem;
                }

                tab-button[selected],
                tab-button.active,
                tab-button.checked {
                    --tab-button-selected-bg: hsl(var(--accent));
                }
            `;
        case "kc-ui-toggle-menu":
            return `
                button {
                    border: 1px solid hsl(var(--border));
                    border-radius: 9999px;
                    box-shadow: 0 1px 2px rgba(15, 23, 42, 0.12);
                    padding: 0.4em 0.8em;
                    gap: 0.35em;
                    letter-spacing: 0.01em;
                }

                button:hover {
                    border-color: hsl(var(--ring));
                    transform: translateY(-1px);
                }

                button span {
                    display: inline;
                    font-size: 0.9em;
                    font-weight: 600;
                }

                button kc-ui-icon {
                    font-size: 0.95em;
                    margin-top: 0;
                    margin-bottom: 0;
                }
            `;
        case "kc-ui-dropdown":
            return `
                :host {
                    border: 1px solid hsl(var(--border));
                    border-radius: 0.9rem;
                    box-shadow: 0 18px 40px rgba(15, 23, 42, 0.18);
                    backdrop-filter: blur(12px);
                    overflow: hidden;
                }
            `;
        case "kc-ui-menu":
            return `
                :host(.dropdown) {
                    --list-item-padding: 0.42em 0.72em;
                    max-height: 50vh;
                    overflow-y: auto;
                    border-radius: 0.8rem;
                }

                :host(.outline) ::slotted(kc-ui-menu-item) {
                    border-bottom: 1px solid hsl(var(--border));
                }

                :host(.dropdown) ::slotted(kc-ui-menu-item) {
                    margin: 0.08rem 0.16rem;
                    border-radius: 0.55rem;
                }

                :host(.dropdown) ::slotted(kc-ui-menu-label) {
                    font-size: 0.68rem;
                    font-weight: 700;
                    letter-spacing: 0.14em;
                    text-transform: uppercase;
                }
            `;
        case "kc-ui-menu-item":
            return `
                :host {
                    border-radius: 0.55rem;
                }

                kc-ui-icon {
                    margin-right: 0.5em;
                    margin-left: -0.1em;
                }
            `;
        case "kc-ui-menu-label":
            return `
                :host {
                    width: 100%;
                    display: flex;
                    flex-wrap: nowrap;
                    padding: 0.2em 0.3em;
                    background: hsl(var(--muted));
                    color: hsl(var(--muted-foreground));
                }
            `;
        default:
            return "";
    }
}

const STYLED_ROOTS = new WeakSet<ShadowRoot>();

function injectViewerStyles(host: HTMLElement) {
    const walk = (root: HTMLElement) => {
        const sr = root.shadowRoot;
        if (!sr) return;
        // Always walk children to catch shadow roots that mounted after the last pass.
        // Only inject the stylesheet once per root (tracked by STYLED_ROOTS).
        if (!STYLED_ROOTS.has(sr)) {
            STYLED_ROOTS.add(sr);
            const rootTag = (sr.host as Element)?.tagName?.toLowerCase?.() ?? "";
            const sheet = new CSSStyleSheet();
            sheet.replaceSync(`${VIEWER_BASE_CSS}\n${viewerThemeCssForRoot(rootTag)}`);
            try {
                sr.adoptedStyleSheets = [...sr.adoptedStyleSheets, sheet];
            } catch {
                const style = document.createElement("style");
                style.textContent = `${VIEWER_BASE_CSS}\n${viewerThemeCssForRoot(rootTag)}`;
                sr.appendChild(style);
            }
        }
        // Always recurse so late-mounting children (e.g. kc-board-properties-panel
        // which mounts after the viewer loads) are caught on subsequent poll passes.
        for (const el of sr.querySelectorAll("*")) {
            if ((el as HTMLElement).shadowRoot) walk(el as HTMLElement);
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


export function extractItemDetail(rawItem: unknown): ItemDetail | null {
    if (!rawItem || typeof rawItem !== "object") return null;
    const item = rawItem as Anyish;
    const typeId = (item.typeId ?? item.constructor?.name ?? "") as string;


    // PCB items — matched by typeId (set explicitly by kicanvas board parser).
    switch (typeId) {
        case "Footprint":   return extractFootprint(item);
        case "Pad":         return extractPad(item);
        case "LineSegment": return extractLine(item);
        case "Via":         return extractVia(item);
        case "Zone":        return extractZone(item);
    }

    // Schematic items — kicanvas uses constructor.name (minified class names vary,
    // so we duck-type on the fields that each item type uniquely has).
    if (item.lib_symbol != null || item.lib_id != null || item.in_bom != null)
        return extractSchSymbol(item);
    if (item.sheet_name != null || (item.properties != null && item.pins != null && item.at != null && item.lib_symbol == null))
        return extractSchSheet(item);
    if (item.stroke != null && item.pts != null)
        return extractSchWireOrBus(item, typeId);
    if (item.number != null && item.definition != null)
        return extractSchPin(item);
    if (item.text != null && item.effects != null)
        return extractSchText(item, typeId);

    return extractGeneric(item, typeId);
}

type Field = { label: string; value: string };
type Group = { label: string; entries: Field[] };

function s(v: unknown): string {
    if (v == null) return "";
    if (typeof v === "boolean") return v ? BOOL_TRUE : BOOL_FALSE;
    if (typeof v === "number") return fmt(v);
    return String(v).trim();
}

function field(label: string, v: unknown): Field | null {
    const str = s(v);
    if (str === "") return null;
    return { label, value: str };
}

function fields(...pairs: (Field | null)[]): Field[] {
    return pairs.filter(Boolean) as Field[];
}

function extractFootprint(t: Anyish): ItemDetail {
    const pos  = (t.at as Anyish)?.position as Anyish | undefined;
    const bbox = t.bbox as Anyish | undefined;
    const attr = t.attr as Anyish | undefined;

    const geometryGroup: Group = {
        label: "Geometry",
        entries: fields(
            field("X",           pos?.x != null ? `${fmt(pos.x as number, 4)} mm` : null),
            field("Y",           pos?.y != null ? `${fmt(pos.y as number, 4)} mm` : null),
            field("Height",      bbox?.h != null ? `${fmt(bbox.h as number, 4)} mm` : null),
            field("Width",       bbox?.w != null ? `${fmt(bbox.w as number, 4)} mm` : null),
            field("Orientation", (t.at as Anyish)?.rotation != null ? `${fmt((t.at as Anyish).rotation as number, 1)}°` : null),
        ),
    };

    const fpFields = fields(
        field("Reference",   t.reference),
        field("Value",       t.value),
        field("Type",        attr?.through_hole ? "through hole" : attr?.smd ? "smd" : "unspecified"),
        field("Pads",        Array.isArray(t.pads) ? String((t.pads as unknown[]).length) : null),
        field("Library link",t.library_link),
        field("Description", t.descr),
        field("Keywords",    t.tags),
    );

    // Custom properties — read from t.properties (plain object) and merge with
    // t.properties_kicad_8 (array of {name,value} objects). The KiCad 8 array
    // takes precedence for non-empty values so Datasheet etc. are not lost.
    const customProps = readProperties(t.properties, t.properties_kicad_8);

    const fabFields = fields(
        field("Not in schematic",             boolField(attr?.board_only)),
        field("Exclude from position files",  boolField(attr?.exclude_from_pos_files)),
        field("Exclude from BOM",             boolField(attr?.exclude_from_bom)),
    );

    const overrideFields = fields(
        field("Exempt from courtyard", boolField(attr?.allow_missing_courtyard)),
        field("Clearance",             t.clearance != null ? `${t.clearance} mm` : null),
        field("Solderpaste margin",    t.solder_paste_margin != null ? `${t.solder_paste_margin} mm` : null),
        field("Solderpaste ratio",     t.solder_paste_ratio),
        field("Zone connection",       t.zone_connect ?? "inherited"),
    );

    const groups: Group[] = [];
    if (geometryGroup.entries.length) groups.push(geometryGroup);
    if (customProps.length)    groups.push({ label: "Properties",             entries: customProps });
    if (fabFields.length)      groups.push({ label: "Fabrication attributes", entries: fabFields });
    if (overrideFields.length) groups.push({ label: "Overrides",              entries: overrideFields });

    return {
        title:    String(t.reference ?? "Footprint"),
        subtitle: String(t.value ?? ""),
        fields:   [...fpFields],
        groups:   groups.length > 0 ? groups : undefined,
    };
}

function extractPad(t: Anyish): ItemDetail {
    const bbox = t.bbox as Anyish | undefined;
    const net  = t.net as Anyish | undefined;
    const drill= t.drill as Anyish | undefined;

    return {
        title:  `Pad ${t.number ?? ""}`,
        subtitle: net?.name ? String(net.name) : undefined,
        fields: fields(
            field("X",           bbox?.x != null ? `${fmt(bbox.x as number, 4)} mm` : null),
            field("Y",           bbox?.y != null ? `${fmt(bbox.y as number, 4)} mm` : null),
            field("Height",      bbox?.h != null ? `${fmt(bbox.h as number, 4)} mm` : null),
            field("Width",       bbox?.w != null ? `${fmt(bbox.w as number, 4)} mm` : null),
            field("Orientation", (t.at as Anyish)?.rotation != null ? `${fmt((t.at as Anyish).rotation as number, 1)}°` : null),
            field("Layer",       (t.parent as Anyish)?.layer),
            field("Type",        t.type),
            field("Shape",       t.shape),
            field("Drill",       drill?.diameter != null ? `${fmt(drill.diameter as number, 4)} mm` : null),
            field("Net",         net?.name),
            field("PinNum",      t.number),
            field("PinType",     t.pintype),
            field("PinFunction", t.pinfunction),
        ),
    };
}

function extractLine(t: Anyish): ItemDetail {
    const start = t.start as Anyish | undefined;
    const end   = t.end as Anyish | undefined;
    return {
        title: "Track",
        fields: fields(
            field("X",      start?.x != null ? `${fmt(start.x as number, 4)} mm` : null),
            field("Y",      start?.y != null ? `${fmt(start.y as number, 4)} mm` : null),
            field("Width",  t.width != null ? `${fmt(t.width as number, 4)} mm` : null),
            field("Length", t.routed_length != null ? `${fmt(t.routed_length as number, 4)} mm` : null),
            field("Layer",  t.layer),
            field("Net",    t.net_name ?? t.net),
            field("End X",  end?.x != null ? `${fmt(end.x as number, 4)} mm` : null),
            field("End Y",  end?.y != null ? `${fmt(end.y as number, 4)} mm` : null),
        ),
    };
}

function extractVia(t: Anyish): ItemDetail {
    const pos = (t.at as Anyish)?.position as Anyish | undefined;
    const layers = t.layers as string[] | undefined;
    return {
        title: "Via",
        fields: fields(
            field("X",            pos?.x != null ? `${fmt(pos.x as number, 4)} mm` : null),
            field("Y",            pos?.y != null ? `${fmt(pos.y as number, 4)} mm` : null),
            field("Net",          t.net_name ?? t.net),
            field("Diameter",     t.size != null ? `${fmt(t.size as number, 4)} mm` : null),
            field("Hole",         t.drill != null ? `${fmt(t.drill as number, 4)} mm` : null),
            field("Layer Top",    layers?.[0]),
            field("Layer Bottom", layers?.[layers.length - 1]),
            field("Via Type",     t.type),
        ),
    };
}

function extractZone(t: Anyish): ItemDetail {
    const fill = t.fill as Anyish | undefined;
    const cp   = t.connect_pads as Anyish | undefined;
    return {
        title: String(t.name ?? t.net_name ?? "Zone"),
        fields: fields(
            field("Name",                    t.name),
            field("Priority",                t.priority),
            field("Net",                     t.net_name),
            field("Fill mode",               fill?.mode),
            field("Clearance override",      cp?.clearance),
            field("Minimum width",           t.min_thickness != null ? `${fmt(t.min_thickness as number, 4)} mm` : null),
            field("Pad connections",         cp?.type ?? "Thermal reliefs"),
            field("Thermal relief gap",      fill?.thermal_gap != null ? `${fmt(fill.thermal_gap as number, 4)} mm` : null),
            field("Thermal relief spoke width", fill?.thermal_bridge_width != null ? `${fmt(fill.thermal_bridge_width as number, 4)} mm` : null),
        ),
    };
}

// ---------------------------------------------------------------------------
// Schematic item extractors
// Field paths taken directly from kc-schematic-properties-panel in ecad-viewer.js
// ---------------------------------------------------------------------------

function extractSchSymbol(t: Anyish): ItemDetail {
    const pos     = (t.at as Anyish)?.position as Anyish | undefined;
    const libSym  = t.lib_symbol as Anyish | undefined;

    // Properties: Map of {name, text} entries (kicanvas reads .values())
    const propsEntries: Field[] = [];
    const propsMap = t.properties;
    if (propsMap instanceof Map) {
        for (const v of (propsMap as Map<unknown, Anyish>).values()) {
            const f = field(String(v?.name ?? ""), v?.text);
            if (f) propsEntries.push(f);
        }
    } else if (Array.isArray(propsMap)) {
        for (const v of propsMap as Anyish[]) {
            const f = field(String(v?.name ?? ""), v?.text);
            if (f) propsEntries.push(f);
        }
    }

    // Pins from unit_pins
    const pinEntries: Field[] = [];
    const unitPins = t.unit_pins as Anyish[] | undefined;
    if (Array.isArray(unitPins)) {
        for (const pin of unitPins) {
            const num  = String((pin as Anyish)?.number ?? "");
            const defName = ((pin as Anyish)?.definition as Anyish)?.name as Anyish | undefined;
            const name = String(defName?.text ?? "");
            if (num) pinEntries.push({ label: num, value: name || "—" });
        }
    }

    const geometryGroup: Group = {
        label: "Geometry",
        entries: fields(
            field("X",           pos?.x != null ? `${fmt(pos.x as number, 4)} mm` : null),
            field("Y",           pos?.y != null ? `${fmt(pos.y as number, 4)} mm` : null),
            field("Orientation", (t.at as Anyish)?.rotation != null ? `${fmt((t.at as Anyish).rotation as number, 1)}°` : null),
            field("Mirror",      t.mirror === "x" ? "Around X axis" : t.mirror === "y" ? "Around Y axis" : t.mirror ? String(t.mirror) : null),
        ),
    };

    const instanceGroup: Group = {
        label: "Instance properties",
        entries: fields(
            field("Library link", t.lib_name ?? t.lib_id),
            field("Unit",         t.unit != null ? String.fromCharCode(65 + (t.unit as number) - 1) : null),
            field("In BOM",       boolField(t.in_bom)),
            field("On board",     boolField(t.on_board)),
            field("Populate",     boolField(t.dnp != null ? !t.dnp : null)),
        ),
    };

    const symPropsGroup: Group = {
        label: "Symbol properties",
        entries: fields(
            field("Name",                    libSym?.name),
            field("Description",             libSym?.description),
            field("Keywords",                libSym?.keywords),
            field("Power",                   boolField(libSym?.power)),
            field("Units",                   libSym?.unit_count),
            field("Units interchangeable",   boolField(libSym?.units_interchangable)),
        ),
    };

    const groups: Group[] = [];
    if (geometryGroup.entries.length)  groups.push(geometryGroup);
    if (instanceGroup.entries.length)  groups.push(instanceGroup);
    if (propsEntries.length)           groups.push({ label: "Fields",           entries: propsEntries });
    if (symPropsGroup.entries.length)  groups.push(symPropsGroup);
    if (pinEntries.length)             groups.push({ label: "Pins",             entries: pinEntries });

    // Hoist Reference, Value, Footprint to top-level fields (shown above dropdowns).
    const TOP_PROPS = ["Reference", "Value", "Footprint"];
    const topFields = TOP_PROPS.map(k => propsEntries.find(e => e.label === k)).filter(Boolean) as Field[];
    const refEntry  = topFields.find(e => e.label === "Reference");
    const valEntry  = topFields.find(e => e.label === "Value");

    return {
        title:    refEntry?.value ?? String(t.lib_id ?? t.lib_name ?? "Symbol"),
        subtitle: valEntry?.value,
        fields:   topFields,
        groups:   groups.length > 0 ? groups : undefined,
    };
}

function extractSchSheet(t: Anyish): ItemDetail {
    const pos = (t.at as Anyish)?.position as Anyish | undefined;

    const propsEntries: Field[] = [];
    const propsMap = t.properties;
    if (propsMap instanceof Map) {
        for (const v of (propsMap as Map<unknown, Anyish>).values()) {
            const f = field(String(v?.name ?? ""), v?.text);
            if (f) propsEntries.push(f);
        }
    } else if (Array.isArray(propsMap)) {
        for (const v of propsMap as Anyish[]) {
            const f = field(String(v?.name ?? ""), v?.text);
            if (f) propsEntries.push(f);
        }
    }

    const pinEntries: Field[] = [];
    const pins = t.pins as Anyish[] | undefined;
    if (Array.isArray(pins)) {
        for (const pin of pins) {
            const nm = String((pin as Anyish)?.name ?? "");
            const shape = String((pin as Anyish)?.shape ?? "");
            if (nm) pinEntries.push({ label: nm, value: shape || "—" });
        }
    }

    const geometryGroup: Group = {
        label: "Geometry",
        entries: fields(
            field("X", pos?.x != null ? `${fmt(pos.x as number, 4)} mm` : null),
            field("Y", pos?.y != null ? `${fmt(pos.y as number, 4)} mm` : null),
        ),
    };

    const groups: Group[] = [];
    if (geometryGroup.entries.length) groups.push(geometryGroup);
    if (propsEntries.length)          groups.push({ label: "Fields", entries: propsEntries });
    if (pinEntries.length)            groups.push({ label: "Pins",   entries: pinEntries });

    return {
        title:  String(t.sheet_name ?? "Sheet"),
        fields: [],
        groups: groups.length > 0 ? groups : undefined,
    };
}

function extractSchWireOrBus(t: Anyish, typeId: string): ItemDetail {
    const stroke = t.stroke as Anyish | undefined;
    const color  = (stroke?.color as Anyish | undefined);
    return {
        title: typeId.includes("Bus") ? "Bus" : "Wire",
        fields: fields(
            field("Line Style", stroke?.type),
            field("Line Width", stroke?.width != null ? `${stroke.width} mils` : null),
            field("Color",      color?.to_css ? String((color.to_css as () => string)()) : null),
        ),
    };
}

function extractSchPin(t: Anyish): ItemDetail {
    return {
        title: `Pin ${t.number ?? ""}`,
        fields: fields(
            field("Number",    t.number),
            field("Alternate", t.alternate),
            field("Unit",      t.unit),
        ),
    };
}

function extractSchText(t: Anyish, typeId: string): ItemDetail {
    const stroke = t.stroke as Anyish | undefined;
    const effects = t.effects as Anyish | undefined;
    const font   = (effects?.font as Anyish | undefined);
    return {
        title: String(t.text ?? typeId ?? "Text"),
        fields: fields(
            field("Text",       t.text),
            field("Bold",       boolField(font?.bold)),
            field("Italic",     boolField(font?.italic)),
            field("Shape",      t.shape),
            field("Line Style", stroke?.type),
            field("Line Width", stroke?.width != null ? `${stroke.width} mils` : null),
        ),
    };
}

function extractGeneric(item: Anyish, typeId: string): ItemDetail {
    // Net info or unknown item — show whatever we can read.
    const allFields: Field[] = [];
    const seen = new Set<string>();
    const skip = new Set(["typeId", "constructor", "shadowRoot", "renderer", "viewer", "viewport", "bbox", "properties", "properties_kicad_8"]);
    for (const k of Object.keys(item)) {
        if (skip.has(k) || k.startsWith("#") || k.startsWith("_")) continue;
        if (seen.has(k)) continue;
        seen.add(k);
        const v = s(item[k]);
        if (v) allFields.push({ label: prettyLabel(k), value: v });
    }
    const title = String(item.reference ?? item.name ?? item.text ?? item.net_name ?? typeId ?? "Item");
    return { title, fields: allFields };
}

// Read kicanvas's t.properties — a plain {key: string} object (KiCad 7)
// or an array/Map of {name, value} objects (KiCad 8).
// Optionally merges a second source (properties_kicad_8) — non-empty values
// from the second source override empty placeholders from the first.
function readProperties(raw: unknown, raw2?: unknown): Field[] {
    const out: Field[] = [];
    const seen = new Map<string, number>(); // label.toLowerCase() -> index in out

    const push = (label: string, value: string) => {
        if (!label) return;
        const key = label.toLowerCase();
        const trimmed = value.trim();
        if (seen.has(key)) {
            // Override with a non-empty value if the existing entry is a placeholder.
            if (trimmed && out[seen.get(key)!].value === "—") {
                out[seen.get(key)!].value = trimmed;
            }
            return;
        }
        seen.set(key, out.length);
        out.push({ label, value: trimmed || "—" });
    };

    const ingest = (source: unknown) => {
        if (!source || typeof source !== "object") return;
        if (source instanceof Map) {
            for (const [k, v] of source as Map<unknown, unknown>) {
                push(String(k), propVal(v));
            }
        } else if (Array.isArray(source)) {
            for (const v of source) {
                push(String((v as Anyish)?.name ?? ""), propVal(v));
            }
        } else {
            for (const [k, v] of Object.entries(source as Record<string, unknown>)) {
                push(k, propVal(v));
            }
        }
    };

    ingest(raw);
    ingest(raw2);
    return out;
}

// Extract string value from a property entry (plain string or {name,value} object).
function propVal(v: unknown): string {
    if (v == null) return "";
    if (typeof v === "string") return v;
    if (typeof v !== "object") return String(v);
    const o = v as Record<string, unknown>;
    for (const k of ["value", "shown_text", "text"]) {
        if (typeof o[k] === "string") return o[k] as string;
    }
    // Walk prototype getters for KiCad 8 Qn objects with private #fields.
    let proto = Object.getPrototypeOf(o);
    let hops = 0;
    while (proto && hops < 4 && proto !== Object.prototype) {
        for (const k of ["value", "shown_text", "text"]) {
            const desc = Object.getOwnPropertyDescriptor(proto, k);
            if (desc?.get) {
                try {
                    const r = desc.get.call(o);
                    if (typeof r === "string") return r;
                } catch { /* ignore */ }
            }
        }
        proto = Object.getPrototypeOf(proto);
        hops++;
    }
    return "";
}

function boolField(v: unknown): string | null {
    if (v == null) return null;
    return v ? BOOL_TRUE : BOOL_FALSE;
}

function prettyLabel(k: string): string {
    return k.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

export const BOOL_TRUE = "bool:true";
export const BOOL_FALSE = "bool:false";


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
                if (r.current) injectViewerStyles(r.current as unknown as HTMLElement);
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
            injectViewerStyles(el as unknown as HTMLElement);
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

        const stylePollId = window.setInterval(() => {
            if (cancelled) return;
            const el = hostRef.current;
            if (el) injectViewerStyles(el as unknown as HTMLElement);
        }, 750);

        return () => {
            cancelled = true;
            try {
                window.clearInterval(stylePollId);
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
