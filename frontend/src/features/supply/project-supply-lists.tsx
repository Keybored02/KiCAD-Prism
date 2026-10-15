import { Link } from "react-router-dom";

import type { ProjectSupply } from "@/types/supply";
import { releaseComplianceCsvUrl } from "./release-check-api";
import { StatusDot } from "./status-dot";
import { STATUS_LABEL } from "./supply-format";

const section = (title: string, children: React.ReactNode) => (
  <section aria-label={title} className="space-y-2">
    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</h3>
    {children}
  </section>
);

/** The builds this project put on the plan. Adding one is done from the BOM; where each runs short is under Insights. */
export function ProjectSupplyBuilds({ builds }: { builds: ProjectSupply["builds"] }) {
  return section("Builds", builds.length === 0 ? (
    <p className="text-sm text-muted-foreground">No build is planned. Add one from the BOM bar with Add to plan.</p>
  ) : (
    <ul className="divide-y border text-sm">
      {builds.map((build) => (
        <li key={build.name} className="flex flex-wrap items-center gap-x-3 p-2">
          <span className="font-medium">{build.name}</span>
          <span className="text-xs text-muted-foreground">{build.parts} parts{build.note ? `, ${build.note}` : ""}{build.need_by ? `, needed by ${build.need_by}` : ""}</span>
          <Link to="/?section=supply&supplyView=insights&insightsView=planning" className="ml-auto text-xs text-primary hover:underline">Where it runs short</Link>
        </li>
      ))}
    </ul>
  ));
}

/** Each release's supply when it was published, and the parts that were fine then and are not now. */
export function ProjectSupplyReleases({ projectId, releases }: { projectId: string; releases: ProjectSupply["releases"] }) {
  return section("Releases", releases.length === 0 ? (
    <p className="text-sm text-muted-foreground">No release has a supply snapshot yet.</p>
  ) : (
    <ul className="divide-y border text-sm">
      {releases.map((release) => (
        <li key={release.build_id} className="space-y-1 p-2">
          <div className="flex flex-wrap items-center gap-2">
            <StatusDot status={release.status} />
            <span className="font-medium">{release.tag}</span>
            <span className="text-xs text-muted-foreground">
              {release.health === null ? STATUS_LABEL[release.status] : `Health ${release.health.toFixed(1)} of 10`}, {release.parts} parts,{" "}
              {release.needing_a_look} needed a look, {new Date(release.created_at).toLocaleDateString()}
            </span>
            <a href={releaseComplianceCsvUrl(projectId, release.build_id)} className="ml-auto text-xs text-primary hover:underline">Compliance CSV</a>
          </div>
          {release.changed_since.length > 0 ? (
            <p className="text-xs text-destructive">
              Since then:{" "}
              {release.changed_since.map((item, index) => (
                <span key={item.part_id}>{index > 0 ? ", " : ""}<Link className="underline" to={`/?section=supply&supplyView=parts&part=${encodeURIComponent(item.part_id)}`}>{item.mpn}</Link> is now {STATUS_LABEL[item.now].toLowerCase()}</span>
              ))}
            </p>
          ) : null}
        </li>
      ))}
    </ul>
  ));
}

/** The notes written on BOM lines, listed per project. Each opens the BOM, where they stay. */
export function ProjectSupplyNotes({ supply }: { supply: ProjectSupply }) {
  const names = new Map((supply.parts ?? []).map((part) => [part.key, part.mpn || part.key]));
  return section("Line notes", supply.notes.length === 0 ? (
    <p className="text-sm text-muted-foreground">No note is written on a BOM line.</p>
  ) : (
    <ul className="divide-y border text-sm">
      {supply.notes.map((note) => (
        <li key={note.id} className="p-2">
          <div className="flex flex-wrap items-baseline gap-2">
            <Link to="?section=visualizers" className="font-medium text-primary hover:underline">{names.get(note.line_key) ?? note.line_key}</Link>
            <span className="text-xs text-muted-foreground">{note.author_name || note.author}, {new Date(note.created_at).toLocaleDateString()}</span>
          </div>
          <p className="whitespace-pre-wrap">{note.body}</p>
        </li>
      ))}
    </ul>
  ));
}
