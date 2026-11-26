import { CHANNEL_INFO, NCELL, NCH, type Rollout } from "./contract";

/** Display variables. Wind speed is derived per timeline from u10 and v10 before any difference. */
export type ViewVar = "t2m" | "tp" | "wind" | "u10" | "v10" | "msl" | "tcwv";

export const VIEW_VARS: { id: ViewVar; label: string; unit: string; deltaUnit: string }[] = [
  { id: "tp", label: "Rainfall", unit: "mm/day", deltaUnit: "mm/day" },
  { id: "t2m", label: "Temperature", unit: "°C", deltaUnit: "K (= °C)" },
  { id: "wind", label: "Wind speed", unit: "m/s", deltaUnit: "m/s" },
  { id: "u10", label: "Eastward wind u10", unit: "m/s", deltaUnit: "m/s" },
  { id: "v10", label: "Northward wind v10", unit: "m/s", deltaUnit: "m/s" },
  { id: "msl", label: "Sea-level pressure", unit: "hPa", deltaUnit: "hPa" },
  { id: "tcwv", label: "Column water vapour", unit: "kg/m²", deltaUnit: "kg/m²" },
];

/** Presentation-layer conversion from API units. Differences use the same scale factor without the offset. */
export function displayField(r: Rollout, day: number, v: ViewVar): Float32Array {
  const t = day - 1;
  const out = new Float32Array(NCELL);
  const ch = (c: keyof typeof CHANNEL_INFO) => (t * NCH + CHANNEL_INFO[c].index) * NCELL;
  if (v === "wind") {
    const u = ch("u10"), w = ch("v10");
    for (let i = 0; i < NCELL; i++) out[i] = Math.hypot(r.data[u + i], r.data[w + i]);
    return out;
  }
  const base = ch(v);
  const [scale, offset] = v === "t2m" ? [1, -273.15] : v === "msl" ? [0.01, 0] : [1, 0];
  for (let i = 0; i < NCELL; i++) out[i] = r.data[base + i] * scale + offset;
  return out;
}

export function difference(a: Float32Array, b: Float32Array): Float32Array {
  const out = new Float32Array(a.length);
  for (let i = 0; i < a.length; i++) out[i] = b[i] - a[i];
  return out;
}

export function maxAbs(f: Float32Array): number {
  let m = 0;
  for (let i = 0; i < f.length; i++) m = Math.max(m, Math.abs(f[i]));
  return m;
}

/** Robust shared range across both timelines and all days, so the slider never rescales. */
export function sharedRange(fields: Float32Array[]): [number, number] {
  const all: number[] = [];
  for (const f of fields) for (let i = 0; i < f.length; i += 1) all.push(f[i]);
  all.sort((x, y) => x - y);
  const q = (p: number) => all[Math.min(all.length - 1, Math.max(0, Math.round(p * (all.length - 1))))];
  let lo = q(0.01), hi = q(0.99);
  if (hi - lo < 1e-6) { lo -= 0.5; hi += 0.5; }
  return [lo, hi];
}
