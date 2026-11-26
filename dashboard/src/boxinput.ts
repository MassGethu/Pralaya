/**
 * Turns the four "Edit box by latitude / longitude" fields into a shock box, or a message saying why not.
 * Uses region.ts's own cell-centre rule (boxFromDegrees); this file only checks and explains the typed numbers.
 * Nothing is swapped silently: people type one field at a time, so an inverted pair is often a half-finished edit.
 * The caller shows the message next to the fields and can offer `fix` (min and max swapped) as a one-click repair.
 */
import { NLAT, NLON, latOf, lonOf } from "./contract";
import { type Box, boxFromDegrees } from "./region";

export interface TypedBox { latMin: number; latMax: number; lonMin: number; lonMax: number }

export interface BoxFieldResult {
  box: Box | null; // null = keep the current box
  kind: "ok" | "inverted" | "error";
  message: string; // "" when the numbers were fine as typed
  fix?: TypedBox; // for "inverted": the same numbers with min and max swapped
}

const GRID = `The grid covers ${latOf(0)}–${latOf(NLAT - 1)}°N, ${lonOf(0)}–${lonOf(NLON - 1)}°E.`;

export function boxFromFields(t: TypedBox): BoxFieldResult {
  const { latMin, latMax, lonMin, lonMax } = t;
  if (![latMin, latMax, lonMin, lonMax].every(Number.isFinite)) {
    return { box: null, kind: "error", message: "Fill in all four numbers. The shock box was not changed." };
  }
  const bad: string[] = [];
  if (latMin > latMax) bad.push(`lat min ${latMin} is above lat max ${latMax}`);
  if (lonMin > lonMax) bad.push(`lon min ${lonMin} is above lon max ${lonMax}`);
  if (bad.length) {
    const fix = { latMin: Math.min(latMin, latMax), latMax: Math.max(latMin, latMax), lonMin: Math.min(lonMin, lonMax), lonMax: Math.max(lonMin, lonMax) };
    const fixOk = boxFromDegrees(fix.latMin, fix.latMax, fix.lonMin, fix.lonMax) != null;
    const msg = bad.join(" and ");
    return {
      box: null, kind: "inverted", fix: fixOk ? fix : undefined,
      message: `${msg[0].toUpperCase()}${msg.slice(1)}. The shock box was not changed.`,
    };
  }
  const box = boxFromDegrees(latMin, latMax, lonMin, lonMax);
  if (!box) {
    return {
      box: null, kind: "error",
      message: `No 1° cell centre lies inside ${latMin}–${latMax}°N, ${lonMin}–${lonMax}°E. ${GRID} The shock box was not changed.`,
    };
  }
  return { box, kind: "ok", message: "" };
}
