/**
 * Staging a merge of two KiCad branches, object by object.
 *
 * Opened from the KiCad plugin, which starts a session with the local agent and hands us
 * a one-shot key in the URL fragment. Everything on this page happens against that one
 * session: one repository, one branch, and a token that expires.
 *
 * The page is a CHOOSER, not a writer. It never sends file content anywhere. It sends a
 * list of "for this object, take theirs" decisions, and the agent rebuilds the merge from
 * git and validates it before writing a byte. That division is what keeps a web page from
 * being able to put arbitrary content into somebody's board.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, Check, GitMerge, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { CATEGORY_META, categoryFor, type Category } from "@/lib/diff-grouping";
import { MergePanes, type PaneContent } from "@/components/merge-panes";
import {
    claim,
    commitMerge,
    fetchPlan,
    fetchSide,
    readSessionFromUrl,
    MergeAgentError,
    MergeLinkSpentError,
    type MergeDecision,
    type MergeFile,
    type MergePlan,
    type MergeSession,
    type TraceGroup,
} from "@/lib/merge-agent";

type Resolutions = Record<string, string>;

/** What each classification means to someone who did not write the diff engine. */
const CLASSIFICATION_LABEL: Record<string, string> = {
    only_ours: "Only you changed this",
    only_theirs: "Only they changed this",
    both_same: "You both made the same change",
    both_fields: "You changed different things",
    conflict: "You both changed the same thing",
    key_collision: "Two different things in the same place",
    undescribable: "Changed in a way Prism can't show",
};

const RESOLUTION_LABEL: Record<string, string> = {
    ours: "Keep mine",
    theirs: "Take theirs",
    both: "Keep both",
    remove: "Remove",
};

export default function MergePage() {
    const [session, setSession] = useState<MergeSession | null>(null);
    const [plan, setPlan] = useState<MergePlan | null>(null);
    const [error, setError] = useState<string>("");
    const [loading, setLoading] = useState(true);
    const [resolutions, setResolutions] = useState<Resolutions>({});
    const [committing, setCommitting] = useState(false);
    const [done, setDone] = useState<string>("");
    const [message, setMessage] = useState("");
    // Set once the user agrees to put uncommitted work aside. `undefined` means they
    // have not been asked; "" is a valid (if unhelpful) name they chose.
    const [stashMessage, setStashMessage] = useState<string | undefined>(undefined);
    const [needsStash, setNeedsStash] = useState<string>("");

    // Which file the panes are showing, and which object to centre in them.
    const [viewedPath, setViewedPath] = useState<string>("");
    const [focusKey, setFocusKey] = useState<string | undefined>(undefined);
    // null while loading, "" when that side does not have the file at all.
    const [sides, setSides] = useState<Record<string, string | null>>({});

    // Text files git could not merge by line, and which side the user picked for each.
    // Only populated once the agent has actually tried and refused: a file that merges
    // cleanly should never ask anyone anything.
    const [textConflicts, setTextConflicts] = useState<string[]>([]);
    const [textChoices, setTextChoices] = useState<Record<string, string>>({});

    // Claim the session and load the plan. Runs once: the key is single-use, so a
    // re-run would fail even though nothing is wrong.
    useEffect(() => {
        let cancelled = false;

        (async () => {
            let params: ReturnType<typeof readSessionFromUrl>;
            try {
                params = readSessionFromUrl();
            } catch (caught) {
                setError(
                    caught instanceof MergeLinkSpentError
                        ? caught.message
                        : "This page needs to be opened from KiCad.",
                );
                setLoading(false);
                return;
            }

            if (!params) {
                setError("This page needs to be opened from KiCad.");
                setLoading(false);
                return;
            }

            try {
                console.log("[merge] claiming", {
                    port: params.port,
                    session: params.sessionId,
                    keyLength: params.key.length,
                });
                const claimed = await claim(params.port, params.sessionId, params.key);
                if (cancelled) return;
                console.log("[merge] claimed OK, fetching plan");
                setSession(claimed);

                const loaded = await fetchPlan(claimed);
                if (cancelled) return;
                console.log("[merge] plan loaded", loaded);
                setPlan(loaded);

                // Start from what the engine considers safe. Every decision has a
                // default; conflicts default to keeping ours, so accepting the whole
                // page without reading it can never silently discard your own work.
                const initial: Resolutions = {};
                for (const file of loaded.files) {
                    for (const decision of file.decisions) {
                        initial[`${file.path}::${decision.key}`] = decision.default;
                    }
                }
                setResolutions(initial);
            } catch (caught) {
                console.error("[merge] startup failed:", caught);
                if (!cancelled) {
                    setError(
                        caught instanceof MergeAgentError
                            ? caught.message
                            : "Something went wrong starting this merge.",
                    );
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();

        return () => { cancelled = true; };
    }, []);

    // Which routing decisions were set by following a component rather than by hand, so
    // the rows can say so and the choice can be taken back.
    const [followed, setFollowed] = useState<Record<string, string>>({});

    const setResolution = useCallback(
        (path: string, key: string, value: string, cascade = true) => {
            const file = plan?.files.find(f => f.path === path);
            const updates: Resolutions = { [`${path}::${key}`]: value };
            const followedNow: Record<string, string> = {};

            // Moving a part moves the traces attached to it. That is one intent, and
            // making someone re-state it per trace is how a component ends up in one
            // branch's position wired with the other branch's copper.
            if (cascade && file) {
                for (const group of file.groups ?? []) {
                    if (group.follows !== key) continue;
                    if (!group.resolutions.includes(value)) continue;
                    for (const member of group.keys) {
                        updates[`${path}::${member}`] = value;
                        followedNow[`${path}::${member}`] = key;
                    }
                }
            }

            setResolutions(previous => ({ ...previous, ...updates }));
            if (Object.keys(followedNow).length > 0) {
                setFollowed(previous => ({ ...previous, ...followedNow }));
            }
            if (!cascade) {
                // Set by hand: it is no longer following anything.
                setFollowed(previous => {
                    const next = { ...previous };
                    delete next[`${path}::${key}`];
                    return next;
                });
            }
        },
        [plan],
    );

    // The file the panes are showing. Defaults to the first one with something to
    // decide, so a merge with one board opens straight onto it.
    const viewed = useMemo(() => {
        if (!plan) return null;
        const drawable = plan.files.filter(f => f.semantic);
        if (drawable.length === 0) return null;
        return drawable.find(f => f.path === viewedPath) ?? drawable[0];
    }, [plan, viewedPath]);

    // Fetch the three sides of whichever file is on screen. Separate requests, in
    // parallel: they are independent, and the first to arrive can start parsing while
    // the others are still in flight.
    useEffect(() => {
        if (!session || !viewed) return;
        let cancelled = false;

        setSides({});
        for (const side of ["base", "ours", "theirs"] as const) {
            fetchSide(session, viewed.path, side)
                .then(text => {
                    if (!cancelled) setSides(prev => ({ ...prev, [side]: text }));
                })
                .catch(() => {
                    // A side that does not have this file is a legitimate outcome, and
                    // one the merge is often ABOUT. "" renders as "not in this version".
                    if (!cancelled) setSides(prev => ({ ...prev, [side]: "" }));
                });
        }

        return () => { cancelled = true; };
    }, [session, viewed]);

    // Where the focused object sits on the board. Every decision carries coordinates
    // whether or not it has a uuid, so this is what makes clicking a TRACK work: those
    // are keyed by their own geometry and have no id the viewer could look up.
    const focusAt = useMemo(() => {
        if (!focusKey || !plan) return null;
        for (const file of plan.files) {
            for (const decision of file.decisions) {
                if (decision.key !== focusKey) continue;
                // Prefer the side that still has it: an object one side deleted has no
                // position there, and that side is often the point of the change.
                const item =
                    decision.theirs_item ?? decision.ours_item ?? decision.base_item;
                const x = item?.x as number | undefined;
                const y = item?.y as number | undefined;
                return typeof x === "number" && typeof y === "number" ? { x, y } : null;
            }
        }
        return null;
    }, [focusKey, plan]);

    const panes = useMemo<PaneContent[]>(() => {
        if (!plan || !viewed) return [];
        const filename = viewed.path.split("/").pop() || viewed.path;
        return [
            { side: "base" as const, label: "Common ancestor", detail: plan.base.slice(0, 8) },
            { side: "ours" as const, label: "Yours", detail: plan.ours },
            { side: "theirs" as const, label: "Theirs", detail: plan.theirs },
        ].map(pane => ({
            ...pane,
            filename,
            content: sides[pane.side] ?? null,
        }));
    }, [plan, viewed, sides]);

    // Split, because they are different requests of the reader. A conflict is two
    // people disagreeing and someone has to pick. An inferred match is Prism saying "I
    // think this is the same part, confirm it" - lumping them together would make the
    // count read as more disagreement than there is.
    const conflicts = useMemo(
        () =>
            (plan?.files ?? []).flatMap(f =>
                f.decisions.filter(d => d.needs_input && !d.inferred_identity),
            ),
        [plan],
    );

    const inferred = useMemo(
        () =>
            (plan?.files ?? []).flatMap(f =>
                f.decisions.filter(d => d.inferred_identity),
            ),
        [plan],
    );

    // Text conflicts the user has not answered yet. The Merge button stays enabled:
    // the agent is the one that decides, and it will simply refuse again and re-surface
    // the list. Disabling here would only duplicate that check in a place that can go
    // stale.
    const unsettledText = useMemo(
        () => textConflicts.filter(path => !textChoices[path]).length,
        [textConflicts, textChoices],
    );

    const runCommit = useCallback(
        async (stashName: string | undefined) => {
            if (!session || !plan) return;
            setCommitting(true);
            setError("");

            const decisions: Record<string, { key: string; resolution: string }[]> = {};
            for (const file of plan.files) {
                decisions[file.path] = file.decisions.map(d => ({
                    key: d.key,
                    resolution: resolutions[`${file.path}::${d.key}`] ?? d.default,
                }));
            }

            try {
                const result = await commitMerge(session, decisions, {
                    message,
                    stashMessage: stashName,
                    textChoices,
                });
                setDone(result.message);
            } catch (caught) {
                const detail =
                    caught instanceof MergeAgentError
                        ? caught.message
                        : "The merge could not be completed.";
                const conflicts =
                    caught instanceof MergeAgentError ? caught.conflicts : [];

                // Both of these are refusals with a way out, not dead ends. Surfacing
                // the reason and stopping would send the user to a terminal to do by
                // hand what the page could have offered.
                if (conflicts.length > 0) {
                    setTextConflicts(conflicts);
                    setError("");
                } else if (/uncommitted/i.test(detail) && stashName === undefined) {
                    setNeedsStash(detail);
                } else {
                    setError(detail);
                }
            } finally {
                setCommitting(false);
            }
        },
        [session, plan, resolutions, message, textChoices],
    );

    const handleCommit = useCallback(() => {
        void runCommit(stashMessage);
    }, [runCommit, stashMessage]);

    if (loading) {
        return (
            <Centred>
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Reading both branches…</p>
            </Centred>
        );
    }

    if (done) {
        return (
            <Centred>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10">
                    <Check className="h-6 w-6 text-emerald-500" />
                </div>
                <p className="text-lg font-medium">{done}</p>
                <p className="text-sm text-muted-foreground">
                    You can close this tab and go back to KiCad.
                </p>
            </Centred>
        );
    }

    if (error && !plan) {
        return (
            <Centred>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                    <X className="h-6 w-6 text-destructive" />
                </div>
                <p className="text-lg font-medium">Can&apos;t start this merge</p>
                <p className="max-w-md text-center text-sm text-muted-foreground">{error}</p>
            </Centred>
        );
    }

    if (!plan) return null;

    return (
        <div className="flex h-screen flex-col bg-background text-foreground">
            <header className="flex shrink-0 items-center justify-between gap-4 border-b px-5 py-3">
                <div className="flex items-center gap-3">
                    <GitMerge className="h-5 w-5 text-primary" />
                    <div>
                        <h1 className="text-base font-semibold leading-tight">
                            Merge <span className="font-mono">{plan.theirs}</span> into{" "}
                            <span className="font-mono">{plan.ours}</span>
                        </h1>
                        <p className="text-xs text-muted-foreground">{plan.detail}</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {unsettledText > 0 && (
                        <Badge variant="outline" className="gap-1.5 border-amber-500/40 text-amber-500">
                            <AlertTriangle className="h-3 w-3" />
                            {unsettledText} file{unsettledText === 1 ? "" : "s"} git couldn&apos;t merge
                        </Badge>
                    )}
                    {inferred.length > 0 && (
                        <Badge variant="outline" className="gap-1.5 border-sky-500/40 text-sky-500">
                            {inferred.length} matched by similarity
                        </Badge>
                    )}
                    {conflicts.length > 0 && (
                        <Badge variant="outline" className="gap-1.5 border-amber-500/40 text-amber-500">
                            <AlertTriangle className="h-3 w-3" />
                            {conflicts.length} need{conflicts.length === 1 ? "s" : ""} a choice
                        </Badge>
                    )}
                    <Input
                        value={message}
                        onChange={e => setMessage(e.target.value)}
                        placeholder="Describe this merge (optional)"
                        className="h-9 w-72"
                    />
                    <Button onClick={handleCommit} disabled={committing}>
                        {committing ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Merging…
                            </>
                        ) : (
                            "Merge"
                        )}
                    </Button>
                </div>
            </header>

            {error && (
                <div className="shrink-0 border-b border-destructive/30 bg-destructive/10 px-5 py-2.5 text-sm text-destructive">
                    {error}
                </div>
            )}

            {needsStash && (
                <StashPrompt
                    detail={needsStash}
                    onCancel={() => setNeedsStash("")}
                    onConfirm={name => {
                        setStashMessage(name);
                        setNeedsStash("");
                        // Hand the name straight to the retry rather than reading it back
                        // from state, which has not landed yet in this tick.
                        void runCommit(name);
                    }}
                />
            )}

            <main className="flex min-h-0 flex-1">
                {/* The board, when there is one to draw. Left side, because it is what
                    the reader looks at while deciding; the list is the thing they act on. */}
                {viewed && (
                    <div className="min-w-0 flex-1 border-r">
                        <MergePanes panes={panes} focusKey={focusKey} focusAt={focusAt} />
                    </div>
                )}

                <div
                    className={
                        viewed
                            ? "w-[26rem] shrink-0 overflow-y-auto"
                            : "min-h-0 flex-1 overflow-y-auto"
                    }
                >
                    <div className={viewed ? "space-y-6 p-4" : "mx-auto max-w-4xl space-y-6 p-5"}>
                        {plan.files.map(file => (
                            <FileSection
                                key={file.path}
                                file={file}
                                resolutions={resolutions}
                                followed={followed}
                                onResolve={setResolution}
                                selected={viewed?.path === file.path}
                                onSelectFile={() => setViewedPath(file.path)}
                                onFocus={setFocusKey}
                                focusKey={focusKey}
                            />
                        ))}

                        {plan.text_files.length > 0 && (
                            <TextFiles
                                paths={plan.text_files}
                                conflicts={textConflicts}
                                choices={textChoices}
                                onChoose={(path, side) =>
                                    setTextChoices(prev => ({ ...prev, [path]: side }))
                                }
                            />
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}

/**
 * Offer to set uncommitted work aside, and ask what to call it.
 *
 * The name is the point. Git's own default is "WIP on main: a1b2c3d", which says nothing
 * about what is in it, and after two of them nobody knows which board they were half way
 * through editing.
 */
function StashPrompt({
    detail,
    onCancel,
    onConfirm,
}: {
    detail: string;
    onCancel: () => void;
    onConfirm: (name: string) => void;
}) {
    const [name, setName] = useState("");

    return (
        <div className="shrink-0 border-b border-amber-500/30 bg-amber-500/10 px-5 py-3">
            <p className="text-sm">{detail}</p>
            <p className="mt-1 text-sm text-muted-foreground">
                Prism can set them aside and you can bring them back afterwards.
            </p>
            <div className="mt-2.5 flex items-center gap-2">
                <Input
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="What were you working on?"
                    className="h-9 w-80"
                    autoFocus
                    onKeyDown={e => {
                        if (e.key === "Enter") onConfirm(name);
                    }}
                />
                <Button size="sm" onClick={() => onConfirm(name)}>
                    Set aside and merge
                </Button>
                <Button size="sm" variant="ghost" onClick={onCancel}>
                    Cancel
                </Button>
            </div>
        </div>
    );
}

function Centred({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex h-screen flex-col items-center justify-center gap-3 bg-background text-foreground">
            {children}
        </div>
    );
}

function FileSection({
    file,
    resolutions,
    followed,
    onResolve,
    selected,
    onSelectFile,
    onFocus,
    focusKey,
}: {
    file: MergeFile;
    resolutions: Resolutions;
    followed: Record<string, string>;
    onResolve: (path: string, key: string, value: string, cascade?: boolean) => void;
    selected?: boolean;
    onSelectFile?: () => void;
    onFocus?: (key: string) => void;
    focusKey?: string;
}) {
    // Group by the same categories the diff viewer uses, so "Components" means the same
    // thing here as it does when reviewing a commit.
    const grouped = useMemo(() => {
        const buckets = new Map<Category, MergeDecision[]>();
        for (const decision of file.decisions) {
            const category = categoryFor(decision.kind);
            const existing = buckets.get(category);
            if (existing) existing.push(decision);
            else buckets.set(category, [decision]);
        }
        return [...buckets.entries()].sort(
            (a, b) => CATEGORY_META[a[0]].order - CATEGORY_META[b[0]].order,
        );
    }, [file.decisions]);

    return (
        <section className={`rounded-lg border ${selected ? "border-primary/50" : ""}`}>
            <button
                type="button"
                onClick={onSelectFile}
                disabled={!file.semantic || !onSelectFile}
                className="flex w-full items-center justify-between gap-3 border-b px-4 py-2.5 text-left disabled:cursor-default"
            >
                <h2 className="truncate font-mono text-sm font-medium">{file.path}</h2>
                <span className="shrink-0 text-xs text-muted-foreground">{file.detail}</span>
            </button>

            {/* Taking one side wholesale is a normal thing to want, and doing it by
                hand across dozens of rows is where a row gets missed. */}
            <div className="flex items-center gap-2 border-b px-4 py-2">
                <span className="text-xs text-muted-foreground">Set every change:</span>
                {(["ours", "theirs"] as const).map(side => (
                    <Button
                        key={side}
                        size="sm"
                        variant="outline"
                        className="h-7 px-2.5 text-xs"
                        onClick={() => {
                            // cascade:false - this already sets every decision in the
                            // file, so following a component would only re-set rows that
                            // are about to be set anyway, and would mark them as
                            // followed when the user chose them outright.
                            for (const decision of file.decisions) {
                                if (decision.resolutions.includes(side)) {
                                    onResolve?.(file.path, decision.key, side, false);
                                }
                            }
                        }}
                    >
                        {side === "ours" ? "Keep all mine" : "Take all theirs"}
                    </Button>
                ))}
            </div>

            {file.decisions.length === 0 ? (
                <p className="px-4 py-6 text-center text-sm text-muted-foreground">
                    Nothing to choose between in this file.
                </p>
            ) : (
                <div className="divide-y">
                    {grouped.map(([category, decisions]) => (
                        <CategoryGroup
                            key={category}
                            label={CATEGORY_META[category].label}
                            decisions={decisions}
                            groups={file.groups ?? []}
                            path={file.path}
                            resolutions={resolutions}
                            followed={followed}
                            onResolve={onResolve}
                            onFocus={onFocus}
                            focusKey={focusKey}
                        />
                    ))}
                </div>
            )}
        </section>
    );
}

function CategoryGroup({
    label,
    decisions,
    groups,
    path,
    resolutions,
    followed,
    onResolve,
    onFocus,
    focusKey,
}: {
    label: string;
    decisions: MergeDecision[];
    groups: TraceGroup[];
    path: string;
    resolutions: Resolutions;
    followed: Record<string, string>;
    onResolve: (path: string, key: string, value: string, cascade?: boolean) => void;
    onFocus?: (key: string) => void;
    focusKey?: string;
}) {
    // A pour reroute is hundreds of segments. Showing them all would bury the handful
    // that actually need a person, so the ones needing input come first and the rest
    // collapse behind a count.
    //
    // Tracks collapse further, by net: rerouting GND is one thing the engineer did, not
    // four hundred. Display only - the merge still stages every individual segment.
    // Split on whether there is a CHOICE, not on whether the engine demands one.
    //
    // "only I changed this" needs no arbitration, but it is still a decision: taking
    // the other side everywhere is a normal thing to want, and those rows are how you
    // say it. Hiding them behind "need no choice" produced a real wrong merge during
    // testing - the visible footprints were set to theirs while eight of our tracks
    // stayed hidden at their default, giving a board with their routing and our
    // traces, which shorted a net.
    // Collapsed by net as well, because a reroute is hundreds of segments and the
    // point of showing them is that they are choosable, not that they are numerous.
    // Setting the collapsed row sets every segment it stands for.
    const needing = useMemo(
        () => collapseByRun(decisions.filter(d => d.resolutions.length > 1), groups),
        [decisions, groups],
    );
    const rest = useMemo(
        () => collapseByRun(decisions.filter(d => d.resolutions.length <= 1), groups),
        [decisions, groups],
    );
    const [expanded, setExpanded] = useState(false);

    return (
        <div className="px-4 py-3">
            <div className="mb-2 flex items-center gap-2">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {label}
                </h3>
                <span className="text-xs text-muted-foreground">{decisions.length}</span>
            </div>

            <div className="space-y-1.5">
                {needing.map(decision => (
                    <DecisionRow
                        key={decision.key}
                        decision={decision}
                        path={path}
                        value={resolutions[`${path}::${decision.key}`] ?? decision.default}
                        followedFrom={followed[`${path}::${decision.key}`]}
                        onResolve={onResolve}
                        onFocus={onFocus}
                        focused={focusKey === decision.key}
                    />
                ))}

                {rest.length > 0 && !expanded && (
                    <button
                        type="button"
                        onClick={() => setExpanded(true)}
                        className="text-xs text-muted-foreground underline-offset-2 hover:underline"
                    >
                        Show {rest.length} more with only one possible outcome
                    </button>
                )}

                {expanded &&
                    rest.map(decision => (
                        <DecisionRow
                            key={decision.key}
                            decision={decision}
                            path={path}
                            value={resolutions[`${path}::${decision.key}`] ?? decision.default}
                            onResolve={onResolve}
                            onFocus={onFocus}
                            focused={focusKey === decision.key}
                        />
                    ))}
            </div>
        </div>
    );
}

function DecisionRow({
    decision,
    path,
    value,
    followedFrom,
    onResolve,
    onFocus,
    focused,
}: {
    decision: MergeDecision;
    path: string;
    value: string;
    /** Set when this row moved because the component it attaches to was set. */
    followedFrom?: string;
    onResolve: (path: string, key: string, value: string, cascade?: boolean) => void;
    onFocus?: (key: string) => void;
    focused?: boolean;
}) {
    const name = describe(decision);
    const group = FROM_GROUP.get(decision);

    // An inferred identity is a different kind of caution from a conflict: nobody
    // disagrees, we are just not certain these are the same object. Amber would say
    // "two people clashed here", which is not what happened.
    const tone = focused
        ? "border-primary bg-primary/5"
        : decision.inferred_identity
            ? "border-sky-500/40 bg-sky-500/5"
            : decision.needs_input
                ? "border-amber-500/40 bg-amber-500/5"
                : "border-transparent bg-muted/40";

    return (
        <div className={`flex items-center justify-between gap-4 rounded-md border px-3 py-2 ${tone}`}>
            {/* Clicking the row centres this object in all three panes. Deliberately
                separate from the resolution buttons: looking at something and deciding
                about it are different acts, and merging them would mean you cannot
                inspect a change without also choosing. */}
            <button
                type="button"
                onClick={() => onFocus?.(decision.key)}
                disabled={!onFocus}
                className="min-w-0 flex-1 text-left disabled:cursor-default"
                title={onFocus ? "Show this in the board" : undefined}
            >
                <p className="flex items-center gap-1.5 truncate text-sm">
                    {name}
                    {decision.inferred_identity && (
                        <span
                            className="shrink-0 rounded border border-sky-500/40 px-1 py-px text-[10px] font-medium uppercase tracking-wide text-sky-500"
                            title="Prism matched these by similarity, not by id. Check it."
                        >
                            matched
                        </span>
                    )}
                    {followedFrom && group?.follows_reference && (
                        <span
                            className="shrink-0 rounded border border-emerald-500/40 px-1 py-px text-[10px] font-medium uppercase tracking-wide text-emerald-500"
                            title={`Set to match ${group.follows_reference}. Choose a side here to set it yourself.`}
                        >
                            follows {group.follows_reference}
                        </span>
                    )}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                    {decision.detail || CLASSIFICATION_LABEL[decision.classification] || ""}
                </p>
            </button>

            {decision.resolutions.length > 1 ? (
                <div className="flex shrink-0 gap-1">
                    {decision.resolutions.map(option => (
                        <Button
                            key={option}
                            size="sm"
                            variant={value === option ? "default" : "outline"}
                            className="h-7 px-2.5 text-xs"
                            onClick={() => {
                                // Apply to every decision this row stands for. A
                                // collapsed run row is one thing the engineer did, so
                                // choosing a side on it must move all of it: setting
                                // one segment and leaving the rest is how a merge ends
                                // up with half of each branch's routing.
                                //
                                // cascade:false - choosing here is a deliberate act, so
                                // the row stops following its component rather than
                                // being overwritten the next time that component moves.
                                for (const key of REPRESENTS.get(decision) ?? [
                                    decision.key,
                                ]) {
                                    onResolve(path, key, option, false);
                                }
                            }}
                        >
                            {RESOLUTION_LABEL[option] ?? option}
                        </Button>
                    ))}
                </div>
            ) : (
                <span className="shrink-0 text-xs text-muted-foreground">
                    {RESOLUTION_LABEL[decision.default] ?? decision.default}
                </span>
            )}
        </div>
    );
}

/**
 * Which decisions a collapsed row stands for, itself included.
 *
 * The keys, not just a count: choosing a side on a collapsed row has to apply to every
 * segment behind it. Storing only the number would set one track and silently leave the
 * rest at their defaults, which is the same class of bug as hiding them.
 */
const REPRESENTS = new WeakMap<MergeDecision, string[]>();

/** How many changes a row stands for, itself included. */
const SIZE = new WeakMap<MergeDecision, number>();

/** The group a row came from, so it can say what it follows. */
const FROM_GROUP = new WeakMap<MergeDecision, TraceGroup>();

/**
 * Collapse routing changes into the runs the engine found.
 *
 * A run is a stretch of track joined end to end on one net, which is what a person means
 * by "this trace". Grouping on the net name instead would be wrong in both directions:
 * GND is one net but many separate traces, so two unrelated corners of a board would
 * share a row and one would hide behind the other.
 *
 * Display only. Every segment is still staged and still merged individually; this only
 * decides what the reader is asked to look at.
 *
 * A member that genuinely conflicts is never folded away. The whole point of grouping is
 * to clear the noise so real conflicts are visible, and a group that swallowed one would
 * defeat itself.
 */
function collapseByRun(
    decisions: MergeDecision[],
    groups: TraceGroup[],
): MergeDecision[] {
    if (groups.length === 0) return decisions;

    const present = new Set(decisions.map(d => d.key));
    const byKey = new Map(decisions.map(d => [d.key, d]));
    const claimed = new Map<string, TraceGroup>();

    for (const group of groups) {
        for (const key of [...group.keys, ...group.settled]) {
            if (present.has(key)) claimed.set(key, group);
        }
    }

    const out: MergeDecision[] = [];
    const emitted = new Set<string>();

    for (const decision of decisions) {
        const group = claimed.get(decision.key);
        if (!group) {
            out.push(decision);
            continue;
        }

        // A conflicting member stands on its own, outside the group row.
        if (group.conflicts.includes(decision.key)) {
            out.push(decision);
            continue;
        }

        if (emitted.has(group.id)) continue;
        emitted.add(group.id);

        // The representative is the first member still in this bucket, so the row is
        // stable and its `kind`, `classification` and items are a real member's.
        const members = group.keys.filter(
            key => present.has(key) && !group.conflicts.includes(key),
        );
        const representative = byKey.get(members[0] ?? decision.key) ?? decision;

        REPRESENTS.set(representative, members.length > 0 ? members : [decision.key]);
        SIZE.set(representative, members.length + group.settled.length);
        FROM_GROUP.set(representative, group);
        out.push(representative);
    }

    return out;
}

/** A human name for an object, preferring what an engineer would recognise. */
function describe(decision: MergeDecision): string {
    const item = decision.theirs_item ?? decision.ours_item ?? decision.base_item ?? {};
    const reference = item.reference as string | undefined;
    const netName = item.net_name as string | undefined;
    const text = item.text as string | undefined;

    // Say how many, so a collapsed row never hides the scale of a change. The count is
    // the whole run, including members whose outcome is already settled: the row stands
    // for that much of the board whether or not each piece is still a choice.
    const represents = SIZE.get(decision) ?? REPRESENTS.get(decision)?.length ?? 1;
    if (netName && represents > 1) {
        return `${netName} (${represents} segments)`;
    }

    if (reference) return `${reference} (${decision.kind})`;
    if (netName) return `${decision.kind} on ${netName}`;
    if (text) return `${decision.kind}: ${text}`;
    return decision.kind;
}

/**
 * Files that are not designs: BOM scripts, notes, documentation.
 *
 * These merge by line, and git is better at that than we would be. The section exists
 * so the user can see what else is moving, and so the line between "merged by
 * understanding" and "merged by line matching" is drawn rather than blurred.
 *
 * A file git could not reconcile gets a choice here. Unlike a board there IS a sensible
 * file-level answer, so refusing and sending the user to a terminal would be making them
 * do by hand what the page can offer.
 */
function TextFiles({
    paths,
    conflicts,
    choices,
    onChoose,
}: {
    paths: string[];
    conflicts: string[];
    choices: Record<string, string>;
    onChoose: (path: string, side: string) => void;
}) {
    const conflicted = new Set(conflicts);

    return (
        <section
            className={`rounded-lg border ${conflicts.length > 0 ? "border-amber-500/40" : "border-dashed"}`}
        >
            <div
                className={`px-4 py-2.5 ${conflicts.length > 0 ? "border-b border-amber-500/40" : "border-b border-dashed"}`}
            >
                <h2 className="text-sm font-medium">Other files</h2>
                <p className="text-xs text-muted-foreground">
                    {conflicts.length > 0
                        ? `git couldn't merge ${conflicts.length} of these. Choose a version for each.`
                        : "Merged line by line, the way git normally does."}
                </p>
            </div>

            <ul className="space-y-1.5 px-4 py-3">
                {paths.map(path => {
                    const inConflict = conflicted.has(path);
                    const chosen = choices[path];

                    return (
                        <li
                            key={path}
                            className={
                                inConflict
                                    ? "flex items-center justify-between gap-3 rounded-md border border-amber-500/40 bg-amber-500/5 px-2.5 py-1.5"
                                    : "flex items-center justify-between gap-3 px-0.5"
                            }
                        >
                            <span
                                className={`truncate font-mono text-xs ${inConflict ? "" : "text-muted-foreground"}`}
                            >
                                {path}
                            </span>

                            {inConflict && (
                                <div className="flex shrink-0 gap-1">
                                    {(["ours", "theirs"] as const).map(side => (
                                        <Button
                                            key={side}
                                            size="sm"
                                            variant={chosen === side ? "default" : "outline"}
                                            className="h-7 px-2.5 text-xs"
                                            onClick={() => onChoose(path, side)}
                                        >
                                            {side === "ours" ? "Keep mine" : "Take theirs"}
                                        </Button>
                                    ))}
                                </div>
                            )}
                        </li>
                    );
                })}
            </ul>
        </section>
    );
}
