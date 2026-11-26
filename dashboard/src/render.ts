import { NCELL, NLAT, NLON, LAT0, LON0 } from "./contract";
import type { ViewVar } from "./fields";
import type { Box } from "./region";

// ---------- colour scales (vivid on near-black, radar-style) ----------
type RGB = [number, number, number];
const hex = (h: string): RGB => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];

const SEQ: Record<string, RGB[]> = {
  heat: ["#3b0f70", "#1f63c6", "#1fb2a6", "#9be04a", "#f9d423", "#f8781f", "#c81e1e"].map(hex),
  moist: ["#1a1446", "#3b2f9e", "#2f7ed8", "#4fd1e8", "#d7fbff"].map(hex),
  calm: ["#0b1d51", "#1e4f9c", "#2a9ad6", "#5fd3e8", "#c8f4ff"].map(hex),
};
const DIV: Record<string, [RGB[], RGB, RGB[]]> = {
  // negative side (strong → weak), neutral, positive side (weak → strong)
  rain: [["#fdba74", "#c2410c"].map(hex), hex("#101826"), ["#0e7490", "#67e8f9"].map(hex)],
  heat: [["#93c5fd", "#1d4ed8"].map(hex), hex("#101826"), ["#b91c1c", "#fca5a5"].map(hex)],
  other: [["#c4b5fd", "#6d28d9"].map(hex), hex("#101826"), ["#b45309", "#fcd34d"].map(hex)],
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
  /** Opacity 0..1 over the terrain base; dry rain and near-zero differences fade out so the land shows through. */
  alpha: (v: number) => number;
  gradient: string; // CSS gradient for the legend
  classes?: { lo: number; color: RGB }[]; // set for classed (stepped) scales
}

/**
 * Classed daily-rainfall scale (mm/day), stepped like operational radar maps so values read directly off the colour.
 * Below 0.1 mm/day is transparent (dry). 10 mm/day, the contract's heavy-rain level, is where it turns yellow.
 */
const RAIN_CLASSES: [number, string][] = [
  [0, "#0b1018"], [0.1, "#1e3a8a"], [0.5, "#1d4ed8"], [1, "#0891b2"], [2, "#10b981"],
  [5, "#84cc16"], [10, "#facc15"], [20, "#f97316"], [50, "#e11d48"],
];
export function classedRainScale(): Scale {
  const classes = RAIN_CLASSES.map(([lo, c]) => ({ lo, color: hex(c) }));
  return {
    kind: "seq", lo: 0, hi: 50,
    color: (x) => { let c = classes[0].color; for (const k of classes) if (x >= k.lo) c = k.color; return c; },
    alpha: (x) => (x < 0.1 ? 0 : x < 1 ? 0.3 : x < 2 ? 0.55 : x < 5 ? 0.75 : 0.92), // light rain stays faint so terrain reads
    gradient: "",
    classes,
  };
}

export const css = (c: RGB) => `rgb(${c.map(Math.round).join(",")})`;

export function sequentialScale(v: ViewVar, lo: number, hi: number): Scale {
  const stops = v === "t2m" ? SEQ.heat : v === "tcwv" || v === "tp" ? SEQ.moist : SEQ.calm;
  return {
    kind: "seq", lo, hi,
    color: (x) => ramp(stops, (x - lo) / (hi - lo)),
    alpha: () => 0.8,
    gradient: `linear-gradient(90deg, ${stops.map(css).join(",")})`,
  };
}

/** Zero-centred diverging scale on [-m, m]. Zero is transparent; strength grows with |Δ|. */
export function divergingScale(v: ViewVar, m: number): Scale {
  const [neg, mid, pos] = v === "tp" || v === "tcwv" ? DIV.rain : v === "t2m" ? DIV.heat : DIV.other;
  const mm = m > 0 ? m : 1;
  const negRamp = [...neg, mid];
  const posRamp = [mid, ...pos];
  return {
    kind: "div", lo: -mm, hi: mm,
    color: (x) => (x < 0 ? ramp(negRamp, 1 + Math.max(-1, x / mm)) : ramp(posRamp, Math.min(1, x / mm))),
    alpha: (x) => (x === 0 ? 0 : Math.min(0.96, 0.22 + 0.9 * Math.pow(Math.min(1, Math.abs(x) / mm), 0.5))),
    gradient: `linear-gradient(90deg, ${[...negRamp, ...pos].map(css).join(",")})`,
  };
}

/** Bilinear sample of a [32 x 36] field at fractional grid coordinates (col, row of cell centres), edges clamped. */
export function sampleBilinear(f: Float32Array, col: number, row: number): number {
  const c = Math.min(NLON - 1, Math.max(0, col)), r = Math.min(NLAT - 1, Math.max(0, row));
  const c0 = Math.floor(c), r0 = Math.floor(r), c1 = Math.min(NLON - 1, c0 + 1), r1 = Math.min(NLAT - 1, r0 + 1);
  const tc = c - c0, tr = r - r0;
  const a = f[r0 * NLON + c0] * (1 - tc) + f[r0 * NLON + c1] * tc;
  const b = f[r1 * NLON + c0] * (1 - tc) + f[r1 * NLON + c1] * tc;
  return a * (1 - tr) + b * tr;
}

// ---------- map view ----------
export interface Overlays {
  shockBox?: Box | null;
  impactBox?: Box | null;
  /** Farm region has results (a current, non-zero Branch). Until then it is drawn quietly: it is context, not the story. */
  impactLive?: boolean;
  draftBox?: Box | null;
  draftKind?: "shock" | "impact";
  hoverCell?: number | null;
}

export interface City { name: string; lat: number; lon: number; labelLeft?: boolean; labelBelow?: boolean }

export interface GeoContext {
  land: Float32Array;
  orography: Float32Array; // metres, same grid
  cities: City[];
}

/** What the map shows: one field, or Prime and Branch split by a draggable divider. */
export type MapContent =
  | { kind: "empty"; text: string }
  | { kind: "single"; field: Float32Array; scale: Scale }
  | { kind: "swipe"; left: Float32Array; right: Float32Array; scale: Scale; split: number; leftLabel: string; rightLabel: string };

export interface MapOptions {
  smooth: boolean; // interpolate values for display (tooltips always show true cell values)
  terrain: boolean; // shaded-relief base from the kit orography
}

export interface MapGeometry { padL: number; padT: number; cell: number; width: number; height: number }

const PAD = { l: 34, r: 10, t: 10, b: 24 };
const MIN_CELL = 4;
const DIVIDER_GRAB_PX = 14;
const SUB = 5; // display samples per cell in smooth mode
const BASE_SUB = 6; // terrain samples per cell

/**
 * Dark "command centre" map of the 32 x 36 grid, north up. Layers, bottom to top: shaded terrain (cached),
 * data (radar-style, transparent where dry or unchanged), coastline glow, graticule, cities, boxes, hover.
 * Sizes itself to its container. Pointer: drag = draw a box; in swipe mode, dragging near the divider moves it.
 */
export class MapView {
  private ctx: CanvasRenderingContext2D;
  private cell = 12;
  private dpr = Math.max(1, window.devicePixelRatio || 1);
  private coast: number[][] = [];
  private content: MapContent = { kind: "empty", text: "" };
  private overlays: Overlays = {};
  private opts: MapOptions = { smooth: true, terrain: true };
  private base: HTMLCanvasElement | null = null;
  private data = document.createElement("canvas");
  onHover: ((cell: number | null, ev: PointerEvent) => void) | null = null;
  onBox: ((b: Box, final: boolean) => void) | null = null;
  onSplit: ((split: number) => void) | null = null;
  onResize: ((g: MapGeometry) => void) | null = null;
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

  setOptions(o: Partial<MapOptions>) {
    this.opts = { ...this.opts, ...o };
    this.render();
  }

  geometry(): MapGeometry {
    return { padL: PAD.l, padT: PAD.t, cell: this.cell, width: PAD.l + NLON * this.cell + PAD.r, height: PAD.t + NLAT * this.cell + PAD.b };
  }

  /** Largest whole-pixel cell that fits the parent box. */
  private fit() {
    const host = this.canvas.parentElement!;
    const w = host.clientWidth, h = host.clientHeight;
    if (!w || !h) return;
    const cell = Math.max(MIN_CELL, Math.floor(Math.min((w - PAD.l - PAD.r) / NLON, (h - PAD.t - PAD.b) / NLAT)));
    if (cell === this.cell && this.canvas.width) { this.render(); return; }
    this.setCell(cell);
    this.render();
  }

  private setCell(cell: number) {
    this.cell = cell;
    const g = this.geometry();
    this.canvas.width = Math.round(g.width * this.dpr);
    this.canvas.height = Math.round(g.height * this.dpr);
    this.canvas.style.width = `${g.width}px`;
    this.canvas.style.height = `${g.height}px`;
    this.onResize?.(g);
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

  /** Helper for small fixed maps. */
  drawField(field: Float32Array | null, scale: Scale | null, ov: Overlays = {}, emptyText = "") {
    this.draw(field && scale ? { kind: "single", field, scale } : { kind: "empty", text: emptyText }, ov);
  }

  private render() {
    const g = this.ctx, k = this.cell, ct = this.content, ov = this.overlays;
    const mx = PAD.l, my = PAD.t, mw = NLON * k, mh = NLAT * k;
    g.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    g.clearRect(0, 0, this.canvas.width, this.canvas.height);
    // 1. terrain base
    g.imageSmoothingEnabled = true; g.imageSmoothingQuality = "high";
    g.drawImage(this.baseLayer(), mx, my, mw, mh);
    // 2. data
    const paintData = (f: Float32Array, sc: Scale) => {
      this.renderData(f, sc);
      g.imageSmoothingEnabled = this.opts.smooth;
      g.drawImage(this.data, mx, my, mw, mh);
    };
    if (ct.kind === "single") paintData(ct.field, ct.scale);
    if (ct.kind === "swipe") {
      paintData(ct.left, ct.scale);
      g.save(); g.beginPath(); g.rect(this.splitX(ct.split), 0, this.canvas.width, this.canvas.height); g.clip();
      g.drawImage(this.baseLayer(), mx, my, mw, mh);
      paintData(ct.right, ct.scale);
      g.restore();
    }
    // 3. vectors and labels
    this.drawCoast();
    this.drawGraticule();
    this.drawCities();
    if (ov.impactBox) {
      if (ov.impactLive) this.drawBox(ov.impactBox, "#a3e635", [], 2, "rgba(163,230,53,0.07)");
      else this.drawBox(ov.impactBox, "rgba(163,230,53,0.55)", [], 1.25, "rgba(163,230,53,0.04)", 0);
    }
    if (ov.shockBox) this.drawBox(ov.shockBox, "#ffb020", [6, 4]);
    if (ov.draftBox) this.drawBox(ov.draftBox, ov.draftKind === "impact" ? "#a3e635" : "#ffb020", [2, 2], 2);
    if (ov.hoverCell != null) {
      const r = Math.floor(ov.hoverCell / NLON), c = ov.hoverCell % NLON;
      g.strokeStyle = "rgba(255,255,255,0.95)"; g.lineWidth = 1.5; g.setLineDash([]); g.shadowBlur = 0;
      g.strokeRect(this.x(c) + 0.75, this.y(r) + 0.75, k - 1.5, k - 1.5);
    }
    if (ct.kind === "swipe") this.drawDivider(ct);
    if (ct.kind === "empty" && ct.text) {
      // A pill near the top of the map (over the Himalaya/Tibet edge), clear of the shock and farm boxes and their tags.
      g.save();
      g.font = "500 14px Tomorrow, ui-sans-serif, -apple-system, sans-serif"; g.textAlign = "center"; g.textBaseline = "middle";
      const tw = g.measureText(ct.text).width, ph = 32, pw = tw + 32, px = mx + mw / 2 - pw / 2, py = my + Math.min(28, mh * 0.06);
      g.fillStyle = "rgba(8,12,18,0.82)"; g.strokeStyle = "rgba(255,255,255,0.14)"; g.lineWidth = 1;
      g.beginPath(); g.roundRect(px, py, pw, ph, ph / 2); g.fill(); g.stroke();
      g.fillStyle = "rgba(234,240,247,0.95)";
      g.fillText(ct.text, mx + mw / 2, py + ph / 2 + 1);
      g.restore();
    }
  }

  /** Data layer at SUB samples per cell (smooth) or one pixel per cell (grid), north row first. */
  private renderData(f: Float32Array, sc: Scale) {
    const sub = this.opts.smooth ? SUB : 1;
    const W = NLON * sub, H = NLAT * sub;
    if (this.data.width !== W || this.data.height !== H) { this.data.width = W; this.data.height = H; }
    const dg = this.data.getContext("2d")!;
    const img = dg.createImageData(W, H);
    const px = img.data;
    for (let py = 0; py < H; py++) {
      const row = NLAT - 1 - ((py + 0.5) / sub - 0.5); // fractional grid row of this sample (north at top)
      for (let pxi = 0; pxi < W; pxi++) {
        const col = (pxi + 0.5) / sub - 0.5;
        const v = sub === 1 ? f[(NLAT - 1 - py) * NLON + pxi] : sampleBilinear(f, col, row);
        const c = sc.color(v), a = sc.alpha(v), o = (py * W + pxi) * 4;
        px[o] = c[0]; px[o + 1] = c[1]; px[o + 2] = c[2]; px[o + 3] = Math.round(a * 255);
      }
    }
    dg.putImageData(img, 0, 0);
  }

  /** Shaded relief from orography (light from the north-west) blended with a deep sea by land fraction. Cached. */
  private baseLayer(): HTMLCanvasElement {
    if (this.base && (this.base.dataset.terrain === String(this.opts.terrain))) return this.base;
    const W = NLON * BASE_SUB, H = NLAT * BASE_SUB;
    const cv = document.createElement("canvas"); cv.width = W; cv.height = H; cv.dataset.terrain = String(this.opts.terrain);
    const g = cv.getContext("2d")!, img = g.createImageData(W, H), px = img.data;
    const oro = this.geo.orography, land = this.geo.land;
    const sea: RGB = [6, 10, 17], lowland: RGB = [22, 28, 36];
    const step = 1 / BASE_SUB;
    for (let py = 0; py < H; py++) {
      const row = NLAT - 1 - ((py + 0.5) * step - 0.5);
      for (let pxi = 0; pxi < W; pxi++) {
        const col = (pxi + 0.5) * step - 0.5;
        const lf = Math.min(1, Math.max(0, (sampleBilinear(land, col, row) - 0.35) / 0.3));
        let c: RGB = sea;
        if (lf > 0) {
          let shade = 1, lift = 0;
          if (this.opts.terrain) {
            const z = Math.max(0, sampleBilinear(oro, col, row));
            const dzx = sampleBilinear(oro, col + 0.5, row) - sampleBilinear(oro, col - 0.5, row);
            const dzy = sampleBilinear(oro, col, row + 0.5) - sampleBilinear(oro, col, row - 0.5);
            shade = Math.min(1.7, Math.max(0.45, 1 + (dzy - dzx) / 1400)); // brighter on north-west faces
            lift = Math.min(1, z / 5000) * 26;
          }
          const l: RGB = [lowland[0] * shade + lift, lowland[1] * shade + lift, lowland[2] * shade + lift * 1.1];
          c = lerp(sea, l, lf);
        }
        const o = (py * W + pxi) * 4;
        px[o] = c[0]; px[o + 1] = c[1]; px[o + 2] = c[2]; px[o + 3] = 255;
      }
    }
    g.putImageData(img, 0, 0);
    this.base = cv;
    return cv;
  }

  private drawDivider(ct: Extract<MapContent, { kind: "swipe" }>) {
    const g = this.ctx, k = this.cell, x = this.splitX(ct.split);
    const top = PAD.t, bottom = PAD.t + NLAT * k, mid = (top + bottom) / 2;
    g.strokeStyle = "rgba(255,255,255,0.95)"; g.lineWidth = 2; g.setLineDash([]);
    g.beginPath(); g.moveTo(x, top); g.lineTo(x, bottom); g.stroke();
    g.fillStyle = "#05070a"; g.beginPath(); g.arc(x, mid, 13, 0, Math.PI * 2); g.fill(); g.stroke();
    g.fillStyle = "#ffffff"; g.font = "600 12px ui-sans-serif, -apple-system, sans-serif"; g.textAlign = "center";
    g.fillText("⇆", x, mid + 4);
    const tag = (text: string, tx: number, align: CanvasTextAlign) => {
      g.font = "600 12px ui-sans-serif, -apple-system, sans-serif"; g.textAlign = align;
      const w = g.measureText(text).width + 14, bx = align === "right" ? tx - w : tx;
      g.fillStyle = "rgba(5,7,10,0.85)"; g.beginPath(); g.roundRect(bx, top + 8, w, 22, 6); g.fill();
      g.fillStyle = "#e8edf2"; g.fillText(text, align === "right" ? tx - 7 : tx + 7, top + 23);
    };
    if (ct.split > 0.08) tag(ct.leftLabel, x - 8, "right");
    if (ct.split < 0.92) tag(ct.rightLabel, x + 8, "left");
  }

  /** Smooth coastline: the 0.5 contour of the land fraction at cell centres, with a soft cyan glow. */
  private drawCoast() {
    const g = this.ctx;
    g.setLineDash([]); g.lineCap = "round";
    g.beginPath();
    for (const [c0, r0, c1, r1] of this.coast) {
      g.moveTo(this.x(c0 + 0.5), this.y(r0 - 0.5));
      g.lineTo(this.x(c1 + 0.5), this.y(r1 - 0.5));
    }
    g.save();
    g.shadowColor = "rgba(120,200,255,0.55)"; g.shadowBlur = 6;
    g.strokeStyle = "rgba(170,215,255,0.75)"; g.lineWidth = 1.2; g.stroke();
    g.restore();
  }

  private drawGraticule() {
    const g = this.ctx, k = this.cell;
    g.font = "10.5px ui-monospace, SFMono-Regular, Menlo, monospace"; g.fillStyle = "rgba(160,175,195,0.6)";
    g.strokeStyle = "rgba(140,170,210,0.08)"; g.lineWidth = 1;
    for (let lat = 10; lat <= 35; lat += 5) {
      const yy = PAD.t + (NLAT - (lat - (LAT0 - 0.5))) * k;
      g.beginPath(); g.moveTo(PAD.l, yy); g.lineTo(PAD.l + NLON * k, yy); g.stroke();
      g.textAlign = "right"; g.fillText(`${lat}°N`, PAD.l - 5, yy + 4);
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
      g.save(); g.shadowColor = "rgba(255,214,140,0.9)"; g.shadowBlur = 8;
      g.fillStyle = "#ffe2a8"; g.beginPath(); g.arc(xx, yy, 2.2, 0, Math.PI * 2); g.fill(); g.restore();
      if (k >= 11) {
        g.textAlign = city.labelLeft ? "right" : "left";
        const tx = xx + (city.labelLeft ? -6 : 6), ty = yy + (city.labelBelow ? 13 : -5);
        g.lineWidth = 3; g.strokeStyle = "rgba(3,5,8,0.85)"; g.strokeText(city.name, tx, ty);
        g.fillStyle = "rgba(236,241,247,0.95)"; g.fillText(city.name, tx, ty);
      }
    }
  }

  private drawBox(b: Box, color: string, dash: number[], width = 2, fill?: string, glow = 8) {
    const g = this.ctx, k = this.cell;
    const r0 = Math.min(b.r0, b.r1), r1 = Math.max(b.r0, b.r1), c0 = Math.min(b.c0, b.c1), c1 = Math.max(b.c0, b.c1);
    const rx = this.x(c0), ry = this.y(r1), rw = (c1 - c0 + 1) * k, rh = (r1 - r0 + 1) * k;
    g.save();
    if (fill) { g.fillStyle = fill; g.fillRect(rx, ry, rw, rh); }
    g.shadowColor = color; g.shadowBlur = glow;
    g.strokeStyle = color; g.lineWidth = width; g.setLineDash(dash);
    g.strokeRect(rx, ry, rw, rh);
    g.restore();
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

export const gridFrom = (lsm: number[][]): Float32Array => {
  const out = new Float32Array(NCELL);
  for (let r = 0; r < NLAT; r++) for (let c = 0; c < NLON; c++) out[r * NLON + c] = lsm[r][c];
  return out;
};
