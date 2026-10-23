/** The six Supply tabs and the settings page (reached from Connectors, not a tab), and where the old addresses lead. */
export type SupplyTab = "dashboard" | "parts" | "projects" | "review" | "insights" | "connectors" | "settings";

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
    case "review":
    case "connectors":
    case "settings":
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
