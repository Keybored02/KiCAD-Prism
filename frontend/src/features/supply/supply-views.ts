/** The four Supply tabs, and where the old addresses lead. Tracking was Parts: the old name still opens it. */
export type SupplyTab = "dashboard" | "tracking" | "projects" | "insights";

/** Where a link to one part leads: the component it counts for, on its Supply tab (or the part's sheet on Tracking when the
 * library has none). Resolved by the Supply section when it opens. */
export function partHref(partId: string): string {
  return `/?section=supply&supplyView=part&part=${encodeURIComponent(partId)}`;
}

/** Connectors and Review live in Library Manager; `supplyView=connectors` and `supplyView=review` lead there. */
export const CONNECTORS_PLACE = "/?section=library-manager&libraryView=connectors";
export const REVIEW_PLACE = "/?section=library-manager&libraryView=review";
export const MOVED_TO_LIBRARY: Readonly<Record<string, string>> = { connectors: CONNECTORS_PLACE, review: REVIEW_PLACE };

export interface SupplyPlace {
  tab: SupplyTab;
  /** The BOM file tool, opened from Parts. */
  tool: "bom-file" | null;
}

/** The tab and tool an address asks for. `overview` and `inbox` open Dashboard, `market` and `planning` open Insights, `parts` and `part`
 * open Tracking, `bom-file` opens Tracking with the tool. */
export function resolvePlace(view: string | null, tool: string | null): SupplyPlace {
  switch (view) {
    case "projects":
    case "insights":
    case "dashboard":
      return { tab: view, tool: null };
    case "tracking":
    case "parts":
    case "part":
      return { tab: "tracking", tool: tool === "bom-file" ? "bom-file" : null };
    case "market":
    case "planning":
      return { tab: "insights", tool: null };
    case "bom-file":
      return { tab: "tracking", tool: "bom-file" };
    default:
      return { tab: "dashboard", tool: null };
  }
}
