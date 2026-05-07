import { useEffect, useMemo, useState, useCallback } from "react";
import { GitCommit, Tag, Eye, Check, Copy, User, Clock, Calendar, GitCompare, ChevronDown, ChevronRight, FileText, Plus, Minus, RefreshCw, Loader2, X, CircuitBoard, Cpu, List } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
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
}

interface ReleasesResponse {
    releases: Release[];
}

interface CommitsResponse {
    commits: Commit[];
}

interface CommitFile {
    path: string;
    filename: string;
    status: "added" | "removed" | "modified" | "renamed";
    additions: number | null;
    deletions: number | null;
    schematic_diff?: {
        added: number;
        removed: number;
        changed: number;
    };
}

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

interface CommitItemProps {
    commit: Commit;
    projectId: string;
    onViewCommit: (hash: string) => void;
    isSelected: boolean;
    onSelect: () => void;
    selectable: boolean;
}

function CommitItem({ commit, projectId, onViewCommit, isSelected, onSelect, selectable }: CommitItemProps) {
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
        <div className={`border rounded-lg transition-colors ${isSelected ? 'bg-primary/5 border-primary/50' : 'hover:bg-muted/50'}`}>
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
                    {summary?.files.map((file) => (
                        <div key={file.path} className="space-y-0.5">
                            <div className="flex items-center gap-2 text-xs">
                                <span className={`flex items-center gap-1 shrink-0 ${STATUS_COLOR[file.status] ?? "text-muted-foreground"}`}>
                                    {STATUS_ICON[file.status]}
                                </span>
                                <FileText className="h-3 w-3 shrink-0 text-muted-foreground" />
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
                            {file.schematic_diff && (
                                <div className="ml-9 flex items-center gap-3 text-[11px] font-mono pb-0.5">
                                    {file.schematic_diff.added > 0 && (
                                        <span className="text-green-500">+{file.schematic_diff.added} items</span>
                                    )}
                                    {file.schematic_diff.removed > 0 && (
                                        <span className="text-red-500">-{file.schematic_diff.removed} items</span>
                                    )}
                                    {file.schematic_diff.changed > 0 && (
                                        <span className="text-amber-500">~{file.schematic_diff.changed} changed</span>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ---------------------------------------------------------------------------
// Tabbed diff modal
// ---------------------------------------------------------------------------

type DiffTab = "schematic" | "pcb" | "bom";

interface CommitDiffModalProps {
    projectId: string;
    commit1: string;
    commit2: string;
    onClose: () => void;
}

function CommitDiffModal({ projectId, commit1, commit2, onClose }: CommitDiffModalProps) {
    const [tab, setTab] = useState<DiffTab>("schematic");

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
                            onClick={() => setTab(t.id)}
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

            {/* Tab content */}
            <div className="flex-1 overflow-hidden relative">
                {tab === "schematic" && (
                    <div className="absolute inset-0">
                        <SchematicDiffViewer
                            projectId={projectId}
                            commit1={commit1}
                            commit2={commit2}
                            onClose={onClose}
                            embedded
                        />
                    </div>
                )}
                {tab === "pcb" && (
                    <div className="absolute inset-0">
                        <PcbDiffViewer
                            projectId={projectId}
                            commit1={commit1}
                            commit2={commit2}
                            onClose={onClose}
                            embedded
                        />
                    </div>
                )}
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

    useEffect(() => {
        const controller = new AbortController();
        setLoading(true);
        setError(null);

        const fetchHistory = async () => {
            const [releasesResult, commitsResult] = await Promise.allSettled([
                fetchJson<ReleasesResponse>(
                    `/api/projects/${projectId}/releases`,
                    { signal: controller.signal },
                    "Failed to load releases"
                ),
                fetchJson<CommitsResponse>(
                    `/api/projects/${projectId}/commits`,
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
    }, [projectId]);

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

            {/* Tabbed diff modal */}
            {showDiff && diffPair && (
                <CommitDiffModal
                    projectId={projectId}
                    commit1={diffPair.newer.full_hash}
                    commit2={diffPair.older.full_hash}
                    onClose={() => setShowDiff(false)}
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
                <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold flex items-center gap-2">
                        <GitCommit className="h-5 w-5" />
                        Commits
                    </h3>
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

                {commits.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                        No commits found
                    </p>
                ) : (
                    <div className="space-y-3">
                        {commits.map((commit) => (
                            <CommitItem
                                key={commit.full_hash}
                                commit={commit}
                                projectId={projectId}
                                onViewCommit={onViewCommit}
                                isSelected={selectedCommits.includes(commit.full_hash)}
                                onSelect={() => handleSelectCommit(commit.full_hash)}
                                selectable={canCompareDiffs}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
