/**
 * Harness geometry numbers, frozen in SB2-40 (CONTRACTS_P2 §17.5, D-P2-35).
 *
 * The twin of `backend/app/services/systems/placement/harness_spec.py`; both
 * equal `backend/tests/fixtures/system_builder/harness_spec.json`.
 */

export const HARNESS_SPEC = {
  bootMm: 10,
  housingDepthMm: 8,
  breakoutLiftMm: 10,
  chordErrorMm: 0.2,
  catmullRomAlpha: 0.5,
  minBendRadiusFactor: 6,
  bendRelaxIterations: 8,
  packingFactor: 1.2,
  ringSegments: 12,
  breakoutBlendMm: 5,
  lengthAllowance: 0.1,
  lengthMismatchTolerance: 0.15,
  boardCollisionMarginMm: 1,
  defaultGaugeAwg: "24",
} as const;

/** M22759/16 finished wire diameter, nominal (NASA NEPP AS22759/16 table, inches × 25.4). */
export const WIRE_OD_MM: Readonly<Record<string, number>> = {
  "24": 1.143, "22": 1.3208, "20": 1.524, "18": 1.8034, "16": 2.0066, "14": 2.3622, "12": 2.8956,
  "10": 3.5306, "8": 5.0546, "6": 6.35, "4": 7.9248, "2": 9.8552, "1": 10.9474, "0": 12.1666, "00": 13.8684,
};

/** A wire's outside diameter and whether it is assumed (no gauge, or one M22759/16 doesn't make). */
export function wireOdMm(gauge: string | number | null | undefined): { odMm: number; assumed: boolean } {
  const key = gauge == null ? null : String(gauge).trim().toUpperCase().replace(/AWG$/, "").trim();
  if (key !== null && key in WIRE_OD_MM) return { odMm: WIRE_OD_MM[key], assumed: false };
  return { odMm: WIRE_OD_MM[HARNESS_SPEC.defaultGaugeAwg], assumed: true };
}
