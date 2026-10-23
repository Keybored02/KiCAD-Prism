import { useState } from "react";

import { Input } from "@/components/ui/input";

const MIN = 1;
const MAX = 1_000_000;

/** The one board count of the tab: it drives the costing, the forecast and the CSV together, and is saved nowhere. */
export function BoardCount({ boards, onChange }: { boards: number; onChange: (next: number) => void }) {
  const [text, setText] = useState(String(boards));
  const apply = () => {
    const next = Math.floor(Number(text.replace(/[,\s]/g, "")));
    if (Number.isFinite(next) && next >= MIN && next <= MAX) onChange(next);
    else setText(String(boards));
  };
  return (
    <label className="flex items-center gap-1.5 text-sm">
      Boards
      <Input
        aria-label="Boards to forecast and cost" className="h-8 w-24" inputMode="numeric" value={text}
        onChange={(event) => setText(event.target.value)} onBlur={apply} onKeyDown={(event) => { if (event.key === "Enter") apply(); }}
      />
    </label>
  );
}
