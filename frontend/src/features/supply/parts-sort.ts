/** What a parts list is sorted by: nothing (worst first), "runout", or a column and a direction as "<column>:<asc|desc>". */
export type PartsSort = string;

export type SortColumn = "part" | "stock" | "price";
export type Direction = "asc" | "desc";

const COLUMNS: readonly SortColumn[] = ["part", "stock", "price"];

/** The sort an address asks for, or none when it is not one Prism knows. */
export function sortFromParam(value: string | null): PartsSort {
  if (value === "runout") return "runout";
  const [column, direction] = (value ?? "").split(":");
  return COLUMNS.some((item) => item === column) && (direction === "asc" || direction === "desc") ? `${column}:${direction}` : "";
}

/** The column and direction a sort is on, or null when it is on none (the list's own order or "runout"). */
export function columnOf(sort: PartsSort): { column: SortColumn; direction: Direction } | null {
  const [column, direction] = sort.split(":");
  return COLUMNS.some((item) => item === column) && (direction === "asc" || direction === "desc") ? { column: column as SortColumn, direction } : null;
}

/** The sort after a click on a column: the first click puts the most first (the part number, A first), the next reverses it, the third lets go. */
export function clickColumn(sort: PartsSort, column: SortColumn): PartsSort {
  const now = columnOf(sort);
  const first: Direction = column === "part" ? "asc" : "desc";
  if (now?.column !== column) return `${column}:${first}`;
  return now.direction === first ? `${column}:${first === "asc" ? "desc" : "asc"}` : "";
}
