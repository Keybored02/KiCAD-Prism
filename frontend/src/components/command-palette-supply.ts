import { Warehouse } from "lucide-react";

import type { PaletteCommand } from "@/lib/command-registry";
import { canOpenSupply } from "@/lib/roles";
import type { UserRole } from "@/types/auth";

const SUPPLY_VIEWS = [
  { view: "overview", label: "Overview" },
  { view: "parts", label: "Parts" },
  { view: "inbox", label: "Inbox" },
  { view: "review", label: "Review" },
  { view: "market", label: "Market" },
  { view: "planning", label: "Planning" },
] as const;

/** Go-to entries for the Supply section, for roles that may open it. */
export function supplyCommands(role: UserRole | null | undefined, goToWorkspace: (params: string) => () => void): PaletteCommand[] {
  if (!canOpenSupply(role)) return [];
  return SUPPLY_VIEWS.map((entry) => ({
    id: `go:supply:${entry.view}`,
    label: `Supply: ${entry.label}`,
    group: "Go to",
    icon: Warehouse,
    keywords: `stock distributors availability alerts watch ${entry.label}`,
    run: goToWorkspace(`?section=supply&supplyView=${entry.view}`),
  }));
}
