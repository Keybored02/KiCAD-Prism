/** The four Supply tabs, and where the old addresses lead. */
export type SupplyTab = "dashboard" | "parts" | "projects" | "insights";

/** Connectors and Review live in Library Manager; `supplyView=connectors` and `supplyView=review` lead there. */
export const CONNECTORS_PLACE = "/?section=library-manager&libraryView=connectors";
export const REVIEW_PLACE = "/?section=library-manager&libraryView=review";
export const MOVED_TO_LIBRARY: Readonly<Record<string, string>> = { connectors: CONNECTORS_PLACE, review: REVIEW_PLACE };

export interface SupplyPlace {
  tab: SupplyTab;
  /** The BOM file tool, opened from Parts. */
  tool: "bom-file" | null;
}

/** The tab and tool an address asks for. `overview` and `inbox` open Dashboard, `market` and `planning` open Insights, `bom-file` opens Parts with the tool. */
export function resolvePlace(view: string | null, tool: string | null): SupplyPlace {
  switch (view) {
    case "parts":
    case "projects":
    case "insights":
    case "dashboard":
      return { tab: view, tool: view === "parts" && tool === "bom-file" ? "bom-file" : null };
    case "market":
    case "planning":
      return { tab: "insights", tool: null };
    case "bom-file":
      return { tab: "parts", tool: "bom-file" };
    default:
      return { tab: "dashboard", tool: null };
  }
}
