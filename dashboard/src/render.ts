import { NCELL, NLAT, NLON, LAT0, LON0 } from "./contract";
import type { ViewVar } from "./fields";
import type { Box } from "./region";

// ---------- colour scales ----------
type RGB = [number, number, number];
const hex = (h: string): RGB => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];

const SEQ: Record<string, RGB[]> = {
  rain: ["#151c24", "#173d52", "#1b6f86", "#2fa5b0", "#7fd6c4", "#e3f7e9"].map(hex),
  heat: ["#1d1838", "#4a1f6b", "#8c2a74", "#cf4a5a", "#f08a3c", "#f9d77a"].map(hex),
  calm: ["#141b27", "#22385a", "#2e5f86", "#4b8faa", "#86c1c4", "#d9ece4"].map(hex),
};
const DIV: Record<string, [RGB[], RGB, RGB[]]> = {
  // negative side (strong → weak), neutral, positive side (weak → strong)
  rain: [["#b8742f", "#7a5232"].map(hex), hex("#1a2029"), ["#2a6f6a", "#46c7b3"].map(hex)],
  heat: [["#4f8fe0", "#2f4a73"].map(hex), hex("#1a2029"), ["#7a3a36", "#ef6a50"].map(hex)],
  other: [["#9d7be0", "#4d3f73"].map(hex), hex("#1a2029"), ["#6b5a2a", "#e3b44a"].map(hex)],
};

const lerp = (a: RGB, b: RGB, t: number): RGB => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
function ramp(stops: RGB[], t: number): RGB {
  const x = Math.min(1, Math.max(0, t)) * (stops.length - 1);
  const i = Math.min(stops.length - 2, Math.floor(x));
  return lerp(stops[i], stops[i + 1], x - i);
}

export interface Scale {
  kind: "seq" | "div";
  lo: number;
  hi: number;
  color: (v: number) => RGB;
  gradient: string; // CSS gradient for the legend
}

const css = (c: RGB) => `rgb(${c.map(Math.round).join(",")})`;

export function sequentialScale(v: ViewVar, lo: number, hi: number): Scale {
  const stops = v === "tp" || v === "tcwv" ? SEQ.rain : v === "t2m" ? SEQ.heat : SEQ.calm;
  return {
    kind: "seq", lo, hi,
    color: (x) => ramp(stops, (x - lo) / (hi - lo)),
    gradient: `linear-gradient(90deg, ${stops.map(css).join(",")})`,
  };
}

/** Zero-centred diverging scale on [-m, m]. Zero always maps to the neutral colour. */
export function divergingScale(v: ViewVar, m: number): Scale {
  const [neg, mid, pos] = v === "tp" || v === "tcwv" ? DIV.rain : v === "t2m" ? DIV.heat : DIV.other;
  const mm = m > 0 ? m : 1;
  const negRamp = [...neg, mid];
  const posRamp = [mid, ...pos];
  return {
    kind: "div", lo: -mm, hi: mm,
    color: (x) => (x < 0 ? ramp(negRamp, 1 + Math.max(-1, x / mm)) : ramp(posRamp, Math.min(1, x / mm))),
    gradient: `linear-gradient(90deg, ${[...negRamp, ...pos].map(css).join(",")})`,
  };
}

// ---------- map view ----------
export interface Overlays {
  shockBox?: Box | null;
  impactBox?: Box | null;
  draftBox?: Box | null;
  draftKind?: "shock" | "impact";
  hoverCell?: number | null;
}

export interface GeoContext {
  land: Float32Array;
  cities: { name: string; lat: number; lon: number }[];
}

const PAD = { l: 30, r: 6, t: 6, b: 20 };

export class MapView {
  private ctx: CanvasRenderingContext2D;
  private cell: number;
  private dpr = Math.max(1, window.devicePixelRatio || 1);
  onHover: ((cell: number | null, ev: PointerEvent) => void) | null = null;
  onBox: ((b: Box, final: boolean) => void) | null = null;
  private dragStart: { r: number; c: number } | null = null;

  constructor(private canvas: HTMLCanvasElement, cellPx: number, private geo: GeoContext, interactive: boolean) {
    this.cell = cellPx;
    const w = PAD.l + NLON * cellPx + PAD.r, h = PAD.t + NLAT * cellPx + PAD.b;
    canvas.width = w * this.dpr;
    canvas.height = h * this.dpr;
    canvas.style.aspectRatio = `${w} / ${h}`;
    this.ctx = canvas.getContext("2d")!;
    if (interactive) this.bindPointer();
  }

  /** Screen → grid. North is up, so screen row 0 is grid row NLAT-1. */
  cellAt(ev: PointerEvent | MouseEvent): { r: number; c: number } | null {
    const rect = this.canvas.getBoundingClientRect();
    const sx = ((ev.clientX - rect.left) / rect.width) * (this.canvas.width / this.dpr) - PAD.l;
    const sy = ((ev.clientY - rect.top) / rect.height) * (this.canvas.height / this.dpr) - PAD.t;
    const c = Math.floor(sx / this.cell), sr = Math.floor(sy / this.cell);
    if (c < 0 || c >= NLON || sr < 0 || sr >= NLAT) return null;
    return { r: NLAT - 1 - sr, c };
  }

  private bindPointer() {
    const cv = this.canvas;
    cv.addEventListener("pointermove", (ev) => {
      const p = this.cellAt(ev);
      this.onHover?.(p ? p.r * NLON + p.c : null, ev);
      if (this.dragStart && p) this.onBox?.({ r0: this.dragStart.r, r1: p.r, c0: this.dragStart.c, c1: p.c }, false);
    });
    cv.addEventListener("pointerleave", (ev) => this.onHover?.(null, ev));
    cv.addEventListener("pointerdown", (ev) => {
      const p = this.cellAt(ev);
      if (!p) return;
      cv.setPointerCapture(ev.pointerId);
      this.dragStart = p;
      this.onBox?.({ r0: p.r, r1: p.r, c0: p.c, c1: p.c }, false);
    });
    cv.addEventListener("pointerup", (ev) => {
      if (!this.dragStart) return;
      const p = this.cellAt(ev) ?? this.dragStart;
      this.onBox?.({ r0: this.dragStart.r, r1: p.r, c0: this.dragStart.c, c1: p.c }, true);
      this.dragStart = null;
    });
  }

  private x = (c: number) => PAD.l + c * this.cell;
  private y = (r: number) => PAD.t + (NLAT - 1 - r) * this.cell;

  draw(field: Float32Array | null, scale: Scale | null, ov: Overlays = {}, emptyText = "") {
    const g = this.ctx, k = this.cell;
    g.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    g.clearRect(0, 0, this.canvas.width, this.canvas.height);
    // cells
    for (let r = 0; r < NLAT; r++) {
      for (let c = 0; c < NLON; c++) {
        const i = r * NLON + c;
        if (field && scale) {
          g.fillStyle = css(scale.color(field[i]));
        } else {
          g.fillStyle = this.geo.land[i] >= 0.5 ? "#1b222c" : "#12171f";
        }
        g.fillRect(this.x(c), this.y(r), k + 0.5, k + 0.5);
      }
    }
    this.drawCoast();
    this.drawGraticule();
    this.drawCities();
    if (ov.impactBox) this.drawBox(ov.impactBox, "#9bd36a", []);
    if (ov.shockBox) this.drawBox(ov.shockBox, "#f2a93b", [4, 3]);
    if (ov.draftBox) this.drawBox(ov.draftBox, ov.draftKind === "impact" ? "#9bd36a" : "#f2a93b", [2, 2], 2);
    if (ov.hoverCell != null) {
      const r = Math.floor(ov.hoverCell / NLON), c = ov.hoverCell % NLON;
      g.strokeStyle = "rgba(255,255,255,0.9)"; g.lineWidth = 1.5; g.setLineDash([]);
      g.strokeRect(this.x(c) + 0.75, this.y(r) + 0.75, k - 1.5, k - 1.5);
    }
    if (!field && emptyText) {
      g.fillStyle = "rgba(220,228,236,0.55)"; g.font = "500 12px ui-sans-serif, -apple-system, sans-serif"; g.textAlign = "center";
      g.fillText(emptyText, PAD.l + (NLON * k) / 2, PAD.t + (NLAT * k) / 2);
    }
  }

  /** Coastline approximated by the edges between land (lsm ≥ 0.5) and sea cells. */
  private drawCoast() {
    const g = this.ctx, k = this.cell, land = this.geo.land;
    const isLand = (r: number, c: number) => r >= 0 && r < NLAT && c >= 0 && c < NLON && land[r * NLON + c] >= 0.5;
    g.strokeStyle = "rgba(235,240,245,0.55)"; g.lineWidth = 1; g.setLineDash([]);
    g.beginPath();
    for (let r = 0; r < NLAT; r++) for (let c = 0; c < NLON; c++) {
      const a = isLand(r, c);
      if (c + 1 < NLON && a !== isLand(r, c + 1)) { g.moveTo(this.x(c + 1), this.y(r)); g.lineTo(this.x(c + 1), this.y(r) + k); }
      if (r + 1 < NLAT && a !== isLand(r + 1, c)) { g.moveTo(this.x(c), this.y(r)); g.lineTo(this.x(c) + k, this.y(r)); }
    }
    g.stroke();
  }

  private drawGraticule() {
    const g = this.ctx, k = this.cell;
    g.font = "10px ui-monospace, SFMono-Regular, Menlo, monospace"; g.fillStyle = "rgba(200,210,220,0.6)";
    g.strokeStyle = "rgba(255,255,255,0.07)"; g.lineWidth = 1;
    // cell edges are at integer degrees: lat edge e sits at bottom of row (e - 6)
    for (let lat = 10; lat <= 35; lat += 5) {
      const yy = PAD.t + (NLAT - (lat - (LAT0 - 0.5))) * k;
      g.beginPath(); g.moveTo(PAD.l, yy); g.lineTo(PAD.l + NLON * k, yy); g.stroke();
      g.textAlign = "right"; g.fillText(`${lat}°`, PAD.l - 4, yy + 3);
    }
    for (let lon = 70; lon <= 100; lon += 5) {
      const xx = PAD.l + (lon - (LON0 - 0.5)) * k;
      g.beginPath(); g.moveTo(xx, PAD.t); g.lineTo(xx, PAD.t + NLAT * k); g.stroke();
      g.textAlign = "center"; g.fillText(`${lon}°E`, xx, PAD.t + NLAT * k + 13);
    }
  }

  private drawCities() {
    const g = this.ctx, k = this.cell;
    g.font = "10px ui-sans-serif, -apple-system, sans-serif"; g.textAlign = "left";
    for (const city of this.geo.cities) {
      const xx = PAD.l + (city.lon - (LON0 - 0.5)) * k;
      const yy = PAD.t + (NLAT - (city.lat - (LAT0 - 0.5))) * k;
      g.fillStyle = "#0b0f14"; g.beginPath(); g.arc(xx, yy, 3, 0, Math.PI * 2); g.fill();
      g.fillStyle = "#eef2f6"; g.beginPath(); g.arc(xx, yy, 1.8, 0, Math.PI * 2); g.fill();
      if (k >= 11) { g.fillStyle = "rgba(238,242,246,0.85)"; g.fillText(city.name, xx + 4, yy - 3); }
    }
  }

  private drawBox(b: Box, color: string, dash: number[], width = 1.75) {
    const g = this.ctx, k = this.cell;
    const r0 = Math.min(b.r0, b.r1), r1 = Math.max(b.r0, b.r1), c0 = Math.min(b.c0, b.c1), c1 = Math.max(b.c0, b.c1);
    g.strokeStyle = color; g.lineWidth = width; g.setLineDash(dash);
    g.strokeRect(this.x(c0), this.y(r1), (c1 - c0 + 1) * k, (r1 - r0 + 1) * k);
    g.setLineDash([]);
  }
}

export const CITIES = [
  { name: "Delhi", lat: 28.61, lon: 77.21 },
  { name: "Mumbai", lat: 19.08, lon: 72.88 },
  { name: "Kolkata", lat: 22.57, lon: 88.36 },
  { name: "Chennai", lat: 13.08, lon: 80.27 },
  { name: "Bengaluru", lat: 12.97, lon: 77.59 },
];

export const landFrom = (lsm: number[][]): Float32Array => {
  const out = new Float32Array(NCELL);
  for (let r = 0; r < NLAT; r++) for (let c = 0; c < NLON; c++) out[r * NLON + c] = lsm[r][c];
  return out;
};
