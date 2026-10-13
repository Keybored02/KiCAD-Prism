import { useCallback, useState } from "react";
import { X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { SupplyNotice, SupplyNoticeKind } from "@/types/supply";
import { addNotice, closeNotice, listPartNotices } from "./supply-api";
import { useConnectorSubmit } from "./use-connector-submit";
import { useLoaded } from "./use-loaded";
import { VendorName } from "./vendor-name";

const KIND_CHOICES: ReadonlyArray<{ value: SupplyNoticeKind; label: string }> = [
  { value: "end_of_life", label: "End of life" },
  { value: "last_time_buy", label: "Last time buy" },
  { value: "nrnd", label: "Not recommended for new designs" },
  { value: "change", label: "Product change" },
];

interface NoticesSectionProps {
  part: { id: string; manufacturer: string; mpn: string };
  canEdit: boolean;
}

/** Product change notices for the part, as people entered them. Prism does not read the notice for you. */
export function NoticesSection({ part, canEdit }: NoticesSectionProps) {
  const fetcher = useCallback((signal: AbortSignal) => listPartNotices(part.id, signal), [part.id]);
  const loaded = useLoaded<SupplyNotice[]>(`${part.id}:notices`, fetcher, "Could not load the notices");
  const { busy, error, run } = useConnectorSubmit();
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<SupplyNoticeKind>("end_of_life");
  const [lastBuy, setLastBuy] = useState("");
  const [lastShip, setLastShip] = useState("");
  const [url, setUrl] = useState("");
  const items = loaded.data ?? [];
  if (!canEdit && items.length === 0) return null;

  return (
    <section aria-label="Notices" className="space-y-2">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Product change notices</h3>
      {items.length > 0 ? (
        <ul className="divide-y border text-sm">
          {items.map((item) => (
            <li key={item.id} className="flex items-start justify-between gap-2 p-2">
              <span className="min-w-0 space-y-0.5">
                <span className="flex flex-wrap items-center gap-2">
                  <Badge variant={item.state === "closed" ? "outline" : item.kind === "change" ? "secondary" : "warning"}>{item.kind_label}</Badge>
                  {item.state === "closed" ? <span className="text-xs text-muted-foreground">closed</span> : null}
                  {item.notice_url ? <a href={item.notice_url} target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline">{item.title}</a> : <span className="font-medium">{item.title}</span>}
                  {item.has_file ? <a href={`/api/supply/notices/${encodeURIComponent(item.id)}/file`} className="text-xs text-primary hover:underline">Kept copy</a> : null}
                </span>
                {item.source && item.source !== "manual" && item.notes ? <span className="block text-xs">{item.notes}</span> : null}
                <span className="block text-xs text-muted-foreground">
                  {item.published_on ? `Released ${item.published_on}. ` : ""}
                  {item.last_time_buy ? `Last time buy ${item.last_time_buy}. ` : ""}
                  {item.last_time_ship ? `Last time to ship ${item.last_time_ship}. ` : ""}
                  {item.parts > 1 ? `Covers ${item.parts} parts. ` : ""}
                  {item.source && item.source !== "manual" ? <>From <VendorName provider={item.source} name={item.source_label} />.</> : `Entered by ${item.created_by}.`}
                </span>
              </span>
              {canEdit && item.state === "open" ? (
                <Button size="icon" variant="ghost" aria-label={`Close ${item.title}`} disabled={busy}
                  onClick={() => void run(async () => { await closeNotice(item.id); await loaded.refresh(); })}>
                  <X className="h-4 w-4" />
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
      {canEdit ? (
        <form
          className="grid gap-2 sm:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault();
            void run(async () => {
              await addNotice({
                title: title.trim(), kind, parts: [{ manufacturer: part.manufacturer, mpn: part.mpn }],
                notice_url: url.trim(), last_time_buy: lastBuy || null, last_time_ship: lastShip || null, notes: "",
              });
              setTitle(""); setLastBuy(""); setLastShip(""); setUrl("");
              await loaded.refresh();
            });
          }}
        >
          <div className="space-y-1 sm:col-span-2">
            <Label htmlFor="notice-title" className="text-xs">Notice title or number</Label>
            <Input id="notice-title" maxLength={200} value={title} onChange={(event) => setTitle(event.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="notice-kind" className="text-xs">What it announces</Label>
            <select id="notice-kind" className="h-9 w-full border bg-background px-2 text-sm" value={kind} onChange={(event) => setKind(event.target.value as SupplyNoticeKind)}>
              {KIND_CHOICES.map((choice) => <option key={choice.value} value={choice.value}>{choice.label}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="notice-url" className="text-xs">Notice address (optional)</Label>
            <Input id="notice-url" inputMode="url" placeholder="https://" value={url} onChange={(event) => setUrl(event.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="notice-buy" className="text-xs">Last time buy</Label>
            <Input id="notice-buy" type="date" value={lastBuy} onChange={(event) => setLastBuy(event.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="notice-ship" className="text-xs">Last time to ship</Label>
            <Input id="notice-ship" type="date" value={lastShip} onChange={(event) => setLastShip(event.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" size="sm" variant="outline" disabled={busy || title.trim() === ""}>Add notice</Button>
          </div>
        </form>
      ) : null}
      {error ? <p role="alert" className="text-xs text-destructive">{error}</p> : null}
    </section>
  );
}
