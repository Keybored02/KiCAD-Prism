import { useState } from "react";
import { CalendarPlus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ProjectSupplyPart } from "@/types/supply";
import { planSupplyBuild } from "./supply-api";

/** Add a build of this project to the plan as demand. The same name again replaces what it asked for before. */
export function ProjectPlanButton({ projectId, parts, onDone }: { projectId: string; parts: ProjectSupplyPart[]; onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [boards, setBoards] = useState(10);
  const [name, setName] = useState("");
  const [needBy, setNeedBy] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    try {
      const label = name.trim() || `${boards} boards`;
      const lines = parts.flatMap((part) => (part.mpn ? [{ key: part.key, manufacturer: part.manufacturer, mpn: part.mpn, quantity: part.quantity }] : []));
      const result = await planSupplyBuild({ name: label, projectId, lines, buildQuantity: boards, attritionPercent: 0, needBy: needBy || null });
      toast.success(`"${label}" asks for ${result.parts} parts`, result.replaced > 0 ? { description: `It replaced ${result.replaced} earlier lines under that name.` } : undefined);
      setOpen(false);
      onDone();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not add the build to the plan");
    } finally {
      setBusy(false);
    }
  };

  if (!open) {
    return (
      <Button type="button" size="sm" variant="outline" onClick={() => setOpen(true)}>
        <CalendarPlus className="h-3.5 w-3.5" />Add to plan
      </Button>
    );
  }
  return (
    <form className="flex flex-wrap items-center gap-1.5" onSubmit={(event) => { event.preventDefault(); void submit(); }}>
      <Input aria-label="Boards to build" type="number" min={1} max={1_000_000} value={boards} className="h-8 w-24"
        onChange={(event) => { const next = Math.floor(Number(event.target.value)); if (Number.isFinite(next) && next >= 1 && next <= 1_000_000) setBoards(next); }} />
      <Input aria-label="Plan name" placeholder={`${boards} boards`} value={name} maxLength={100} className="h-8 w-36" onChange={(event) => setName(event.target.value)} />
      <Input aria-label="Needed by" type="date" value={needBy} className="h-8 w-36" onChange={(event) => setNeedBy(event.target.value)} />
      <Button type="submit" size="sm" disabled={busy}>Add</Button>
      <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
    </form>
  );
}
