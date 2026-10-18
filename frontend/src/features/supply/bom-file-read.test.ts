import * as XLSX from "xlsx";
import { describe, expect, it } from "vitest";

import { readTableFile } from "./bom-file-read";

function fileOf(bytes: BlobPart, name: string): File {
  const file = new File([bytes], name);
  // jsdom's File has no arrayBuffer or text.
  Object.defineProperty(file, "arrayBuffer", { value: () => Promise.resolve(bytes instanceof Uint8Array ? bytes.buffer : new ArrayBuffer(0)) });
  Object.defineProperty(file, "text", { value: () => Promise.resolve(String(bytes)) });
  return file;
}

const SHEET = [["Manufacturer", "MPN", "Qty"], ["Acme", "R-10K", 2], ["Globex", "LM358", 4]];

describe("reading a BOM file", () => {
  for (const bookType of ["xlsx", "xls"] as const) {
    it(`reads the first sheet of an .${bookType} file as text`, async () => {
      const book = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(book, XLSX.utils.aoa_to_sheet(SHEET), "BOM");
      const bytes = new Uint8Array(XLSX.write(book, { type: "array", bookType }));
      expect(await readTableFile(fileOf(bytes, `bom.${bookType}`))).toEqual([
        ["Manufacturer", "MPN", "Qty"], ["Acme", "R-10K", "2"], ["Globex", "LM358", "4"],
      ]);
    });
  }

  it("reads delimited text as before", async () => {
    expect(await readTableFile(fileOf("a;b\n1;2\n", "bom.csv"))).toEqual([["a", "b"], ["1", "2"]]);
  });
});
