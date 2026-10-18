import type { SupplyPartRow } from "@/types/supply";
import { PackagingChip } from "./packaging-chip";
import { priceAt, PRICE_QUANTITIES } from "./parts-layout";
import { formatPrice, packagingName } from "./supply-format";
import { vendorColor } from "./vendor-colors";

const HEAD = "px-2 py-1 font-normal";

/** A part's vendors, one row each: stock, smallest order, packaging and the unit price at each quantity. */
export function PartOfferRows({ part }: { part: SupplyPartRow }) {
  const offers = part.offers ?? [];
  if (offers.length === 0) return <p className="px-2 py-1 text-xs text-muted-foreground">No vendor has been read yet.</p>;
  return (
    <table className="w-full text-xs" aria-label={`Vendors of ${part.mpn}`}>
      <thead className="text-left text-muted-foreground">
        <tr>
          <th className={HEAD}>Vendor</th>
          <th className={`${HEAD} text-right`}>In stock</th>
          <th className={`${HEAD} text-right`}>Min order</th>
          <th className={HEAD}>Packaging</th>
          {PRICE_QUANTITIES.map((quantity) => <th key={quantity} className={`${HEAD} text-right`}>{quantity.toLocaleString()}</th>)}
        </tr>
      </thead>
      <tbody>
        {offers.map((offer) => (
          <tr key={`${offer.connector_id}:${offer.sku}`} className="border-t border-dashed">
            <td className="px-2 py-1">
              <span className="inline-flex items-center gap-1.5 font-medium">
                <span aria-hidden className="h-2.5 w-2.5 rounded-[2px]" style={{ backgroundColor: vendorColor(offer.provider) ?? "#6b7280" }} />
                {offer.product_url ? (
                  <a
                    href={offer.product_url} target="_blank" rel="noopener noreferrer" className="hover:underline"
                    aria-label={`Open ${part.mpn} at ${offer.name}`} title={`Open ${offer.sku} at ${offer.name}`}
                    onClick={(event) => event.stopPropagation()}
                  >
                    {offer.name}
                  </a>
                ) : offer.name}
              </span>
            </td>
            <td className={`px-2 py-1 text-right tabular-nums ${offer.stock > 0 ? "" : "text-muted-foreground"}`}>{offer.stock.toLocaleString()}</td>
            <td className="px-2 py-1 text-right tabular-nums">{offer.moq > 0 ? offer.moq.toLocaleString() : "–"}</td>
            <td className="px-2 py-1"><PackagingChip packaging={offer.packaging} reelSize={offer.reel_size} inferred={offer.packaging_inferred} />{packagingName(offer.packaging) ? null : <span className="text-muted-foreground">–</span>}</td>
            {PRICE_QUANTITIES.map((quantity) => {
              const price = priceAt(offer.price_breaks, quantity);
              return <td key={quantity} className="px-2 py-1 text-right tabular-nums">{price === null ? <span className="text-muted-foreground">–</span> : formatPrice(price, offer.currency)}</td>;
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
