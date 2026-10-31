import { useEffect, useReducer, useRef, useState } from "react";

import { isAbortError } from "@/lib/jobs";
import type { DiscoveredRepository } from "@/lib/repo-discovery";
import { importRequestOf, reviewReducer, seedRows, type ReviewRow } from "@/lib/repo-review";
import { analyzeBranch, importRepository } from "@/lib/repo-review-api";

/** Where one repository stands once the import has started. */
export interface RepoImportState {
  status: "waiting" | "running" | "done" | "failed";
  message: string;
  projects: number;
}

const messageOf = (error: unknown, fallback: string) =>
  error instanceof Error && error.message ? error.message : fallback;

/**
 * The review screen: a row per picked repository, a branch change that reads
 * that branch's projects, and the imports once the user confirms.
 */
export function useReview(repositories: DiscoveredRepository[], onImported: () => void) {
  const [rows, dispatch] = useReducer(reviewReducer, repositories, seedRows);
  const [progress, setProgress] = useState<Record<string, RepoImportState> | null>(null);
  const [finished, setFinished] = useState(false);
  const analyses = useRef(new Map<string, AbortController>());
  const importing = useRef<AbortController | null>(null);

  useEffect(() => {
    const running = analyses.current;
    return () => {
      running.forEach((controller) => controller.abort());
      importing.current?.abort();
    };
  }, []);

  const changeBranch = (row: ReviewRow, branch: string) => {
    const id = row.repository.id;
    analyses.current.get(id)?.abort();
    const controller = new AbortController();
    analyses.current.set(id, controller);
    dispatch({ type: "branch-start", id, branch });
    analyzeBranch(row.repository.cloneUrl, branch, controller.signal)
      .then((projects) => dispatch({ type: "branch-loaded", id, branch, projects }))
      .catch((error) => {
        if (isAbortError(error) || controller.signal.aborted) return;
        dispatch({ type: "branch-failed", id, branch, error: messageOf(error, "Could not read this branch") });
      });
  };

  const startImport = async () => {
    const jobs = rows.flatMap((row) => {
      const request = importRequestOf(row);
      return request ? [{ id: row.repository.id, request }] : [];
    });
    const controller = new AbortController();
    importing.current = controller;
    const set = (id: string, state: RepoImportState) =>
      setProgress((current) => ({ ...current, [id]: state }));
    setProgress(Object.fromEntries(jobs.map((job) => [job.id, { status: "waiting", message: "Waiting", projects: 0 }])));
    await Promise.all(
      jobs.map(async ({ id, request }) => {
        try {
          const projects = await importRepository(request, controller.signal, (status) =>
            set(id, { status: "running", message: status.message || "Importing", projects: 0 }),
          );
          set(id, { status: "done", message: "Imported", projects });
        } catch (error) {
          if (isAbortError(error) || controller.signal.aborted) return;
          set(id, { status: "failed", message: messageOf(error, "Import failed"), projects: 0 });
        }
      }),
    );
    if (controller.signal.aborted) return;
    setFinished(true);
    onImported();
  };

  return { rows, dispatch, changeBranch, progress, finished, startImport };
}
