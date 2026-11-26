import { NCELL, NLAT, NLON } from "./contract";
import type { ViewVar } from "./fields";
import type { Box } from "./region";

/**
 * Ripple diagnostic: per forecast day, the share of grid cells OUTSIDE the initial shock box whose
 * |Branch − Prime| exceeds a variable-specific threshold (display units). It measures how far the
 * model's response reaches; it is not an official score and not proof of physical causation.
 */
export const RIPPLE_THRESHOLDS: Record<ViewVar, number> = {
  t2m: 0.5, // K
  tp: 1.0, // mm/day
  wind: 0.5, // m/s
  u10: 0.5,
  v10: 0.5,
  msl: 0.5, // hPa
  tcwv: 1.0, // kg/m²
};

export function outsideMask(box: Box): Uint8Array {
  const m = new Uint8Array(NCELL);
  for (let r = 0; r < NLAT; r++)
    for (let c = 0; c < NLON; c++) if (r < box.r0 || r > box.r1 || c < box.c0 || c > box.c1) m[r * NLON + c] = 1;
  return m;
}

export function rippleFraction(diff: Float32Array, outside: Uint8Array, threshold: number): number {
  let n = 0, hit = 0;
  for (let i = 0; i < NCELL; i++) {
    if (!outside[i]) continue;
    n++;
    if (Math.abs(diff[i]) > threshold) hit++;
  }
  return n ? hit / n : 0;
}
