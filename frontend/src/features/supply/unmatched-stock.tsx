import { useCallback, useEffect, useState } from "react";
import { Link2, LibraryBig } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { AsyncSearchPicker } from "@/components/workspace/async-search-picker";
import { listComponents } from "@/components/workspace/catalog-client";
import { CreateComponentDialog } from "@/components/workspace/create-component-dialog";
import type { CatalogComponent } from "@/types/catalog";
import type { InventorySource, InventoryUnmatchedPart } from "@/types/supply";
import { CollapsibleSection } from "./collapsible-section";
import { linkUnmatchedPart, listInventorySources, listUnmatchedParts } from "./inventory-api";

const REASON: Record<InventoryUnmatchedPart["reason"], string> = {
  no_component: "No component",
  sap_code_shared: "SAP code on several components",
  mpn_shared: "MPN on several components",
};

// Vision serves every part under this maker until it knows the real one; it is not worth copying into a new component.
const UNKNOWN_MAKER = "unknown manufacturer";

interface Waiting {
  source: InventorySource;
  part: InventoryUnmatchedPart;
}

/** Every source's unmatched parts with stock, largest first; null until loaded. */
function useUnmatched() {
  const [items, setItems] = useState<Waiting[] | null>(null);
  const load = useCallback(async (signal?: AbortSignal) => {
    try {
      const sources = (await listInventorySources(signal)).filter((source) => source.unmatched > 0);
      const lists = await Promise.all(sources.map(async (source) => (await listUnmatchedParts(source.id, signal)).map((part) => ({ source, part }))));
      setItems(lists.flat().sort((a, b) => b.part.quantity - a.part.quantity));
    } catch (caught) {
      if (!signal?.aborted) {
        setItems([]);
        toast.error(caught instanceof Error ? caught.message : "Could not load the unmatched stock");
      }
    }
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);
  return { items, reload: () => void load() };
}

/** Library Manager > Review: stock a local inventory server holds for parts no component matched. QA and admins link them. */
export function UnmatchedStockSection({ canDecide, onDecided }: { canDecide: boolean; onDecided?: () => void }) {
  const { items, reload } = useUnmatched();
  if (!items || items.length === 0) return null;
  const done = () => { reload(); onDecided?.(); };
  return (
    <CollapsibleSection id="review-unmatched-stock" title="Unmatched local stock" count={items.length}>
      <ul className="divide-y">
        {items.map(({ source, part }) => (
          <UnmatchedRow key={`${source.id}/${part.remote_part}`} source={source} part={part} canDecide={canDecide} onLinked={done} />
        ))}
      </ul>
    </CollapsibleSection>
  );
}

function UnmatchedRow({ source, part, canDecide, onLinked }: { source: InventorySource; part: InventoryUnmatchedPart; canDecide: boolean; onLinked: () => void }) {
  const [picking, setPicking] = useState(false);
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState(false);
  const identity = [part.ipn && `SAP ${part.ipn}`, part.mpn].filter(Boolean).join(" · ");

  const link = async (component: Pick<CatalogComponent, "id" | "name">) => {
    setBusy(true);
    try {
      const result = await linkUnmatchedPart(source.id, part.remote_part, component.id);
      if (result.status === "ok") toast.success(`Linked to ${component.name}`);
      else toast.warning(`Linked to ${component.name}`, { description: `The source could not be read again: ${result.error}` });
      onLinked();
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : "Could not link the part");
    } finally {
      setBusy(false);
    }
  };

  return (
    <li className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2 text-sm">
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium" title={part.name}>{part.name || part.mpn || `Part ${part.remote_part}`}</p>
        <p className="truncate text-xs text-muted-foreground">{[source.display_name, identity, REASON[part.reason]].filter(Boolean).join(" · ")}</p>
      </div>
      <span className="shrink-0 tabular-nums" title={`${part.records} stock records`}>{part.quantity.toLocaleString()}</span>
      {canDecide ? (
        <div className="flex shrink-0 gap-1.5">
          <AsyncSearchPicker<CatalogComponent>
            id={`link-${source.id}-${part.remote_part}`}
            open={picking}
            onOpenChange={setPicking}
            trigger={<Button size="sm" variant="outline" disabled={busy}><Link2 className="h-3.5 w-3.5" />Link</Button>}
            fetchPage={async (query, signal) => {
              const page = await listComponents(new URLSearchParams({ q: query, page_size: "20" }), signal);
              return { items: page.items, total: page.total };
            }}
            getKey={(component) => component.id}
            renderItem={(component) => (
              <span className="flex min-w-0 flex-col">
                <span className="truncate">{component.name}</span>
                <span className="truncate text-xs text-muted-foreground">{[component.manufacturer, component.mpn].filter(Boolean).join(" · ")}</span>
              </span>
            )}
            onSelect={(component) => { setPicking(false); void link(component); }}
            searchPlaceholder="Search the Component Database"
            listLabel="Components"
            emptyMessage="No component matches"
            suggestQuery={part.mpn || part.ipn}
          />
          <Button size="sm" variant="ghost" disabled={busy} onClick={() => setAdding(true)} title="Add to Component Database">
            <LibraryBig className="h-3.5 w-3.5" />Add
          </Button>
        </div>
      ) : null}
      {adding ? (
        <CreateComponentDialog
          open
          onOpenChange={(next) => { if (!next) setAdding(false); }}
          initial={{
            manufacturer: part.manufacturer.trim().toLowerCase() === UNKNOWN_MAKER ? "" : part.manufacturer,
            manufacturerPartNumber: part.mpn,
            description: part.name,
          }}
          onCreated={(component) => void link(component)}
        />
      ) : null}
    </li>
  );
}
