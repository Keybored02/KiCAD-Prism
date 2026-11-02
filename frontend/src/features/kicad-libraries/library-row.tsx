import { Lock } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { KicadLibrary } from "@/types/kicad-libraries";

import { describeLibrary, formatBytes, isFetching, sourceLine } from "./library-status";

interface LibraryRowProps {
    library: KicadLibrary;
    busy: boolean;
    onEdit: (library: KicadLibrary) => void;
    onFetchAgain: (library: KicadLibrary) => void;
    onRemove: (library: KicadLibrary) => void;
}

/** Whether a fetch can be started by hand: not while one runs, and not for a folder. */
function canFetchAgain(library: KicadLibrary): boolean {
    return library.git !== "" && !isFetching(library) && library.state !== "fetching";
}

export function LibraryRow({ library, busy, onEdit, onFetchAgain, onRemove }: LibraryRowProps) {
    const status = describeLibrary(library);
    const showProgress = library.state === "fetching" && library.progress !== null;
    const detail = [formatBytes(library.sizeBytes), library.ready && library.fetchedAt ? `fetched ${new Date(library.fetchedAt).toLocaleString()}` : ""]
        .filter(Boolean)
        .join(", ");

    return (
        <li className="rounded-lg border p-4 flex flex-col gap-2">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                        <span className="font-medium truncate">{library.name}</span>
                        <Badge variant={status.variant}>{status.label}</Badge>
                        {library.locked && (
                            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                                <Lock className="h-3 w-3" aria-hidden /> Set by the server
                            </span>
                        )}
                    </div>
                    <div className="flex flex-wrap gap-1">
                        {library.variables.map((variable) => (
                            <code key={variable} className="rounded bg-muted px-1.5 py-0.5 text-xs">{`\${${variable}}`}</code>
                        ))}
                    </div>
                    <p className="text-xs text-muted-foreground break-all">{sourceLine(library)}</p>
                    {detail && <p className="text-xs text-muted-foreground">{detail}</p>}
                </div>
                {!library.locked && (
                    <div className="flex shrink-0 gap-2">
                        {canFetchAgain(library) && (
                            <Button size="sm" variant="outline" disabled={busy} onClick={() => onFetchAgain(library)}>
                                Fetch again
                            </Button>
                        )}
                        <Button size="sm" variant="outline" disabled={busy} onClick={() => onEdit(library)}>
                            Edit
                        </Button>
                        <Button size="sm" variant="ghost" disabled={busy} onClick={() => onRemove(library)}>
                            Remove
                        </Button>
                    </div>
                )}
            </div>
            {showProgress && (
                <div
                    role="progressbar"
                    aria-label={`Fetching ${library.name}`}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={library.progress ?? 0}
                    className="h-1.5 w-full overflow-hidden rounded bg-muted"
                >
                    <div className="h-full bg-primary transition-[width]" style={{ width: `${library.progress ?? 0}%` }} />
                </div>
            )}
            {library.state === "failed" && library.error && (
                <p className="text-sm text-destructive break-words">{library.error}</p>
            )}
        </li>
    );
}
