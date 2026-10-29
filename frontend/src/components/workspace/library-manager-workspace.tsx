import { lazy, Suspense, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Database, DownloadCloud, ListChecks, PackageCheck, Plug, Table2, type LucideIcon } from "lucide-react";

import { StudioTabsList, StudioTabsTrigger } from "@/components/ui/studio-tabs";
import { Tabs } from "@/components/ui/tabs";
import { useLibraryReviewCount } from "@/features/supply/library-review-view";
import { canOpenSupply } from "@/lib/roles";
import type { User } from "@/types/auth";
import type { Project } from "@/types/project";
import { LibraryCatalogWorkspace } from "./library-catalog-workspace";

const LibraryBulkEditWorkspace = lazy(() => import("./library-bulk-edit-workspace").then((module) => ({ default: module.LibraryBulkEditWorkspace })));
const LibraryComponentWorkspace = lazy(() => import("./library-component-workspace").then((module) => ({ default: module.LibraryComponentWorkspace })));
const LibraryImportCenter = lazy(() => import("./library-import-center").then((module) => ({ default: module.LibraryImportCenter })));
const LibraryReleaseQueue = lazy(() => import("./library-release-queue").then((module) => ({ default: module.LibraryReleaseQueue })));
const LibraryReviewView = lazy(() => import("@/features/supply/library-review-view").then((module) => ({ default: module.LibraryReviewView })));
const LibraryConnectorsView = lazy(() => import("@/features/supply/library-connectors-view").then((module) => ({ default: module.LibraryConnectorsView })));

type LibraryView = "catalog" | "bulk-edit" | "imports" | "releases" | "review" | "connectors";

const VIEW_LABELS: Record<LibraryView, string> = {
  catalog: "Catalog",
  "bulk-edit": "Bulk Edit",
  imports: "Import Center",
  releases: "Release Queue",
  review: "Review",
  connectors: "Connectors",
};

const VIEW_ICONS: Record<LibraryView, LucideIcon> = {
  catalog: Database,
  "bulk-edit": Table2,
  imports: DownloadCloud,
  releases: PackageCheck,
  review: ListChecks,
  connectors: Plug,
};

export function LibraryManagerWorkspace({ user, projects }: { user: User | null; projects: Project[] }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const componentId = searchParams.get("component") || "";
  const requestedView = searchParams.get("libraryView") as LibraryView | null;
  // Ending Parts became notifications on the Supply Dashboard.
  const endingMoved = (requestedView as string | null) === "ending";
  useEffect(() => {
    if (endingMoved) setSearchParams(new URLSearchParams({ section: "supply", supplyView: "dashboard" }), { replace: true });
  }, [endingMoved, setSearchParams]);
  const supplyRole = canOpenSupply(user?.role);
  const views: LibraryView[] = supplyRole ? ["catalog", "bulk-edit", "imports", "releases", "review", "connectors"] : ["catalog", "bulk-edit", "imports", "releases"];
  const view: LibraryView = requestedView && views.includes(requestedView) ? requestedView : "catalog";
  // Counted again whenever the tab changes, so a decision made on Review shows when leaving it.
  const reviewCount = useLibraryReviewCount(supplyRole);

  const setView = (next: LibraryView) => {
    setSearchParams((current) => {
      const updated = new URLSearchParams(current);
      updated.set("section", "library-manager");
      updated.set("libraryView", next);
      updated.delete("component");
      updated.delete("componentTab");
      updated.delete("revision");
      updated.delete("compare");
      return updated;
    });
  };

  const openComponent = (id: string, tab = "overview", returnView: LibraryView = "catalog") => {
    setSearchParams((current) => {
      const updated = new URLSearchParams(current);
      updated.set("section", "library-manager");
      updated.set("libraryView", returnView);
      updated.set("component", id);
      updated.set("componentTab", tab);
      updated.delete("revision");
      updated.delete("compare");
      return updated;
    });
  };

  const closeComponent = () => {
    setSearchParams((current) => {
      const updated = new URLSearchParams(current);
      updated.delete("component");
      updated.delete("componentTab");
      updated.delete("revision");
      updated.delete("compare");
      updated.set("section", "library-manager");
      if (!updated.get("libraryView")) updated.set("libraryView", "catalog");
      return updated;
    });
  };

  if (componentId) {
    return <Suspense fallback={<div className="flex h-full items-center justify-center text-sm text-muted-foreground">Opening component workspace…</div>}><LibraryComponentWorkspace componentId={componentId} user={user} projects={projects} onBack={closeComponent} /></Suspense>;
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex h-11 shrink-0 items-center overflow-x-auto border-b bg-card px-2">
        {/* Manual activation, as in the studios: arrows move focus, a click or
            Enter selects. */}
        <Tabs value={view} activationMode="manual" className="shrink-0">
          <StudioTabsList aria-label="Library Manager sections">
            {views.map((item) => {
              const Icon = VIEW_ICONS[item];
              return (
                <StudioTabsTrigger
                  key={item}
                  value={item}
                  className="gap-1.5"
                  onClick={() => setView(item)}
                >
                  <Icon className="size-3.5" aria-hidden />
                  {VIEW_LABELS[item]}
                  {item === "review" && reviewCount ? <span className="rounded-full bg-primary px-1.5 text-xs text-primary-foreground" aria-label={`${reviewCount} waiting`}>{reviewCount}</span> : null}
                </StudioTabsTrigger>
              );
            })}
          </StudioTabsList>
        </Tabs>
      </header>
      <Suspense fallback={<div className="flex h-full items-center justify-center text-sm text-muted-foreground">Loading library workspace…</div>}>
      <div className="min-h-0 flex-1 overflow-hidden">
        {view === "catalog" && <LibraryCatalogWorkspace user={user} onOpenComponent={(id) => openComponent(id, "overview", "catalog")} />}
        {view === "bulk-edit" && <LibraryBulkEditWorkspace user={user} />}
        {view === "imports" && <LibraryImportCenter projects={projects} user={user} initialSessionId={searchParams.get("session") || undefined} />}
        {view === "releases" && <LibraryReleaseQueue onOpenComponent={(id) => openComponent(id, "review", "releases")} />}
        {view === "review" && <LibraryReviewView user={user} />}
        {view === "connectors" && <LibraryConnectorsView user={user} />}
      </div>
      </Suspense>
    </div>
  );
}
