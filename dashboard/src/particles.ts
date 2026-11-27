/**
 * Animated wind particles (earth.nullschool-style) driven by the displayed forecast's own u10 / v10 fields.
 * Display only: particles are advected through the bilinearly interpolated wind of the selected day.
 * Off when the user prefers reduced motion; paused when the tab is hidden.
 */
import { NLAT, NLON } from "./contract";
import { type MapGeometry, sampleBilinear } from "./render";

const CELLS_PER_FRAME_PER_MS = 0.0075; // 10 m/s ≈ 0.075 cells per frame: readable, not frantic
const MAX_AGE = 90; // frames
const FADE = 0.92; // trail persistence per frame
const DENSITY = 0.9; // particles per grid cell

interface P { c: number; r: number; age: number }

export interface WindSource { u: Float32Array; v: Float32Array }

export class WindFlow {
  private g: CanvasRenderingContext2D;
  private dpr = Math.max(1, window.devicePixelRatio || 1);
  private geo: MapGeometry | null = null;
  private left: WindSource | null = null;
  private right: WindSource | null = null;
  private split = 1; // fraction of width using `left`; the rest uses `right` (swipe view)
  private ps: P[] = [];
  private raf = 0;
  private enabled = false;

  constructor(private canvas: HTMLCanvasElement) {
    this.g = canvas.getContext("2d")!;
    document.addEventListener("visibilitychange", () => (document.hidden ? this.stop() : this.start()));
  }

  static reducedMotion(): boolean {
    return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
  }

  resize(geo: MapGeometry) {
    this.geo = geo;
    this.canvas.width = Math.round(geo.width * this.dpr);
    this.canvas.height = Math.round(geo.height * this.dpr);
    this.canvas.style.width = `${geo.width}px`;
    this.canvas.style.height = `${geo.height}px`;
  }

  setWind(left: WindSource | null, right: WindSource | null = null, split = 1) {
    this.left = left;
    this.right = right;
    this.split = right ? split : 1;
    if (!left) { this.stop(); this.clear(); } // stop the loop, or its next frame reads a null field and dies
    this.start();
  }

  setEnabled(on: boolean) {
    this.enabled = on;
    if (on) this.start();
    else { this.stop(); this.clear(); }
  }

  private clear() {
    this.g.setTransform(1, 0, 0, 1, 0, 0);
    this.g.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  private spawn(): P {
    return { c: Math.random() * (NLON - 1), r: Math.random() * (NLAT - 1), age: Math.floor(Math.random() * MAX_AGE) };
  }

  private start() {
    if (!this.enabled || !this.left || !this.geo || this.raf || document.hidden) return;
    const n = Math.round(NLAT * NLON * DENSITY);
    if (this.ps.length !== n) this.ps = Array.from({ length: n }, () => this.spawn());
    const tick = () => {
      if (!this.left) { this.raf = 0; return; } // wind cleared between frames: end cleanly so start() can restart
      this.step();
      this.raf = requestAnimationFrame(tick);
    };
    this.raf = requestAnimationFrame(tick);
  }

  private stop() {
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
  }

  private step() {
    const geo = this.geo!, g = this.g, k = geo.cell;
    g.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    // fade previous trails
    g.globalCompositeOperation = "destination-in";
    g.fillStyle = `rgba(0,0,0,${FADE})`;
    g.fillRect(0, 0, geo.width, geo.height);
    g.globalCompositeOperation = "source-over";
    const sx = (c: number) => geo.padL + (c + 0.5) * k;
    const sy = (r: number) => geo.padT + (NLAT - 1 - r + 0.5) * k;
    const splitCol = this.split * NLON - 0.5;
    g.lineWidth = 1.1;
    g.lineCap = "round";
    for (const p of this.ps) {
      const src = this.right && p.c > splitCol ? this.right : this.left!;
      const u = sampleBilinear(src.u, p.c, p.r), v = sampleBilinear(src.v, p.c, p.r);
      const speed = Math.hypot(u, v);
      const nc = p.c + u * CELLS_PER_FRAME_PER_MS * 10, nr = p.r + v * CELLS_PER_FRAME_PER_MS * 10; // v > 0 = north
      const a = Math.min(0.6, 0.12 + speed / 22);
      g.strokeStyle = `rgba(225,240,255,${a.toFixed(3)})`;
      g.beginPath(); g.moveTo(sx(p.c), sy(p.r)); g.lineTo(sx(nc), sy(nr)); g.stroke();
      p.c = nc; p.r = nr; p.age++;
      if (p.age > MAX_AGE || nc < -0.5 || nc > NLON - 0.5 || nr < -0.5 || nr > NLAT - 0.5) Object.assign(p, this.spawn(), { age: 0 });
    }
  }
}
