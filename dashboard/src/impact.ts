/**
 * Agricultural weather-stress indicators computed from two real rollouts.
 *
 * Aggregation (documented, shown in the panel):
 *  - Region cells = selected impact box ∩ land cells, where land = land_sea_mask >= LAND_THRESHOLD
 *    (kit static field, fraction 0..1).
 *  - Regional daily rainfall = area-weighted mean of tp over those cells, weight cos(latitude).
 *  - Cumulative rainfall = sum of regional daily means over the selected forecast days (mm).
 *  - Dry day = regional daily mean rainfall < dryThreshold (mm/day). Longest dry spell = longest run of dry days.
 *  - Heavy-rain exposure = number of (cell, day) pairs in the region with tp >= heavyThreshold, as a share of all pairs.
 *  - Mean temperature = area-weighted mean t2m over the window, in °C (daily-mean field, not daily maximum).
 *
 * These are weather-stress indicators for comparing two simulated timelines. They are not yield, loss or
 * drought declarations. A rainfall change is relative to Timeline Prime, not to a climatological normal.
 */
import { CHANNEL_INFO, NCELL, NCH, type Rollout, latOf, NLON } from "./contract";

export const LAND_THRESHOLD = 0.5;

export interface ImpactParams {
  regionMask: Uint8Array; // 1 = in selected impact box
  landFraction: Float32Array; // land_sea_mask 0..1
  dayStart: number; // 1-based, inclusive
  dayEnd: number; // 1-based, inclusive
  dryThreshold: number; // mm/day
  heavyThreshold: number; // mm/day
}

export interface TimelineIndicators {
  dailyRain: number[]; // regional mean mm/day per day in window
  cumulativeRain: number; // mm
  dryDays: number;
  longestDrySpell: number; // days
  heavyShare: number; // 0..1
  meanTempC: number;
}

export type ImpactResult =
  | { empty: true; reason: string }
  | {
      empty: false;
      cells: number;
      days: number[];
      prime: TimelineIndicators;
      branch: TimelineIndicators;
      rainChangeMm: number; // branch - prime cumulative
      rainChangePct: number | null; // relative to prime; null when prime cumulative ~ 0
      drySpellChange: number;
    };

export function regionCells(p: ImpactParams): number[] {
  const out: number[] = [];
  for (let i = 0; i < NCELL; i++) if (p.regionMask[i] && p.landFraction[i] >= LAND_THRESHOLD) out.push(i);
  return out;
}

export function longestRun(flags: boolean[]): number {
  let best = 0, cur = 0;
  for (const f of flags) {
    cur = f ? cur + 1 : 0;
    best = Math.max(best, cur);
  }
  return best;
}

function timeline(r: Rollout, cells: number[], weights: number[], wsum: number, p: ImpactParams): TimelineIndicators {
  const tp = CHANNEL_INFO.tp.index, t2m = CHANNEL_INFO.t2m.index;
  const dailyRain: number[] = [];
  let tempSum = 0, heavy = 0;
  for (let d = p.dayStart; d <= p.dayEnd; d++) {
    const t = d - 1;
    let rain = 0, temp = 0;
    for (let k = 0; k < cells.length; k++) {
      const i = cells[k];
      const v = r.data[(t * NCH + tp) * NCELL + i];
      rain += weights[k] * v;
      temp += weights[k] * r.data[(t * NCH + t2m) * NCELL + i];
      if (v >= p.heavyThreshold) heavy++;
    }
    dailyRain.push(rain / wsum);
    tempSum += temp / wsum;
  }
  const nDays = p.dayEnd - p.dayStart + 1;
  const dryFlags = dailyRain.map((v) => v < p.dryThreshold);
  return {
    dailyRain,
    cumulativeRain: dailyRain.reduce((a, b) => a + b, 0),
    dryDays: dryFlags.filter(Boolean).length,
    longestDrySpell: longestRun(dryFlags),
    heavyShare: heavy / (cells.length * nDays),
    meanTempC: tempSum / nDays - 273.15,
  };
}

export function computeImpact(prime: Rollout, branch: Rollout, p: ImpactParams): ImpactResult {
  if (prime.steps !== branch.steps) return { empty: true, reason: "Prime and Branch horizons differ" };
  if (!(p.dayStart >= 1 && p.dayEnd <= prime.steps && p.dayStart <= p.dayEnd)) {
    return { empty: true, reason: `forecast window must lie within days 1–${prime.steps}` };
  }
  if (!Number.isFinite(p.dryThreshold) || p.dryThreshold < 0) return { empty: true, reason: "dry-day threshold must be ≥ 0 mm/day" };
  if (!Number.isFinite(p.heavyThreshold) || p.heavyThreshold <= 0) return { empty: true, reason: "heavy-rain threshold must be > 0 mm/day" };
  const cells = regionCells(p);
  if (!cells.length) return { empty: true, reason: "the impact region contains no land cells (land_sea_mask ≥ 0.5)" };
  const weights = cells.map((i) => Math.cos((latOf(Math.floor(i / NLON)) * Math.PI) / 180));
  const wsum = weights.reduce((a, b) => a + b, 0);
  const a = timeline(prime, cells, weights, wsum, p);
  const b = timeline(branch, cells, weights, wsum, p);
  const days: number[] = [];
  for (let d = p.dayStart; d <= p.dayEnd; d++) days.push(d);
  const change = b.cumulativeRain - a.cumulativeRain;
  return {
    empty: false,
    cells: cells.length,
    days,
    prime: a,
    branch: b,
    rainChangeMm: change,
    rainChangePct: a.cumulativeRain > 0.1 ? (100 * change) / a.cumulativeRain : null,
    drySpellChange: b.longestDrySpell - a.longestDrySpell,
  };
}
