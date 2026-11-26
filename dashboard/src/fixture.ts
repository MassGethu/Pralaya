/**
 * DEVELOPMENT FIXTURE ONLY. Synthetic input and a toy diffusion "engine" so the dashboard can be exercised
 * while the trained server is unavailable. Nothing here is a weather model or real data. It is activated only
 * by an explicit user toggle and every view it feeds is labelled FIXTURE. API failures never fall back to it.
 */
import { CHANNEL_INFO, type InitialState, NCELL, NCH, NLAT, NLON, T_IN, doySinCos, latOf, lonOf, type Rollout } from "./contract";

const gauss = (lat: number, lon: number, la0: number, lo0: number, s: number) =>
  Math.exp(-((lat - la0) ** 2 + (lon - lo0) ** 2) / (2 * s * s));

export function syntheticInput(landFraction: Float32Array): InitialState {
  const states = new Float32Array(T_IN * NCH * NCELL);
  for (let t = 0; t < T_IN; t++) {
    for (let r = 0; r < NLAT; r++) {
      for (let c = 0; c < NLON; c++) {
        const i = r * NLON + c, lat = latOf(r), lon = lonOf(c), land = landFraction[i];
        const put = (ch: keyof typeof CHANNEL_INFO, v: number) => (states[(t * NCH + CHANNEL_INFO[ch].index) * NCELL + i] = v);
        put("t2m", 303 - 0.45 * (lat - 6.5) + 2 * land - 0.3 * t);
        put("tp", Math.max(0, 25 * gauss(lat, lon, 21 + t, 88 - t, 3) + 12 * gauss(lat, lon, 15, 74, 2.5) + 0.5));
        put("u10", 6 * Math.cos(((lat - 6.5) / 31) * Math.PI) - 2 * land);
        put("v10", 2 + 1.5 * Math.sin(((lon - 65.5) / 35) * Math.PI));
        put("msl", 100600 + 40 * (lat - 6.5) - 300 * gauss(lat, lon, 22, 80, 5));
        put("tcwv", 55 - 1.1 * (lat - 6.5) - 10 * land + 10 * gauss(lat, lon, 18, 88, 4));
      }
    }
  }
  return { id: crypto.randomUUID(), label: "Synthetic fixture (not real weather)", source: "synthetic-fixture", states, doySinCos: doySinCos(196), meta: { fixture: true } };
}

/** Toy dynamics: eastward advection by one cell every other day plus neighbour diffusion. Shock applied once. */
export function fixtureSimulate(input: InitialState, steps: number, perturbation: Float32Array | null): Rollout {
  let cur = input.states.slice((T_IN - 1) * NCH * NCELL);
  if (perturbation) for (let i = 0; i < cur.length; i++) cur[i] += perturbation[i];
  const out = new Float32Array(steps * NCH * NCELL);
  for (let s = 0; s < steps; s++) {
    const next = new Float32Array(NCH * NCELL);
    for (let ch = 0; ch < NCH; ch++) {
      for (let r = 0; r < NLAT; r++) {
        for (let c = 0; c < NLON; c++) {
          const src = s % 2 === 0 ? Math.max(0, c - 1) : c;
          const at = (rr: number, cc: number) => cur[ch * NCELL + Math.min(NLAT - 1, Math.max(0, rr)) * NLON + Math.min(NLON - 1, Math.max(0, cc))];
          const centre = at(r, src);
          const nb = (at(r + 1, src) + at(r - 1, src) + at(r, src + 1) + at(r, src - 1)) / 4;
          let v = 0.7 * centre + 0.3 * nb;
          if (ch === CHANNEL_INFO.tp.index) v = Math.max(0, v * 0.97);
          next[ch * NCELL + r * NLON + c] = v;
        }
      }
    }
    out.set(next, s * NCH * NCELL);
    cur = next;
  }
  return { steps, data: out };
}
