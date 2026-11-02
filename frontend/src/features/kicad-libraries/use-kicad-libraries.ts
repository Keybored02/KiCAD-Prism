import { useCallback, useEffect, useState } from "react";

import { listLibraries } from "@/lib/kicad-libraries-client";
import type { KicadLibraryList } from "@/types/kicad-libraries";

import { isFetching } from "./library-status";

const POLL_MS = 2000;

interface LibrariesState {
    list: KicadLibraryList | null;
    error: string | null;
}

/** The libraries, refreshed every couple of seconds while any is still being fetched. */
export function useKicadLibraries() {
    const [state, setState] = useState<LibrariesState>({ list: null, error: null });

    const load = useCallback(async (signal?: AbortSignal) => {
        try {
            const list = await listLibraries(signal);
            setState({ list, error: null });
        } catch (error) {
            if (signal?.aborted) return;
            setState((previous) => ({
                ...previous,
                error: error instanceof Error ? error.message : "Failed to load the KiCad libraries",
            }));
        }
    }, []);

    useEffect(() => {
        const controller = new AbortController();
        void load(controller.signal);
        return () => controller.abort();
    }, [load]);

    const working = state.list?.libraries.some(isFetching) ?? false;
    useEffect(() => {
        if (!working) return undefined;
        const timer = window.setInterval(() => void load(), POLL_MS);
        return () => window.clearInterval(timer);
    }, [working, load]);

    return { ...state, reload: load };
}
