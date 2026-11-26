// Official Round 1 contract (yug-monsoon-kit v1.0.0, docs/R1_CONTRACT.md).
// Grid row 0 = 6.5N (south), col 0 = 65.5E (west). Physical units on the wire, always.

export const NLAT = 32;
export const NLON = 36;
export const NCELL = NLAT * NLON;
export const NCH = 6;
export const T_IN = 3;
export const DEFAULT_STEPS = 10;
export const MAX_STEPS = 14;

export const LAT0 = 6.5;
export const LON0 = 65.5;
export const DLAT = 1;
export const DLON = 1;

export const CHANNELS = ["t2m", "tp", "u10", "v10", "msl", "tcwv"] as const;
export type Channel = (typeof CHANNELS)[number];

export const CHANNEL_INFO: Record<Channel, { index: number; label: string; unit: string }> = {
  t2m: { index: 0, label: "2 m temperature", unit: "K" },
  tp: { index: 1, label: "Daily precipitation", unit: "mm/day" },
  u10: { index: 2, label: "10 m eastward wind", unit: "m/s" },
  v10: { index: 3, label: "10 m northward wind", unit: "m/s" },
  msl: { index: 4, label: "Mean sea-level pressure", unit: "Pa" },
  tcwv: { index: 5, label: "Total column water vapour", unit: "kg/m²" },
};

/** Per-channel std from the kit's stats.json (used only for the zero-shock tolerance: 1e-3 x std). */
export const CHANNEL_STD = [13.46363353729248, 7.553342342376709, 2.8989806175231934, 2.4269521236419678, 619.0198364257812, 20.49437141418457];

export const latOf =(row: number): number => LAT0 + row * DLAT;
export const lonOf = (col: number): number => LON0 + col * DLON;
export const cellIndex = (row: number, col: number): number => row * NLON + col;

/** Index into a flat [.., 6, 32, 36] array for (time, channel, row, col). */
export const flatIndex = (t: number, ch: number, row: number, col: number): number =>
  ((t * NCH + ch) * NLAT + row) * NLON + col;

export function doySinCos(doy: number): [number, number] {
  return [Math.sin((2 * Math.PI * doy) / 365), Math.cos((2 * Math.PI * doy) / 365)];
}

/** A loaded three-day atmospheric state. `states` is flat [3, 6, 32, 36] in physical units. */
export interface InitialState {
  id: string;
  label: string;
  source: "file" | "synthetic-fixture";
  states: Float32Array;
  doySinCos: [number, number];
  meta: Record<string, unknown>;
}

/** A forecast rollout, flat [steps, 6, 32, 36]. */
export interface Rollout {
  steps: number;
  data: Float32Array;
}

export class ContractError extends Error {}

/** Flatten a nested numeric array of an exact shape, rejecting non-finite values. */
export function flattenExact(value: unknown, shape: number[], name: string): Float32Array {
  const size = shape.reduce((a, b) => a * b, 1);
  const out = new Float32Array(size);
  let k = 0;
  const walk = (v: unknown, depth: number, path: string): void => {
    if (depth === shape.length) {
      if (typeof v !== "number" || !Number.isFinite(v)) {
        throw new ContractError(`${name}${path} is not a finite number`);
      }
      out[k++] = v;
      return;
    }
    if (!Array.isArray(v) || v.length !== shape[depth]) {
      const got = Array.isArray(v) ? `length ${v.length}` : typeof v;
      throw new ContractError(`${name}${path}: expected length ${shape[depth]} at axis ${depth}, got ${got}`);
    }
    for (let i = 0; i < v.length; i++) walk(v[i], depth + 1, `${path}[${i}]`);
  };
  walk(value, 0, "");
  return out;
}

/** Nest a flat array back into JSON lists for the wire. */
export function nest(flat: Float32Array, shape: number[]): unknown[] {
  const build = (offset: number, depth: number): unknown[] => {
    const n = shape[depth];
    const stride = shape.slice(depth + 1).reduce((a, b) => a * b, 1);
    const arr = new Array(n);
    for (let i = 0; i < n; i++) {
      arr[i] = depth === shape.length - 1 ? flat[offset + i] : build(offset + i * stride, depth + 1);
    }
    return arr;
  };
  return build(0, 0);
}

/** Parse a demo-input or request-body JSON into an InitialState. */
export function parseInitialState(json: unknown, label: string): InitialState {
  if (typeof json !== "object" || json === null) throw new ContractError("input is not a JSON object");
  const obj = json as Record<string, unknown>;
  if (!("init_states" in obj)) throw new ContractError("missing field init_states");
  if (!("doy_sincos" in obj)) throw new ContractError("missing field doy_sincos (seasonal encoding of the last input day)");
  const states = flattenExact(obj.init_states, [T_IN, NCH, NLAT, NLON], "init_states");
  const ds = flattenExact(obj.doy_sincos, [2], "doy_sincos");
  const norm = Math.hypot(ds[0], ds[1]);
  if (Math.abs(norm - 1) > 1e-3) throw new ContractError(`doy_sincos must lie on the unit circle (|v| = ${norm.toFixed(4)})`);
  checkPhysicalRanges(states, T_IN, "init_states");
  const meta = typeof obj.meta === "object" && obj.meta !== null ? (obj.meta as Record<string, unknown>) : {};
  return { id: crypto.randomUUID(), label, source: "file", states, doySinCos: [ds[0], ds[1]], meta };
}

/** Plausibility checks in physical units; catches normalised or Celsius/hPa inputs early. */
export function checkPhysicalRanges(flat: Float32Array, nt: number, name: string): void {
  const ranges: Record<Channel, [number, number]> = {
    t2m: [180, 340], tp: [0, 2000], u10: [-80, 80], v10: [-80, 80], msl: [85000, 110000], tcwv: [0, 120],
  };
  for (let t = 0; t < nt; t++) {
    for (const ch of CHANNELS) {
      const [lo, hi] = ranges[ch];
      const base = flatIndex(t, CHANNEL_INFO[ch].index, 0, 0);
      for (let i = 0; i < NCELL; i++) {
        const v = flat[base + i];
        if (v < lo || v > hi) {
          throw new ContractError(`${name}[${t}].${ch} = ${v} outside plausible ${lo}..${hi} ${CHANNEL_INFO[ch].unit}; check units`);
        }
      }
    }
  }
}

export function parseRollout(json: unknown, steps: number): Rollout & { inferenceMs: number | null } {
  if (typeof json !== "object" || json === null) throw new ContractError("response is not a JSON object");
  const obj = json as Record<string, unknown>;
  if (!("rollout" in obj)) throw new ContractError("response has no rollout field");
  const data = flattenExact(obj.rollout, [steps, NCH, NLAT, NLON], "rollout");
  const ms = typeof obj.inference_ms === "number" ? obj.inference_ms : null;
  return { steps, data, inferenceMs: ms };
}
