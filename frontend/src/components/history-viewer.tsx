import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { GitCommit, Tag, Eye, Check, Copy, User, Clock, Calendar, GitCompare, ChevronDown, ChevronRight, FileText, Plus, Minus, RefreshCw, Loader2, X, CircuitBoard, Cpu, List, Settings, FileCode, GitBranch } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
    Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectSeparator,
    SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { SchematicDiffViewer } from "./schematic-diff-viewer";
import { PcbDiffViewer } from "./pcb-diff-viewer";
import { fetchJson } from "@/lib/api";

interface Release {
    tag: string;
    commit_hash: string;
    date: string;
    message: string;
}

interface Commit {
    hash: string;
    full_hash: string;
    author: string;
    email: string;
    date: string;
    message: string;
    parents?: string[];
    kicad_changes?: { sch: number; pcb: number; pro: number; other: number };
}

interface ReleasesResponse {
    releases: Release[];
}

interface CommitsResponse {
    commits: Commit[];
}

interface Branch {
    name: string;
    full_name: string;
    type: "local" | "remote";
    current: boolean;
    head_hash: string;
    full_head_hash: string;
    upstream: string | null;
}

interface BranchesResponse {
    branches: Branch[];
    current: string | null;
}

interface DiffItem {
    id: string;
    type: string;
    reference?: string;
    value?: string;
    footprint?: string;
    text?: string;
    name?: string;
    net?: string;
    net_name?: string;
    layer?: string;
    sheet_file?: string;
    sheet_name?: string;
    lib_id?: string;
    x?: number;
    y?: number;
}

interface ChangedDiffItem extends DiffItem {
    changes?: Record<string, { old: string | number | null; new: string | number | null }>;
}

interface FileDiffPayload {
    added: number;
    removed: number;
    changed: number;
    added_items?: DiffItem[];
    removed_items?: DiffItem[];
    changed_items?: ChangedDiffItem[];
    truncated?: boolean;
}

interface CommitFile {
    path: string;
    filename: string;
    status: "added" | "removed" | "modified" | "renamed";
    additions: number | null;
    deletions: number | null;
    schematic_diff?: FileDiffPayload;
    pcb_diff?: FileDiffPayload;
}

type DiffTab = "schematic" | "pcb" | "bom";

interface CommitSummary {
    files: CommitFile[];
}

interface HistoryViewerProps {
    projectId: string;
    onViewCommit: (commitHash: string) => void;
    canCompareDiffs: boolean;
}

function formatDate(isoDate: string): string {
    const date = new Date(isoDate);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return date.toLocaleDateString();
}

const STATUS_COLOR: Record<string, string> = {
    added: "text-green-500",
    removed: "text-red-500",
    modified: "text-amber-500",
    renamed: "text-blue-500",
};

const STATUS_ICON: Record<string, React.ReactNode> = {
    added:    <Plus    className="h-3 w-3" />,
    removed:  <Minus   className="h-3 w-3" />,
    modified: <RefreshCw className="h-3 w-3" />,
    renamed:  <RefreshCw className="h-3 w-3" />,
};

// Pluralise a base noun for a count.
function plural(n: number, singular: string, pluralForm?: string): string {
    return `${n} ${n === 1 ? singular : (pluralForm ?? singular + "s")}`;
}

// Group a list of diff items by type and return a compact human label.
// Examples: "2 footprints, 1 zone", "3 symbols, 1 label".
function summariseItemTypes(items: { type: string }[] | undefined): string {
    if (!items || items.length === 0) return "";
    const counts = new Map<string, number>();
    for (const it of items) {
        const key = LABEL_BY_TYPE[it.type] ?? it.type;
        counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    const parts = [...counts.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([k, v]) => plural(v, k));
    return parts.join(", ");
}

const LABEL_BY_TYPE: Record<string, string> = {
    // Schematic
    symbol: "symbol",
    label: "label",
    global_label: "global label",
    hierarchical_label: "hier label",
    net_label: "net label",
    text: "text",
    sheet: "sheet",
    // PCB
    footprint: "footprint",
    segment: "trace",
    via: "via",
    zone: "zone",
    gr_text: "graphic text",
    gr_line: "graphic line",
    gr_circle: "graphic circle",
    gr_rect: "graphic rect",
    gr_arc: "graphic arc",
};

// Sort rank for the file list inside an expanded commit. Lower rank = shown
// first. Schematic and PCB files lead, followed by project, libraries, then
// everything else. Within a rank, original order is preserved (stable sort).
function fileSortRank(filename: string): number {
    if (filename.endsWith(".kicad_sch")) return 0;
    if (filename.endsWith(".kicad_pcb")) return 1;
    if (filename.endsWith(".kicad_pro")) return 2;
    if (filename.endsWith(".kicad_sym") || filename.endsWith(".kicad_mod")) return 3;
    return 4;
}

// File-type icon picker. Returns the icon + a colour class so KiCad files
// stand out from generic ones in the file list.
function fileTypeIcon(filename: string): { Icon: typeof FileText; color: string; label: string } {
    if (filename.endsWith(".kicad_sch")) return { Icon: CircuitBoard, color: "text-blue-500",   label: "Schematic" };
    if (filename.endsWith(".kicad_pcb")) return { Icon: Cpu,          color: "text-emerald-500", label: "PCB" };
    if (filename.endsWith(".kicad_pro")) return { Icon: Settings,     color: "text-violet-500",  label: "Project" };
    if (filename.endsWith(".kicad_sym") || filename.endsWith(".kicad_mod")) {
        return { Icon: FileCode, color: "text-cyan-500", label: "Library" };
    }
    return { Icon: FileText, color: "text-muted-foreground", label: "" };
}

// Small chip indicating that a commit touched N KiCad files of a given kind.
function KicadChip({ icon: Icon, label, count, color }: {
    icon: typeof FileText; label: string; count: number; color: string;
}) {
    if (count <= 0) return null;
    return (
        <span
            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-muted text-[10px] font-medium leading-none ${color}`}
            title={`${count} ${label.toLowerCase()} file${count > 1 ? "s" : ""} changed`}
        >
            <Icon className="h-3 w-3" />
            {count > 1 ? <span className="font-mono">{count}</span> : null}
        </span>
    );
}

// Branch selector — shadcn Select wrapping local + remote branches.
// `currentBranch` is the actual checked-out branch (used for the "current" badge);
// `selectedBranch` is what the user has chosen to view (may differ).
function BranchSelector({
    branches, currentBranch, selectedBranch, onSelect,
}: {
    branches: Branch[];
    currentBranch: string | null;
    selectedBranch: string | null;
    onSelect: (name: string | null) => void;
}) {
    const local  = branches.filter(b => b.type === "local");
    const remote = branches.filter(b => b.type === "remote");
    // Sentinel value for "no specific branch" (defaults to HEAD on the server).
    const ANY = "__any__";
    const value = selectedBranch ?? ANY;

    return (
        <Select
            value={value}
            onValueChange={(v) => onSelect(v === ANY ? null : v)}
        >
            <SelectTrigger className="h-9 min-w-[180px] gap-2">
                <GitBranch className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <SelectValue placeholder="Branch" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value={ANY}>
                    <span className="text-muted-foreground">All commits (HEAD)</span>
                </SelectItem>
                {local.length > 0 && (
                    <>
                        <SelectSeparator />
                        <SelectGroup>
                            <SelectLabel>Local</SelectLabel>
                            {local.map(b => (
                                <SelectItem key={b.full_name} value={b.name}>
                                    <span className="flex items-center gap-2">
                                        <span className="font-medium">{b.name}</span>
                                        {b.name === currentBranch && (
                                            <span className="text-[9px] uppercase tracking-wider px-1 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 leading-none">
                                                current
                                            </span>
                                        )}
                                        {b.upstream && (
                                            <span className="text-[10px] text-muted-foreground font-mono">
                                                ↑ {b.upstream}
                                            </span>
                                        )}
                                    </span>
                                </SelectItem>
                            ))}
                        </SelectGroup>
                    </>
                )}
                {remote.length > 0 && (
                    <>
                        <SelectSeparator />
                        <SelectGroup>
                            <SelectLabel>Remote</SelectLabel>
                            {remote.map(b => (
                                <SelectItem key={b.full_name} value={b.name}>
                                    <span className="font-mono text-[12px]">{b.name}</span>
                                </SelectItem>
                            ))}
                        </SelectGroup>
                    </>
                )}
            </SelectContent>
        </Select>
    );
}

// Human label for one diff item — used as the visible row text.
function diffItemLabel(item: DiffItem): string {
    if (item.reference) {
        return item.value ? `${item.reference} (${item.value})` : item.reference;
    }
    if (item.text)        return item.text.length > 40 ? item.text.slice(0, 37) + "…" : item.text;
    if (item.net_name)    return item.net_name;
    if (item.name)        return item.name;
    if (item.sheet_name)  return `Sheet: ${item.sheet_name}`;
    if (item.lib_id)      return item.lib_id;
    if (item.layer)       return `${LABEL_BY_TYPE[item.type] ?? item.type} on ${item.layer}`;
    if (item.net != null) return `${LABEL_BY_TYPE[item.type] ?? item.type} (net ${item.net})`;
    return LABEL_BY_TYPE[item.type] ?? item.type;
}

const KIND_TINT: Record<"added" | "removed" | "changed", string> = {
    added:   "text-green-500",
    removed: "text-red-500",
    changed: "text-amber-500",
};
const KIND_PREFIX: Record<"added" | "removed" | "changed", string> = {
    added: "+", removed: "−", changed: "~",
};

function ChangedFieldsLine({ changes }: { changes?: ChangedDiffItem["changes"] }) {
    if (!changes) return null;
    const entries = Object.entries(changes);
    if (entries.length === 0) return null;
    return (
        <span className="text-muted-foreground/80 italic">
            {" "}— {entries.map(([k]) => k).join(", ")}
        </span>
    );
}

interface ItemDiffListProps {
    diff: FileDiffPayload;
    tab: DiffTab;
    onOpenItemDiff?: (tab: DiffTab, itemId?: string) => void;
}

// Types where added + removed on the same file most likely represent a net
// change (re-routed traces, moved components) rather than truly distinct
// additions and deletions. Mirrors the diff-viewer's _mergedKind() logic.
const MERGE_AS_CHANGED_TYPES = new Set(["segment", "zone", "via", "gr_line", "gr_arc", "gr_circle", "gr_rect"]);

function _shouldMergeIntoBuckets(diff: FileDiffPayload): boolean {
    if (diff.added <= 0 || diff.removed <= 0) return false;
    // If the item lists are available, only merge if ALL added/removed items
    // are of a mergeable type. If lists aren't available, fall back to merging
    // when the diff has both additions and deletions (conservative guess).
    const addedItems  = diff.added_items  ?? [];
    const removedItems = diff.removed_items ?? [];
    if (addedItems.length === 0 && removedItems.length === 0) return true; // no detail — merge conservatively
    const allMergeable = [...addedItems, ...removedItems].every(it => MERGE_AS_CHANGED_TYPES.has(it.type));
    return allMergeable;
}

function ItemDiffList({ diff, tab, onOpenItemDiff }: ItemDiffListProps) {
    const [expanded, setExpanded] = useState(false);
    const [showAllPerBucket, setShowAllPerBucket] = useState(false);
    const VISIBLE_PER_BUCKET = 5;

    // When both added and removed items are of mergeable types, collapse them
    // into a single "changed" bucket (amber) — same logic as the diff viewer.
    const mergeAddedRemoved = _shouldMergeIntoBuckets(diff);
    const rawBuckets: { kind: "added" | "removed" | "changed"; total: number; items: ChangedDiffItem[] }[] = mergeAddedRemoved
        ? [
            { kind: "changed", total: diff.added + diff.removed + diff.changed, items: [
                ...(diff.added_items   ?? []) as ChangedDiffItem[],
                ...(diff.removed_items ?? []) as ChangedDiffItem[],
                ...(diff.changed_items ?? []),
            ]},
          ]
        : [
            { kind: "added",   total: diff.added,   items: (diff.added_items   ?? []) as ChangedDiffItem[] },
            { kind: "removed", total: diff.removed, items: (diff.removed_items ?? []) as ChangedDiffItem[] },
            { kind: "changed", total: diff.changed, items: (diff.changed_items ?? []) },
          ];
    const buckets = rawBuckets.filter(b => b.total > 0);

    if (buckets.length === 0) return null;

    const totalItems = diff.added + diff.removed + diff.changed;

    return (
        <div className="ml-9 flex flex-col text-[11px] pb-1">
            {/* Master toggle: collapsed shows just bucket summary lines; expanded
                reveals per-item clickable rows. */}
            <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setExpanded(v => !v); }}
                className="flex items-center gap-1 text-muted-foreground hover:text-foreground py-0.5 -ml-3.5 self-start"
                title={expanded ? "Hide details" : "Show details"}
            >
                {expanded
                    ? <ChevronDown  className="h-3 w-3" />
                    : <ChevronRight className="h-3 w-3" />}
                <span>{totalItems} change{totalItems !== 1 ? "s" : ""}</span>
            </button>

            <div className="flex flex-col gap-1">
                {buckets.map(bucket => {
                    const visibleCount = showAllPerBucket
                        ? bucket.items.length
                        : Math.min(bucket.items.length, VISIBLE_PER_BUCKET);
                    const visibleItems = bucket.items.slice(0, visibleCount);
                    const hiddenCount = bucket.total - visibleItems.length;
                    const summary = summariseItemTypes(bucket.items) || `${bucket.total} item${bucket.total > 1 ? "s" : ""}`;
                    return (
                        <div key={bucket.kind} className="space-y-0.5">
                            <div className={`${KIND_TINT[bucket.kind]} font-medium`}>
                                {KIND_PREFIX[bucket.kind]} {summary}
                            </div>
                            {expanded && visibleItems.length > 0 && (
                                <div className="ml-3 flex flex-col gap-0.5">
                                    {visibleItems.map((it) => (
                                        <button
                                            key={`${bucket.kind}-${it.id}`}
                                            type="button"
                                            onClick={(e) => { e.stopPropagation(); onOpenItemDiff?.(tab, it.id); }}
                                            className="text-left rounded hover:bg-muted/60 -mx-1 px-1 py-0.5 transition-colors text-muted-foreground hover:text-foreground"
                                            title="Open diff viewer at this change"
                                        >
                                            <span className={KIND_TINT[bucket.kind]}>{KIND_PREFIX[bucket.kind]}</span>{" "}
                                            <span className="font-mono">{diffItemLabel(it)}</span>
                                            {bucket.kind === "changed" && <ChangedFieldsLine changes={it.changes} />}
                                        </button>
                                    ))}
                                </div>
                            )}
                            {expanded && hiddenCount > 0 && !showAllPerBucket && (
                                <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); setShowAllPerBucket(true); }}
                                    className="ml-3 text-muted-foreground hover:text-foreground italic"
                                >
                                    … and {hiddenCount} more
                                </button>
                            )}
                        </div>
                    );
                })}
                {expanded && diff.truncated && (
                    <span className="text-muted-foreground italic">(list truncated by server)</span>
                )}
            </div>
        </div>
    );
}

interface CommitItemProps {
    commit: Commit;
    projectId: string;
    onViewCommit: (hash: string) => void;
    isSelected: boolean;
    onSelect: () => void;
    selectable: boolean;
    /** Open the diff modal for this commit (vs its parent), focused on `itemId` in `tab`. */
    onOpenItemDiff?: (tab: DiffTab, itemId?: string) => void;
    /** Position in the commit list — used to draw the timeline. */
    isFirst?: boolean;
    isLast?: boolean;
}

function CommitItem({
    commit, projectId, onViewCommit, isSelected, onSelect, selectable, onOpenItemDiff,
    isFirst, isLast,
}: CommitItemProps) {
    const [copied, setCopied] = useState(false);
    const [expanded, setExpanded] = useState(false);
    const [summary, setSummary] = useState<CommitSummary | null>(null);
    const [summaryLoading, setSummaryLoading] = useState(false);
    const [summaryError, setSummaryError] = useState<string | null>(null);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(commit.full_hash);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            console.warn("Failed to copy commit hash", error);
        }
    };

    const loadSummary = useCallback(async () => {
        if (summary || summaryLoading) return;
        setSummaryLoading(true);
        setSummaryError(null);
        try {
            const data = await fetchJson<CommitSummary>(
                `/api/projects/${projectId}/commits/${commit.full_hash}/summary`,
                {},
                "Failed to load commit summary"
            );
            setSummary(data);
        } catch (e) {
            setSummaryError(e instanceof Error ? e.message : "Failed to load");
        } finally {
            setSummaryLoading(false);
        }
    }, [projectId, commit.full_hash, summary, summaryLoading]);

    const handleExpand = () => {
        const next = !expanded;
        setExpanded(next);
        if (next) loadSummary();
    };

    return (
        <div className="flex items-stretch gap-3 pb-1.5 last:pb-0">
            {/* Timeline column: vertical line + dot, one row tall */}
            <div className="relative w-4 shrink-0 flex justify-center">
                {/* upper line segment — hidden on the very first commit */}
                <div
                    aria-hidden
                    className={`absolute left-1/2 -translate-x-1/2 top-0 h-[26px] w-px ${isFirst ? "" : "bg-border"}`}
                />
                {/* dot at the same y as the commit icon/checkbox */}
                <div
                    aria-hidden
                    className={`absolute left-1/2 -translate-x-1/2 top-[22px] h-2.5 w-2.5 rounded-full border-2 ${
                        isSelected
                            ? "bg-primary border-primary"
                            : "bg-background border-muted-foreground/60"
                    }`}
                />
                {/* lower line segment — hidden on the last commit; spans the rest */}
                <div
                    aria-hidden
                    className={`absolute left-1/2 -translate-x-1/2 top-[32px] bottom-0 w-px ${isLast ? "" : "bg-border"}`}
                />
            </div>

            <div className={`flex-1 border rounded-lg transition-colors ${isSelected ? 'bg-primary/5 border-primary/50' : 'hover:bg-muted/50'}`}>
            <div className="flex items-start gap-3 p-4">
                <div className="flex-shrink-0 mt-1 flex items-center justify-center">
                    {selectable ? (
                        <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={onSelect}
                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer accent-primary"
                        />
                    ) : (
                        <GitCommit className="h-4 w-4 text-muted-foreground" />
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                        <button
                            className="text-sm font-medium leading-relaxed text-left hover:underline flex items-center gap-1.5 min-w-0"
                            onClick={handleExpand}
                        >
                            {expanded
                                ? <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                : <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
                            <span className="truncate">{(commit.message || "").split('\n')[0]}</span>
                        </button>
                        <div className="flex items-center gap-1 flex-shrink-0">
                            <code className="text-xs bg-muted px-2 py-1 rounded">
                                {commit.hash}
                            </code>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={handleCopy} title="Copy full hash">
                                {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                            </Button>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => onViewCommit(commit.full_hash)} title="View this version">
                                <Eye className="h-3 w-3" />
                            </Button>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {commit.author || "Unknown"}
                        </div>
                        {commit.kicad_changes && (
                            <div className="flex items-center gap-1">
                                <KicadChip icon={CircuitBoard} label="Schematic" count={commit.kicad_changes.sch} color="text-blue-500" />
                                <KicadChip icon={Cpu}          label="PCB"        count={commit.kicad_changes.pcb} color="text-emerald-500" />
                                <KicadChip icon={Settings}     label="Project"    count={commit.kicad_changes.pro} color="text-violet-500" />
                            </div>
                        )}
                        <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDate(commit.date)}
                        </div>
                    </div>
                </div>
            </div>

            {/* Expandable file summary */}
            {expanded && (
                <div className="border-t px-4 py-3 space-y-1">
                    {summaryLoading && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground py-1">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Loading changes…
                        </div>
                    )}
                    {summaryError && (
                        <p className="text-xs text-destructive py-1">{summaryError}</p>
                    )}
                    {summary && summary.files.length === 0 && (
                        <p className="text-xs text-muted-foreground py-1">No tracked files changed</p>
                    )}
                    {summary?.files
                        .slice()
                        .sort((a, b) => fileSortRank(a.filename) - fileSortRank(b.filename))
                        .map((file) => {
                        const { Icon: TypeIcon, color: typeColor } = fileTypeIcon(file.filename);
                        const itemDiff = file.schematic_diff ?? file.pcb_diff;
                        const fileTab: DiffTab | null =
                            file.filename.endsWith(".kicad_sch") ? "schematic" :
                            file.filename.endsWith(".kicad_pcb") ? "pcb" : null;
                        const fileClickable = !!fileTab && !!onOpenItemDiff;
                        const headerNode = (
                            <div className="flex items-center gap-2 text-xs">
                                <span className={`flex items-center gap-1 shrink-0 ${STATUS_COLOR[file.status] ?? "text-muted-foreground"}`}>
                                    {STATUS_ICON[file.status]}
                                </span>
                                <TypeIcon className={`h-3.5 w-3.5 shrink-0 ${typeColor}`} />
                                <span className="font-medium truncate" title={file.path}>{file.filename}</span>
                                <span className="text-muted-foreground truncate hidden sm:block" title={file.path}>
                                    {file.path.includes("/") ? file.path.substring(0, file.path.lastIndexOf("/")) : ""}
                                </span>
                                {(file.additions !== null || file.deletions !== null) && (
                                    <span className="ml-auto shrink-0 flex items-center gap-1.5 font-mono text-[10px]">
                                        {file.additions !== null && file.additions > 0 && (
                                            <span className="text-green-500">+{file.additions}</span>
                                        )}
                                        {file.deletions !== null && file.deletions > 0 && (
                                            <span className="text-red-500">-{file.deletions}</span>
                                        )}
                                    </span>
                                )}
                            </div>
                        );
                        return (
                            <div key={file.path} className="space-y-0.5">
                                {fileClickable ? (
                                    <button
                                        type="button"
                                        onClick={() => onOpenItemDiff!(fileTab!)}
                                        className="w-full text-left rounded hover:bg-muted/60 -mx-1 px-1 py-0.5 transition-colors"
                                        title="Open diff viewer for this file"
                                    >
                                        {headerNode}
                                    </button>
                                ) : headerNode}
                                {itemDiff && fileTab && (
                                    <ItemDiffList
                                        diff={itemDiff}
                                        tab={fileTab}
                                        onOpenItemDiff={onOpenItemDiff}
                                    />
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
            </div>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Tabbed diff modal
// ---------------------------------------------------------------------------

interface CommitDiffModalProps {
    projectId: string;
    commit1: string;
    commit2: string;
    onClose: () => void;
    /** Optional: which tab to open on. Defaults to schematic. */
    initialTab?: DiffTab;
    /** Optional: item id to focus inside that tab's diff viewer. */
    focusItemId?: string;
}

function CommitDiffModal({ projectId, commit1, commit2, onClose, initialTab, focusItemId }: CommitDiffModalProps) {
    const [tab, setTab] = useState<DiffTab>(initialTab ?? "schematic");
    // Last reference selected in each tab — used to navigate the other tab when switching
    const lastSelected = useRef<{ schematic?: string; pcb?: string }>({});
    const [schCrossProbeTarget, setSchCrossProbeTarget] = useState<string | undefined>(undefined);
    const [pcbCrossProbeTarget, setPcbCrossProbeTarget] = useState<string | undefined>(undefined);

    const handleSchematicCrossProbe = useCallback((reference: string) => {
        lastSelected.current.schematic = reference;
    }, []);

    const handlePcbCrossProbe = useCallback((reference: string) => {
        lastSelected.current.pcb = reference;
    }, []);

    const handleTabChange = useCallback((next: DiffTab) => {
        if (next === "pcb" && lastSelected.current.schematic) {
            setPcbCrossProbeTarget(lastSelected.current.schematic);
        } else if (next === "schematic" && lastSelected.current.pcb) {
            setSchCrossProbeTarget(lastSelected.current.pcb);
        }
        setTab(next);
    }, []);

    const tabs: { id: DiffTab; label: string; icon: React.ReactNode }[] = [
        { id: "schematic", label: "Schematic", icon: <CircuitBoard className="h-3.5 w-3.5" /> },
        { id: "pcb",       label: "PCB",       icon: <Cpu          className="h-3.5 w-3.5" /> },
        { id: "bom",       label: "BOM",       icon: <List         className="h-3.5 w-3.5" /> },
    ];

    return (
        <div className="fixed inset-0 z-50 bg-background flex flex-col">
            {/* Tab bar header */}
            <div className="flex items-center gap-0 border-b bg-background/95 backdrop-blur shrink-0 px-2">
                <Button variant="ghost" size="icon" className="h-8 w-8 mr-2 shrink-0" onClick={onClose}>
                    <X className="h-4 w-4" />
                </Button>
                <div className="flex-1 flex items-center">
                    {tabs.map((t) => (
                        <button
                            key={t.id}
                            onClick={() => handleTabChange(t.id)}
                            className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                                tab === t.id
                                    ? "border-primary text-foreground"
                                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/40"
                            }`}
                        >
                            {t.icon}
                            {t.label}
                        </button>
                    ))}
                </div>
                <p className="text-xs text-muted-foreground font-mono pr-3 shrink-0">
                    {commit2.slice(0, 7)} → {commit1.slice(0, 7)}
                </p>
            </div>

            {/* Tab content — always mounted to preserve viewer state across tab switches */}
            <div className="flex-1 overflow-hidden relative">
                <div className="absolute inset-0" style={{ display: tab === "schematic" ? undefined : "none" }}>
                    <SchematicDiffViewer
                        projectId={projectId}
                        commit1={commit1}
                        commit2={commit2}
                        onClose={onClose}
                        embedded
                        onCrossProbe={handleSchematicCrossProbe}
                        crossProbeTarget={schCrossProbeTarget}
                        focusItemId={initialTab === "schematic" ? focusItemId : undefined}
                    />
                </div>
                <div className="absolute inset-0" style={{ display: tab === "pcb" ? undefined : "none" }}>
                    <PcbDiffViewer
                        projectId={projectId}
                        commit1={commit1}
                        commit2={commit2}
                        onClose={onClose}
                        embedded
                        onCrossProbe={handlePcbCrossProbe}
                        crossProbeTarget={pcbCrossProbeTarget}
                        focusItemId={initialTab === "pcb" ? focusItemId : undefined}
                    />
                </div>
                {tab === "bom" && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="flex flex-col items-center gap-3 text-center">
                            <List className="h-10 w-10 text-muted-foreground/40" />
                            <p className="text-sm font-medium text-muted-foreground">BOM diff coming soon</p>
                            <p className="text-xs text-muted-foreground/60">Bill of materials comparison will appear here</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export function HistoryViewer({ projectId, onViewCommit, canCompareDiffs }: HistoryViewerProps) {
    const [releases, setReleases] = useState<Release[]>([]);
    const [commits, setCommits] = useState<Commit[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedCommits, setSelectedCommits] = useState<string[]>([]);
    const [showDiff, setShowDiff] = useState(false);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [currentBranch, setCurrentBranch] = useState<string | null>(null);
    // null = "default" (HEAD); otherwise a branch name to filter commits to.
    const [selectedBranch, setSelectedBranch] = useState<string | null>(null);
    // Single-commit diff: opens the modal against the commit's parent and
    // optionally pre-selects an item / tab.
    const [itemDiff, setItemDiff] = useState<{
        commit1: string;
        commit2: string;
        tab: DiffTab;
        focusItemId?: string;
    } | null>(null);

    // Filter commits to find selected ones and determining newer/older
    const diffPair = useMemo(() => {
        if (selectedCommits.length !== 2) return null;

        // Commits are already sorted by date (newest first)
        const c1Index = commits.findIndex(c => c.full_hash === selectedCommits[0]);
        const c2Index = commits.findIndex(c => c.full_hash === selectedCommits[1]);

        if (c1Index === -1 || c2Index === -1) return null;

        // Smaller index = Newer commit
        const newerIndex = Math.min(c1Index, c2Index);
        const olderIndex = Math.max(c1Index, c2Index);

        return {
            newer: commits[newerIndex],
            older: commits[olderIndex]
        };
    }, [commits, selectedCommits]);

    const handleSelectCommit = (hash: string) => {
        if (!canCompareDiffs) {
            return;
        }
        setSelectedCommits(prev => {
            if (prev.includes(hash)) {
                return prev.filter(h => h !== hash);
            }
            if (prev.length >= 2) {
                // Remove oldest selection (first one added? or just FIFO)
                // Let's just create a new array with the new one
                return [prev[1], hash];
            }
            return [...prev, hash];
        });
    };

    useEffect(() => {
        if (!canCompareDiffs) {
            setSelectedCommits([]);
        }
    }, [canCompareDiffs]);

    useEffect(() => {
        const currentHashes = new Set(commits.map((commit) => commit.full_hash));
        setSelectedCommits((previous) => previous.filter((hash) => currentHashes.has(hash)).slice(-2));
    }, [commits]);

    // Branches: fetch once per project, then default the selected branch to
    // the current HEAD branch if any.
    useEffect(() => {
        const controller = new AbortController();
        fetchJson<BranchesResponse>(
            `/api/projects/${projectId}/branches`,
            { signal: controller.signal },
            "Failed to load branches"
        ).then((data) => {
            if (controller.signal.aborted) return;
            setBranches(data.branches ?? []);
            setCurrentBranch(data.current ?? null);
            // Default selection: the current branch, so the initial commit list
            // matches what the user is checked out on.
            if (data.current) setSelectedBranch(prev => prev ?? data.current ?? null);
        }).catch((err: unknown) => {
            if (err instanceof DOMException && err.name === "AbortError") return;
            // Non-fatal — branches are an enhancement, the commit list still works.
            console.warn("Failed to fetch branches", err);
        });
        return () => controller.abort();
    }, [projectId]);

    // Releases + commits. Re-fetches when the selected branch changes.
    useEffect(() => {
        const controller = new AbortController();
        setLoading(true);
        setError(null);

        const commitsUrl = selectedBranch
            ? `/api/projects/${projectId}/commits?branch=${encodeURIComponent(selectedBranch)}`
            : `/api/projects/${projectId}/commits`;

        const fetchHistory = async () => {
            const [releasesResult, commitsResult] = await Promise.allSettled([
                fetchJson<ReleasesResponse>(
                    `/api/projects/${projectId}/releases`,
                    { signal: controller.signal },
                    "Failed to load releases"
                ),
                fetchJson<CommitsResponse>(
                    commitsUrl,
                    { signal: controller.signal },
                    "Failed to load commits"
                ),
            ]);

            if (controller.signal.aborted) {
                return;
            }

            if (releasesResult.status === "fulfilled") {
                setReleases(releasesResult.value.releases || []);
            } else {
                setReleases([]);
            }

            if (commitsResult.status === "fulfilled") {
                setCommits(commitsResult.value.commits || []);
            } else {
                setCommits([]);
            }

            if (releasesResult.status === "rejected" && commitsResult.status === "rejected") {
                const releaseMessage =
                    releasesResult.reason instanceof Error ? releasesResult.reason.message : "Failed to load releases";
                const commitMessage =
                    commitsResult.reason instanceof Error ? commitsResult.reason.message : "Failed to load commits";
                setError(`${releaseMessage}. ${commitMessage}`);
            } else if (releasesResult.status === "rejected") {
                const releaseMessage =
                    releasesResult.reason instanceof Error ? releasesResult.reason.message : "Failed to load releases";
                setError(releaseMessage);
            } else if (commitsResult.status === "rejected") {
                const commitMessage =
                    commitsResult.reason instanceof Error ? commitsResult.reason.message : "Failed to load commits";
                setError(commitMessage);
            } else {
                setError(null);
            }

            setLoading(false);
        };

        fetchHistory().catch((err: unknown) => {
            if (controller.signal.aborted) {
                return;
            }
            if (err instanceof DOMException && err.name === "AbortError") {
                return;
            }
            console.error("Failed to fetch history", err);
            setError("Failed to load history");
            setLoading(false);
        });

        return () => controller.abort();
    }, [projectId, selectedBranch]);

    if (loading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-64 w-full" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {error && (
                <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm text-red-500">
                    {error}
                </div>
            )}

            {/* Tabbed diff modal — two-commit comparison */}
            {showDiff && diffPair && (
                <CommitDiffModal
                    projectId={projectId}
                    commit1={diffPair.newer.full_hash}
                    commit2={diffPair.older.full_hash}
                    onClose={() => setShowDiff(false)}
                />
            )}

            {/* Tabbed diff modal — single commit vs its parent, optionally
                focused on a specific changed item. */}
            {itemDiff && (
                <CommitDiffModal
                    projectId={projectId}
                    commit1={itemDiff.commit1}
                    commit2={itemDiff.commit2}
                    onClose={() => setItemDiff(null)}
                    initialTab={itemDiff.tab}
                    focusItemId={itemDiff.focusItemId}
                />
            )}

            {/* Releases Section */}
            {releases.length > 0 && (
                <div className="space-y-4">
                    <h3 className="text-xl font-semibold flex items-center gap-2">
                        <Tag className="h-5 w-5" />
                        Releases
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {releases.map((release) => (
                            <div
                                key={release.tag}
                                className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                            >
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <Tag className="h-4 w-4 text-green-500" />
                                        <span className="font-semibold">{release.tag}</span>
                                    </div>
                                    <code className="text-xs bg-muted px-2 py-1 rounded">
                                        {release.commit_hash}
                                    </code>
                                </div>
                                <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                                    {release.message || "No description"}
                                </p>
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <Calendar className="h-3 w-3" />
                                    {formatDate(release.date)}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Commits Section */}
            <div className="space-y-4">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                    <h3 className="text-xl font-semibold flex items-center gap-2">
                        <GitCommit className="h-5 w-5" />
                        Commits
                    </h3>
                    <div className="flex items-center gap-2">
                        {branches.length > 0 && (
                            <BranchSelector
                                branches={branches}
                                currentBranch={currentBranch}
                                selectedBranch={selectedBranch}
                                onSelect={setSelectedBranch}
                            />
                        )}
                        {canCompareDiffs && selectedCommits.length === 2 && (
                            <Button
                                variant="default"
                                size="sm"
                                onClick={() => setShowDiff(true)}
                            >
                                <GitCompare className="h-4 w-4 mr-2" />
                                Compare Changes
                            </Button>
                        )}
                    </div>
                </div>

                {commits.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                        No commits found
                    </p>
                ) : (
                    <div>
                        {commits.map((commit, idx) => (
                            <CommitItem
                                key={commit.full_hash}
                                commit={commit}
                                projectId={projectId}
                                onViewCommit={onViewCommit}
                                isSelected={selectedCommits.includes(commit.full_hash)}
                                onSelect={() => handleSelectCommit(commit.full_hash)}
                                selectable={canCompareDiffs}
                                isFirst={idx === 0}
                                isLast={idx === commits.length - 1}
                                onOpenItemDiff={(tab, itemId) => {
                                    const parent = commit.parents?.[0];
                                    if (!parent) return; // root commit — nothing to diff against
                                    setItemDiff({
                                        commit1: commit.full_hash,
                                        commit2: parent,
                                        tab,
                                        focusItemId: itemId,
                                    });
                                }}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
