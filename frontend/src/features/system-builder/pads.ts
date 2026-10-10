/**
 * Natural pad order, the same as the backend's `pad_sort_key` (§2.4):
 * digit runs compare as numbers and before text runs, so "2" < "10" < "A1".
 */
function chunks(pad: string): (number | string)[] {
  return (pad.match(/\d+|\D+/g) ?? []).map((chunk) => (/^\d+$/.test(chunk) ? Number(chunk) : chunk));
}

export function comparePads(a: string, b: string): number {
  const left = chunks(a);
  const right = chunks(b);
  for (let i = 0; i < Math.min(left.length, right.length); i += 1) {
    const x = left[i];
    const y = right[i];
    if (typeof x === "number" && typeof y === "number") {
      if (x !== y) return x - y;
    } else if (typeof x === "number") {
      return -1;
    } else if (typeof y === "number") {
      return 1;
    } else if (x !== y) {
      return x < y ? -1 : 1;
    }
  }
  return left.length - right.length;
}
