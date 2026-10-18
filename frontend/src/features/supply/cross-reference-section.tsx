import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { CrossReference } from "@/types/supply";
import { addComponentSource, askSubstitutes, getCrossReference } from "./supply-api";
import { FoldSection } from "./fold-section";
import { SuggestionsList } from "./suggestions-list";
import { formatStock } from "./supply-format";

const SAME_LABEL: Record<string, string> = {
  resistance: "value", capacitance: "value", inductance: "value", output_voltage: "output voltage", positions: "positions", rows: "rows",
  pitch: "pitch", core: "core", package: "package", tolerance: "tolerance", voltage_rating: "voltage rating", power_rating: "power rating",
};
const label = (key: string) => SAME_LABEL[key] ?? key.replace(/_/g, " ");

async function propose(componentId: string, manufacturer: string, mpn: string) {
  try {
    await addComponentSource(componentId, manufacturer, mpn);
    toast.success(`${mpn} proposed as an alternate. QA approves it.`);
  } catch (error) {
    toast.error(error instanceof Error ? error.message : "Could not propose the part");
  }
}

/** Alternatives found in what Prism holds, graded by how close they are. Looked up when asked. A person checks footprint and pins before approving one. */
export function CrossReferenceSection({ partId, canEdit }: { partId: string; canEdit: boolean }) {
  const [found, setFound] = useState<CrossReference | null>(null);
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const look = async () => {
    setBusy(true);
    try {
      setFound(await getCrossReference(partId));
      setOpen(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not look for alternatives");
    } finally {
      setBusy(false);
    }
  };
  const ask = async () => {
    setBusy(true);
    try {
      const reply = await askSubstitutes(partId);
      if (reply.problems.length > 0) toast.error(reply.problems.map((problem) => problem.reason).join(" "));
      else toast.success(`${reply.found === 0 ? "DigiKey names no substitutes." : `DigiKey names ${reply.found} ${reply.found === 1 ? "substitute" : "substitutes"}.`}${reply.resolved ? ` ${reply.resolved} Mouser ${reply.resolved === 1 ? "number" : "numbers"} named.` : ""}`);
      setFound(await getCrossReference(partId));
      setOpen(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not ask for substitutes");
    } finally {
      setBusy(false);
    }
  };
  return (
    <FoldSection
      title="Alternatives" open={open} onOpenChange={setOpen}
      actions={(
        <span className="ml-auto flex gap-1">
          {canEdit ? <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => void ask()}>Ask DigiKey for substitutes</Button> : null}
          <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => void look()}>Find alternatives</Button>
        </span>
      )}
    >
      {found ? (
        <>
          <SuggestionsList suggestions={found.suggestions ?? []} componentId={found.component_id} canEdit={canEdit} onTracked={() => void look()} />
          {!found.suggestions?.length && found.suggested_by_distributors.length > 0 ? <p className="text-sm">Distributors suggest: {found.suggested_by_distributors.join(", ")}.</p> : null}
          {found.candidates.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {found.judged_on.length === 0 ? "Not enough is listed for this part to compare it." : "No part Prism knows matches it."}
            </p>
          ) : (
            <ul className="divide-y border text-sm">
              {found.candidates.map((item) => (
                <li key={item.part_id} className="flex flex-wrap items-center justify-between gap-2 p-2">
                  <span className="min-w-0">
                    <span className="font-medium">{item.mpn}</span>, {item.manufacturer}{" "}
                    <Badge variant={item.grade === "direct" ? "outline" : "secondary"}>{item.grade_label}</Badge>
                    <span className="block text-xs text-muted-foreground">
                      Same: {item.same.map(label).join(", ")}.{item.differs.length > 0 ? ` Differs: ${item.differs.map(label).join(", ")}.` : ""}{" "}
                      {item.stock === null ? "Not read yet." : `${formatStock(item.stock)} in stock.`}
                    </span>
                  </span>
                  {canEdit && found.component_id ? (
                    <Button type="button" size="sm" variant="outline" onClick={() => void propose(found.component_id as string, item.manufacturer, item.mpn)}>Propose as alternate</Button>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
          <p className="text-xs text-muted-foreground">Compared on {found.judged_on.map(label).join(", ") || "nothing"} as distributors list them. Footprint and pins are not compared: check them before approving.</p>
        </>
      ) : <p className="text-xs text-muted-foreground">Nothing looked up yet.</p>}
    </FoldSection>
  );
}
