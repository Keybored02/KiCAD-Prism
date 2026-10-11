import { lazy, Suspense } from "react";
import { useSearchParams } from "react-router-dom";
import { ListChecks, ShieldAlert, type LucideIcon } from "lucide-react";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { canOpenSupply } from "@/lib/roles";
import type { User } from "@/types/auth";

const ReviewView = lazy(() => import("./review-view").then((module) => ({ default: module.ReviewView })));

const VIEWS: ReadonlyArray<{ id: SupplyView; label: string; icon: LucideIcon }> = [
  { id: "review", label: "Review", icon: ListChecks },
];

type SupplyView = "review";

function isSupplyView(value: string | null): value is SupplyView {
  return VIEWS.some((view) => view.id === value);
}

/** The Supply section: stock, matching and sourcing. Tabs are added as they ship. */
export function SupplyWorkspace({ user }: { user: User | null }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const requested = searchParams.get("supplyView");
  const view: SupplyView = isSupplyView(requested) ? requested : "review";

  if (!canOpenSupply(user?.role)) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 p-8 text-center">
        <ShieldAlert className="h-8 w-8 text-muted-foreground" />
        <p className="text-sm font-medium">Supply data is not available to your role</p>
        <p className="max-w-md text-sm text-muted-foreground">Designers, QA and administrators can open it.</p>
      </div>
    );
  }

  const setView = (next: SupplyView) => {
    setSearchParams((current) => {
      const updated = new URLSearchParams(current);
      updated.set("section", "supply");
      updated.set("supplyView", next);
      return updated;
    });
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <Tabs
        value={view}
        onValueChange={(next) => { if (isSupplyView(next)) setView(next); }}
        className="shrink-0 gap-0 border-b bg-card px-3"
      >
        <TabsList variant="line" className="h-10 gap-2" aria-label="Supply sections">
          {VIEWS.map(({ id, label, icon: Icon }) => (
            <TabsTrigger key={id} value={id} className="gap-2 px-2 text-sm">
              <Icon className="h-4 w-4" />
              {label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      <Suspense fallback={<div className="flex h-full items-center justify-center text-sm text-muted-foreground">Loading…</div>}>
        <div className="min-h-0 flex-1 overflow-hidden">
          {view === "review" && <ReviewView user={user} />}
        </div>
      </Suspense>
    </div>
  );
}
