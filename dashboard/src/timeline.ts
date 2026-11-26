/**
 * HUD timeline scrubber: a slim track with one tick per forecast day, date labels, the ripple reach drawn as a soft
 * amber area along the track, and a glowing playhead with a day/date bubble. Click or drag anywhere to scrub.
 */
export interface TimelineModel {
  steps: number;
  day: number;
  dates: string[]; // "" when unknown
  ripple: number[] | null; // 0..1 per day, or null before a Branch
}

const H = 56, PAD_X = 14, TRACK_Y = 22;

export class Timeline {
  private svg: SVGSVGElement;
  private model: TimelineModel = { steps: 10, day: 1, dates: [], ripple: null };
  private dragging = false;

  constructor(private host: HTMLElement, private onDay: (day: number) => void) {
    this.svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    this.svg.setAttribute("class", "tl-svg");
    this.svg.setAttribute("role", "slider");
    this.svg.setAttribute("aria-label", "Forecast day");
    this.svg.setAttribute("tabindex", "0"); // ← / → (handled by the app) and Home / End move the day
    this.svg.addEventListener("keydown", (e) => {
      if (e.key === "Home" || e.key === "End") { e.preventDefault(); this.onDay(e.key === "Home" ? 1 : this.model.steps); }
    });
    host.replaceChildren(this.svg);
    new ResizeObserver(() => this.draw()).observe(host);
    this.svg.addEventListener("pointerdown", (e) => { this.dragging = true; this.svg.setPointerCapture(e.pointerId); this.pick(e); });
    this.svg.addEventListener("pointermove", (e) => { if (this.dragging) this.pick(e); });
    this.svg.addEventListener("pointerup", () => (this.dragging = false));
    this.svg.addEventListener("pointercancel", () => (this.dragging = false));
  }

  set(m: TimelineModel) {
    this.model = m;
    this.draw();
  }

  private width() { return Math.max(240, this.host.clientWidth); }
  private x(d: number) {
    const w = this.width(), n = this.model.steps;
    return PAD_X + (n === 1 ? (w - 2 * PAD_X) / 2 : ((d - 1) * (w - 2 * PAD_X)) / (n - 1));
  }

  private pick(e: PointerEvent) {
    const r = this.svg.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * this.width();
    const n = this.model.steps, w = this.width();
    const d = Math.round(((px - PAD_X) / (w - 2 * PAD_X)) * (n - 1)) + 1;
    const day = Math.min(n, Math.max(1, d));
    if (day !== this.model.day) this.onDay(day);
  }

  private draw() {
    const { steps, day, dates, ripple } = this.model, w = this.width();
    this.svg.setAttribute("viewBox", `0 0 ${w} ${H}`);
    this.svg.setAttribute("aria-valuemin", "1");
    this.svg.setAttribute("aria-valuemax", String(steps));
    this.svg.setAttribute("aria-valuenow", String(day));
    this.svg.setAttribute("aria-valuetext", `Day ${day}${dates[day - 1] ? `, ${dates[day - 1]}` : ""}`);
    let s = "";
    // ripple reach as a soft area above the track (scaled to its own maximum; labels keep the real %)
    if (ripple && ripple.length === steps) {
      const peak = Math.max(...ripple, 1e-9), top = 2, base = TRACK_Y - 3;
      const y = (v: number) => base - (v / peak) * (base - top);
      const pts = ripple.map((v, i) => `${this.x(i + 1).toFixed(1)},${y(v).toFixed(1)}`);
      s += `<path d="M${this.x(1)},${base} L${pts.join(" L")} L${this.x(steps)},${base} Z" class="tl-area"/>`;
      s += `<path d="M${pts.join(" L")}" class="tl-spark"/>`;
    }
    // track + filled progress
    s += `<line x1="${PAD_X}" x2="${w - PAD_X}" y1="${TRACK_Y}" y2="${TRACK_Y}" class="tl-track"/>`;
    s += `<line x1="${PAD_X}" x2="${this.x(day)}" y1="${TRACK_Y}" y2="${TRACK_Y}" class="tl-fill"/>`;
    for (let d = 1; d <= steps; d++) {
      const x = this.x(d), on = d === day;
      s += `<line x1="${x}" x2="${x}" y1="${TRACK_Y - 4}" y2="${TRACK_Y + 4}" class="tl-tick${d <= day ? " past" : ""}"/>`;
      // when days are tight, label every other one (the current day is always labelled)
      const spacing = steps > 1 ? (w - 2 * PAD_X) / (steps - 1) : w;
      if (on || spacing >= 52 || (d - 1) % 2 === 0) {
        s += `<text x="${x}" y="${TRACK_Y + 20}" text-anchor="middle" class="tl-date${on ? " on" : ""}">${dates[d - 1] || `D${d}`}</text>`;
      }
    }
    // playhead: a white knob (Ventusky-style); the day and date show in the date pill beside the slider
    const px = this.x(day);
    s += `<circle cx="${px}" cy="${TRACK_Y}" r="8" class="tl-knob"/>`;
    this.svg.innerHTML = s;
  }
}
