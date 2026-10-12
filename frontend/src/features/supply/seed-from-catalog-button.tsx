import { useState } from "react";
import { Library, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { seedSummary } from "./seed-summary";
import { seedSupplyFromCatalog } from "./supply-api";

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
