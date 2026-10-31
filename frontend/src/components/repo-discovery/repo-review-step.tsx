import { Button } from "@/components/ui/button";
import { DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatBytes, type DiscoveredRepository } from "@/lib/repo-discovery";
import { canImport, selectedProjectCount, totalSizeBytes } from "@/lib/repo-review";

import { RepoReviewRow } from "./repo-review-row";
import { useReview } from "./use-review";

interface RepoReviewStepProps {
  repositories: DiscoveredRepository[];
  onBack: () => void;
  onClose: () => void;
  /** Called once every import has settled, so the workspace can refresh. */
  onImported: () => void;
}

/**
 * What the single import's review step offers, for every picked repository at
 * once: its size, the branch to import and the projects on it.
 */
export function RepoReviewStep({ repositories, onBack, onClose, onImported }: RepoReviewStepProps) {
  const review = useReview(repositories, onImported);
  const { rows, progress, finished } = review;
  const started = progress !== null;
  const projectCount = selectedProjectCount(rows);
  const total = totalSizeBytes(rows);
  const failed = Object.values(progress ?? {}).filter((state) => state.status === "failed").length;

  return (
    <>
      <DialogHeader>
        <DialogTitle>
          {finished ? "Import finished" : started ? "Importing" : `Review ${rows.length} ${rows.length === 1 ? "repository" : "repositories"}`}
        </DialogTitle>
        <DialogDescription>
          {finished
            ? failed > 0
              ? `${failed} of ${Object.keys(progress ?? {}).length} repositories could not be imported.`
              : "Every selected repository was imported."
            : `${total === null ? "Size unknown" : `${formatBytes(total)} in total`}. Choose the branch and the projects to import from each.`}
        </DialogDescription>
      </DialogHeader>

      <ul className="max-h-[55vh] space-y-3 overflow-y-auto">
        {rows.map((row) => (
          <RepoReviewRow
            key={row.repository.id}
            row={row}
            importState={progress?.[row.repository.id]}
            onToggle={(key) => review.dispatch({ type: "toggle", id: row.repository.id, key })}
            onAll={(on) => review.dispatch({ type: "all", id: row.repository.id, on })}
            onBranch={(branch) => review.changeBranch(row, branch)}
          />
        ))}
      </ul>

      <div className="flex justify-between gap-2">
        {finished ? (
          <span />
        ) : (
          <Button variant="outline" disabled={started} onClick={onBack}>
            Back
          </Button>
        )}
        {finished ? (
          <Button onClick={onClose}>Close</Button>
        ) : (
          <Button disabled={started || !canImport(rows)} onClick={() => void review.startImport()}>
            {started ? "Importing…" : `Import ${projectCount} ${projectCount === 1 ? "project" : "projects"}`}
          </Button>
        )}
      </div>
    </>
  );
}
