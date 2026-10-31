import { useState } from "react";

import type { DiscoverySource } from "@/lib/repo-discovery";

import { RepoPickStep } from "./repo-pick-step";
import { RepoReviewStep } from "./repo-review-step";
import { useRepoDiscovery } from "./use-repo-discovery";

interface RepoDiscoveryFlowProps {
  source: DiscoverySource;
  /** An organisation to limit the list to; empty for the whole host. */
  scope: string;
  /** Back to the address box. */
  onBack: () => void;
  onClose: () => void;
  /** Called once the imports have settled, so the workspace can refresh. */
  onImported: () => void;
}

/**
 * Importing from a whole host: pick repositories, then review them together.
 * Renders the screens inside the import dialog, in place of the single-repository ones.
 */
export function RepoDiscoveryFlow({ source, scope, onBack, onClose, onImported }: RepoDiscoveryFlowProps) {
  const discovery = useRepoDiscovery(source.id);
  const [reviewing, setReviewing] = useState(false);
  const [picked, setPicked] = useState<Set<string>>(new Set());

  if (reviewing) {
    const repositories = discovery.list.candidates.filter((repository) => picked.has(repository.id));
    return (
      <RepoReviewStep
        repositories={repositories}
        onBack={() => setReviewing(false)}
        onClose={onClose}
        onImported={() => {
          onImported();
          void discovery.reload();
        }}
      />
    );
  }

  return (
    <RepoPickStep
      source={source}
      scope={scope}
      discovery={discovery}
      picked={picked}
      onPickedChange={setPicked}
      onBack={onBack}
      onReview={() => setReviewing(true)}
    />
  );
}
