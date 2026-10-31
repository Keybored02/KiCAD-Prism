import { fetchJson } from "@/lib/api";
import { analysisResultOf, importedProjectIdsOf } from "@/lib/import-analysis";
import { watchPrismJob, type PrismJobStatus } from "@/lib/jobs";
import type { DiscoveredProjectView } from "@/lib/repo-discovery";
import { projectsFromAnalysis, type ImportRequest } from "@/lib/repo-review";

/** The projects on one branch of a repository, read by the same analyse job the single import uses. */
export async function analyzeBranch(
  url: string,
  branch: string,
  signal: AbortSignal,
): Promise<DiscoveredProjectView[]> {
  const { job_id } = await fetchJson<{ job_id: string }>(
    "/api/projects/analyze",
    { method: "POST", body: JSON.stringify({ url, ref: branch || null }) },
    "Analysis failed",
  );
  const job = await watchPrismJob(job_id, { signal, intervalMs: 1000 });
  if (job.status !== "completed") {
    throw new Error(job.error_message || (job.status === "cancelled" ? "Analysis cancelled." : "Analysis failed"));
  }
  const result = analysisResultOf(job);
  if (!result) throw new Error("Analysis completed but no result returned");
  return projectsFromAnalysis(result);
}

/** Imports one repository the way the single import does; resolves with how many projects were registered. */
export async function importRepository(
  request: ImportRequest,
  signal: AbortSignal,
  onUpdate: (status: PrismJobStatus) => void,
): Promise<number> {
  const { job_id } = await fetchJson<{ job_id: string }>(
    "/api/projects/import",
    { method: "POST", body: JSON.stringify(request) },
    "Import failed",
  );
  const job = await watchPrismJob(job_id, { signal, intervalMs: 1000, onUpdate });
  if (job.status !== "completed") {
    throw new Error(job.error_message || (job.status === "cancelled" ? "Import cancelled." : "Import failed"));
  }
  return importedProjectIdsOf(job).length;
}
