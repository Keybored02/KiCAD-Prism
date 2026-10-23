import { Link } from "react-router-dom";

import type { ProjectSupply } from "@/types/supply";
import { releaseComplianceCsvUrl } from "./release-check-api";
import { StatusDot } from "./status-dot";
import { STATUS_LABEL } from "./supply-format";

/** A folded section with its count in the summary; an empty one has a summary and nothing to open. */
const section = (title: string, children: React.ReactNode, count?: number, open = false) => (
  <details open={open || undefined}>
    <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wider text-muted-foreground">{count === undefined ? title : `${title} (${count})`}</summary>
    <section aria-label={title} className="mt-2 space-y-2">{children}</section>
  </details>
);

type Release = ProjectSupply["releases"][number];

/** What a release looks like once it has a supply snapshot, shown while the project has none. Made up, and marked as such. */
const EXAMPLE: Release[] = [
  {
    build_id: "example-2", tag: "v1.2", created_at: "2026-09-18T09:30:00Z", health: 8.6, status: "warning", parts: 147, needing_a_look: 9,
    changed_since: [
      { part_id: "example-a", manufacturer: "Texas Instruments", mpn: "TPS62840DLCR", was: "ok", now: "error" },
      { part_id: "example-b", manufacturer: "Murata", mpn: "GRM188R61E106MA73D", was: "ok", now: "warning" },
    ],
  },
  { build_id: "example-1", tag: "v1.1", created_at: "2026-08-02T14:05:00Z", health: 9.3, status: "ok", parts: 142, needing_a_look: 3, changed_since: [] },
];

function ReleaseList({ projectId, releases, example = false }: { projectId: string; releases: Release[]; example?: boolean }) {
  return (
    <ul className={`divide-y border text-sm ${example ? "text-muted-foreground" : ""}`}>
      {releases.map((release) => (
        <li key={release.build_id} className="space-y-1 p-2">
          <div className="flex flex-wrap items-center gap-2">
            <StatusDot status={release.status} />
            <span className="font-medium">{release.tag}</span>
            <span className="text-xs text-muted-foreground">
              {release.health === null ? STATUS_LABEL[release.status] : `Health ${release.health.toFixed(1)} of 10`}, {release.parts} parts,{" "}
              {release.needing_a_look} needed a look, {new Date(release.created_at).toLocaleDateString()}
            </span>
            {example ? null : <a href={releaseComplianceCsvUrl(projectId, release.build_id)} className="ml-auto text-xs text-primary hover:underline">Compliance CSV</a>}
          </div>
          {release.changed_since.length > 0 ? (
            <p className="text-xs text-destructive">
              Since then:{" "}
              {release.changed_since.map((item, index) => (
                <span key={item.part_id}>
                  {index > 0 ? ", " : ""}
                  {example ? <span className="underline">{item.mpn}</span> : <Link className="underline" to={`/?section=supply&supplyView=parts&part=${encodeURIComponent(item.part_id)}`}>{item.mpn}</Link>} is now {STATUS_LABEL[item.now].toLowerCase()}
                </span>
              ))}
            </p>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

/** Each release's supply when it was published, and the parts that were fine then and are not now. With none, an example of how it will look. */
export function ProjectSupplyReleases({ projectId, releases }: { projectId: string; releases: ProjectSupply["releases"] }) {
  if (releases.length === 0) {
    return section("Releases", (
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">No release has a supply snapshot yet. A release gets one when it is built. This is an example of how it will look.</p>
        <div aria-label="Example releases" className="opacity-70"><ReleaseList projectId={projectId} releases={EXAMPLE} example /></div>
      </div>
    ), undefined, true);
  }
  return section("Releases", <ReleaseList projectId={projectId} releases={releases} />, releases.length);
}

/** The notes written on BOM lines, listed per project. Each opens the BOM, where they stay. */
export function ProjectSupplyNotes({ supply }: { supply: ProjectSupply }) {
  const names = new Map((supply.parts ?? []).map((part) => [part.key, part.mpn || part.key]));
  if (supply.notes.length === 0) return null;
  return section("Line notes", (
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
  ), supply.notes.length);
}
