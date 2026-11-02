import type { KicadLibrary } from "@/types/kicad-libraries";

export interface LibraryStatus {
    label: string;
    variant: "success" | "warning" | "destructive" | "outline";
}

/** A git library the server is still working on: worth polling for. */
export function isFetching(library: KicadLibrary): boolean {
    return library.git !== "" && !library.ready && (library.state === "pending" || library.state === "fetching");
}

/** What the badge says. The server's `ready` decides, not the fetch's last report. */
export function describeLibrary(library: KicadLibrary): LibraryStatus {
    if (library.ready) return { label: "Ready", variant: "success" };
    if (library.state === "failed") return { label: "Fetch failed", variant: "destructive" };
    if (library.state === "fetching") {
        return { label: library.progress === null ? "Fetching" : `Fetching ${library.progress}%`, variant: "outline" };
    }
    if (library.path) return { label: "Folder not found", variant: "warning" };
    if (library.state === "ready") return { label: "Missing from disk", variant: "warning" };
    return { label: "Waiting to fetch", variant: "outline" };
}

export function formatBytes(bytes: number | null): string {
    if (bytes === null) return "";
    if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
    if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
    return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
}

/** Variable names from free text: commas, spaces or new lines, no duplicates, no `${}`. */
export function parseVariables(text: string): string[] {
    const names = text
        .split(/[\s,]+/)
        .map((part) => part.replace(/^\$\{?|\}$/g, "").trim())
        .filter(Boolean);
    return [...new Set(names)];
}

/** Where the library comes from, in one line. */
export function sourceLine(library: KicadLibrary): string {
    if (library.path) return `Folder ${library.path}`;
    const where = library.subdir ? ` (${library.subdir})` : "";
    return `${library.git} @ ${library.ref}${where}`;
}
