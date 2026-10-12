import { useState } from "react";
import { CalendarPlus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { BomSupply } from "./use-bom-supply";

/** Add this build's parts to the plan as demand. The same name again replaces what it asked for before. */
export function BomPlanButton({ supply }: { supply: BomSupply }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [needBy, setNeedBy] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    try {
      const label = name.trim() || `${supply.buildQuantity} boards`;
      const result = await supply.planBuild(label, needBy || null);
      toast.success(`"${label}" asks for ${result.parts} parts`, result.replaced > 0 ? { description: `It replaced ${result.replaced} earlier lines under that name.` } : undefined);
      setOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not add the build to the plan");
    } finally {
      setBusy(false);
    }
  };

  if (!open) {
    return (
      <Button type="button" size="sm" variant="outline" className="h-7" onClick={() => setOpen(true)}>
        <CalendarPlus className="h-3.5 w-3.5" />Add to plan
      </Button>
    );
  }
  return (
    <form className="flex items-center gap-1.5" onSubmit={(event) => { event.preventDefault(); void submit(); }}>
      <Input aria-label="Plan name" placeholder={`${supply.buildQuantity} boards`} value={name} maxLength={100} className="h-7 w-36" onChange={(event) => setName(event.target.value)} />
      <Input aria-label="Needed by" type="date" value={needBy} className="h-7 w-36" onChange={(event) => setNeedBy(event.target.value)} />
      <Button type="submit" size="sm" className="h-7" disabled={busy}>Add</Button>
      <Button type="button" size="sm" variant="ghost" className="h-7" onClick={() => setOpen(false)}>Cancel</Button>
    </form>
  );
}
