/** The five Supply tabs, and where the old addresses lead. */
export type SupplyTab = "dashboard" | "parts" | "review" | "insights" | "connectors";

export interface SupplyPlace {
  tab: SupplyTab;
  /** Which of Insights' two views is open. */
  insight: "market" | "planning";
  /** The BOM file tool, opened from Parts. */
  tool: "bom-file" | null;
}

/** The tab, view and tool an address asks for. `overview` and `inbox` open Dashboard, `market` and `planning` open Insights, `bom-file` opens Parts with the tool. */
export function resolvePlace(view: string | null, insight: string | null, tool: string | null): SupplyPlace {
  const insightView = insight === "planning" ? "planning" : "market";
  switch (view) {
    case "parts":
    case "review":
    case "connectors":
    case "insights":
    case "dashboard":
      return { tab: view, insight: insightView, tool: view === "parts" && tool === "bom-file" ? "bom-file" : null };
    case "market":
    case "planning":
      return { tab: "insights", insight: view, tool: null };
    case "bom-file":
      return { tab: "parts", insight: insightView, tool: "bom-file" };
    default:
      return { tab: "dashboard", insight: insightView, tool: null };
  }
}
