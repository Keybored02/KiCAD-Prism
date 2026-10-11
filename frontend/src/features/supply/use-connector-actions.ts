import { useCallback } from "react";
import { toast } from "sonner";

import type { SupplyConnector } from "@/types/supply";
import type { ConnectorAction } from "./connector-card";
import {
  confirmSupplyTermsReview,
  resumeSupplyConnector,
  updateSupplyConnector,
} from "./supply-api";

type QuickAction = Extract<ConnectorAction, "resume" | "enable" | "disable" | "terms">;

const QUICK: Record<QuickAction, { run: (connector: SupplyConnector) => Promise<SupplyConnector>; done: string }> = {
  resume: { run: (connector) => resumeSupplyConnector(connector.id), done: "Connector resumed" },
  enable: { run: (connector) => updateSupplyConnector(connector.id, { enabled: true }), done: "Connector enabled" },
  disable: { run: (connector) => updateSupplyConnector(connector.id, { enabled: false }), done: "Connector disabled" },
  terms: { run: (connector) => confirmSupplyTermsReview(connector.id), done: "Terms review recorded" },
};

export function isQuickAction(action: ConnectorAction): action is QuickAction {
  return action in QUICK;
}

/** Actions that need no form: call the API, update the list, say what happened. */
export function useQuickConnectorActions(apply: (connector: SupplyConnector) => void) {
  return useCallback(
    async (action: QuickAction, connector: SupplyConnector) => {
      try {
        apply(await QUICK[action].run(connector));
        toast.success(QUICK[action].done);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "The change was not saved");
      }
    },
    [apply],
  );
}
