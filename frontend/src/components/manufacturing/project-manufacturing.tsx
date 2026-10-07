import { useCallback, useEffect, useState } from "react";
import {
    Factory,
    Sparkles,
    Plus,
    PlusCircle,
    Settings2,
    ChevronDown,
    ChevronRight,
    FileDown,
    Trash2,
    Pencil,
    MoreHorizontal,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
    extractBoardSpec,
    listRuns,
    listManufacturers,
    listProjectManufacturers,
    attachManufacturer,
    detachManufacturer,
    getProjectSpec,
    getProjectSpecForManufacturer,
    updateProjectSpec,
    updateTemplate,
    applyTemplateToSpec,
    listTemplates,
    downloadSpecSheet,
    getPcbRuleFields,
    extractPcbRules,
} from "@/lib/manufacturing";
import {
    effectiveFieldValue,
    evaluateCondition,
    sectionProgress,
    specProgress,
    visibleFields,
    type CapabilityMeta,
    type Manufacturer,
    type ManufacturingRun,
    type ParsedSpecConfig,
    type PcbRuleField,
    type ProjectManufacturer,
    type SpecFieldDef,
    type SpecSectionDef,
    type SpecTemplate,
} from "@/types/manufacturing";
import { SchemaCapabilitiesDialog } from "./spec-config-editor";
import { NewProductionDialog } from "./new-production-dialog";
import { ProductionList } from "./production-list";
import { DEFAULT_FILTERS, type ProductionFilters } from "./production-filters";
import { RunDrawer } from "./run-drawer";
import { CapabilityCheck } from "./capability-check";
import { OptionRow, ProvenanceMarker, type Provenance } from "./option-row";
import { SaveBar, useBeforeUnloadWhen } from "./save-bar";
import { RunStatusBadge } from "./status-badge";
import { CompactSelect } from "./ui";

interface ProjectManufacturingProps {
    projectId: string;
    canEdit: boolean;
    /** QA can act on defects even without edit rights. Defaults to `canEdit`. */
    canLogDefects?: boolean;
    /** QA and admin advance a production's status. */
    canChangeStatus?: boolean;
    /** Shown in the new-production dialog; falls back to the id. */
    projectName?: string;
}

type SpecValues = Record<string, unknown>;
type SubTab = "specs" | "production";

export function ProjectManufacturing({
    projectId,
    canEdit,
    canLogDefects = canEdit,
    canChangeStatus = false,
    projectName,
}: ProjectManufacturingProps) {
    const [subTab, setSubTab] = useState<SubTab>("specs");

    // Productions open in place: a drawer over the list, a full page on request,
    // and the new-production dialog with this project (and manufacturer) filled in.
    const [filters, setFilters] = useState<ProductionFilters>(DEFAULT_FILTERS);
    const [drawerRunId, setDrawerRunId] = useState<string | null>(null);
    const [newRunOpen, setNewRunOpen] = useState(false);

    // Navigation: which attached manufacturer is selected. Each has one spec.
    const [manufacturers, setManufacturers] = useState<ProjectManufacturer[]>([]);
    const [manufacturerId, setManufacturerId] = useState<string>("");
    const [specId, setSpecId] = useState<string>("");

    // The selected spec's form state.
    const [values, setValues] = useState<SpecValues>({});
    const [source, setSource] = useState<Record<string, string>>({});
    const [schema, setSchema] = useState<ParsedSpecConfig>({ sections: [], errors: [] });
    const [runs, setRuns] = useState<ManufacturingRun[]>([]);
    const [loading, setLoading] = useState(true);
    const [specLoading, setSpecLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [extracting, setExtracting] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [dirty, setDirty] = useState(false);
    const [editorOpen, setEditorOpen] = useState(false);
    const [allManufacturers, setAllManufacturers] = useState<Manufacturer[]>([]);
    const [ruleFields, setRuleFields] = useState<PcbRuleField[]>([]);
    // The selected spec's linked-process capabilities (read live from getProjectSpec).
    const [templateCapabilities, setTemplateCapabilities] = useState<Record<string, number>>({});
    const [templateCapabilityMeta, setTemplateCapabilityMeta] = useState<Record<string, CapabilityMeta>>({});
    const [templateName, setTemplateName] = useState<string | null>(null);
    // The id of the spec's linked process, needed to edit its capability text.
    const [templateId, setTemplateId] = useState<string | null>(null);
    // The selected manufacturer's processes, offered to swap the one spec's fields.
    const [templates, setTemplates] = useState<SpecTemplate[]>([]);
    const [applyingTemplate, setApplyingTemplate] = useState(false);
    // The board's own extracted rules, read automatically for the capability check.
    const [boardRules, setBoardRules] = useState<Record<string, unknown> | null>(null);
    // Which optional sections are switched on (persisted with the spec).
    const [activeSections, setActiveSections] = useState<Set<string>>(new Set());
    // Which sections are collapsed in the UI (per-session, not persisted).
    const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

    // Switching manufacturer while the form has unsaved edits asks first.
    const [pendingNav, setPendingNav] = useState<(() => void) | null>(null);
    // A process the user picked, waiting for confirmation.
    const [pendingProcessId, setPendingProcessId] = useState<string | null>(null);
    const [detachTarget, setDetachTarget] = useState<ProjectManufacturer | null>(null);
    const [detaching, setDetaching] = useState(false);

    useBeforeUnloadWhen(dirty);

    // Re-read just the runs after a change, without blanking the whole tab.
    const reloadRuns = useCallback(async () => {
        try {
            setRuns(await listRuns(projectId));
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to refresh production.");
        }
    }, [projectId]);

    useEffect(() => {
        void getPcbRuleFields()
            .then(({ fields }) => setRuleFields(fields))
            .catch(() => setRuleFields([]));
    }, []);

    // Auto-extract the board's PCB rules once, so the capability check can compare
    // against them without the user having to ask. Silent: a board with no
    // readable rules just leaves the comparison empty.
    useEffect(() => {
        let cancelled = false;
        void extractPcbRules(projectId)
            .then(({ rules }) => !cancelled && setBoardRules(rules))
            .catch(() => !cancelled && setBoardRules(null));
        return () => {
            cancelled = true;
        };
    }, [projectId]);

    // Load the project-level pieces: attached manufacturers, the runs, and the
    // global directory (for the "attach manufacturer" picker).
    const load = useCallback(async () => {
        setLoading(true);
        try {
            const [attached, runList, all] = await Promise.all([
                listProjectManufacturers(projectId),
                listRuns(projectId),
                listManufacturers().catch(() => [] as Manufacturer[]),
            ]);
            setManufacturers(attached);
            setRuns(runList);
            setAllManufacturers(all);
            // Keep the current manufacturer selection if still attached, else pick the first.
            setManufacturerId((current) =>
                attached.some((m) => m.id === current) ? current : (attached[0]?.id ?? ""),
            );
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to load manufacturing data.");
        } finally {
            setLoading(false);
        }
    }, [projectId]);

    useEffect(() => {
        void load();
    }, [load]);

    // Each manufacturer has exactly one spec, created on first read. Load it, and
    // its manufacturer's processes so the picker can swap which one it uses.
    useEffect(() => {
        if (!manufacturerId) {
            setSpecId("");
            setTemplates([]);
            return;
        }
        let cancelled = false;
        void (async () => {
            try {
                const spec = await getProjectSpecForManufacturer(projectId, manufacturerId);
                if (!cancelled) setSpecId(spec.id);
            } catch {
                if (!cancelled) setSpecId("");
            }
        })();
        void (async () => {
            try {
                const list = await listTemplates(manufacturerId);
                if (!cancelled) setTemplates(list);
            } catch {
                if (!cancelled) setTemplates([]);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [projectId, manufacturerId]);

    // When the selected spec changes, load its fields and values into the form.
    useEffect(() => {
        if (!specId) {
            setValues({});
            setSource({});
            setSchema({ sections: [], errors: [] });
            setActiveSections(new Set());
            setTemplateCapabilities({});
            setTemplateCapabilityMeta({});
            setTemplateName(null);
            setTemplateId(null);
            setDirty(false);
            return;
        }
        let cancelled = false;
        setSpecLoading(true);
        void (async () => {
            try {
                const spec = await getProjectSpec(specId);
                if (cancelled) return;
                setValues(spec.specs ?? {});
                setSource(spec.source ?? {});
                setSchema(spec.parsed);
                setActiveSections(new Set(spec.active_sections ?? []));
                setTemplateCapabilities(spec.template_capabilities ?? {});
                setTemplateCapabilityMeta(spec.template_capability_meta ?? {});
                setTemplateName(spec.template_name ?? null);
                setTemplateId(spec.template_id ?? null);
                setDirty(false);
            } catch (error) {
                if (!cancelled) toast.error(error instanceof Error ? error.message : "Failed to load the spec.");
            } finally {
                if (!cancelled) setSpecLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [specId]);

    const setField = (key: string, value: unknown, provenance: string = "manual") => {
        setValues((current) => ({ ...current, [key]: value }));
        setSource((current) => ({ ...current, [key]: provenance }));
        setDirty(true);
    };

    const handleExtract = async () => {
        setExtracting(true);
        try {
            const { suggested, reason } = await extractBoardSpec(projectId);
            const keys = Object.keys(suggested);
            if (keys.length === 0) {
                toast.info(reason ?? "Nothing could be read from the board.");
                return;
            }
            setValues((current) => ({ ...current, ...suggested }));
            setSource((current) => {
                const next = { ...current };
                for (const key of keys) next[key] = "extracted";
                return next;
            });
            setDirty(true);
            toast.success(`Filled ${keys.length} field(s) from the board. Review and save.`);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to read the board.");
        } finally {
            setExtracting(false);
        }
    };

    const handleSave = async () => {
        if (!specId) return;
        setSaving(true);
        try {
            await updateProjectSpec(specId, { specs: values, source, active_sections: [...activeSections] });
            setDirty(false);
            toast.success("Spec saved.");
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to save.");
        } finally {
            setSaving(false);
        }
    };

    const toggleCollapsed = (title: string) => {
        setCollapsed((prev) => {
            const next = new Set(prev);
            if (next.has(title)) next.delete(title);
            else next.add(title);
            return next;
        });
    };

    const toggleSectionActive = (title: string, on: boolean) => {
        setActiveSections((prev) => {
            const next = new Set(prev);
            if (on) next.add(title);
            else next.delete(title);
            return next;
        });
        setDirty(true);
    };

    const handleDownloadPdf = async () => {
        setDownloading(true);
        try {
            await downloadSpecSheet(projectId, specId || undefined);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to download the spec sheet.");
        } finally {
            setDownloading(false);
        }
    };

    // Reload the current spec into the form (after a process swap, an edit, or a
    // discard) so fields, values, and capabilities match what is saved.
    const reloadSpec = useCallback(async () => {
        if (!specId) return;
        const spec = await getProjectSpec(specId);
        setValues(spec.specs ?? {});
        setSource(spec.source ?? {});
        setSchema(spec.parsed);
        setActiveSections(new Set(spec.active_sections ?? []));
        setTemplateCapabilities(spec.template_capabilities ?? {});
        setTemplateCapabilityMeta(spec.template_capability_meta ?? {});
        setTemplateName(spec.template_name ?? null);
        setTemplateId(spec.template_id ?? null);
        setDirty(false);
    }, [specId]);

    const handleDiscard = async () => {
        try {
            await reloadSpec();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to reload the spec.");
        }
    };

    // Swap which of the manufacturer's processes this one spec uses. Re-links the
    // spec so its fields and capabilities both move to the chosen process.
    const applyProcess = async (id: string) => {
        if (!specId) return;
        setApplyingTemplate(true);
        try {
            await applyTemplateToSpec(specId, id);
            await reloadSpec();
            toast.success("Process applied.");
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to apply process.");
        } finally {
            setApplyingTemplate(false);
        }
    };

    const handleAttach = async (id: string) => {
        try {
            await attachManufacturer(projectId, id);
            await load();
            setManufacturerId(id);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to add manufacturer.");
        }
    };

    const handleDetach = async (id: string) => {
        setDetaching(true);
        try {
            await detachManufacturer(projectId, id);
            setDetachTarget(null);
            await load();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to remove manufacturer.");
        } finally {
            setDetaching(false);
        }
    };

    const selectManufacturer = (id: string) => {
        if (id === manufacturerId) return;
        if (dirty) setPendingNav(() => () => setManufacturerId(id));
        else setManufacturerId(id);
    };

    if (loading) {
        return <div className="text-sm text-muted-foreground">Loading manufacturing...</div>;
    }

    const hasFields = schema.sections.some((s) => s.fields.length > 0);
    const attachedIds = new Set(manufacturers.map((m) => m.id));
    const attachable = allManufacturers.filter((m) => !attachedIds.has(m.id));
    const selectedManufacturer = manufacturers.find((m) => m.id === manufacturerId) ?? null;
    const manufacturerRuns = runs.filter((r) => r.manufacturer_id === manufacturerId);
    // The latest production that actually went ahead: a cancelled one says nothing about the fab.
    const lastRun =
        [...manufacturerRuns]
            .filter((r) => r.status !== "cancelled")
            .sort((a, b) => b.created_at.localeCompare(a.created_at))[0] ?? null;
    const progress = specProgress(schema.sections, values, activeSections);
    const pendingProcess = templates.find((t) => t.id === pendingProcessId) ?? null;

    return (
        <div className="flex flex-col gap-4">
            <Tabs value={subTab} onValueChange={(next) => setSubTab(next as SubTab)} className="gap-0 border-b">
                <TabsList variant="line" className="h-10 gap-2" aria-label="Manufacturing sections">
                    <TabsTrigger value="specs" className="gap-2 px-2 text-sm">
                        <Settings2 className="h-4 w-4" />
                        Specs
                    </TabsTrigger>
                    <TabsTrigger value="production" className="gap-2 px-2 text-sm">
                        <Factory className="h-4 w-4" />
                        Production
                        {runs.length > 0 && (
                            <Badge variant="outline" className="px-1 text-[10px]">
                                {runs.length}
                            </Badge>
                        )}
                    </TabsTrigger>
                </TabsList>
            </Tabs>

            {subTab === "production" ? (
                <section className="flex min-h-[24rem] flex-col gap-3">
                    <ProductionList
                        runs={runs}
                        filters={filters}
                        onFiltersChange={setFilters}
                        selectedId={drawerRunId}
                        onOpen={setDrawerRunId}
                        hideProject
                        actions={
                            canEdit ? (
                                <Button size="sm" onClick={() => setNewRunOpen(true)}>
                                    <PlusCircle className="mr-1.5 h-3.5 w-3.5" />
                                    New production
                                </Button>
                            ) : undefined
                        }
                        emptyAction={
                            canEdit ? (
                                <Button size="sm" onClick={() => setNewRunOpen(true)}>
                                    <PlusCircle className="mr-1.5 h-3.5 w-3.5" />
                                    New production
                                </Button>
                            ) : undefined
                        }
                    />
                </section>
            ) : (
                <>
                    {/* Which manufacturer's spec is shown. */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        {manufacturers.length > 0 ? (
                            <div role="tablist" aria-label="Manufacturers" className="flex flex-wrap gap-1">
                                {manufacturers.map((m) => (
                                    <button
                                        key={m.id}
                                        type="button"
                                        role="tab"
                                        aria-selected={m.id === manufacturerId}
                                        onClick={() => selectManufacturer(m.id)}
                                        className={cn(
                                            "border px-3 py-1.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                                            m.id === manufacturerId
                                                ? "border-primary bg-secondary font-medium"
                                                : "text-muted-foreground hover:bg-muted/40 hover:text-foreground",
                                        )}
                                    >
                                        {m.name}
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <span />
                        )}
                        <div className="flex items-center gap-2">
                            {canEdit && attachable.length > 0 && (
                                <Select
                                    value=""
                                    onValueChange={(id) => {
                                        if (id) void handleAttach(id);
                                    }}
                                >
                                    <SelectTrigger size="sm" aria-label="Add a manufacturer" className="w-auto">
                                        <Plus className="h-3.5 w-3.5" />
                                        <SelectValue placeholder="Add manufacturer" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {attachable.map((m) => (
                                            <SelectItem key={m.id} value={m.id}>
                                                {m.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                            {selectedManufacturer && canEdit && (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="outline"
                                            size="icon-sm"
                                            aria-label={`Actions for ${selectedManufacturer.name}`}
                                        >
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        {specId && (
                                            <DropdownMenuItem onSelect={() => setEditorOpen(true)}>
                                                <Pencil className="h-4 w-4" />
                                                Edit process
                                            </DropdownMenuItem>
                                        )}
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            className="text-destructive focus:text-destructive"
                                            onSelect={() => setDetachTarget(selectedManufacturer)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                            Remove from project
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            )}
                        </div>
                    </div>

                    {!selectedManufacturer ? (
                        <div className="flex flex-col items-center gap-2 border p-10 text-center text-muted-foreground">
                            <Factory className="h-8 w-8 opacity-50" />
                            <p className="text-sm">
                                No manufacturers on this project yet.
                                {canEdit
                                    ? attachable.length > 0
                                        ? " Add one above to set its fabrication specs."
                                        : " None exist yet: add one from Manufacturing in the sidebar, then attach it here."
                                    : ""}
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Process and the actions on this manufacturer's spec. */}
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-sm text-muted-foreground">Process</span>
                                    {templates.length > 0 ? (
                                        <Select
                                            value={templateId ?? ""}
                                            onValueChange={(id) => {
                                                if (specId && id && id !== templateId) setPendingProcessId(id);
                                            }}
                                            disabled={!canEdit || !specId || applyingTemplate}
                                        >
                                            <SelectTrigger size="sm" aria-label="Process" className="w-auto min-w-[12rem]">
                                                <SelectValue placeholder="Custom (no process)" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {templates.map((t) => (
                                                    <SelectItem key={t.id} value={t.id}>
                                                        {t.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    ) : (
                                        <span className="text-sm text-muted-foreground">
                                            No processes defined for {selectedManufacturer.name}.
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => void handleDownloadPdf()}
                                        disabled={downloading}
                                    >
                                        <FileDown className="mr-1.5 h-3.5 w-3.5" />
                                        PDF spec sheet
                                    </Button>
                                    {canEdit && specId && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => void handleExtract()}
                                            disabled={extracting}
                                        >
                                            <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                                            {extracting ? "Reading..." : "Fill from board"}
                                        </Button>
                                    )}
                                </div>
                            </div>

                            <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
                                {/* The spec form */}
                                <section className="min-w-0 space-y-3">
                                    {!specId ? (
                                        <div className="flex flex-col items-center gap-3 border p-10 text-center text-muted-foreground">
                                            <Settings2 className="h-8 w-8 opacity-50" />
                                            <p className="text-sm">Loading {selectedManufacturer.name}&rsquo;s spec...</p>
                                        </div>
                                    ) : specLoading ? (
                                        <div className="border p-10 text-center text-sm text-muted-foreground">
                                            Loading spec...
                                        </div>
                                    ) : !hasFields ? (
                                        <div className="flex flex-col items-center gap-3 border p-10 text-center text-muted-foreground">
                                            <Settings2 className="h-8 w-8 opacity-50" />
                                            <p className="text-sm">
                                                This process defines no fields yet.
                                                {canEdit ? " Open “Edit process” to add some." : ""}
                                            </p>
                                        </div>
                                    ) : (
                                        <>
                                            {schema.errors.length > 0 && (
                                                <div className="border border-destructive/40 bg-destructive/10 p-2.5 text-sm text-destructive">
                                                    The process has {schema.errors.length} problem(s). Some fields may be
                                                    missing until you fix it.
                                                </div>
                                            )}
                                            {schema.sections
                                                .filter((section) => evaluateCondition(section.when, values))
                                                .map((section) => (
                                                    <SpecSection
                                                        key={section.title}
                                                        section={section}
                                                        values={values}
                                                        source={source}
                                                        collapsed={collapsed.has(section.title)}
                                                        active={!section.optional || activeSections.has(section.title)}
                                                        canEdit={canEdit}
                                                        onToggleCollapsed={() => toggleCollapsed(section.title)}
                                                        onToggleActive={(on) => toggleSectionActive(section.title, on)}
                                                        onChange={(key, value) => setField(key, value)}
                                                    />
                                                ))}
                                        </>
                                    )}
                                    {canEdit && specId && dirty && (
                                        <SaveBar
                                            saving={saving}
                                            onSave={() => void handleSave()}
                                            onDiscard={() => void handleDiscard()}
                                        />
                                    )}
                                </section>

                                {/* Summary: the capability check and where this spec stands. */}
                                <aside className="space-y-4 lg:sticky lg:top-2">
                                    <CapabilityCheck
                                        fields={ruleFields}
                                        capabilities={templateCapabilities}
                                        meta={templateCapabilityMeta}
                                        boardRules={boardRules}
                                        processName={templateName}
                                    />
                                    <section className="border">
                                        <div className="border-b bg-muted/30 px-4 py-2.5">
                                            <h3 className="text-sm font-medium">Spec</h3>
                                        </div>
                                        <div className="space-y-3 px-4 py-3">
                                            {progress.total > 0 ? (
                                                <div className="space-y-1.5">
                                                    <p className="text-sm">
                                                        <span className="font-medium tabular-nums">{progress.set}</span> of{" "}
                                                        <span className="tabular-nums">{progress.total}</span> fields set
                                                    </p>
                                                    <div
                                                        className="h-1.5 bg-muted"
                                                        role="progressbar"
                                                        aria-label="Spec completeness"
                                                        aria-valuemin={0}
                                                        aria-valuemax={progress.total}
                                                        aria-valuenow={progress.set}
                                                    >
                                                        <div
                                                            className="h-full bg-primary"
                                                            style={{ width: `${(progress.set / progress.total) * 100}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            ) : (
                                                <p className="text-sm text-muted-foreground">No fields to fill in.</p>
                                            )}
                                            <div className="border-t pt-3">
                                                <p className="mb-1.5 text-xs text-muted-foreground">Last production</p>
                                                {lastRun ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => setDrawerRunId(lastRun.id)}
                                                        className="flex w-full items-center justify-between gap-2 text-left hover:underline"
                                                    >
                                                        <span className="min-w-0 truncate text-sm">
                                                            {lastRun.job_number || new Date(lastRun.created_at).toLocaleDateString()}
                                                        </span>
                                                        <span className="flex shrink-0 items-center gap-2">
                                                            <RunStatusBadge status={lastRun.status} />
                                                            <span className="text-xs tabular-nums text-muted-foreground">
                                                                {lastRun.quantity_good}/{lastRun.quantity_ordered}
                                                            </span>
                                                        </span>
                                                    </button>
                                                ) : (
                                                    <p className="text-sm text-muted-foreground">
                                                        None with {selectedManufacturer.name} yet.
                                                    </p>
                                                )}
                                            </div>
                                            {canEdit && (
                                                <Button size="sm" className="w-full" onClick={() => setNewRunOpen(true)}>
                                                    <PlusCircle className="mr-1.5 h-3.5 w-3.5" />
                                                    Start production
                                                </Button>
                                            )}
                                        </div>
                                    </section>
                                </aside>
                            </div>
                        </>
                    )}
                </>
            )}

            <ConfirmDialog
                open={pendingNav !== null}
                onOpenChange={(open) => !open && setPendingNav(null)}
                title="Discard unsaved changes?"
                description="This spec has edits that are not saved. Switching now loses them."
                confirmLabel="Discard changes"
                onConfirm={() => {
                    const go = pendingNav;
                    setPendingNav(null);
                    setDirty(false);
                    go?.();
                }}
            />

            <ConfirmDialog
                open={pendingProcessId !== null}
                onOpenChange={(open) => !open && setPendingProcessId(null)}
                title={`Switch to ${pendingProcess?.name ?? "this process"}?`}
                description={
                    <>
                        This spec&rsquo;s fields are replaced by the new process&rsquo;s fields, so any edits made to the
                        fields themselves are lost. Values for fields the new process does not have are hidden but kept.
                        {dirty ? " Your unsaved changes to this spec are also discarded." : ""}
                    </>
                }
                confirmLabel="Switch process"
                destructive={false}
                onConfirm={() => {
                    const id = pendingProcessId;
                    setPendingProcessId(null);
                    if (id) void applyProcess(id);
                }}
            />

            <ConfirmDialog
                open={detachTarget !== null}
                onOpenChange={(open) => !open && setDetachTarget(null)}
                title="Remove manufacturer from this project?"
                description={
                    <>
                        {detachTarget?.name} is removed from this project. Its spec and its production are kept and
                        come back if you add it again.
                    </>
                }
                confirmLabel="Remove"
                busy={detaching}
                onConfirm={() => detachTarget && void handleDetach(detachTarget.id)}
            />

            <RunDrawer
                runId={drawerRunId}
                canEdit={canEdit}
                canLogDefects={canLogDefects}
                canChangeStatus={canChangeStatus}
                onClose={() => setDrawerRunId(null)}
                onDeleted={() => {
                    setDrawerRunId(null);
                    void reloadRuns();
                }}
                onChanged={() => void reloadRuns()}
            />

            {newRunOpen && (
                <NewProductionDialog
                    open
                    projects={[{ id: projectId, name: projectName ?? projectId }]}
                    initialProjectId={projectId}
                    initialManufacturerId={manufacturerId || undefined}
                    onClose={() => setNewRunOpen(false)}
                    onCreated={(runId) => {
                        setNewRunOpen(false);
                        void reloadRuns();
                        setSubTab("production");
                        setDrawerRunId(runId);
                    }}
                />
            )}

            {editorOpen && specId && (
                <SchemaCapabilitiesDialog
                    title="Edit process"
                    description="Fields are shown on this spec's form. Capabilities belong to the process and are shared by every spec using it."
                    saveLabel="Save"
                    tabs={[
                        {
                            id: "schema",
                            label: "Fields",
                            fileBaseName: "spec-schema",
                            load: async () => {
                                const spec = await getProjectSpec(specId);
                                return { text: spec.spec_config, parsed: spec.parsed };
                            },
                            save: async (text) => {
                                await updateProjectSpec(specId, { spec_config: text });
                                const { previewSpecConfig } = await import("@/lib/manufacturing");
                                return previewSpecConfig(text);
                            },
                            // No in-editor "apply process" picker: it overwrote the
                            // open spec's fields. To switch process, use the Process
                            // selector instead.
                        },
                        {
                            id: "capabilities",
                            label: "Capabilities",
                            fileBaseName: "spec-capabilities",
                            // Capabilities belong to the linked process.
                            disabledNote: templateId
                                ? undefined
                                : "This spec is not linked to a process, so it has no capabilities to edit. Pick a process from the selector to get one.",
                            load: async () => {
                                const { previewSpecConfig, getTemplate } = await import("@/lib/manufacturing");
                                if (!templateId) return { text: "", parsed: { sections: [], errors: [] } };
                                const tmpl = await getTemplate(templateId);
                                const text = tmpl.capability_config ?? "";
                                return { text, parsed: await previewSpecConfig(text) };
                            },
                            save: async (text) => {
                                const { previewSpecConfig } = await import("@/lib/manufacturing");
                                if (templateId) await updateTemplate(templateId, { capability_config: text });
                                return previewSpecConfig(text);
                            },
                        },
                    ]}
                    onClose={() => setEditorOpen(false)}
                    onSaved={() => {
                        setEditorOpen(false);
                        // Reload the spec into the form so new fields and capabilities appear.
                        void reloadSpec();
                    }}
                />
            )}
        </div>
    );
}

interface SpecSectionProps {
    section: SpecSectionDef;
    values: SpecValues;
    source: Record<string, string>;
    collapsed: boolean;
    active: boolean;
    canEdit: boolean;
    onToggleCollapsed: () => void;
    onToggleActive: (on: boolean) => void;
    onChange: (key: string, value: unknown) => void;
}

// One section of the spec form, as a card: a title with how many of its fields
// are set, then label-left rows. An optional section has an Include switch and
// folds to its header while excluded.
function SpecSection({
    section,
    values,
    source,
    collapsed,
    active,
    canEdit,
    onToggleCollapsed,
    onToggleActive,
    onChange,
}: SpecSectionProps) {
    const showBody = active && !collapsed;
    // Fields whose gate is unsatisfied are hidden, so options only appear when
    // their controlling field has the right value.
    const fields = visibleFields(section, values);
    const progress = sectionProgress(section, values);
    const sectionKeys = new Set(section.fields.map((f) => f.key));
    return (
        <section className={cn("border", !active && "bg-muted/20")}>
            <div className="flex items-center justify-between gap-3 px-4 py-2.5">
                <button
                    type="button"
                    onClick={onToggleCollapsed}
                    className={cn(
                        "flex min-w-0 items-center gap-1.5 text-sm font-medium hover:text-foreground",
                        !active && "text-muted-foreground",
                    )}
                    aria-expanded={showBody}
                >
                    {showBody ? (
                        <ChevronDown className="h-3.5 w-3.5 shrink-0" />
                    ) : (
                        <ChevronRight className="h-3.5 w-3.5 shrink-0" />
                    )}
                    <span className="truncate">{section.title}</span>
                    {section.optional && (
                        <span className="rounded-none bg-muted px-1.5 py-0.5 text-[10px] font-normal text-muted-foreground">
                            optional
                        </span>
                    )}
                </button>

                <div className="flex shrink-0 items-center gap-3">
                    {active && progress.total > 0 && (
                        <span className="text-xs tabular-nums text-muted-foreground">
                            {progress.set} of {progress.total} set
                        </span>
                    )}
                    {section.optional && (
                        <button
                            type="button"
                            role="switch"
                            aria-checked={active}
                            aria-label={`Enable ${section.title}`}
                            disabled={!canEdit}
                            onClick={() => onToggleActive(!active)}
                            className={`relative inline-flex h-4 w-7 shrink-0 items-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                                active ? "bg-primary" : "bg-muted-foreground/30"
                            }`}
                        >
                            <span
                                className={`inline-block h-3 w-3 transform rounded-full bg-background shadow transition-transform ${
                                    active ? "translate-x-3.5" : "translate-x-0.5"
                                }`}
                            />
                        </button>
                    )}
                </div>
            </div>

            {showBody && (
                <div className="border-t px-4 py-2">
                    {fields.map((field) => (
                        <SpecFieldRow
                            key={field.key}
                            field={field}
                            value={values[field.key]}
                            provenance={provenanceOf(field, values, source)}
                            // A sub-option, drawn under the field that unlocks it.
                            nested={Boolean(field.when && sectionKeys.has(field.when.key))}
                            disabled={!canEdit}
                            onChange={(v) => onChange(field.key, v)}
                        />
                    ))}
                </div>
            )}
        </section>
    );
}

function provenanceOf(
    field: SpecFieldDef,
    values: SpecValues,
    source: Record<string, string>,
): Provenance | null {
    const stored = values[field.key];
    const hasStored = stored !== undefined && stored !== null && stored !== "";
    if (hasStored) {
        if (source[field.key] === "extracted") return "extracted";
        if (source[field.key] === "manual") return "manual";
        return null;
    }
    return field.default !== undefined && field.default !== null && field.default !== "" ? "default" : null;
}

// A choice with a few short options reads best as buttons side by side; a long
// or crowded list stays a select.
function isShortChoice(field: SpecFieldDef): boolean {
    return field.options.length > 0 && field.options.length <= 5 && field.options.every((o) => o.length <= 14);
}

interface SpecFieldRowProps {
    field: SpecFieldDef;
    value: unknown;
    provenance: Provenance | null;
    nested: boolean;
    disabled: boolean;
    onChange: (value: unknown) => void;
}

function SpecFieldRow({ field, value, provenance, nested, disabled, onChange }: SpecFieldRowProps) {
    const inputId = `spec-${field.key}`;
    // A stored value wins; otherwise fall back to the schema's declared default.
    const effective = effectiveFieldValue(field, { [field.key]: value });
    const isUnset = effective === undefined || effective === null || effective === "";
    const marker = <ProvenanceMarker provenance={provenance} />;

    // Read-only viewers see the values as text, not disabled inputs.
    if (disabled) {
        let text: string;
        if (isUnset) text = "";
        else if (field.type === "bool") text = effective === true || effective === "true" ? "Yes" : "No";
        else text = field.unit ? `${effective} ${field.unit}` : String(effective);
        return (
            <OptionRow label={field.label} marker={marker} nested={nested}>
                {text ? (
                    <span className="text-sm tabular-nums">{text}</span>
                ) : (
                    <span className="text-sm text-muted-foreground">Not set</span>
                )}
            </OptionRow>
        );
    }

    if (field.type === "bool") {
        const selected = isUnset ? "" : effective === true || effective === "true" ? "yes" : "no";
        return (
            <OptionRow label={field.label} htmlFor={inputId} marker={marker} nested={nested}>
                <SegmentedControl
                    id={inputId}
                    aria-label={field.label}
                    value={selected}
                    onChange={(v) => onChange(v === "yes")}
                    options={[
                        { value: "yes", label: "Yes" },
                        { value: "no", label: "No" },
                    ]}
                />
            </OptionRow>
        );
    }

    if (field.type === "choice") {
        // Coerce to a string so a number (e.g. an extracted layer count) matches its
        // string option. An unset value stays "" (nothing selected).
        const selected = isUnset ? "" : String(effective);
        const current = field.options.includes(selected) ? selected : "";
        return (
            <OptionRow label={field.label} htmlFor={inputId} marker={marker} nested={nested}>
                {isShortChoice(field) ? (
                    <SegmentedControl
                        id={inputId}
                        aria-label={field.label}
                        value={current}
                        onChange={(v) => onChange(v || undefined)}
                        options={field.options.map((o) => ({ value: o, label: o }))}
                    />
                ) : (
                    <CompactSelect
                        id={inputId}
                        className="h-8 text-sm"
                        widthClass="w-full max-w-sm"
                        value={current}
                        onChange={(e) => onChange(e.target.value || undefined)}
                    >
                        <option value="">Not set</option>
                        {field.options.map((option) => (
                            <option key={option} value={option}>
                                {option}
                            </option>
                        ))}
                    </CompactSelect>
                )}
            </OptionRow>
        );
    }

    const isNumber = field.type === "int" || field.type === "number";
    return (
        <OptionRow label={field.label} htmlFor={inputId} marker={marker} nested={nested}>
            <div className={cn("relative", isNumber ? "w-40" : "max-w-sm")}>
                <Input
                    id={inputId}
                    type={isNumber ? "number" : "text"}
                    step={field.type === "int" ? 1 : "any"}
                    placeholder="Not set"
                    className={cn("h-8", isNumber && "tabular-nums", field.unit && "pr-10")}
                    value={isUnset ? "" : String(effective)}
                    onChange={(e) => {
                        const raw = e.target.value;
                        if (isNumber) {
                            onChange(raw === "" ? undefined : Number(raw));
                        } else {
                            onChange(raw || undefined);
                        }
                    }}
                />
                {field.unit && (
                    <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                        {field.unit}
                    </span>
                )}
            </div>
        </OptionRow>
    );
}
