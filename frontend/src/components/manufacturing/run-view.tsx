import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
    ArrowLeft,
    Check,
    CheckCircle2,
    ChevronDown,
    ChevronRight,
    ExternalLink,
    FileDown,
    MoreHorizontal,
    Paperclip,
    Pencil,
    Plus,
    Tag,
    Trash2,
    FileText,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { formatRelative } from "@/lib/relative-time";
import {
    getRun,
    updateRun,
    updateRunStatus,
    deleteRun,
    logDefect,
    updateDefect,
    deleteDefect,
    uploadEvidence,
    deleteEvidence,
    evidenceUrl,
    previewSpecConfig,
    downloadRunReport,
} from "@/lib/manufacturing";
import {
    DEFECT_CATEGORIES,
    RUN_STATUSES,
    RUN_STATUS_LABELS,
    defectCategoryLabel,
    evaluateCondition,
    type DefectSeverity,
    type ManufacturingRun,
    type ParsedSpecConfig,
    type RunDefect,
    type SpecFieldDef,
} from "@/types/manufacturing";
import { boardName } from "./production-filters";
import { RunStatusBadge, SEVERITY_VARIANT } from "./status-badge";
import { StatusStepper, nextRunStatus } from "./status-stepper";
import { CompactSelect } from "./ui";

interface RunViewProps {
    runId: string;
    canEdit: boolean;
    canLogDefects: boolean;
    /** QA/admin only: move the run through its status lifecycle. */
    canChangeStatus: boolean;
    /** "page" fills the main area with a back button; "drawer" sits over a list. */
    variant?: "page" | "drawer";
    onBack?: () => void;
    /** Drawer only: switch to the full-page view of the same run. */
    onOpenFull?: () => void;
    /** Called after the run is deleted, so the host can leave this view. */
    onDeleted: () => void;
    /** Called after any change, so a list behind this view can refresh. */
    onChanged?: () => void;
}

const SEVERITY_BORDER: Record<DefectSeverity, string> = {
    aesthetic: "border-l-border",
    minor: "border-l-muted-foreground/50",
    major: "border-l-warning",
    critical: "border-l-destructive",
};

type DefectFilter = "open" | "resolved" | "all";

export function RunView({
    runId,
    canEdit,
    canLogDefects,
    canChangeStatus,
    variant = "page",
    onBack,
    onOpenFull,
    onDeleted,
    onChanged,
}: RunViewProps) {
    const [run, setRun] = useState<ManufacturingRun | null>(null);
    const [loading, setLoading] = useState(true);
    const [addDefectOpen, setAddDefectOpen] = useState(false);
    const [defectFilter, setDefectFilter] = useState<DefectFilter>("all");
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [downloading, setDownloading] = useState(false);

    const load = useCallback(async () => {
        try {
            setRun(await getRun(runId));
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to load production.");
        } finally {
            setLoading(false);
        }
    }, [runId]);

    useEffect(() => {
        setLoading(true);
        void load();
    }, [load]);

    // Reload this run, then tell the host something changed.
    const refresh = useCallback(async () => {
        await load();
        onChanged?.();
    }, [load, onChanged]);

    const handleDownloadReport = async () => {
        setDownloading(true);
        try {
            await downloadRunReport(runId);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to download the report.");
        } finally {
            setDownloading(false);
        }
    };

    const handleDelete = async () => {
        setDeleting(true);
        try {
            await deleteRun(runId);
            toast.success("Production deleted.");
            setConfirmDelete(false);
            onDeleted();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to delete production.");
        } finally {
            setDeleting(false);
        }
    };

    const changeStatus = async (status: string) => {
        try {
            await updateRunStatus(runId, status);
            await refresh();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to change status.");
        }
    };

    const patch = async (body: Parameters<typeof updateRun>[1]) => {
        try {
            await updateRun(runId, body);
            await refresh();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to update production.");
        }
    };

    if (loading) {
        return <div className="p-6 text-sm text-muted-foreground">Loading production...</div>;
    }
    if (!run) {
        return (
            <div className="p-6">
                {onBack && (
                    <Button variant="ghost" onClick={onBack}>
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back
                    </Button>
                )}
                <p className="mt-4 text-sm text-muted-foreground">Production not found.</p>
            </div>
        );
    }

    const defects = run.defects ?? [];
    const openCount = defects.filter((d) => d.status === "open").length;
    const resolvedCount = defects.length - openCount;
    const affected = defects.reduce((sum, d) => sum + d.quantity_affected, 0);
    const shownDefects = defects.filter((d) =>
        defectFilter === "all" ? true : defectFilter === "open" ? d.status === "open" : d.status !== "open",
    );
    const yieldPct = run.quantity_ordered > 0 ? Math.round((run.quantity_good / run.quantity_ordered) * 100) : null;
    const next = nextRunStatus(run.status);
    const board = boardName(run);
    const showActionsMenu = canChangeStatus || canEdit;
    const title = run.job_number || run.project_name || run.project_id;

    return (
        <div className="flex h-full min-h-0 flex-col bg-background">
            <header className="shrink-0 border-b bg-card">
                <div className={cn("px-4 py-3", variant === "drawer" && "pr-14")}>
                    {variant === "page" && onBack && (
                        <Button size="sm" variant="ghost" className="-ml-2 mb-2 h-7 px-2 text-xs" onClick={onBack}>
                            <ArrowLeft className="mr-1 h-3 w-3" /> All production
                        </Button>
                    )}
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                                <h2 className="truncate font-mono text-lg font-semibold tracking-tight">{title}</h2>
                                <RunStatusBadge status={run.status} />
                            </div>
                            <p className="mt-0.5 text-sm text-muted-foreground">
                                {run.project_name || run.project_id}
                                {board !== "—" ? ` / ${board}` : ""}
                                {run.manufacturer_name ? ` · ${run.manufacturer_name}` : ""}
                                {run.spec_name ? ` · ${run.spec_name}` : ""}
                            </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => void handleDownloadReport()}
                                disabled={downloading}
                            >
                                <FileDown className="mr-1.5 h-4 w-4" />
                                {downloading ? "Preparing..." : "Download report"}
                            </Button>
                            {variant === "drawer" && onOpenFull && (
                                <Button size="sm" variant="outline" onClick={onOpenFull}>
                                    <ExternalLink className="mr-1.5 h-4 w-4" />
                                    Open full page
                                </Button>
                            )}
                            {showActionsMenu && (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button size="icon-sm" variant="outline" aria-label="Production actions">
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        {canChangeStatus && (
                                            <>
                                                <DropdownMenuLabel>Set status</DropdownMenuLabel>
                                                <DropdownMenuRadioGroup
                                                    value={run.status}
                                                    onValueChange={(value) => void changeStatus(value)}
                                                >
                                                    {RUN_STATUSES.map((status) => (
                                                        <DropdownMenuRadioItem key={status} value={status}>
                                                            {RUN_STATUS_LABELS[status]}
                                                        </DropdownMenuRadioItem>
                                                    ))}
                                                </DropdownMenuRadioGroup>
                                            </>
                                        )}
                                        {canChangeStatus && canEdit && <DropdownMenuSeparator />}
                                        {canEdit && (
                                            <DropdownMenuItem
                                                className="text-destructive focus:text-destructive"
                                                onSelect={() => setConfirmDelete(true)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                                Delete production
                                            </DropdownMenuItem>
                                        )}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            )}
                        </div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                        <StatusStepper status={run.status} />
                        {canChangeStatus && next && (
                            <Button size="sm" onClick={() => void changeStatus(next)}>
                                Mark as {RUN_STATUS_LABELS[next].toLowerCase()}
                            </Button>
                        )}
                    </div>
                </div>
            </header>

            <ScrollArea className="min-h-0 flex-1">
                <main className="grid w-full gap-6 p-4 lg:grid-cols-[minmax(0,1fr)_17rem]">
                    <div className="min-w-0 space-y-6">
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                            <Stat label="Ordered" value={run.quantity_ordered} />
                            <EditableStat
                                label="Good"
                                value={run.quantity_good}
                                max={run.quantity_ordered}
                                canEdit={canEdit}
                                onCommit={(v) => void patch({ quantity_good: v })}
                            />
                            <Stat label="Affected units" value={affected} />
                            <Stat label="Yield" value={yieldPct === null ? "—" : `${yieldPct}%`} />
                        </div>

                        <section aria-label="Defects">
                            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                                <h3 className="text-sm font-medium">Defects</h3>
                                <div className="flex flex-wrap items-center gap-2">
                                    <SegmentedControl
                                        aria-label="Filter defects"
                                        value={defectFilter}
                                        onChange={(v) => setDefectFilter(v as DefectFilter)}
                                        className="[&_button]:h-7 [&_button]:px-2.5 [&_button]:text-xs"
                                        options={[
                                            { value: "open", label: `Open ${openCount}` },
                                            { value: "resolved", label: `Resolved ${resolvedCount}` },
                                            { value: "all", label: `All ${defects.length}` },
                                        ]}
                                    />
                                    {canLogDefects && (
                                        <Button size="sm" onClick={() => setAddDefectOpen(true)}>
                                            <Plus className="mr-1.5 h-4 w-4" /> Log defect
                                        </Button>
                                    )}
                                </div>
                            </div>

                            {defects.length === 0 ? (
                                <div className="flex flex-col items-center gap-2 border border-dashed p-8 text-center text-muted-foreground">
                                    <CheckCircle2 className="h-8 w-8 text-success opacity-70" />
                                    <p className="text-sm">No defects logged.</p>
                                    {canLogDefects && (
                                        <Button size="sm" variant="outline" onClick={() => setAddDefectOpen(true)}>
                                            Log defect
                                        </Button>
                                    )}
                                </div>
                            ) : shownDefects.length === 0 ? (
                                <p className="border border-dashed p-6 text-center text-sm text-muted-foreground">
                                    No {defectFilter} defects.
                                </p>
                            ) : (
                                <ul className="space-y-3">
                                    {shownDefects.map((defect) => (
                                        <DefectCard
                                            key={defect.id}
                                            runId={run.id}
                                            defect={defect}
                                            canEdit={canLogDefects}
                                            onChanged={() => void refresh()}
                                        />
                                    ))}
                                </ul>
                            )}
                        </section>

                        <SpecSnapshot snapshot={run.spec_snapshot} />
                    </div>

                    <aside className="min-w-0 space-y-6">
                        <section aria-label="Details" className="border">
                            <div className="border-b bg-muted/30 px-4 py-2.5">
                                <h3 className="text-sm font-medium">Details</h3>
                            </div>
                            <dl className="divide-y text-sm">
                                <Fact label="Manufacturer" value={run.manufacturer_name || "—"} />
                                <Fact label="Process" value={run.spec_name || "—"} />
                                <Fact
                                    label="Release"
                                    value={
                                        run.release_tag && run.commit_sha ? (
                                            <Link
                                                to={`/project/${run.project_id}?section=history&commit=${encodeURIComponent(run.commit_sha)}`}
                                                className="inline-flex items-center gap-1 text-primary hover:underline"
                                                title={`Open ${run.release_tag} in History`}
                                            >
                                                <Tag className="h-3 w-3" />
                                                {run.release_tag}
                                            </Link>
                                        ) : (
                                            run.release_tag || "—"
                                        )
                                    }
                                />
                                <Fact
                                    label="Commit"
                                    value={run.commit_sha ? <span className="font-mono">{run.commit_sha.slice(0, 7)}</span> : "—"}
                                />
                                <Fact
                                    label="Created"
                                    value={`${new Date(run.created_at).toLocaleDateString()}${run.created_by ? ` by ${run.created_by}` : ""}`}
                                />
                                <Fact
                                    label="Updated"
                                    value={<span title={new Date(run.updated_at).toLocaleString()}>{formatRelative(run.updated_at)}</span>}
                                />
                            </dl>
                        </section>

                        <RunNotes notes={run.notes} canEdit={canEdit} onCommit={(notes) => void patch({ notes })} />
                    </aside>
                </main>
            </ScrollArea>

            {addDefectOpen && (
                <AddDefectDialog
                    runId={run.id}
                    onClose={() => setAddDefectOpen(false)}
                    onLogged={() => {
                        setAddDefectOpen(false);
                        void refresh();
                    }}
                />
            )}

            <ConfirmDialog
                open={confirmDelete}
                onOpenChange={setConfirmDelete}
                title="Delete production?"
                description={
                    <>
                        This production and its defects and evidence will be permanently removed. This cannot be undone.
                    </>
                }
                confirmLabel="Delete production"
                requireHold
                busy={deleting}
                onConfirm={() => void handleDelete()}
            />
        </div>
    );
}

function Fact({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div className="grid grid-cols-[6.5rem_minmax(0,1fr)] gap-3 px-4 py-2">
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="min-w-0 break-words">{value}</dd>
        </div>
    );
}

function Stat({ label, value }: { label: string; value: number | string }) {
    return (
        <div className="border p-3">
            <div className="text-xs text-muted-foreground">{label}</div>
            <div className="mt-1 text-2xl font-semibold tabular-nums">{value}</div>
        </div>
    );
}

function RunNotes({
    notes,
    canEdit,
    onCommit,
}: {
    notes: string;
    canEdit: boolean;
    onCommit: (notes: string) => void;
}) {
    const [draft, setDraft] = useState(notes);
    useEffect(() => setDraft(notes), [notes]);

    if (!canEdit && !notes.trim()) return null;
    return (
        <section className="border">
            <div className="border-b bg-muted/30 px-4 py-2.5">
                <h3 className="text-sm font-medium">Notes</h3>
            </div>
            {canEdit ? (
                <Textarea
                    aria-label="Notes"
                    rows={4}
                    className="rounded-none border-0 shadow-none focus-visible:ring-0"
                    placeholder="Add notes about this production"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onBlur={() => draft !== notes && onCommit(draft.trim())}
                />
            ) : (
                <p className="whitespace-pre-wrap px-4 py-3 text-sm">{notes}</p>
            )}
        </section>
    );
}

/** Render one field's stored value the way it read on the form: booleans as
 *  Yes/No, numbers with their unit, and blanks as a dash. */
function displaySpecValue(field: SpecFieldDef, raw: unknown): string {
    if (field.type === "bool") {
        return raw === true || raw === "true" ? "Yes" : "No";
    }
    if (raw === undefined || raw === null || raw === "") return "—";
    return field.unit ? `${raw} ${field.unit}` : String(raw);
}

/**
 * The board spec as it stood when the run was created, read-only and folded away
 * until asked for. It reuses the run's frozen field text and values so it stays a
 * faithful picture even after the project's live spec moves on.
 */
function SpecSnapshot({ snapshot }: { snapshot: Record<string, unknown> | null | undefined }) {
    const specConfig = typeof snapshot?.spec_config === "string" ? snapshot.spec_config : "";
    const stored = (snapshot?.specs as Record<string, unknown> | undefined) ?? {};
    const activeSections = new Set(
        Array.isArray(snapshot?.active_sections) ? (snapshot.active_sections as string[]) : [],
    );
    const [open, setOpen] = useState(false);
    const [schema, setSchema] = useState<ParsedSpecConfig | null>(null);

    useEffect(() => {
        let cancelled = false;
        if (!specConfig.trim()) {
            setSchema({ sections: [], errors: [] });
            return;
        }
        void previewSpecConfig(specConfig)
            .then((parsed) => !cancelled && setSchema(parsed))
            .catch(() => !cancelled && setSchema({ sections: [], errors: [] }));
        return () => {
            cancelled = true;
        };
    }, [specConfig]);

    // Fill each field's schema default under the stored value, so gating and
    // display see the effective spec (the form's behaviour). This also completes
    // older runs whose snapshot only froze the few edited values.
    const values: Record<string, unknown> = {};
    for (const section of schema?.sections ?? []) {
        for (const field of section.fields) {
            const raw = stored[field.key];
            values[field.key] = raw === undefined || raw === null || raw === "" ? field.default : raw;
        }
    }
    // Keep any stored keys not present in the schema too.
    for (const [key, val] of Object.entries(stored)) {
        if (!(key in values)) values[key] = val;
    }

    // Sections in play: always-on sections whose gate is met, plus optional ones
    // that were switched on for this run.
    const sections = (schema?.sections ?? []).filter(
        (s) => (s.optional ? activeSections.has(s.title) : true) && evaluateCondition(s.when, values),
    );

    return (
        <section className="border">
            <button
                type="button"
                aria-expanded={open}
                onClick={() => setOpen((v) => !v)}
                className="flex w-full items-center gap-2 bg-muted/30 px-4 py-2.5 text-left"
            >
                {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                <FileText className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-medium">Spec at the time of order</h3>
            </button>
            {open &&
                (schema === null ? (
                    <p className="px-4 py-6 text-sm text-muted-foreground">Loading spec…</p>
                ) : sections.length === 0 ? (
                    <p className="px-4 py-6 text-sm text-muted-foreground">No spec was recorded for this run.</p>
                ) : (
                    <div className="divide-y border-t">
                        {sections.map((section) => {
                            const fields = section.fields.filter((f) => evaluateCondition(f.when, values));
                            if (fields.length === 0) return null;
                            return (
                                <div key={section.title} className="px-4 py-3">
                                    <div className="mb-2 text-sm font-medium">{section.title}</div>
                                    <dl className="grid gap-x-8 gap-y-1 sm:grid-cols-2">
                                        {fields.map((field) => (
                                            <div key={field.key} className="flex items-baseline justify-between gap-3 py-0.5">
                                                <dt className="text-sm text-muted-foreground">{field.label}</dt>
                                                <dd className="text-right text-sm tabular-nums">
                                                    {displaySpecValue(field, values[field.key])}
                                                </dd>
                                            </div>
                                        ))}
                                    </dl>
                                </div>
                            );
                        })}
                    </div>
                ))}
        </section>
    );
}

function EditableStat({
    label,
    value,
    max,
    canEdit,
    onCommit,
}: {
    label: string;
    value: number;
    max: number;
    canEdit: boolean;
    onCommit: (value: number) => void;
}) {
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(String(value));
    useEffect(() => setDraft(String(value)), [value]);

    const commit = () => {
        const next = Number(draft) || 0;
        if (next !== value) onCommit(next);
        setEditing(false);
    };

    // Read-only or not being edited: show the value as a plain stat. When
    // editable, a pencil reveals the input rather than always showing one.
    if (!canEdit || !editing) {
        return (
            <div className="border p-3">
                <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-muted-foreground">{label}</span>
                    {canEdit && (
                        <button
                            type="button"
                            aria-label={`Edit ${label}`}
                            className="text-muted-foreground hover:text-foreground"
                            onClick={() => setEditing(true)}
                        >
                            <Pencil className="h-3.5 w-3.5" />
                        </button>
                    )}
                </div>
                <div className="mt-1 text-2xl font-semibold tabular-nums">{value}</div>
            </div>
        );
    }

    return (
        <div className="border p-3">
            <div className="text-xs text-muted-foreground">{label}</div>
            <div className="mt-1 flex items-center gap-1">
                <Input
                    type="number"
                    min={0}
                    max={max || undefined}
                    autoFocus
                    className="h-9 text-lg font-semibold tabular-nums"
                    value={draft}
                    aria-label={label}
                    onChange={(e) => setDraft(e.target.value)}
                    onBlur={commit}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") commit();
                        if (e.key === "Escape") {
                            setDraft(String(value));
                            setEditing(false);
                        }
                    }}
                />
                <button
                    type="button"
                    aria-label={`Save ${label}`}
                    className="shrink-0 text-muted-foreground hover:text-foreground"
                    // onMouseDown so it fires before the input's onBlur cancels it.
                    onMouseDown={(e) => {
                        e.preventDefault();
                        commit();
                    }}
                >
                    <Check className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
}

interface DefectCardProps {
    runId: string;
    defect: RunDefect;
    canEdit: boolean;
    onChanged: () => void;
}

function DefectCard({ runId, defect, canEdit, onChanged }: DefectCardProps) {
    const fileInput = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [disposition, setDisposition] = useState<"resolve" | "accept" | null>(null);

    const isOpen = defect.status === "open";

    const handleUpload = async (files: FileList | null) => {
        if (!files || files.length === 0) return;
        setUploading(true);
        try {
            for (const file of Array.from(files)) {
                await uploadEvidence(defect.id, file);
            }
            toast.success("Evidence attached.");
            onChanged();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Upload failed.");
        } finally {
            setUploading(false);
            if (fileInput.current) fileInput.current.value = "";
        }
    };

    const reopen = async () => {
        try {
            await updateDefect(defect.id, { status: "open" });
            onChanged();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to reopen the defect.");
        }
    };

    return (
        <li className={cn("border border-l-4", SEVERITY_BORDER[defect.severity])}>
            <div className="flex items-start justify-between gap-4 p-4">
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">{defectCategoryLabel(defect.category)}</span>
                        <Badge variant={SEVERITY_VARIANT[defect.severity]}>{defect.severity}</Badge>
                        <Badge variant="outline">{defect.quantity_affected} affected</Badge>
                        {defect.status === "resolved" && <Badge variant="success">Resolved</Badge>}
                        {defect.status === "accepted" && <Badge variant="info">Accepted as is</Badge>}
                    </div>
                    {defect.description && (
                        <p className="mt-1.5 text-sm text-muted-foreground">{defect.description}</p>
                    )}
                    {!isOpen && (defect.resolution_note || defect.resolved_by) && (
                        <p className="mt-2 border-l-2 pl-3 text-sm">
                            {defect.resolution_note || (defect.status === "accepted" ? "Accepted as is." : "Resolved.")}
                            <span className="block text-xs text-muted-foreground">
                                {[defect.resolved_by, defect.resolved_at ? new Date(defect.resolved_at).toLocaleDateString() : ""]
                                    .filter(Boolean)
                                    .join(" · ")}
                            </span>
                        </p>
                    )}
                </div>
                {canEdit && (
                    <div className="flex shrink-0 items-center gap-1">
                        {isOpen ? (
                            <>
                                <Button variant="outline" size="sm" onClick={() => setDisposition("resolve")}>
                                    Resolve
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => setDisposition("accept")}>
                                    Accept as is
                                </Button>
                            </>
                        ) : (
                            <Button variant="outline" size="sm" onClick={() => void reopen()}>
                                Reopen
                            </Button>
                        )}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Defect actions">
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                    className="text-destructive focus:text-destructive"
                                    onSelect={() => setConfirmDelete(true)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                    Delete defect
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                )}
            </div>

            {/* Evidence */}
            {(defect.evidence.length > 0 || canEdit) && (
                <div className="flex flex-wrap items-center gap-3 border-t p-4">
                    {defect.evidence.map((item) => (
                        <EvidenceThumb
                            key={item.digest}
                            runId={runId}
                            defectId={defect.id}
                            item={item}
                            canDelete={canEdit}
                            onDeleted={onChanged}
                        />
                    ))}
                    {canEdit && (
                        <>
                            <input
                                ref={fileInput}
                                type="file"
                                accept="image/*,application/pdf"
                                multiple
                                className="hidden"
                                onChange={(e) => void handleUpload(e.target.files)}
                            />
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={uploading}
                                onClick={() => fileInput.current?.click()}
                            >
                                <Paperclip className="mr-1.5 h-4 w-4" />
                                {uploading ? "Uploading…" : "Attach evidence"}
                            </Button>
                        </>
                    )}
                </div>
            )}

            {disposition && (
                <DispositionDialog
                    defect={defect}
                    mode={disposition}
                    onClose={() => setDisposition(null)}
                    onDone={() => {
                        setDisposition(null);
                        onChanged();
                    }}
                />
            )}

            <ConfirmDialog
                open={confirmDelete}
                onOpenChange={setConfirmDelete}
                title="Delete defect?"
                description="This removes the defect and its attached evidence."
                confirmLabel="Delete"
                busy={deleting}
                onConfirm={async () => {
                    setDeleting(true);
                    try {
                        await deleteDefect(defect.id);
                        setConfirmDelete(false);
                        onChanged();
                    } catch (error) {
                        toast.error(error instanceof Error ? error.message : "Failed to delete.");
                    } finally {
                        setDeleting(false);
                    }
                }}
            />
        </li>
    );
}

// Closing a defect: resolving takes an optional note; accepting it as-is needs a
// reason, because that is a decision to ship a known defect.
function DispositionDialog({
    defect,
    mode,
    onClose,
    onDone,
}: {
    defect: RunDefect;
    mode: "resolve" | "accept";
    onClose: () => void;
    onDone: () => void;
}) {
    const accepting = mode === "accept";
    const [note, setNote] = useState("");
    const [saving, setSaving] = useState(false);
    const trimmed = note.trim();

    const handleSave = async () => {
        setSaving(true);
        try {
            await updateDefect(defect.id, {
                status: accepting ? "accepted" : "resolved",
                ...(trimmed ? { resolution_note: trimmed } : {}),
            });
            toast.success(accepting ? "Defect accepted as is." : "Defect resolved.");
            onDone();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to update the defect.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open onOpenChange={(next) => !next && onClose()}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>{accepting ? "Accept defect as is" : "Resolve defect"}</DialogTitle>
                    <DialogDescription>
                        {accepting
                            ? "The units ship with this defect. Say why that is acceptable."
                            : "Say what was done about it, if that helps the next reader."}
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-1 py-1">
                    <Label htmlFor="def-note">{accepting ? "Why is this acceptable?" : "Note (optional)"}</Label>
                    <Textarea
                        id="def-note"
                        rows={3}
                        autoFocus
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                    />
                </div>
                <div className="flex justify-end gap-2">
                    <Button variant="ghost" onClick={onClose} disabled={saving}>
                        Cancel
                    </Button>
                    <Button onClick={() => void handleSave()} disabled={saving || (accepting && !trimmed)}>
                        {saving ? "Saving…" : accepting ? "Accept as is" : "Resolve"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

function EvidenceThumb({
    runId,
    defectId,
    item,
    canDelete,
    onDeleted,
}: {
    runId: string;
    defectId: string;
    item: RunDefect["evidence"][number];
    canDelete: boolean;
    onDeleted: () => void;
}) {
    const url = evidenceUrl(runId, item.digest);
    const isPdf = item.media_type === "application/pdf";
    const [confirmRemove, setConfirmRemove] = useState(false);
    return (
        <div className="group relative">
            <a
                href={url}
                target="_blank"
                rel="noreferrer"
                className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-md border bg-muted"
                title={item.filename}
            >
                {isPdf ? (
                    <FileText className="h-8 w-8 text-muted-foreground" />
                ) : (
                    <img src={url} alt={item.filename} className="h-full w-full object-cover" />
                )}
            </a>
            {canDelete && (
                <button
                    type="button"
                    aria-label={`Remove ${item.filename}`}
                    className="absolute -right-2 -top-2 hidden rounded-full border bg-background p-1 text-destructive focus-visible:block group-hover:block"
                    onClick={() => setConfirmRemove(true)}
                >
                    <Trash2 className="h-3 w-3" />
                </button>
            )}
            <ConfirmDialog
                open={confirmRemove}
                onOpenChange={setConfirmRemove}
                title="Remove evidence?"
                description={<>{item.filename} will be removed from this defect.</>}
                confirmLabel="Remove"
                onConfirm={() =>
                    void deleteEvidence(defectId, item.digest)
                        .then(() => {
                            setConfirmRemove(false);
                            onDeleted();
                        })
                        .catch((error) =>
                            toast.error(error instanceof Error ? error.message : "Failed to remove."),
                        )
                }
            />
        </div>
    );
}

interface AddDefectDialogProps {
    runId: string;
    onClose: () => void;
    onLogged: () => void;
}

function AddDefectDialog({ runId, onClose, onLogged }: AddDefectDialogProps) {
    const [category, setCategory] = useState("soldering");
    const [severity, setSeverity] = useState<DefectSeverity>("minor");
    const [quantity, setQuantity] = useState(1);
    const [description, setDescription] = useState("");
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        try {
            await logDefect(runId, {
                category,
                severity,
                quantity_affected: quantity,
                description: description.trim(),
            });
            toast.success("Defect logged.");
            onLogged();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to log defect.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open onOpenChange={(next) => !next && onClose()}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Log a defect</DialogTitle>
                    <DialogDescription>Record what went wrong and how many units it affected.</DialogDescription>
                </DialogHeader>
                <div className="space-y-2.5 py-1">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <Label htmlFor="def-category">Category</Label>
                            <CompactSelect
                                id="def-category"
                                className="h-8"
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                            >
                                {DEFECT_CATEGORIES.map((c) => (
                                    <option key={c.value} value={c.value}>
                                        {c.label}
                                    </option>
                                ))}
                            </CompactSelect>
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="def-severity">Severity</Label>
                            <CompactSelect
                                id="def-severity"
                                className="h-8"
                                value={severity}
                                onChange={(e) => setSeverity(e.target.value as DefectSeverity)}
                            >
                                <option value="aesthetic">Aesthetic</option>
                                <option value="minor">Minor</option>
                                <option value="major">Major</option>
                                <option value="critical">Critical</option>
                            </CompactSelect>
                        </div>
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="def-qty">Units affected</Label>
                        <Input
                            id="def-qty"
                            type="number"
                            min={1}
                            value={quantity || ""}
                            onChange={(e) => setQuantity(Number(e.target.value) || 1)}
                        />
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="def-desc">Description</Label>
                        <Textarea
                            id="def-desc"
                            rows={3}
                            placeholder="What went wrong, and where"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>
                </div>
                <div className="flex justify-end gap-2">
                    <Button variant="ghost" onClick={onClose} disabled={saving}>
                        Cancel
                    </Button>
                    <Button onClick={() => void handleSave()} disabled={saving}>
                        {saving ? "Logging…" : "Log defect"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
