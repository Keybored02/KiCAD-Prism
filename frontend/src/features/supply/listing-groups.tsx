import { Star } from "lucide-react";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { SupplyListing, SupplyPartDetail } from "@/types/supply";
import { ListingTable } from "./listing-table";
import { OnePerDistributor } from "./one-per-distributor";
import { pickPackaging } from "./packaging-api";
import { clearPreferredDistributor, setPreferredDistributor } from "./supply-api";
import { useConnectorSubmit } from "./use-connector-submit";
import { VendorName } from "./vendor-name";

interface Group {
  connectorId: string;
  name: string;
  provider: string;
  listings: SupplyListing[];
}

/** Listings by distributor: the preferred one first, then by name. */
function groupsOf(listings: SupplyListing[], preferred: string | null | undefined): Group[] {
  const byConnector = new Map<string, Group>();
  for (const listing of listings) {
    const group = byConnector.get(listing.connector_id) ?? { connectorId: listing.connector_id, name: listing.connector_name, provider: listing.provider ?? "", listings: [] };
    group.listings.push(listing);
    byConnector.set(listing.connector_id, group);
  }
  return [...byConnector.values()].sort((a, b) => Number(b.connectorId === preferred) - Number(a.connectorId === preferred) || a.name.localeCompare(b.name));
}

function followLine(group: Group, detail: SupplyPartDetail): string | null {
  const counted = group.listings.filter((listing) => listing.counted);
  if (counted.length < 2) return null;
  const followed = detail.packaging?.picks[group.connectorId];
  const sku = counted.find((listing) => listing.id === followed)?.sku;
  if (!sku) return `${counted.length} listings, all read`;
  const by = detail.packaging?.picked_by?.[group.connectorId];
  const who = by?.by === "auto" ? "picked by Prism" : by?.by ? `picked by ${by.by}` : "";
  return `Following ${sku}${who ? `, ${who}` : ""}${by?.note ? ` (${by.note})` : ""}`;
}

/** The part's listings grouped by distributor. Each group can be made the preferred one; one with several listings says which is followed. */
export function ListingGroups({
  detail, canDecide, canTrack, onChanged,
}: { detail: SupplyPartDetail; canDecide: boolean; canTrack: boolean; onChanged: () => Promise<void> | void }) {
  const { busy, error, run } = useConnectorSubmit();
  const [asking, setAsking] = useState(false);
  const groups = useMemo(() => groupsOf(detail.listings, detail.preferred_connector_id), [detail.listings, detail.preferred_connector_id]);
  const partId = detail.part.id;
  const preferred = detail.preferred_connector_id ?? null;
  const toggle = (group: Group) =>
    void run(async () => {
      if (group.connectorId === preferred) await clearPreferredDistributor(partId); else await setPreferredDistributor(partId, group.connectorId);
      await onChanged();
    });
  const follow = (group: Group, listing: SupplyListing) =>
    void run(async () => { await pickPackaging(partId, group.connectorId, listing.id); await onChanged(); });
  if (groups.length === 0) return <ListingTable listings={[]} />;
  return (
    <div className="space-y-4">
      {error ? <p role="alert" className="text-xs text-destructive">{error}</p> : null}
      {canTrack && (detail.packaging?.needs_pick.length ?? 0) > 0 ? (
        <div className="flex justify-end">
          <Button size="sm" variant="outline" disabled={busy} onClick={() => setAsking(true)}>One per distributor</Button>
        </div>
      ) : null}
      {groups.map((group) => {
        const line = followLine(group, detail);
        const isPreferred = group.connectorId === preferred;
        return (
          <section key={group.connectorId} aria-label={`${group.name} listings`} className={`space-y-2 ${isPreferred ? "bg-primary/5 p-2" : ""}`}>
            <div className="flex flex-wrap items-center gap-2">
              {canTrack ? (
                <Button
                  type="button" size="icon" variant="ghost" className="h-6 w-6" disabled={busy} aria-pressed={isPreferred}
                  aria-label={isPreferred ? `Stop preferring ${group.name}` : `Prefer ${group.name}`} title={isPreferred ? "Preferred distributor" : "Make this the preferred distributor"}
                  onClick={() => toggle(group)}
                >
                  <Star className={`h-3.5 w-3.5 ${isPreferred ? "fill-current text-primary" : ""}`} />
                </Button>
              ) : isPreferred ? <Star className="h-3.5 w-3.5 fill-current text-primary" aria-hidden /> : null}
              <VendorName provider={group.provider} name={group.name} className="text-sm font-semibold" />
              {isPreferred ? <Badge variant="secondary">Preferred</Badge> : null}
              {line ? <span className="text-xs text-muted-foreground">{line}</span> : null}
            </div>
            <ListingTable
              listings={group.listings} canDecide={canDecide} onChanged={() => void onChanged()}
              follow={{ followed: detail.packaging?.picks[group.connectorId] ?? null, canFollow: canTrack, onFollow: (listing) => follow(group, listing) }}
            />
          </section>
        );
      })}
      {asking ? <OnePerDistributor partId={partId} onClose={() => setAsking(false)} onDone={onChanged} /> : null}
    </div>
  );
}
