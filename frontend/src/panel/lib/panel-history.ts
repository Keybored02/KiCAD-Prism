import type { PanelComponent } from "@/panel/lib/panel-api";

/**
 * Where the panel is, as the webview's own history records it.
 *
 * KiCad's webview has no address bar and no way to leave the page, so the panel draws its own
 * Back, Forward and Home. Each screen change pushes a history entry holding the place and its
 * position (``idx``), so Back and Forward are the webview's own, and a reload lands where it was.
 */
export type PanelPlace =
  | { kind: "finder" }
  | { kind: "category"; name: string }
  | { kind: "detail"; componentId: string };

export type PanelEntry = { place: PanelPlace; idx: number };

export const FINDER: PanelPlace = { kind: "finder" };

const STATE_KEY = "prismPanel";
const TOP_KEY = "prism-panel-top";

/** The history state that records ``entry``. */
export function entryState(entry: PanelEntry): { [STATE_KEY]: PanelEntry } {
  return { [STATE_KEY]: entry };
}

function placeFrom(value: unknown): PanelPlace | null {
  if (!value || typeof value !== "object") return null;
  const place = value as Record<string, unknown>;
  if (place.kind === "finder") return FINDER;
  if (place.kind === "category" && typeof place.name === "string") return { kind: "category", name: place.name };
  if (place.kind === "detail" && typeof place.componentId === "string" && place.componentId) {
    return { kind: "detail", componentId: place.componentId };
  }
  return null;
}

/** The entry a history state records, or null for a state the panel did not write. */
export function readEntry(state: unknown): PanelEntry | null {
  if (!state || typeof state !== "object") return null;
  const entry = (state as Record<string, unknown>)[STATE_KEY] as Record<string, unknown> | undefined;
  if (!entry || typeof entry !== "object") return null;
  const place = placeFrom(entry.place);
  const idx = entry.idx;
  if (!place || typeof idx !== "number" || !Number.isInteger(idx) || idx < 0) return null;
  return { place, idx };
}

// The furthest entry Forward can reach. History cannot say whether a forward entry exists, so the panel counts.
let memoryTop = 0;

export function readTop(): number {
  try {
    const stored = Number(window.sessionStorage.getItem(TOP_KEY));
    return Number.isInteger(stored) && stored >= 0 ? stored : memoryTop;
  } catch {
    return memoryTop;
  }
}

export function writeTop(top: number): void {
  memoryTop = top;
  try {
    window.sessionStorage.setItem(TOP_KEY, String(top));
  } catch {
    // Private window or blocked storage: the in-memory value still serves this page load.
  }
}

/**
 * Call just before the panel navigates to a Prism page of its own. That page is the entry after this one, so Forward
 * from the panel's entry leads back to it.
 */
export function leavingForPrismPage(): void {
  const here = readEntry(window.history.state);
  if (here) writeTop(here.idx + 1);
}

/** ``url`` marked as opened from the panel, so closing the page there goes back through history to the panel. */
export function openedFromPanel(url: string): string {
  try {
    const marked = new URL(url);
    marked.searchParams.set("back", "1");
    return marked.toString();
  } catch {
    return url;
  }
}

// The list rows already fetched, so a part opened from a list shows its name while the full detail loads.
const seenComponents = new Map<string, PanelComponent>();

export function rememberComponent(component: PanelComponent): void {
  seenComponents.set(component.id, component);
}

export function recalledComponent(id: string): PanelComponent | null {
  return seenComponents.get(id) ?? null;
}
