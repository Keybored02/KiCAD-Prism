import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { NoticeReading } from "@/types/supply";
import { confirmNoticeReading, dismissNoticeReading } from "./supply-api";
import { useConnectorSubmit } from "./use-connector-submit";

const KIND_TEXT: Record<NoticeReading["kind"], string> = {
  end_of_life: "end of life", last_time_buy: "last time buy", nrnd: "not recommended for new designs", change: "a product change",
};

/** What Prism read in the notice's kept file. A suggestion: the dates, kind and parts count only once someone accepts them. */
export function NoticeReadingBox({ noticeId, reading, onDone }: { noticeId: string; reading: NoticeReading; onDone: () => void | Promise<void> }) {
  const hasDates = Boolean(reading.last_time_buy || reading.last_time_ship);
  const [dates, setDates] = useState(hasDates);
  const [kind, setKind] = useState(false);
  const [picked, setPicked] = useState<Set<string>>(() => new Set(reading.known_parts.map((part) => part.part_id)));
  const { busy, error, run } = useConnectorSubmit();
  const toggle = (id: string, on: boolean) => setPicked((current) => {
    const next = new Set(current);
    if (on) next.add(id); else next.delete(id);
    return next;
  });
  return (
    <div role="group" aria-label="Read from the file" className="mt-1 space-y-1 border border-dashed p-2 text-xs">
      <p className="font-medium">Read from the kept file. Check it against the notice before you accept it.</p>
      {hasDates ? (
        <span className="flex items-center gap-1.5">
          <Checkbox id={`read-dates-${noticeId}`} checked={dates} onCheckedChange={(on) => setDates(on === true)} />
          <Label htmlFor={`read-dates-${noticeId}`} className="font-normal">
            Dates: {reading.last_time_buy ? `last time buy ${reading.last_time_buy}` : ""}{reading.last_time_buy && reading.last_time_ship ? ", " : ""}
            {reading.last_time_ship ? `last time to ship ${reading.last_time_ship}` : ""}
          </Label>
        </span>
      ) : null}
      <span className="flex items-center gap-1.5">
        <Checkbox id={`read-kind-${noticeId}`} checked={kind} onCheckedChange={(on) => setKind(on === true)} />
        <Label htmlFor={`read-kind-${noticeId}`} className="font-normal">Kind: {KIND_TEXT[reading.kind]}</Label>
      </span>
      {reading.known_parts.map((part) => (
        <span key={part.part_id} className="flex items-center gap-1.5">
          <Checkbox id={`read-part-${noticeId}-${part.part_id}`} checked={picked.has(part.part_id)} onCheckedChange={(on) => toggle(part.part_id, on === true)} />
          <Label htmlFor={`read-part-${noticeId}-${part.part_id}`} className="font-normal">Names {part.mpn}</Label>
        </span>
      ))}
      {reading.other_numbers.length > 0 ? <p className="text-muted-foreground">Other numbers in the file, not known to Prism: {reading.other_numbers.slice(0, 8).join(", ")}.</p> : null}
      {error ? <p role="alert" className="text-destructive">{error}</p> : null}
      <span className="flex gap-2">
        <Button type="button" size="sm" disabled={busy} onClick={() => void run(async () => { await confirmNoticeReading(noticeId, { dates, kind, part_ids: [...picked] }); await onDone(); })}>Accept the ticked</Button>
        <Button type="button" size="sm" variant="ghost" disabled={busy} onClick={() => void run(async () => { await dismissNoticeReading(noticeId); await onDone(); })}>Dismiss</Button>
      </span>
    </div>
  );
}
