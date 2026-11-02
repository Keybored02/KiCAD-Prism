export type LibraryState = "pending" | "fetching" | "ready" | "failed";

/** A KiCad path library as the server reports it. `ready` is whether it resolves now; `state` is the fetch's report. */
export interface KicadLibrary {
    name: string;
    variables: string[];
    git: string;
    ref: string;
    subdir: string;
    path: string;
    state: LibraryState;
    error: string | null;
    progress: number | null;
    sizeBytes: number | null;
    fetchedAt: string | null;
    updatedBy: string;
    ready: boolean;
    /** Set by the server's environment; shown, not editable. */
    locked: boolean;
}

export interface KicadLibraryList {
    libraries: KicadLibrary[];
    pathLibrariesEnabled: boolean;
}

export interface NewKicadLibrary {
    name: string;
    variables: string[];
    git?: string;
    ref?: string;
    subdir?: string;
    path?: string;
}

export interface KicadLibraryChanges {
    variables?: string[];
    ref?: string;
    subdir?: string;
}

export interface RemoteCheckResult {
    reachable: boolean;
    error: string | null;
    tags: string[];
    branches: string[];
    refFound: boolean | null;
}
