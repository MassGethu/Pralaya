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
  classes?: { lo: number; color: RGB }[]; // set for classed (stepped) scales
}

/**
 * Classed daily-rainfall scale (mm/day), stepped like operational rain maps so values read directly off the colour.
 * 10 mm/day is the contract's heavy-rain level and is where the palette turns from blue-green to yellow.
 */
const RAIN_CLASSES: [number, string][] = [
  [0, "#151c24"], [0.1, "#1d3443"], [0.5, "#1f5068"], [1, "#1f6f86"], [2, "#2a9aa8"],
  [5, "#5fc4a8"], [10, "#b5dd7a"], [20, "#f2c14e"], [50, "#ef6a50"],
];
export function classedRainScale(): Scale {
  const classes = RAIN_CLASSES.map(([lo, c]) => ({ lo, color: hex(c) }));
  return {
    kind: "seq", lo: 0, hi: 50,
    color: (x) => { let c = classes[0].color; for (const k of classes) if (x >= k.lo) c = k.color; return c; },
    gradient: "",
    classes,
  };
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

export interface City { name: string; lat: number; lon: number; labelLeft?: boolean; labelBelow?: boolean }

export interface GeoContext {
  land: Float32Array;
  cities: City[];
}

/** What the map shows: one field, or Prime and Branch split by a draggable divider (Worldview-style swipe). */
export type MapContent =
  | { kind: "empty"; text: string }
  | { kind: "single"; field: Float32Array; scale: Scale }
  | { kind: "swipe"; left: Float32Array; right: Float32Array; scale: Scale; split: number; leftLabel: string; rightLabel: string };

const PAD = { l: 34, r: 10, t: 10, b: 24 };
const MIN_CELL = 4;
const DIVIDER_GRAB_PX = 14;

/**
 * Canvas map of the 32 x 36 grid, north up. Sizes itself to its container (fit, aspect kept), so it can fill the
 * screen. Pointer: drag = draw a box (shock or impact region); in swipe mode, dragging near the divider moves it.
 */
export class MapView {
  private ctx: CanvasRenderingContext2D;
  private cell = 12;
  private dpr = Math.max(1, window.devicePixelRatio || 1);
  private coast: number[][] = [];
  private content: MapContent = { kind: "empty", text: "" };
  private overlays: Overlays = {};
  onHover: ((cell: number | null, ev: PointerEvent) => void) | null = null;
  onBox: ((b: Box, final: boolean) => void) | null = null;
  onSplit: ((split: number) => void) | null = null;
  private dragStart: { r: number; c: number } | null = null;
  private draggingSplit = false;

  constructor(private canvas: HTMLCanvasElement, private geo: GeoContext, interactive: boolean, fixedCell?: number) {
    this.ctx = canvas.getContext("2d")!;
    this.coast = coastline(geo.land);
    if (fixedCell) this.setCell(fixedCell);
    else {
      const ro = new ResizeObserver(() => this.fit());
      ro.observe(canvas.parentElement!);
      this.fit();
    }
    if (interactive) this.bindPointer();
  }

  /** Largest whole-pixel cell that fits the parent box. */
  private fit() {
    const host = this.canvas.parentElement!;
    const w = host.clientWidth, h = host.clientHeight;
    if (!w || !h) return;
    const cell = Math.max(MIN_CELL, Math.floor(Math.min((w - PAD.l - PAD.r) / NLON, (h - PAD.t - PAD.b) / NLAT)));
    this.setCell(cell);
    this.render();
  }

  private setCell(cell: number) {
    this.cell = cell;
    const w = PAD.l + NLON * cell + PAD.r, h = PAD.t + NLAT * cell + PAD.b;
    this.canvas.width = Math.round(w * this.dpr);
    this.canvas.height = Math.round(h * this.dpr);
    this.canvas.style.width = `${w}px`;
    this.canvas.style.height = `${h}px`;
  }

  /** Screen → grid. North is up, so screen row 0 is grid row NLAT-1. */
  cellAt(ev: PointerEvent | MouseEvent): { r: number; c: number } | null {
    const { sx, sy } = this.local(ev);
    const c = Math.floor((sx - PAD.l) / this.cell), sr = Math.floor((sy - PAD.t) / this.cell);
    if (c < 0 || c >= NLON || sr < 0 || sr >= NLAT) return null;
    return { r: NLAT - 1 - sr, c };
  }

  private local(ev: PointerEvent | MouseEvent) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      sx: ((ev.clientX - rect.left) / rect.width) * (this.canvas.width / this.dpr),
      sy: ((ev.clientY - rect.top) / rect.height) * (this.canvas.height / this.dpr),
    };
  }

  private splitX(split: number) { return PAD.l + split * NLON * this.cell; }

  private nearDivider(ev: PointerEvent): boolean {
    if (this.content.kind !== "swipe") return false;
    return Math.abs(this.local(ev).sx - this.splitX(this.content.split)) <= DIVIDER_GRAB_PX;
  }

  private bindPointer() {
    const cv = this.canvas;
    cv.addEventListener("pointermove", (ev) => {
      if (this.draggingSplit) {
        const split = Math.min(1, Math.max(0, (this.local(ev).sx - PAD.l) / (NLON * this.cell)));
        this.onSplit?.(split);
        return;
      }
      cv.style.cursor = this.nearDivider(ev) ? "ew-resize" : "crosshair";
      const p = this.cellAt(ev);
      this.onHover?.(p ? p.r * NLON + p.c : null, ev);
      if (this.dragStart && p) this.onBox?.({ r0: this.dragStart.r, r1: p.r, c0: this.dragStart.c, c1: p.c }, false);
    });
    cv.addEventListener("pointerleave", (ev) => this.onHover?.(null, ev));
    cv.addEventListener("pointerdown", (ev) => {
      cv.setPointerCapture(ev.pointerId);
      if (this.nearDivider(ev)) { this.draggingSplit = true; return; }
      const p = this.cellAt(ev);
      if (!p) return;
      this.dragStart = p;
      this.onBox?.({ r0: p.r, r1: p.r, c0: p.c, c1: p.c }, false);
    });
    cv.addEventListener("pointerup", (ev) => {
      if (this.draggingSplit) { this.draggingSplit = false; return; }
      if (!this.dragStart) return;
      const p = this.cellAt(ev) ?? this.dragStart;
      this.onBox?.({ r0: this.dragStart.r, r1: p.r, c0: this.dragStart.c, c1: p.c }, true);
      this.dragStart = null;
    });
  }

  private x = (c: number) => PAD.l + c * this.cell;
  private y = (r: number) => PAD.t + (NLAT - 1 - r) * this.cell;

  draw(content: MapContent, ov: Overlays = {}) {
    this.content = content;
    this.overlays = ov;
    this.render();
  }

  /** Back-compat helper for small fixed maps. */
  drawField(field: Float32Array | null, scale: Scale | null, ov: Overlays = {}, emptyText = "") {
    this.draw(field && scale ? { kind: "single", field, scale } : { kind: "empty", text: emptyText }, ov);
  }

  private render() {
    const g = this.ctx, k = this.cell, ct = this.content, ov = this.overlays;
    g.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    g.clearRect(0, 0, this.canvas.width, this.canvas.height);
    if (ct.kind === "swipe") {
      this.paint(ct.left, ct.scale);
      g.save();
      g.beginPath(); g.rect(this.splitX(ct.split), 0, this.canvas.width, this.canvas.height); g.clip();
      this.paint(ct.right, ct.scale);
      g.restore();
    } else {
      this.paint(ct.kind === "single" ? ct.field : null, ct.kind === "single" ? ct.scale : null);
    }
    this.drawCoast();
    this.drawGraticule();
    this.drawCities();
    if (ov.impactBox) this.drawBox(ov.impactBox, "#9bd36a", []);
    if (ov.shockBox) this.drawBox(ov.shockBox, "#f2a93b", [5, 4]);
    if (ov.draftBox) this.drawBox(ov.draftBox, ov.draftKind === "impact" ? "#9bd36a" : "#f2a93b", [2, 2], 2);
    if (ov.hoverCell != null) {
      const r = Math.floor(ov.hoverCell / NLON), c = ov.hoverCell % NLON;
      g.strokeStyle = "rgba(255,255,255,0.95)"; g.lineWidth = 1.5; g.setLineDash([]);
      g.strokeRect(this.x(c) + 0.75, this.y(r) + 0.75, k - 1.5, k - 1.5);
    }
    if (ct.kind === "swipe") this.drawDivider(ct);
    if (ct.kind === "empty" && ct.text) {
      g.fillStyle = "rgba(225,232,240,0.8)"; g.font = "500 14px ui-sans-serif, -apple-system, sans-serif"; g.textAlign = "center";
      g.fillText(ct.text, PAD.l + (NLON * k) / 2, PAD.t + (NLAT * k) / 2);
    }
  }

  private paint(field: Float32Array | null, scale: Scale | null) {
    const g = this.ctx, k = this.cell;
    for (let r = 0; r < NLAT; r++) {
      for (let c = 0; c < NLON; c++) {
        const i = r * NLON + c;
        g.fillStyle = field && scale ? css(scale.color(field[i])) : this.geo.land[i] >= 0.5 ? "#1c2530" : "#111820";
        g.fillRect(this.x(c), this.y(r), k + 0.5, k + 0.5);
      }
    }
  }

  private drawDivider(ct: Extract<MapContent, { kind: "swipe" }>) {
    const g = this.ctx, k = this.cell, x = this.splitX(ct.split);
    const top = PAD.t, bottom = PAD.t + NLAT * k, mid = (top + bottom) / 2;
    g.strokeStyle = "rgba(255,255,255,0.95)"; g.lineWidth = 2; g.setLineDash([]);
    g.beginPath(); g.moveTo(x, top); g.lineTo(x, bottom); g.stroke();
    g.fillStyle = "#0d1218"; g.beginPath(); g.arc(x, mid, 13, 0, Math.PI * 2); g.fill(); g.stroke();
    g.fillStyle = "#ffffff"; g.font = "600 12px ui-sans-serif, -apple-system, sans-serif"; g.textAlign = "center";
    g.fillText("⇆", x, mid + 4);
    const tag = (text: string, tx: number, align: CanvasTextAlign) => {
      g.font = "600 12px ui-sans-serif, -apple-system, sans-serif"; g.textAlign = align;
      const w = g.measureText(text).width + 14, bx = align === "right" ? tx - w : tx;
      g.fillStyle = "rgba(13,18,24,0.85)"; g.beginPath(); g.roundRect(bx, top + 8, w, 22, 6); g.fill();
      g.fillStyle = "#e8edf2"; g.fillText(text, align === "right" ? tx - 7 : tx + 7, top + 23);
    };
    if (ct.split > 0.08) tag(ct.leftLabel, x - 8, "right");
    if (ct.split < 0.92) tag(ct.rightLabel, x + 8, "left");
  }

  /** Smooth coastline: the 0.5 contour of the land fraction at cell centres (marching squares). */
  private drawCoast() {
    const g = this.ctx;
    g.setLineDash([]); g.lineCap = "round";
    g.beginPath();
    for (const [c0, r0, c1, r1] of this.coast) {
      g.moveTo(this.x(c0 + 0.5), this.y(r0 - 0.5));
      g.lineTo(this.x(c1 + 0.5), this.y(r1 - 0.5));
    }
    // Dark halo under a light line so the coast reads over both dark sea and bright rain colours.
    g.strokeStyle = "rgba(8,12,16,0.75)"; g.lineWidth = 3.2; g.stroke();
    g.strokeStyle = "rgba(245,248,250,0.95)"; g.lineWidth = 1.3; g.stroke();
  }

  private drawGraticule() {
    const g = this.ctx, k = this.cell;
    g.font = "11px ui-monospace, SFMono-Regular, Menlo, monospace"; g.fillStyle = "rgba(200,210,220,0.7)";
    g.strokeStyle = "rgba(255,255,255,0.06)"; g.lineWidth = 1;
    for (let lat = 10; lat <= 35; lat += 5) {
      const yy = PAD.t + (NLAT - (lat - (LAT0 - 0.5))) * k;
      g.beginPath(); g.moveTo(PAD.l, yy); g.lineTo(PAD.l + NLON * k, yy); g.stroke();
      g.textAlign = "right"; g.fillText(`${lat}°`, PAD.l - 5, yy + 4);
    }
    for (let lon = 70; lon <= 100; lon += 5) {
      const xx = PAD.l + (lon - (LON0 - 0.5)) * k;
      g.beginPath(); g.moveTo(xx, PAD.t); g.lineTo(xx, PAD.t + NLAT * k); g.stroke();
      g.textAlign = "center"; g.fillText(`${lon}°E`, xx, PAD.t + NLAT * k + 15);
    }
  }

  private drawCities() {
    const g = this.ctx, k = this.cell;
    g.font = `500 ${k >= 16 ? 12 : 11}px ui-sans-serif, -apple-system, sans-serif`;
    for (const city of this.geo.cities) {
      const xx = PAD.l + (city.lon - (LON0 - 0.5)) * k;
      const yy = PAD.t + (NLAT - (city.lat - (LAT0 - 0.5))) * k;
      g.fillStyle = "#0b0f14"; g.beginPath(); g.arc(xx, yy, 3.2, 0, Math.PI * 2); g.fill();
      g.fillStyle = "#eef2f6"; g.beginPath(); g.arc(xx, yy, 2, 0, Math.PI * 2); g.fill();
      if (k >= 11) {
        g.textAlign = city.labelLeft ? "right" : "left";
        const tx = xx + (city.labelLeft ? -6 : 6), ty = yy + (city.labelBelow ? 13 : -5);
        g.lineWidth = 3; g.strokeStyle = "rgba(11,15,20,0.75)"; g.strokeText(city.name, tx, ty);
        g.fillStyle = "rgba(240,244,248,0.95)"; g.fillText(city.name, tx, ty);
      }
    }
  }

  private drawBox(b: Box, color: string, dash: number[], width = 2) {
    const g = this.ctx, k = this.cell;
    const r0 = Math.min(b.r0, b.r1), r1 = Math.max(b.r0, b.r1), c0 = Math.min(b.c0, b.c1), c1 = Math.max(b.c0, b.c1);
    g.strokeStyle = color; g.lineWidth = width; g.setLineDash(dash);
    g.strokeRect(this.x(c0), this.y(r1), (c1 - c0 + 1) * k, (r1 - r0 + 1) * k);
    g.setLineDash([]);
  }
}

/**
 * Marching-squares segments of the 0.5 land-fraction contour, in grid units (col, row) of cell centres.
 * Each segment is [c0, r0, c1, r1]. Purely a display aid derived from the kit's own land_sea_mask.
 */
export function coastline(land: Float32Array, level = 0.5): number[][] {
  const v = (r: number, c: number) => land[r * NLON + c];
  const segs: number[][] = [];
  const t = (a: number, b: number) => (level - a) / (b - a);
  for (let r = 0; r < NLAT - 1; r++) {
    for (let c = 0; c < NLON - 1; c++) {
      const a = v(r, c), b = v(r, c + 1), d = v(r + 1, c), e = v(r + 1, c + 1); // a=SW b=SE d=NW e=NE
      const pts: number[][] = [];
      if ((a >= level) !== (b >= level)) pts.push([c + t(a, b), r]);
      if ((b >= level) !== (e >= level)) pts.push([c + 1, r + t(b, e)]);
      if ((e >= level) !== (d >= level)) pts.push([c + 1 - t(e, d), r + 1]);
      if ((d >= level) !== (a >= level)) pts.push([c, r + 1 - t(d, a)]);
      if (pts.length === 2) segs.push([pts[0][0], pts[0][1], pts[1][0], pts[1][1]]);
      else if (pts.length === 4) { segs.push([...pts[0], ...pts[1]]); segs.push([...pts[2], ...pts[3]]); }
    }
  }
  return segs;
}

// Bengaluru and Chennai sit ~1 cell apart: their labels go to opposite sides so they never collide.
export const CITIES: City[] = [
  { name: "Delhi", lat: 28.61, lon: 77.21 },
  { name: "Mumbai", lat: 19.08, lon: 72.88 },
  { name: "Kolkata", lat: 22.57, lon: 88.36 },
  { name: "Chennai", lat: 13.08, lon: 80.27, labelBelow: true },
  { name: "Bengaluru", lat: 12.97, lon: 77.59, labelLeft: true, labelBelow: true },
];

export const landFrom = (lsm: number[][]): Float32Array => {
  const out = new Float32Array(NCELL);
  for (let r = 0; r < NLAT; r++) for (let c = 0; c < NLON; c++) out[r * NLON + c] = lsm[r][c];
  return out;
};
