import type { ProjectSupplyPart } from "@/types/supply";
import { formatPrice } from "./supply-format";

/** What a project's parts list adds to a part: its lines of the BOM, the currency the cost is in and the forecast's chance by line. */
export interface ProjectLines {
  byPart: ReadonlyMap<string, ProjectSupplyPart>;
  currency: string;
  /** The forecast's chance of being short in 8 weeks by BOM line key, and the chance that counts as likely. */
  shortAt8Weeks: Record<string, number>;
  chance: number;
}

/** Under the part number: where the part sits on the board, and what the project says about the line. */
export function LineNotes({ line, lines }: { line: ProjectSupplyPart | undefined; lines: ProjectLines }) {
  if (!line) return null;
  const chance = lines.shortAt8Weeks[line.key] ?? 0;
  return (
    <>
      {line.references ? <div className="text-xs text-muted-foreground">{line.references}</div> : null}
      {chance >= lines.chance ? (
        <span className="mt-0.5 inline-block border border-warning/50 px-1 text-[11px] text-warning" title={`${Math.round(chance * 100)}% chance it cannot be bought for one board in 8 weeks`}>Out within 8 weeks</span>
      ) : null}
      {line.notes > 0 ? <span className="ml-2 text-xs text-muted-foreground">{line.notes} {line.notes === 1 ? "note" : "notes"}</span> : null}
    </>
  );
}

/** The columns only a project has, in the order the table puts them: pieces a board uses, pieces the build needs. */
export function BoardCells({ line }: { line: ProjectSupplyPart | undefined }) {
  return (
    <>
      <td className="px-3 py-2 text-right tabular-nums">{line?.quantity ?? ""}</td>
      <td className={`px-3 py-2 text-right tabular-nums ${line?.short ? "text-destructive" : ""}`}>{line?.need ?? ""}</td>
    </>
  );
}

/** What the line costs for the build. */
export function CostCell({ line, lines }: { line: ProjectSupplyPart | undefined; lines: ProjectLines }) {
  return <td className="px-3 py-2 text-right tabular-nums">{line?.line_cost && lines.currency ? formatPrice(line.line_cost, lines.currency) : ""}</td>;
}

/** A line of the BOM that matches no part Prism knows, so the list of parts has no row for it. */
export function UnmatchedRow({ line, lines }: { line: ProjectSupplyPart; lines: ProjectLines }) {
  return (
    <tr className="border-t">
      <td className="px-3 py-2" />
      <td className="px-3 py-2">
        <span className="font-medium">{line.mpn || "No part number"}</span>
        <div className="text-xs text-muted-foreground">{line.manufacturer}{line.references ? ` · ${line.references}` : ""}</div>
      </td>
      <BoardCells line={line} />
      <td className="px-3 py-2" colSpan={2} />
      <CostCell line={line} lines={lines} />
      <td colSpan={3} />
    </tr>
  );
}
