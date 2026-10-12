import type { SupplyParameter } from "@/types/supply";

const LABEL: Record<string, string> = {
  resistance: "Resistance",
  capacitance: "Capacitance",
  inductance: "Inductance",
  tolerance: "Tolerance",
  voltage_rating: "Voltage rating",
  power_rating: "Power rating",
  package: "Package",
  dielectric: "Dielectric",
};
const UNIT: Record<string, string> = { ohm: "Ω", farad: "F", henry: "H", volt: "V", watt: "W", percent: "%" };
const PREFIXES: Array<[number, string]> = [[1e9, "G"], [1e6, "M"], [1e3, "k"], [1, ""], [1e-3, "m"], [1e-6, "µ"], [1e-9, "n"], [1e-12, "p"]];

/** 0.0000047 farad as "4.7 µF". Empty for a unit without a symbol. */
export function siText(value: string, unit: string): string {
  const symbol = UNIT[unit];
  const number = Number(value);
  if (!symbol || !Number.isFinite(number)) return "";
  if (unit === "percent") return `${number} %`;
  const [factor, prefix] = PREFIXES.find(([size]) => Math.abs(number) >= size) ?? PREFIXES[PREFIXES.length - 1];
  return `${Number((number / factor).toPrecision(4))} ${prefix}${symbol}`;
}

export interface ParameterRow {
  name: string;
  label: string;
  raw: string;
  /** The value in SI, only when it differs from how the distributor wrote it. */
  si: string;
  sources: string;
}

export function parameterRows(parameters: readonly SupplyParameter[]): ParameterRow[] {
  return parameters.map((parameter) => {
    const si = parameter.value !== null ? siText(parameter.value, parameter.unit) : "";
    return {
      name: parameter.name,
      label: parameter.key ? LABEL[parameter.key] ?? parameter.name : parameter.name,
      raw: parameter.raw,
      si: si.replace(/\s/g, "") === parameter.raw.replace(/\s/g, "") ? "" : si,
      sources: parameter.sources.join(", "),
    };
  });
}
