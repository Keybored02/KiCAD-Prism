import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { fetchApi } from "@/lib/api";
import {
    createRun,
    extractPcbRules,
    getPcbRuleFields,
    getProjectSpec,
    getProjectSpecForManufacturer,
    listProjectManufacturers,
} from "@/lib/manufacturing";
import {
    checkCapabilities,
    mergeCapabilityRows,
    specProgress,
    type PcbRuleField,
    type ParsedSpecConfig,
    type ProjectManufacturer,
    type ProjectSpec,
} from "@/types/manufacturing";
import { CompactSelect } from "./ui";

export interface ProjectOption {
    id: string;
    name: string;
}

interface Release {
    tag: string;
    commit_hash: string;
    full_hash: string;
    date: string;
}

interface NewProductionDialogProps {
    open: boolean;
    projects: ProjectOption[];
    /** Start with this project chosen and fixed (opened from a project's own tab). */
    initialProjectId?: string;
    /** Start with this manufacturer chosen, if the project has it. */
    initialManufacturerId?: string;
    onClose: () => void;
    onCreated: (runId: string) => void;
}

const NO_RELEASE = "";

/**
 * Start a production: one short form, then the run freezes the manufacturer's
 * spec as it stands. A line under the form says exactly what will be frozen and
 * flags an empty spec or a board below the process minimums. Never blocks.
 */
export function NewProductionDialog({
    open,
    projects,
    initialProjectId,
    initialManufacturerId,
    onClose,
    onCreated,
}: NewProductionDialogProps) {
    const lockedProject = Boolean(initialProjectId);
    const [projectId, setProjectId] = useState(initialProjectId ?? "");
    const [manufacturerId, setManufacturerId] = useState(initialManufacturerId ?? "");
    const [quantity, setQuantity] = useState("");
    const [releases, setReleases] = useState<Release[]>([]);
    const [releaseTag, setReleaseTag] = useState(NO_RELEASE);
    const [releaseTouched, setReleaseTouched] = useState(false);
    const [commitSha, setCommitSha] = useState("");
    const [notes, setNotes] = useState("");
    const [manufacturers, setManufacturers] = useState<ProjectManufacturer[]>([]);
    const [loadedManufacturers, setLoadedManufacturers] = useState(false);
    const [spec, setSpec] = useState<(ProjectSpec & { parsed: ParsedSpecConfig }) | null>(null);
    const [ruleFields, setRuleFields] = useState<PcbRuleField[]>([]);
    const [boardRules, setBoardRules] = useState<Record<string, unknown> | null>(null);
    const [submitting, setSubmitting] = useState(false);

    // A project brings its releases and the manufacturers attached to it.
    useEffect(() => {
        setManufacturers([]);
        setLoadedManufacturers(false);
        setReleases([]);
        setReleaseTag(NO_RELEASE);
        setReleaseTouched(false);
        setCommitSha("");
        setBoardRules(null);
        if (!projectId) return;
        let cancelled = false;
        void (async () => {
            try {
                const res = await fetchApi(`/api/projects/${projectId}/releases?limit=100`);
                if (!res.ok) throw new Error();
                const data = (await res.json()) as { releases?: Release[] };
                if (!cancelled) setReleases(data.releases ?? []);
            } catch {
                if (!cancelled) setReleases([]);
            }
        })();
        void (async () => {
            try {
                const list = await listProjectManufacturers(projectId);
                if (cancelled) return;
                setManufacturers(list);
                // Keep the chosen manufacturer if this project has it; else the only one.
                setManufacturerId((current) =>
                    list.some((m) => m.id === current) ? current : list.length === 1 ? list[0].id : "",
                );
            } catch {
                if (!cancelled) setManufacturers([]);
            } finally {
                if (!cancelled) setLoadedManufacturers(true);
            }
        })();
        void (async () => {
            try {
                const { rules } = await extractPcbRules(projectId);
                if (!cancelled) setBoardRules(rules);
            } catch {
                if (!cancelled) setBoardRules(null);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [projectId]);

    useEffect(() => {
        let cancelled = false;
        void getPcbRuleFields()
            .then(({ fields }) => !cancelled && setRuleFields(fields))
            .catch(() => !cancelled && setRuleFields([]));
        return () => {
            cancelled = true;
        };
    }, []);

    // Until the user picks, a project's newest release is the default build.
    useEffect(() => {
        if (releaseTouched || releases.length === 0) return;
        const latest = [...releases].sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""))[0];
        setReleaseTag(latest.tag);
        setCommitSha(latest.full_hash);
    }, [releases, releaseTouched]);

    // The manufacturer's one spec is what the run freezes.
    useEffect(() => {
        setSpec(null);
        if (!projectId || !manufacturerId) return;
        let cancelled = false;
        // The per-manufacturer lookup finds (or creates) the spec; the full read has its
        // process capabilities too.
        void getProjectSpecForManufacturer(projectId, manufacturerId)
            .then((s) => getProjectSpec(s.id))
            .then((s) => !cancelled && setSpec(s))
            .catch(() => !cancelled && setSpec(null));
        return () => {
            cancelled = true;
        };
    }, [projectId, manufacturerId]);

    const qty = Number(quantity);
    const canSubmit = Boolean(projectId && manufacturerId && Number.isFinite(qty) && qty > 0 && spec);

    const freeze = useMemo(() => {
        if (!spec) return null;
        const progress = specProgress(
            spec.parsed?.sections ?? [],
            spec.specs ?? {},
            new Set(spec.active_sections ?? []),
        );
        const rows = mergeCapabilityRows(
            ruleFields,
            spec.template_capabilities ?? {},
            spec.template_capability_meta ?? {},
        );
        const { findings } = checkCapabilities(rows, boardRules);
        return { progress, findings: findings.length, process: spec.template_name ?? null };
    }, [spec, ruleFields, boardRules]);

    const handleCreate = async () => {
        if (!canSubmit || !spec) return;
        setSubmitting(true);
        try {
            const { id } = await createRun({
                project_id: projectId,
                manufacturer_id: manufacturerId,
                spec_id: spec.id,
                commit_sha: commitSha.trim(),
                release_tag: releaseTag,
                quantity_ordered: qty,
                notes: notes.trim(),
            });
            toast.success("Production created.");
            onCreated(id);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to create production.");
        } finally {
            setSubmitting(false);
        }
    };

    const emptySpec = freeze !== null && freeze.progress.total > 0 && freeze.progress.set === 0;

    return (
        <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>New production</DialogTitle>
                    <DialogDescription>Record a board order. The manufacturer&rsquo;s spec is frozen onto it.</DialogDescription>
                </DialogHeader>

                <div className="space-y-3 py-1">
                    <div className="space-y-1">
                        <Label htmlFor="run-project">Project</Label>
                        <CompactSelect
                            id="run-project"
                            className="h-9"
                            value={projectId}
                            disabled={lockedProject}
                            onChange={(e) => setProjectId(e.target.value)}
                        >
                            <option value="">Select a project…</option>
                            {projects.map((p) => (
                                <option key={p.id} value={p.id}>
                                    {p.name}
                                </option>
                            ))}
                        </CompactSelect>
                    </div>

                    <div className="space-y-1">
                        <Label htmlFor="run-mfr">Manufacturer</Label>
                        {projectId && loadedManufacturers && manufacturers.length === 0 ? (
                            <p className="border border-dashed p-3 text-sm text-muted-foreground">
                                This project has no manufacturers yet.{" "}
                                <Link
                                    to={`/project/${projectId}?section=manufacturing`}
                                    onClick={onClose}
                                    className="text-primary hover:underline"
                                >
                                    Attach one on its Manufacturing tab
                                </Link>
                                , then start the production.
                            </p>
                        ) : (
                            <CompactSelect
                                id="run-mfr"
                                className="h-9"
                                value={manufacturerId}
                                disabled={!projectId}
                                onChange={(e) => setManufacturerId(e.target.value)}
                            >
                                <option value="">{projectId ? "Select a manufacturer…" : "Choose a project first"}</option>
                                {manufacturers.map((m) => (
                                    <option key={m.id} value={m.id}>
                                        {m.name}
                                    </option>
                                ))}
                            </CompactSelect>
                        )}
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1">
                            <Label htmlFor="run-qty">Quantity ordered</Label>
                            <Input
                                id="run-qty"
                                type="number"
                                min={1}
                                className="h-9"
                                value={quantity}
                                onChange={(e) => setQuantity(e.target.value)}
                            />
                        </div>
                        {releases.length > 0 && (
                            <div className="space-y-1">
                                <Label htmlFor="run-release">Release</Label>
                                <CompactSelect
                                    id="run-release"
                                    className="h-9"
                                    value={releaseTag}
                                    onChange={(e) => {
                                        const tag = e.target.value;
                                        setReleaseTouched(true);
                                        setReleaseTag(tag);
                                        // A release fills the commit with its revision; none leaves it to the user.
                                        const rel = releases.find((r) => r.tag === tag);
                                        setCommitSha(rel ? rel.full_hash : "");
                                    }}
                                >
                                    {releases.map((r) => (
                                        <option key={r.tag} value={r.tag}>
                                            {r.tag} ({r.commit_hash})
                                        </option>
                                    ))}
                                    <option value={NO_RELEASE}>No release, use a commit</option>
                                </CompactSelect>
                            </div>
                        )}
                    </div>

                    {releaseTag === NO_RELEASE && (
                        <div className="space-y-1">
                            <Label htmlFor="run-commit">Commit (optional)</Label>
                            <Input
                                id="run-commit"
                                className="h-9"
                                placeholder="The revision that was built"
                                value={commitSha}
                                onChange={(e) => setCommitSha(e.target.value)}
                            />
                        </div>
                    )}

                    <div className="space-y-1">
                        <Label htmlFor="run-notes">Notes (optional)</Label>
                        <Textarea id="run-notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
                    </div>

                    {freeze && (
                        <div className="space-y-1.5 border bg-muted/30 px-3 py-2.5 text-sm">
                            <p>
                                <span className="text-muted-foreground">Freezes:</span>{" "}
                                {freeze.process ? `${freeze.process} spec` : "this spec"},{" "}
                                <span className="tabular-nums">
                                    {freeze.progress.set} of {freeze.progress.total}
                                </span>{" "}
                                fields set
                            </p>
                            {(emptySpec || freeze.findings > 0) && (
                                <p className="flex items-start gap-1.5 text-warning">
                                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                                    <span>
                                        {emptySpec ? "The spec is empty. " : ""}
                                        {freeze.findings > 0
                                            ? `${freeze.findings} ${freeze.findings === 1 ? "rule is" : "rules are"} below the process minimums. `
                                            : ""}
                                        <Link
                                            to={`/project/${projectId}?section=manufacturing`}
                                            onClick={onClose}
                                            className="underline"
                                        >
                                            Review the spec
                                        </Link>
                                    </span>
                                </p>
                            )}
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-2">
                    <Button variant="ghost" onClick={onClose} disabled={submitting}>
                        Cancel
                    </Button>
                    <Button onClick={() => void handleCreate()} disabled={!canSubmit || submitting}>
                        {submitting ? "Creating…" : "Create production"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
