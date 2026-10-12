import { useState } from "react";
import { Library, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import type { SupplySeedResult } from "./supply-api";
import { seedSupplyFromCatalog } from "./supply-api";

/** What a seeding run did, in a sentence. */
export function seedSummary(result: SupplySeedResult): string {
  if (result.considered === 0) return "No catalog component names a vendor and its part number.";
  const parts = [`${result.added} added`, `${result.already} already known`];
  if (result.no_connector > 0) parts.push(`${result.no_connector} for a vendor with no single connector`);
  if (result.unknown_manufacturer > 0) parts.push(`${result.unknown_manufacturer} with a manufacturer Prism does not know`);
  return `${result.considered} components with a vendor part number: ${parts.join(", ")}.`;
}

/** Take the vendor and vendor part number the catalog already holds as known listings. */
export function SeedFromCatalogButton({ onDone }: { onDone: () => void }) {
  const [busy, setBusy] = useState(false);

  const run = async () => {
    setBusy(true);
    try {
      toast.success(seedSummary(await seedSupplyFromCatalog()));
      onDone();
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : "Could not read the catalog vendors");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button variant="outline" disabled={busy} onClick={() => void run()} title="Use the vendor part numbers saved in the catalog">
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Library className="h-4 w-4" />}
      Read catalog vendors
    </Button>
  );
}
