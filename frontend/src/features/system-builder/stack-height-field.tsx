import { useState } from "react";

import { Input } from "@/components/ui/input";
import { updateLink } from "@/lib/systems-api";
import type { SystemLink } from "@/types/system";

import type { Mutate } from "./use-system-mutation";

const HELP = "Gap between the facing surfaces of the two boards (the mated height on the connector datasheet). "
  + "Empty: placed from the connector bodies plus 5 mm.";

/** Parses the field: null when empty, NaN when it is not a usable height. */
function parse(text: string): number | null {
  if (!text.trim()) return null;
  const value = Number(text);
  return value > 0 && value < 1000 ? value : Number.NaN;
}

interface StackHeightFieldProps {
  systemId: string;
  etag: string;
  link: SystemLink;
  editable: boolean;
  busy: boolean;
  run: Mutate;
}

/** The B2B link's stack height, edited in place; saves on Enter or when the field loses focus (§16.2). */
export function StackHeightField({ systemId, etag, link, editable, busy, run }: StackHeightFieldProps) {
  const stored = link.stackHeightMm ?? null;
  const [draft, setDraft] = useState<{ base: number | null; text: string } | null>(null);
  const text = draft && draft.base === stored ? draft.text : stored === null ? "" : String(stored);
  const value = parse(text);
  const invalid = Number.isNaN(value);

  const save = () => {
    if (invalid || value === stored) return;
    void run("link", () => updateLink(systemId, etag, link.id, { stackHeightMm: value }), "Stack height saved");
  };

  if (!editable) {
    return <span className="text-xs text-muted-foreground" title={HELP}>Stack height {stored === null ? "auto" : `${stored} mm`}</span>;
  }
  return (
    <label className="flex items-center gap-1.5 text-xs text-muted-foreground" title={HELP}>
      Stack height
      <Input aria-label="Stack height (mm)" inputMode="decimal" placeholder="auto" value={text} disabled={busy}
        aria-invalid={invalid} className="h-7 w-20 font-mono text-xs"
        onChange={(event) => setDraft({ base: stored, text: event.target.value })}
        onBlur={save}
        onKeyDown={(event) => {
          if (event.key === "Enter") save();
          if (event.key === "Escape") setDraft(null);
        }} />
      mm
    </label>
  );
}
