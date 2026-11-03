import { Check } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import { openInSystemBrowser } from "@/lib/kicad-agent";
import { copyText, insideKiCad } from "@/lib/kicad-host";

/**
 * A link to something outside Prism: a datasheet, a distributor's page. Inside KiCad it asks the agent to open it in the user's
 * browser, because KiCad would load it in the panel with no way back; with no agent it copies the address. In a browser it opens
 * a new tab.
 */
export function OutsideLink({ href, label, className, children }: { href: string; label: string; className?: string; children: ReactNode }) {
  const [done, setDone] = useState<"opened" | "copied" | null>(null);
  useEffect(() => {
    if (!done) return;
    const timer = setTimeout(() => setDone(null), 1500);
    return () => clearTimeout(timer);
  }, [done]);

  if (!insideKiCad()) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" aria-label={label} title={label} className={className}>
        {children}
      </a>
    );
  }
  const open = async () => {
    if (await openInSystemBrowser(href)) {
      setDone("opened");
      return;
    }
    try {
      await copyText(href);
      setDone("copied");
    } catch {
      setDone(null);
    }
  };
  const title = done === "opened" ? "Opened in browser" : done === "copied" ? "Link copied" : label;
  return (
    <button type="button" aria-label={label} title={title} className={className} onClick={() => void open()}>
      {done ? <Check className="h-3.5 w-3.5" aria-hidden /> : children}
    </button>
  );
}
