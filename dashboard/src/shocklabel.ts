/**
 * Human-readable labels for shock components that say what was APPLIED, not just what was typed.
 * buildPerturbation (shock.ts) caps a negative rain delta so rain never goes below 0. When that happens, a label
 * like "tp −30 mm/day" would overstate the shock, so the rain label shows the applied mean and says it was capped.
 * Read-only: this never changes the perturbation; it only compares the built delta with the request.
 */
import { CHANNEL_INFO, NCELL, NCH, type InitialState, T_IN } from "./contract";
import { signed } from "./format";
import { boxMask } from "./region";
import type { ShockSpec } from "./shock";

export interface RainCap {
  capped: number; // cells where the requested rain delta would have made rain negative
  cells: number; // cells in the shock box
  appliedMean: number; // mean applied tp delta over the box (mm/day)
  appliedMin: number;
}

/** How the rain cap changed a built perturbation, or null when the spec has no rain component. */
export function rainCap(input: InitialState, spec: ShockSpec, delta: Float32Array): RainCap | null {
  const tp = spec.components.filter((c) => c.channel === "tp");
  if (!tp.length) return null;
  const ch = CHANNEL_INFO.tp.index;
  const last = (T_IN - 1) * NCH * NCELL + ch * NCELL;
  const mask = boxMask(spec.box);
  let capped = 0, cells = 0, sum = 0, min = Infinity;
  for (let i = 0; i < NCELL; i++) {
    if (!mask[i]) continue;
    const cur = input.states[last + i];
    let requested = 0;
    for (const c of tp) requested += c.mode === "add" ? c.value : (c.value / 100) * cur;
    if (cur + requested < 0) capped++;
    const d = delta[ch * NCELL + i];
    cells++; sum += d; min = Math.min(min, d);
  }
  return { capped, cells, appliedMean: cells ? sum / cells : 0, appliedMin: cells ? min : 0 };
}

const requestedText = (c: ShockSpec["components"][number]) =>
  `${c.channel} ${c.mode === "add" ? `${signed(c.value, 1)} ${CHANNEL_INFO[c.channel].unit}` : `${signed(c.value, 0)}%`}`;

/**
 * One short phrase per shocked variable, e.g. "t2m +3.0 K · tp applied −4.2 mm/day mean (capped so rain ≥ 0)".
 * Pass the built delta and the input it was built from; without them the typed values are shown unchanged.
 */
export function componentSummary(spec: ShockSpec, input: InitialState | null, delta: Float32Array | null): string {
  const cap = input && delta ? rainCap(input, spec, delta) : null;
  const parts: string[] = [];
  let rainDone = false;
  for (const c of spec.components) {
    if (c.channel === "tp" && cap && cap.capped > 0) {
      if (rainDone) continue; // several tp rows are applied as one rain delta
      rainDone = true;
      parts.push(`tp applied ${signed(cap.appliedMean, 1)} mm/day mean (capped so rain ≥ 0 in ${cap.capped}/${cap.cells} cells)`);
    } else parts.push(requestedText(c));
  }
  return parts.join(" · ");
}
