import { parseTable } from "./bom-file-model";

const SPREADSHEET = /\.(xlsx|xlsm|xls|ods)$/i;

export function isSpreadsheet(name: string): boolean {
  return SPREADSHEET.test(name);
}

/** Rows of the first sheet of a spreadsheet, every cell as the text Excel shows. The reader loads only when one is opened. */
async function spreadsheetRows(file: File): Promise<string[][]> {
  const { read, utils } = await import("xlsx");
  const book = read(await file.arrayBuffer(), { type: "array" });
  const sheet = book.Sheets[book.SheetNames[0] ?? ""];
  if (!sheet) return [];
  const rows = utils.sheet_to_json<unknown[]>(sheet, { header: 1, raw: false, defval: "", blankrows: false });
  return rows.map((row) => row.map((cell) => String(cell ?? "")));
}

/** The rows of a BOM file: a spreadsheet's first sheet, or delimited text. */
export async function readTableFile(file: File): Promise<string[][]> {
  return isSpreadsheet(file.name) ? spreadsheetRows(file) : parseTable(await file.text());
}
