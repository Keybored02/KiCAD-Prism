import type { SupplyListing } from "@/types/supply";

const ONE_TAPE = new Set(["cut_tape", "custom_reel"]);

function termsOf(listing: SupplyListing): string | null {
  const offer = listing.offer;
  if (!offer || offer.price_breaks.length === 0 || !ONE_TAPE.has(listing.packaging)) return null;
  return JSON.stringify([listing.connector_id, listing.counted, offer.stock, offer.moq, offer.order_multiple, offer.currency, offer.price_breaks]);
}

/**
 * A distributor often lists a length of tape twice: as cut tape and as its custom reel (DigiKey's -1-ND and -6-ND), with the same stock,
 * smallest order and prices. They are one way of buying, so the second is folded under the first, which says it is also sold that way.
 * Nothing is dropped: both numbers and packagings stay in view.
 */
export function collapseSameTerms(listings: readonly SupplyListing[]): { shown: SupplyListing[]; also: ReadonlyMap<string, SupplyListing[]> } {
  const shown: SupplyListing[] = [];
  const also = new Map<string, SupplyListing[]>();
  const first = new Map<string, SupplyListing>();
  const ordered = [...listings].sort((a, b) => Number(b.packaging === "cut_tape") - Number(a.packaging === "cut_tape"));
  for (const listing of ordered) {
    const key = termsOf(listing);
    const primary = key ? first.get(key) : undefined;
    if (primary) {
      also.set(primary.id, [...(also.get(primary.id) ?? []), listing]);
      continue;
    }
    if (key) first.set(key, listing);
    shown.push(listing);
  }
  // Keep the order the listings came in.
  shown.sort((a, b) => listings.indexOf(a) - listings.indexOf(b));
  return { shown, also };
}
