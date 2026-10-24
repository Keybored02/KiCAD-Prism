import type { ProjectSupplyPart } from "@/types/supply";
import { formatPrice } from "./supply-format";

/** What a project's parts list adds to a part: its lines of the BOM and the currency the cost is in. */
export interface ProjectLines {
  byPart: ReadonlyMap<string, ProjectSupplyPart>;
  currency: string;
}

/** Under the part number: where the part sits on the board, and the notes written on the line. */
export function LineNotes({ line }: { line: ProjectSupplyPart | undefined }) {
  if (!line) return null;
  return (
    <>
      {line.references ? <div className="text-xs text-muted-foreground">{line.references}</div> : null}
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
