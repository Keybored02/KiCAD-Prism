import { useEffect } from "react";

import { PANEL_PATH } from "@/lib/kicad-host";
import type { User } from "@/types/auth";
import { PartSheet } from "./part-sheet";

/** KiCad's Remote Symbols panel, open on ``componentId`` when there is one: where closing the part goes back to. */
export function panelAddress(componentId: string | null): string {
  return componentId ? `${PANEL_PATH}?${new URLSearchParams({ component: componentId })}` : PANEL_PATH;
}

/**
 * What the web app shows inside KiCad's Remote Symbols webview: the part the panel's "Open in Prism" names (``part``), alone.
 * KiCad keeps every navigation in that webview, so the workspace is never drawn there. Closing the part goes back to the panel
 * where it was opened: through history when the panel marked the address (``back``), so its Forward leads here again, and
 * otherwise to the panel's view of the component it was opened from (``component``). An address that names no part goes
 * straight back.
 */
export function KiCadPartPage({ partId, componentId, openedFromPanel, user }: { partId: string | null; componentId: string | null; openedFromPanel: boolean; user: User | null }) {
  const close = () => {
    if (openedFromPanel && window.history.length > 1) window.history.back();
    else window.location.replace(panelAddress(componentId));
  };
  useEffect(() => {
    if (!partId) window.location.replace(panelAddress(componentId));
  }, [partId, componentId]);
  if (!partId) return null;
  return <PartSheet partId={partId} user={user} onClose={close} onWatchChanged={() => {}} />;
}
