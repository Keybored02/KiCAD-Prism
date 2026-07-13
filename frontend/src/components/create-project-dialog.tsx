"use client";

import { useState, type KeyboardEvent } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, AlertCircle, Check, Copy } from "lucide-react";
import { isDialogSubmitShortcut } from "@/lib/dialog-shortcuts";

interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

interface Created {
  id: string;
  name: string;
  origin_url: string;
  origin_owner: string;
}

export function CreateProjectDialog({ open, onOpenChange, onCreated }: CreateProjectDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<Created | null>(null);
  const [copied, setCopied] = useState(false);

  const reset = () => {
    setName("");
    setDescription("");
    setBusy(false);
    setError(null);
    setCreated(null);
    setCopied(false);
  };

  const close = () => {
    // Refresh only if something was actually made, so cancelling is free.
    if (created) onCreated();
    reset();
    onOpenChange(false);
  };

  const submit = async () => {
    if (!name.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/projects/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: name.trim(), description: description.trim() }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail || "Could not create the project.");
      }
      setCreated(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create the project.");
    } finally {
      setBusy(false);
    }
  };

  const copy = async () => {
    if (!created?.origin_url) return;
    try {
      await navigator.clipboard.writeText(`git clone ${created.origin_url}`);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard can be blocked (no HTTPS, denied permission). The URL is on screen
      // and selectable, so there is nothing to recover from and nothing to say.
    }
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (isDialogSubmitShortcut(event)) {
      event.preventDefault();
      if (created) close();
      else void submit();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? onOpenChange(true) : close())}>
      <DialogContent onKeyDown={onKeyDown}>
        {created ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-600" />
                Created {created.name}
              </DialogTitle>
              <DialogDescription>
                Prism is hosting the git repository. Clone it to start work.
              </DialogDescription>
            </DialogHeader>

            {created.origin_url ? (
              <div className="space-y-2">
                <Label>Clone it</Label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 overflow-x-auto rounded-md border bg-muted px-3 py-2 text-xs whitespace-nowrap">
                    git clone {created.origin_url}
                  </code>
                  <Button variant="outline" size="icon" onClick={() => void copy()} aria-label="Copy clone command">
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  The repository is seeded with a KiCad project file and a .gitignore.
                </p>
              </div>
            ) : (
              // origin_url is empty when PRISM_SERVER_URL is unset. Say so plainly:
              // the project is real and fine, we just cannot hand out a URL that would
              // only work on the server's own machine.
              <div className="flex gap-2 rounded-md border border-amber-500/50 bg-amber-500/10 p-3 text-sm">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                <div>
                  <p className="font-medium">No clone URL</p>
                  <p className="text-muted-foreground">
                    The project exists, but this server has no public URL set
                    (PRISM_SERVER_URL), so there is no address to clone from.
                  </p>
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <Button onClick={close}>Done</Button>
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>New project</DialogTitle>
              <DialogDescription>
                Prism hosts the git repository. You clone it, work in KiCad, and push.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="project-name">Name</Label>
                <Input
                  id="project-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Sensor Board"
                  autoFocus
                  disabled={busy}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="project-description">Description (optional)</Label>
                <Input
                  id="project-description"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="What the board does"
                  disabled={busy}
                />
              </div>

              {error && (
                <div className="flex gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                  <p>{error}</p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={close} disabled={busy}>
                Cancel
              </Button>
              <Button onClick={() => void submit()} disabled={!name.trim() || busy}>
                {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
