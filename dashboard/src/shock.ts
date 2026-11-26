import { CHANNEL_INFO, type Channel, NCELL, NCH, type InitialState, T_IN } from "./contract";
import { type Box, boxFromDegrees, boxMask, boxCellCount } from "./region";

/**
 * One shock component. `add` is a physical delta in the channel's API unit (K, mm/day, m/s, Pa, kg/m²).
 * `percent` is a fraction of the ORIGINAL final input day's value in each cell (e.g. -40 = -40 % of u10).
 */
export interface ShockComponent {
  channel: Channel;
  mode: "add" | "percent";
  value: number;
}

export interface ShockSpec {
  box: Box;
  components: ShockComponent[];
  label: string;
}

export class ShockError extends Error {}

export function validateShock(spec: ShockSpec): void {
  if (boxCellCount(spec.box) <= 0) throw new ShockError("shock region is empty");
  if (!spec.components.length) throw new ShockError("pick at least one shocked variable");
  for (const c of spec.components) {
    if (!Number.isFinite(c.value)) throw new ShockError(`${c.channel} magnitude must be a finite number`);
    if (c.mode === "percent" && Math.abs(c.value) > 100) throw new ShockError(`${c.channel}: percent shocks are limited to ±100 %`);
  }
}

/**
 * Build the [6, 32, 36] physical-delta tensor. Only selected cells and channels are non-zero.
 * The initial state is read, never written.
 */
export function buildPerturbation(input: InitialState, spec: ShockSpec): Float32Array {
  validateShock(spec);
  const delta = new Float32Array(NCH * NCELL);
  const mask = boxMask(spec.box);
  const lastDayOffset = (T_IN - 1) * NCH * NCELL;
  for (const comp of spec.components) {
    const ch = CHANNEL_INFO[comp.channel].index;
    for (let i = 0; i < NCELL; i++) {
      if (!mask[i]) continue;
      const d = comp.mode === "add" ? comp.value : (comp.value / 100) * input.states[lastDayOffset + ch * NCELL + i];
      delta[ch * NCELL + i] += d;
    }
  }
  if (spec.components.some((c) => c.channel === "tp")) {
    // Rain cannot go negative: cap a negative tp delta at the cell's current rain.
    const ch = CHANNEL_INFO.tp.index;
    for (let i = 0; i < NCELL; i++) {
      const cur = input.states[lastDayOffset + ch * NCELL + i];
      if (cur + delta[ch * NCELL + i] < 0) delta[ch * NCELL + i] = -cur;
    }
  }
  return delta;
}

export function isZeroTensor(t: Float32Array): boolean {
  for (let i = 0; i < t.length; i++) if (t[i] !== 0) return false;
  return true;
}

export interface DeltaSummary {
  channel: Channel;
  min: number;
  max: number;
  mean: number;
  cells: number;
}

export function summarisePerturbation(delta: Float32Array, spec: ShockSpec): DeltaSummary[] {
  const mask = boxMask(spec.box);
  const seen = new Set<Channel>();
  const out: DeltaSummary[] = [];
  for (const comp of spec.components) {
    if (seen.has(comp.channel)) continue;
    seen.add(comp.channel);
    const ch = CHANNEL_INFO[comp.channel].index;
    let min = Infinity, max = -Infinity, sum = 0, n = 0;
    for (let i = 0; i < NCELL; i++) {
      if (!mask[i]) continue;
      const v = delta[ch * NCELL + i];
      min = Math.min(min, v); max = Math.max(max, v); sum += v; n++;
    }
    out.push({ channel: comp.channel, min, max, mean: n ? sum / n : 0, cells: n });
  }
  return out;
}

/** The two shocks named in the official contract, built from cell centres like the kit's box_mask. */
export const PRESETS: { id: string; label: string; spec: () => ShockSpec }[] = [
  {
    id: "warm_ocean",
    label: "Warm Bay of Bengal (+3 K t2m, +15 % tcwv)",
    spec: () => ({
      box: boxFromDegrees(8, 20, 82, 94)!,
      components: [
        { channel: "t2m", mode: "add", value: 3 },
        { channel: "tcwv", mode: "percent", value: 15 },
      ],
      label: "Warm Bay of Bengal",
    }),
  },
  {
    id: "monsoon_stall",
    label: "Weaker Arabian Sea wind (−40 % u10, v10)",
    spec: () => ({
      box: boxFromDegrees(8, 20, 65, 75)!,
      components: [
        { channel: "u10", mode: "percent", value: -40 },
        { channel: "v10", mode: "percent", value: -40 },
      ],
      label: "Weaker Arabian Sea wind",
    }),
  },
];
