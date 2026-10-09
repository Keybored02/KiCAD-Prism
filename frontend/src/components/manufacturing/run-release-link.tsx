import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Tag } from "lucide-react";

import { listCandidates } from "@/components/release-studio/api";
import type { ReleaseBuild, ReleaseCandidate } from "@/components/release-studio/types";

/** The newest succeeded Release Studio build of a commit, if it has one. */
export function releaseBuildFor(candidates: ReleaseCandidate[], commitSha: string): string | null {
    const sha = commitSha.toLowerCase();
    let newest: ReleaseBuild | null = null;
    for (const candidate of candidates) {
        const own = candidate.commit_sha.toLowerCase();
        if (!own.startsWith(sha) && !sha.startsWith(own)) continue;
        const builds = candidate.builds ?? (candidate.latest_build ? [candidate.latest_build] : []);
        for (const build of builds) {
            if (build.status !== "succeeded") continue;
            if (!newest || (build.completed_at ?? "") > (newest.completed_at ?? "")) newest = build;
        }
    }
    return newest?.id ?? null;
}

/**
 * The run's release, linked to its package in Release Studio: the newest
 * successful build of the run's commit, or Release Studio itself when that
 * commit was never built.
 */
export function RunReleaseLink({ projectId, tag, commitSha }: {
    projectId: string;
    tag: string;
    commitSha: string;
}) {
    const [buildId, setBuildId] = useState<string | null>(null);

    // One lookup owned by the link that shows it; a failure keeps the plain link.
    // react-doctor-disable-next-line react-doctor/no-fetch-in-effect
    useEffect(() => {
        let cancelled = false;
        listCandidates(projectId)
            .then((candidates) => {
                if (!cancelled) setBuildId(releaseBuildFor(candidates, commitSha));
            })
            .catch(() => undefined);
        return () => {
            cancelled = true;
        };
    }, [projectId, commitSha]);

    const build = buildId ? `&build=${encodeURIComponent(buildId)}` : "";
    return (
        <Link
            to={`/project/${projectId}?section=release-studio${build}`}
            className="inline-flex items-center gap-1 text-primary hover:underline"
            title={buildId ? `Open the ${tag} package in Release Studio` : "Open Release Studio"}
        >
            <Tag className="h-3 w-3" />
            {tag}
        </Link>
    );
}
