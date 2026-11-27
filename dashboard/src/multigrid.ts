/**
 * "All futures" grid: every Branch on the shelf drawn as a small Difference map (Branch − Prime) for the same day,
 * on one shared colour scale, so the alternative futures can be compared at a glance. Click a tile to bring that
 * future back on the main map. Display only: fields come from runs already in memory.
 */
import type { Box } from "./region";
import { type GeoContext, MapView, type Scale } from "./render";
import { escapeHtml, signed } from "./format";

export interface GridTile {
  runNo: number;
  label: string;
  field: Float32Array; // Branch − Prime for the shown day
  peak: number; // signed value with the largest |Δ| that day
  box: Box; // the shock box, outlined on the tile
  active: boolean;
}

export class MultiGrid {
  private views = new Map<number, { el: HTMLButtonElement; map: MapView }>();

  constructor(private host: HTMLElement, private geo: GeoContext, private onPick: (runNo: number) => void, private cell = 6) {}

  render(tiles: GridTile[], scale: Scale, unit: string) {
    // drop tiles for runs that left the shelf
    for (const [no, v] of this.views) if (!tiles.some((t) => t.runNo === no)) { v.el.remove(); this.views.delete(no); }
    tiles.forEach((t, i) => {
      let v = this.views.get(t.runNo);
      if (!v) {
        const el = document.createElement("button");
        el.type = "button";
        el.className = "mg-tile";
        el.style.setProperty("--i", String(i));
        const cv = document.createElement("canvas");
        const cap = document.createElement("span");
        cap.className = "mg-cap";
        el.append(cv, cap);
        el.addEventListener("click", () => this.onPick(t.runNo));
        this.host.append(el);
        const map = new MapView(cv, this.geo, false, this.cell);
        map.setOptions({ smooth: true });
        v = { el, map };
        this.views.set(t.runNo, v);
      }
      this.host.append(v.el); // keep shelf order (newest first)
      v.el.classList.toggle("on", t.active);
      v.el.setAttribute("aria-pressed", String(t.active));
      v.el.setAttribute("aria-label", `Branch ${t.runNo}, ${t.label}: biggest change ${signed(t.peak, 1)} ${unit}. Show on the main map.`);
      v.map.drawField(t.field, scale, { shockBox: t.box });
      v.el.querySelector(".mg-cap")!.innerHTML =
        `<span class="mg-no">#${t.runNo}</span><span class="mg-name">${escapeHtml(t.label)}</span><span class="mg-peak ${t.peak >= 0 ? "pos" : "neg"}">${signed(t.peak, 1)}<small> ${escapeHtml(unit)}</small></span>`;
    });
  }
}

/** The value with the largest magnitude (keeps its sign). */
export function signedPeak(f: Float32Array): number {
  let k = 0;
  for (let i = 1; i < f.length; i++) if (Math.abs(f[i]) > Math.abs(f[k])) k = i;
  return f.length ? f[k] : 0;
}
