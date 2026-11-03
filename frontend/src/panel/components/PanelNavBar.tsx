import { ArrowLeft, ArrowRight, House } from "lucide-react";

import { Button } from "@/components/ui/button";

type PanelNavBarProps = {
  canGoBack: boolean;
  canGoForward: boolean;
  atHome: boolean;
  onBack: () => void;
  onForward: () => void;
  onHome: () => void;
};

/** Back, Forward and Home for a webview that has no browser controls of its own. */
export function PanelNavBar({ canGoBack, canGoForward, atHome, onBack, onForward, onHome }: PanelNavBarProps) {
  return (
    <nav aria-label="Panel navigation" className="sticky top-0 z-40 flex h-9 shrink-0 items-center gap-1 border-b bg-background/95 px-3 backdrop-blur">
      <Button variant="ghost" size="icon-xs" onClick={onBack} disabled={!canGoBack} aria-label="Back" title="Back">
        <ArrowLeft className="h-3.5 w-3.5" />
      </Button>
      <Button variant="ghost" size="icon-xs" onClick={onForward} disabled={!canGoForward} aria-label="Forward" title="Forward">
        <ArrowRight className="h-3.5 w-3.5" />
      </Button>
      <Button variant="ghost" size="icon-xs" onClick={onHome} disabled={atHome} aria-label="Home" title="Home">
        <House className="h-3.5 w-3.5" />
      </Button>
    </nav>
  );
}
