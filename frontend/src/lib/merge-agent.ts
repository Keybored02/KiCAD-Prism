/**
 * Talking to the local Prism agent about one merge.
 *
 * The agent runs on 127.0.0.1 and can drive git and the filesystem, so it is deliberately
 * hard to reach: it demands a bearer token, and its own long-lived token is never given
 * to a web page. What this module holds instead is a SESSION token, scoped to a single
 * merge in a single repository, obtained by exchanging a one-shot key the agent put in
 * the URL fragment.
 *
 * A fragment never leaves the browser, so the key cannot appear in a server log or a
 * Referer header. It is spent immediately on load and erased from the address bar, so a
 * copied URL is useless to anyone else.
 *
 * The page never sends board content. It sends decisions - which object to take from
 * which side - and the agent rebuilds the merge from git itself. So the worst this
 * module can do, even if the page were compromised, is pick the wrong objects from
 * commits that already exist in the repository.
 */

export interface MergeDecision {
    key: string;
    kind: string;
    classification:
    | "only_ours"
    | "only_theirs"
    | "both_same"
    | "both_fields"
    | "conflict"
    | "key_collision"
    | "undescribable"
    | "unchanged";
    ours_action: string;
    theirs_action: string;
    resolutions: string[];
    default: string;
    needs_input: boolean;
    base_item: Record<string, unknown> | null;
    ours_item: Record<string, unknown> | null;
    theirs_item: Record<string, unknown> | null;
    conflicting_fields: Record<string, { base: unknown; ours: unknown; theirs: unknown }>;
    merged_fields: Record<string, string>;
    detail: string;
    /**
     * True when the two sides were paired by similarity rather than a shared id: the
     * same part after something rewrote its uuid. This pairing is Prism's opinion, not
     * something the files stated, so it always asks before being applied.
     */
    inferred_identity: boolean;
    inferred_from: string;
    inferred_score: number;
}

/**
 * A connected stretch of routing, and the decision a person makes about it.
 *
 * Rerouting a trace is one intent that lands in the file as dozens of segments and bends.
 * A group is that intent: the segments are joined end to end on one net, so choosing a
 * side for the group is choosing whose version of the whole trace to keep.
 *
 * Display only. Every member is still staged and merged individually.
 */
export interface TraceGroup {
    id: string;
    net_name: string;
    /** Members a group choice applies to. */
    keys: string[];
    layers: string[];
    /** Footprint keys whose pads this run lands on. */
    endpoints_on: string[];
    resolutions: string[];
    default: string;
    /** Changed members already settled, counted in the size but never written to. */
    settled: string[];
    /** Footprint key this run should follow, when exactly one changed component owns it. */
    follows: string;
    follows_reference: string;
    /** Members that must stay individually visible however the group is set. */
    conflicts: string[];
    reason: string;
}

export interface MergeFile {
    path: string;
    kind: "pcb" | "sch" | "text";
    semantic: boolean;
    decisions: MergeDecision[];
    groups: TraceGroup[];
    detail: string;
    needs_input: number;
}

export interface MergePlan {
    repo: string;
    ours: string;
    theirs: string;
    base: string;
    files: MergeFile[];
    text_files: string[];
    detail: string;
    needs_input: number;
}

export interface MergeResult {
    ok: boolean;
    commit: string;
    branch: string;
    merged: string;
    files: { path: string; applied: number; skipped: { key: string; reason: string }[]; promoted: string[] }[];
    text_files: string[];
    message: string;
}

export class MergeAgentError extends Error {
    /**
     * Text files git could not merge by line.
     *
     * Carried as data rather than only in the message, so the page can offer a choice
     * per file instead of asking the user to read a sentence and go elsewhere.
     */
    readonly conflicts: string[];

    constructor(message: string, conflicts: string[] = []) {
        super(message);
        this.conflicts = conflicts;
    }
}

/** Where the agent is, and who we are to it. Held in memory only, never persisted. */
export interface MergeSession {
    port: number;
    id: string;
    token: string;
    ref: string;
}

/**
 * What a failed fetch to the agent actually tells us: nothing specific.
 *
 * The browser refuses to expose why a cross-origin request failed, so a stopped agent, a
 * rejected origin and a blocked private-network request all arrive here identically.
 * Asserting "the agent isn't running" sends people to restart a process that was fine,
 * so this names the likely causes instead of picking one.
 */
const UNREACHABLE =
    "Prism couldn't reach the agent on this machine. It may have stopped, or its " +
    "server URL may not match the address this page is served from.";

function base(port: number): string {
    return `http://127.0.0.1:${port}`;
}

async function request<T>(
    session: Pick<MergeSession, "port" | "id" | "token">,
    method: "GET" | "POST",
    path: string,
    body?: unknown,
): Promise<T> {
    let response: Response;
    try {
        response = await fetch(`${base(session.port)}${path}`, {
            method,
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${session.token}`,
                "X-Prism-Merge": session.id,
            },
            body: body === undefined ? undefined : JSON.stringify(body),
        });
    } catch {
        // The agent is not running, or stopped mid-merge. Distinguish that from a
        // refusal: "Prism isn't running" is fixable, "your merge is invalid" is not the
        // same problem at all.
        throw new MergeAgentError(
            UNREACHABLE,
        );
    }

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
        const { error, conflicts } = payload as { error?: string; conflicts?: string[] };
        throw new MergeAgentError(
            error || `The agent returned ${response.status}.`,
            conflicts ?? [],
        );
    }
    return payload as T;
}

/**
 * Exchange the one-shot key from the URL fragment for a session token.
 *
 * Called once, on page load. The key is single-use: reloading the page will NOT work,
 * which is deliberate - a merge link that keeps working is a merge link that can be
 * replayed by whoever finds it.
 */
export async function claim(port: number, sessionId: string, key: string): Promise<MergeSession> {
    let response: Response;
    try {
        response = await fetch(`${base(port)}/merge/claim`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ session: sessionId, key }),
        });
    } catch {
        throw new MergeAgentError(
            UNREACHABLE,
        );
    }

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new MergeAgentError(
            (payload as { error?: string }).error ||
            "This merge link is no longer valid. Start the merge again from KiCad.",
        );
    }

    const { token, session, ref } = payload as { token: string; session: string; ref: string };
    return { port, id: session, token, ref };
}

/** What merging would involve. Read-only: safe to call with KiCad open on the project. */
export function fetchPlan(session: MergeSession): Promise<MergePlan> {
    return request<MergePlan>(session, "GET", "/merge/plan");
}

/**
 * Commit the merge.
 *
 * `decisions` maps a file path to the choices made in it. No file content crosses this
 * boundary: the agent re-reads base, ours and theirs from git and rebuilds the merge,
 * then validates the result before it writes anything.
 */
export function commitMerge(
    session: MergeSession,
    decisions: Record<string, { key: string; resolution: string }[]>,
    options: {
        message?: string;
        stashMessage?: string;
        allowNewViolations?: boolean;
        /** For text files git could not merge: which side to take, whole. */
        textChoices?: Record<string, string>;
    } = {},
): Promise<MergeResult> {
    return request<MergeResult>(session, "POST", "/merge/commit", {
        decisions,
        message: options.message ?? "",
        stash_message: options.stashMessage,
        allow_new_violations: options.allowNewViolations ?? false,
        text_choices: options.textChoices ?? {},
    });
}

export type MergeSide = "base" | "ours" | "theirs";

/**
 * One side of one file, for the viewer to draw.
 *
 * Fetched separately from the plan, which carries decisions only: three copies of a 9MB
 * board in one payload would make the page unusable on exactly the projects where
 * merging matters most.
 */
export async function fetchSide(
    session: MergeSession,
    path: string,
    side: MergeSide,
): Promise<string> {
    const query = `path=${encodeURIComponent(path)}&side=${side}`;
    let response: Response;
    try {
        response = await fetch(`${base(session.port)}/merge/file?${query}`, {
            headers: {
                Authorization: `Bearer ${session.token}`,
                "X-Prism-Merge": session.id,
            },
        });
    } catch {
        throw new MergeAgentError(
            UNREACHABLE,
        );
    }

    if (!response.ok) {
        // This one is JSON even though success is plain text: an error is small, and a
        // reason is worth more than an empty body.
        const payload = await response.json().catch(() => ({}));
        throw new MergeAgentError(
            (payload as { error?: string }).error || `Couldn't read ${side} of ${path}.`,
        );
    }
    return response.text();
}

/** Abandon a merge left in progress, e.g. by a crash. */
export function abortMerge(session: MergeSession): Promise<{ ok: boolean; message: string }> {
    return request(session, "POST", "/merge/abort", {});
}

/**
 * Read the session parameters the agent put in the URL, and scrub the secret from it.
 *
 * The key lives in the fragment and the rest in the query string. Once read, the
 * fragment is replaced so the secret does not sit in the address bar, in the back/forward
 * history, or in whatever the user pastes into a chat when asking for help.
 */
export class MergeLinkSpentError extends Error { }

export function readSessionFromUrl(): { port: number; sessionId: string; key: string } | null {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get("session") || "";
    const port = Number(params.get("agent") || 0);

    const fragment = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const key = fragment.get("k") || "";

    // A merge link names a session but carries no key: it was already used. The key is
    // single-use and this function strips it, so this is what a RELOAD looks like -
    // which is a thing people do, and it deserves a better answer than "not opened
    // from KiCad".
    if (sessionId && port && !key) {
        throw new MergeLinkSpentError(
            "This merge link has already been used. Start the merge again from KiCad.",
        );
    }

    if (!sessionId || !port || !key) return null;

    window.history.replaceState(
        null,
        "",
        `${window.location.pathname}${window.location.search}`,
    );

    return { port, sessionId, key };
}
