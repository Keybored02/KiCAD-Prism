import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Factory, Plus, Building2 } from "lucide-react";
import { toast } from "sonner";

import type { User } from "@/types/auth";
import type { Project } from "@/types/project";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { canManageProjects } from "@/lib/roles";
import { listRuns, listManufacturers } from "@/lib/manufacturing";
import type { Manufacturer, ManufacturingRun } from "@/types/manufacturing";
import { NewProductionDialog, type ProjectOption } from "./new-production-dialog";
import { ProductionList } from "./production-list";
import { filtersFromParams, filtersToParams, type ProductionFilters } from "./production-filters";
import { RunDrawer } from "./run-drawer";
import { RunView } from "./run-view";
import { ManufacturersPanel } from "./manufacturers-panel";

interface ManufacturingDashboardProps {
    user: User | null;
    projects: Project[];
}

type View = "runs" | "manufacturers";

function projectLabel(p: Project): string {
    const name = p.display_name || p.name;
    return p.sub_path && p.sub_path !== "." ? `${name} (${p.sub_path})` : name;
}

export function ManufacturingDashboard({ user, projects }: ManufacturingDashboardProps) {
    const canEdit = canManageProjects(user?.role);
    // QA can act on defects even though it can't create runs.
    const canLogDefects = canEdit || user?.role === "qa";
    // Advancing a run's status is a QA/Admin act, mirroring component QA.
    const canChangeStatus = user?.role === "qa" || user?.role === "admin";

    const [view, setView] = useState<View>("runs");
    const [runs, setRuns] = useState<ManufacturingRun[]>([]);
    const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
    const [loading, setLoading] = useState(true);
    const [addManufacturer, setAddManufacturer] = useState(false);

    // The list's filters and the open run live in the URL, so a link, a refresh
    // and the Back button all land where the user was. `newRunFor` is read once to
    // start a production for a project, then cleared.
    const [searchParams, setSearchParams] = useSearchParams();
    const filters = useMemo(() => filtersFromParams(searchParams), [searchParams]);
    const drawerRunId = searchParams.get("run");
    const [fullRunId, setFullRunId] = useState<string | null>(null);
    const [wizardProjectId] = useState<string | undefined>(() => searchParams.get("newRunFor") ?? undefined);
    const [wizardOpen, setWizardOpen] = useState(() => searchParams.has("newRunFor"));

    const setFilters = useCallback(
        (next: ProductionFilters) =>
            setSearchParams((current) => filtersToParams(current, next), { replace: true }),
        [setSearchParams],
    );

    const openRun = useCallback(
        (runId: string | null) =>
            setSearchParams((current) => {
                const next = new URLSearchParams(current);
                if (runId) next.set("run", runId);
                else next.delete("run");
                return next;
            }),
        [setSearchParams],
    );

    const load = useCallback(async () => {
        try {
            const [runList, mfrs] = await Promise.all([listRuns(), listManufacturers()]);
            setRuns(runList);
            setManufacturers(mfrs);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to load manufacturing.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void load();
    }, [load]);

    useEffect(() => {
        if (!searchParams.has("newRunFor")) return;
        setSearchParams(
            (current) => {
                const next = new URLSearchParams(current);
                next.delete("newRunFor");
                return next;
            },
            { replace: true },
        );
        // Only on mount: the param was consumed by the state initialisers.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const projectOptions: ProjectOption[] = useMemo(
        () => projects.map((p) => ({ id: p.id, name: projectLabel(p) })),
        [projects],
    );

    if (fullRunId) {
        return (
            <RunView
                runId={fullRunId}
                variant="page"
                canEdit={canEdit}
                canLogDefects={canLogDefects}
                canChangeStatus={canChangeStatus}
                onBack={() => {
                    openRun(fullRunId);
                    setFullRunId(null);
                    void load();
                }}
                onDeleted={() => {
                    setFullRunId(null);
                    void load();
                }}
            />
        );
    }

    return (
        <div className="flex h-full min-h-0 flex-col">
            {/* The tab bar is the page title; the page's actions sit at its right. */}
            <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b bg-card px-6">
                <Tabs value={view} onValueChange={(next) => setView(next as View)} className="gap-0">
                    <TabsList variant="line" className="h-10 gap-2" aria-label="Manufacturing sections">
                        <TabsTrigger value="runs" className="gap-2 px-2 text-sm">
                            <Factory className="h-4 w-4" />
                            Production
                        </TabsTrigger>
                        <TabsTrigger value="manufacturers" className="gap-2 px-2 text-sm">
                            <Building2 className="h-4 w-4" />
                            Manufacturers
                        </TabsTrigger>
                    </TabsList>
                </Tabs>
                {canEdit &&
                    (view === "manufacturers" ? (
                        <Button size="sm" onClick={() => setAddManufacturer(true)}>
                            <Plus className="mr-1.5 h-4 w-4" />
                            Add manufacturer
                        </Button>
                    ) : (
                        <Button size="sm" onClick={() => setWizardOpen(true)}>
                            <Plus className="mr-1.5 h-4 w-4" />
                            New production
                        </Button>
                    ))}
            </div>

            {view === "manufacturers" ? (
                <div className="flex min-h-0 flex-1 flex-col px-6 pb-6 pt-3">
                    <ManufacturersPanel
                        manufacturers={manufacturers}
                        canEdit={canEdit}
                        addOpen={addManufacturer}
                        onAddOpenChange={setAddManufacturer}
                        onChanged={() => void load()}
                    />
                </div>
            ) : (
                <div className="flex min-h-0 flex-1 flex-col px-6 pb-6 pt-3">
                    <ProductionList
                        runs={runs}
                        loading={loading}
                        filters={filters}
                        onFiltersChange={setFilters}
                        selectedId={drawerRunId}
                        onOpen={openRun}
                        emptyAction={
                            canEdit ? (
                                <Button size="sm" onClick={() => setWizardOpen(true)}>
                                    <Plus className="mr-1.5 h-4 w-4" />
                                    New production
                                </Button>
                            ) : undefined
                        }
                    />
                </div>
            )}

            <RunDrawer
                runId={drawerRunId}
                canEdit={canEdit}
                canLogDefects={canLogDefects}
                canChangeStatus={canChangeStatus}
                onClose={() => openRun(null)}
                onOpenFull={() => {
                    setFullRunId(drawerRunId);
                    openRun(null);
                }}
                onDeleted={() => {
                    openRun(null);
                    void load();
                }}
                onChanged={() => void load()}
            />

            {wizardOpen && (
                <NewProductionDialog
                    open={wizardOpen}
                    projects={projectOptions}
                    initialProjectId={wizardProjectId}
                    onClose={() => setWizardOpen(false)}
                    onCreated={(runId) => {
                        setWizardOpen(false);
                        void load();
                        openRun(runId);
                    }}
                />
            )}
        </div>
    );
}
