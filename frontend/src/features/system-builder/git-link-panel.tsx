import { useEffect, useState } from "react";
import { GitBranch, Pencil, RefreshCw, TriangleAlert, Unlink } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { deleteGitLink, fetchGitLink, getGitLink, putGitLink, retrySnapshotGit } from "@/lib/systems-api";
import type { GitLink, SnapshotGit } from "@/types/system";

import { shortSha, timeAgo } from "./system-format";
import type { Mutate } from "./use-system-mutation";

interface GitLinkPanelProps {
  systemId: string;
  etag: string;
  /** Changes whenever the link must be re-read. */
  refresh: string;
  canEdit: boolean;
  busy: string | null;
  run: Mutate;
}

/** The system's repository link (CONTRACTS_P2 §21): where snapshots are committed. */
export function GitLinkPanel({ systemId, etag, refresh, canEdit, busy, run }: GitLinkPanelProps) {
  const [link, setLink] = useState<{ refresh: string; value: GitLink | null } | null>(null);
  const [editing, setEditing] = useState(false);
  const [url, setUrl] = useState("");
  const [branch, setBranch] = useState("");

  useEffect(() => {
    let cancelled = false;
    getGitLink(systemId).then((value) => !cancelled && setLink({ refresh, value })).catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [systemId, refresh]);

  const current = link?.value ?? null;
  const open = () => {
    setUrl(current?.url ?? "");
    setBranch(current?.branch ?? "");
    setEditing(true);
  };
  const save = async () => {
    const done = await run("git-link", () => putGitLink(systemId, etag, { url: url.trim(), branch: branch.trim() || undefined }),
      "Repository linked");
    if (done) {
      setLink({ refresh, value: done.body });
      setEditing(false);
    }
  };

  if (!link || (!current && !canEdit)) return null;
  return (
    <section className="text-sm" aria-label="Repository">
      <div className="flex h-9 items-center gap-2">
        <GitBranch className="size-4 shrink-0 text-muted-foreground" />
        {current ? (
          <>
            <span className="min-w-0 truncate" title={current.url}>{current.url?.replace(/^https?:\/\//, "")}</span>
            <span className="shrink-0 font-mono text-xs">{current.branch}{current.tip && <span className="text-muted-foreground"> @ {shortSha(current.tip)}</span>}</span>
            {current.lastFetchedAt && (
              <span className="hidden shrink-0 text-xs text-muted-foreground md:inline" title={`Fetched ${new Date(current.lastFetchedAt).toLocaleString()}`}>
                {timeAgo(current.lastFetchedAt)}
              </span>
            )}
          </>
        ) : (
          <span className="text-muted-foreground" title="Link one to commit each snapshot's manifest there">No repository</span>
        )}
        {canEdit && (
          <span className="ml-auto flex shrink-0 items-center">
            {current && (
              <Button variant="ghost" size="icon-sm" disabled={busy !== null} aria-label="Fetch now" title="Fetch the repository now"
                onClick={() => void run("git-fetch", () => fetchGitLink(systemId), "Fetching the repository")}>
                <RefreshCw className="size-4" />
              </Button>
            )}
            {current ? (
              <Button variant="ghost" size="icon-sm" aria-label="Change repository" title="Change repository" onClick={open}>
                <Pencil className="size-4" />
              </Button>
            ) : (
              <Button variant="outline" size="sm" className="h-7" onClick={open}>Link repository</Button>
            )}
            {current && (
              <Button variant="ghost" size="icon-sm" disabled={busy !== null} aria-label="Unlink" title="Unlink the repository"
                onClick={() => void run("git-unlink", () => deleteGitLink(systemId, etag), "Repository unlinked")
                  .then((done) => done && setLink({ refresh, value: null }))}>
                <Unlink className="size-4" />
              </Button>
            )}
          </span>
        )}
      </div>
      {current?.outsideCommit && (
        <p className="flex h-7 items-center gap-1.5 truncate text-xs text-warning" title="Snapshots wait until that change is imported (Changes tray)">
          <TriangleAlert className="size-3.5 shrink-0" />
          Manifest changed outside Prism ({shortSha(current.outsideCommit)})
        </p>
      )}
      {current?.lastError && <p className="truncate text-xs text-destructive" title={current.lastError.message}>{current.lastError.message}</p>}

      <Dialog open={editing} onOpenChange={setEditing}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{current ? "Change the repository" : "Link a repository"}</DialogTitle>
            <DialogDescription>
              Each snapshot commits the system manifest (prism.system.json) to this branch, authored by you. Use an
              existing repository that Prism's Git credentials can push to.
            </DialogDescription>
          </DialogHeader>
          <form className="grid gap-4" onSubmit={(event) => { event.preventDefault(); void save(); }}>
            <div className="grid gap-2">
              <Label htmlFor="git-url">Repository URL</Label>
              <Input id="git-url" placeholder="git@github.com:team/avionics-system.git" value={url} maxLength={2000}
                onChange={(event) => setUrl(event.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="git-branch">Branch <span className="font-normal text-muted-foreground">(default: the repository's)</span></Label>
              <Input id="git-branch" value={branch} maxLength={200} onChange={(event) => setBranch(event.target.value)} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
              <Button type="submit" disabled={!url.trim() || busy !== null}>{busy === "git-link" ? "Checking…" : "Link"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
}

const FAILED_LABEL: Record<string, string> = { "push-denied": "push refused", "branch-busy": "branch busy", unlinked: "unlinked" };

/** A snapshot's commit status, with a retry for failed and refused commits. */
export function SnapshotGitBadge({ systemId, snapshotId, name, git, canEdit, run }: {
  systemId: string; snapshotId: string; name: string; git: SnapshotGit | null | undefined; canEdit: boolean; run: Mutate;
}) {
  if (!git || git.state === "skipped") return null;
  const retry = canEdit && (git.state === "failed" || git.state === "refused") && (
    <Button variant="link" size="sm" className="h-auto p-0 text-xs" aria-label={`Retry the commit of ${name}`}
      onClick={() => void run("git-retry", () => retrySnapshotGit(systemId, snapshotId), "Commit queued")}>
      Retry
    </Button>
  );
  switch (git.state) {
    case "queued":
      return <Badge variant="outline">Committing…</Badge>;
    case "pushed":
      return <Badge variant="outline" title={`${git.commit} on ${git.branch}`}>Committed {shortSha(git.commit)}</Badge>;
    case "refused":
      return <span className="flex items-center gap-1"><Badge variant="warning" title={`Outside change ${git.commit}`}>Not committed: outside change</Badge>{retry}</span>;
    case "failed":
      return <span className="flex items-center gap-1"><Badge variant="destructive" title={git.message}>Commit failed{FAILED_LABEL[git.reason] ? `: ${FAILED_LABEL[git.reason]}` : ""}</Badge>{retry}</span>;
  }
}
