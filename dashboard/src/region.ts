import { NCELL, NLAT, NLON, cellIndex, latOf, lonOf } from "./contract";

/** Inclusive box in grid indices. row 0 = south, col 0 = west. */
export interface Box {
  r0: number;
  r1: number;
  c0: number;
  c1: number;
}

export const clampBox = (b: Box): Box => {
  const r0 = Math.max(0, Math.min(NLAT - 1, Math.min(b.r0, b.r1)));
  const r1 = Math.max(0, Math.min(NLAT - 1, Math.max(b.r0, b.r1)));
  const c0 = Math.max(0, Math.min(NLON - 1, Math.min(b.c0, b.c1)));
  const c1 = Math.max(0, Math.min(NLON - 1, Math.max(b.c0, b.c1)));
  return { r0, r1, c0, c1 };
};

/** Cells whose CENTRE lies inside [latMin, latMax] x [lonMin, lonMax] (same rule as the kit's box_mask). */
export function boxFromDegrees(latMin: number, latMax: number, lonMin: number, lonMax: number): Box | null {
  const rows: number[] = [];
  const cols: number[] = [];
  for (let r = 0; r < NLAT; r++) if (latOf(r) >= latMin && latOf(r) <= latMax) rows.push(r);
  for (let c = 0; c < NLON; c++) if (lonOf(c) >= lonMin && lonOf(c) <= lonMax) cols.push(c);
  if (!rows.length || !cols.length) return null;
  return { r0: rows[0], r1: rows[rows.length - 1], c0: cols[0], c1: cols[cols.length - 1] };
}

export function boxMask(b: Box): Uint8Array {
  const m = new Uint8Array(NCELL);
  for (let r = b.r0; r <= b.r1; r++) for (let c = b.c0; c <= b.c1; c++) m[cellIndex(r, c)] = 1;
  return m;
}

export const boxCellCount = (b: Box): number => (b.r1 - b.r0 + 1) * (b.c1 - b.c0 + 1);

export function describeBox(b: Box): string {
  const f = (v: number) => v.toFixed(1);
  return `${f(latOf(b.r0))}–${f(latOf(b.r1))}°N, ${f(lonOf(b.c0))}–${f(lonOf(b.c1))}°E (cell centres) · rows ${b.r0}–${b.r1}, cols ${b.c0}–${b.c1}`;
}
