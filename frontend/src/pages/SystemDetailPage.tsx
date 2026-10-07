import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Archive, ArrowLeft, Boxes, CircleAlert, GitPullRequestArrow, TriangleAlert } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SystemTabContent } from "@/features/system-builder/system-tab-content";
import { SYSTEM_TABS, systemTabFromParam, type SystemTab } from "@/features/system-builder/system-tabs";
import { useSystemDocument } from "@/features/system-builder/use-system-document";
import { canManageProjects } from "@/lib/roles";
import type { User } from "@/types/auth";

interface SystemDetailPageProps {
  user: User | null;
}

export function SystemDetailPage({ user }: SystemDetailPageProps) {
  const { systemId = "" } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = systemTabFromParam(searchParams.get("tab"));
  const state = useSystemDocument(systemId);
  const system = state.document?.system ?? null;
  // D-P2-31: an archived system is kept for the parents that froze it, and takes no changes.
  const archived = Boolean(system?.archivedAt);
  const canEdit = canManageProjects(user?.role) && !archived;

  /** Switch tab; per-tab selections (`board`, `link`, …) belong to their tab and are replaced. */
  const setTab = (next: SystemTab, extra: Record<string, string> = {}) => {
    setSearchParams(() => {
      const params = new URLSearchParams();
      if (next !== "overview") {
        params.set("tab", next);
      }
      for (const [key, value] of Object.entries(extra)) {
        params.set(key, value);
      }
      return params;
    });
  };

  const back = () => navigate(system?.folderId ? `/?folder=${encodeURIComponent(system.folderId)}` : "/");

  if (state.notFound) {
    return (
      <div className="flex h-app-viewport flex-col items-center justify-center gap-3 bg-background text-center">
        <p className="text-lg font-semibold">System not found</p>
        <p className="text-sm text-muted-foreground">It may have been deleted, or it is in a folder you cannot see.</p>
        <Button variant="outline" onClick={() => navigate("/")}>Back to workspace</Button>
      </div>
    );
  }

  const counts = state.document?.findingCounts;
  return (
    <div className="flex h-app-viewport flex-col bg-background">
      <header className="flex items-center gap-4 border-b px-4 py-4 md:px-6">
        <Button variant="ghost" size="sm" onClick={back}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <Boxes className="h-5 w-5 shrink-0 text-primary" />
          <div className="min-w-0">
            <h1 className="truncate text-xl font-bold">{system?.name ?? ""}</h1>
            {system?.description && (
              <p className="hidden truncate text-sm text-muted-foreground md:block">{system.description}</p>
            )}
          </div>
        </div>
        {system && (
          <div className="flex shrink-0 items-center gap-2">
            {archived && (
              <Badge variant="secondary" title="Kept because parent systems or the catalog still reference it">
                <Archive /> Archived · read-only
              </Badge>
            )}
            {system.openReviewCount > 0 && (
              <button type="button" onClick={() => setTab("changes")} aria-label="Open source changes">
                <Badge variant="warning" className="cursor-pointer">
                  <GitPullRequestArrow /> {system.openReviewCount} to review
                </Badge>
              </button>
            )}
            {counts && counts.error > 0 && (
              <Badge variant="destructive"><CircleAlert /> {counts.error} {counts.error === 1 ? "error" : "errors"}</Badge>
            )}
            {counts && counts.warning > 0 && (
              <Badge variant="warning"><TriangleAlert /> {counts.warning} {counts.warning === 1 ? "warning" : "warnings"}</Badge>
            )}
          </div>
        )}
      </header>

      <Tabs value={tab} onValueChange={(value) => setTab(value as SystemTab)} className="border-b px-4 pb-1 pt-1 md:px-6">
        <TabsList variant="line" aria-label="System sections" className="h-9 overflow-x-auto">
          {SYSTEM_TABS.map((item) => (
            <TabsTrigger key={item.id} value={item.id} className="px-3 text-sm">
              {item.label}
              {item.id === "changes" && (system?.openReviewCount ?? 0) > 0 && (
                <Badge variant="warning" className="h-5 px-1.5 tabular-nums">{system?.openReviewCount}</Badge>
              )}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <main className="min-h-0 flex-1 overflow-auto">
        {state.error && !state.document ? (
          <div className="m-6 rounded-md border border-destructive/40 p-4 text-sm text-destructive" role="alert">
            {state.error}
            <Button variant="outline" size="sm" className="ml-3" onClick={() => void state.reload()}>Retry</Button>
          </div>
        ) : state.document && state.etag ? (
          <SystemTabContent
            tab={tab}
            systemId={systemId}
            document={state.document}
            etag={state.etag}
            canEdit={canEdit}
            user={user}
            reload={state.reload}
            onNavigate={setTab}
          />
        ) : (
          <div className="p-6 text-sm text-muted-foreground">Loading…</div>
        )}
      </main>
    </div>
  );
}
