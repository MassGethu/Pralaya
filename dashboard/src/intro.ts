/**
 * Opening film: rain and ripples build into a short storm, then the PRALAYA title (English only), then the dashboard.
 * Runs over the app while it loads and never blocks it: Skip, Esc, Enter or Space close it at once; other keys or a
 * click jump to the title. With prefers-reduced-motion it shows only the still title for a moment. ?nointro disables it.
 */
const STORM_MS = 1200; // rain builds before the title lands
const HOLD_AFTER_TITLE_MS = 2200;
const HOLD_REDUCED_MS = 1400; // reduced motion: still title only, then straight to the app
const EXIT_MS = 380; // exits are quicker than the ~1 s entrances

export function playIntro(): void {
  document.querySelector(".intro")?.remove();
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const root = document.createElement("div");
  root.className = "intro";
  root.setAttribute("role", "dialog");
  root.setAttribute("aria-label", "PRALAYA intro. Press Escape or Enter to skip.");
  root.innerHTML = `<canvas class="intro-rain"></canvas><div class="intro-vignette"></div>
    <div class="intro-stage"></div>
    <button class="intro-skip" type="button">Skip ▸</button>`;
  document.body.append(root);
  const stage = root.querySelector<HTMLElement>(".intro-stage")!, cv = root.querySelector<HTMLCanvasElement>(".intro-rain")!;
  const timers: number[] = [];
  const later = (ms: number, f: () => void) => timers.push(window.setTimeout(f, ms));
  let running = true, intensity = 0.35, finaleShown = false;

  // rain and ripple rings
  const g = cv.getContext("2d")!, dpr = Math.max(1, devicePixelRatio || 1);
  let W = 0, H = 0;
  const size = () => { W = innerWidth; H = innerHeight; cv.width = W * dpr; cv.height = H * dpr; g.setTransform(dpr, 0, 0, dpr, 0, 0); };
  size();
  addEventListener("resize", size);
  const drops = Array.from({ length: 240 }, () => ({ x: Math.random() * W, y: Math.random() * H, v: 6 + Math.random() * 10, l: 8 + Math.random() * 18 }));
  let rings: { x: number; y: number; r: number; a: number }[] = [];
  const frame = () => {
    if (!running) return;
    g.fillStyle = "rgba(2,3,6,0.35)"; g.fillRect(0, 0, W, H);
    g.strokeStyle = `rgba(150,200,255,${0.18 + intensity * 0.25})`; g.lineWidth = 1; g.beginPath();
    for (const d of drops) {
      g.moveTo(d.x, d.y); g.lineTo(d.x - d.l * 0.18, d.y + d.l);
      d.y += d.v * (0.6 + intensity); d.x -= d.v * 0.12;
      if (d.y > H) {
        if (Math.random() < 0.08 * intensity) rings.push({ x: d.x, y: H * (0.55 + Math.random() * 0.45), r: 2, a: 0.5 });
        d.y = -d.l; d.x = Math.random() * (W + 200);
      }
    }
    g.stroke();
    for (const r of rings) { g.strokeStyle = `rgba(103,232,249,${r.a})`; g.beginPath(); g.ellipse(r.x, r.y, r.r, r.r * 0.32, 0, 0, Math.PI * 2); g.stroke(); r.r += 1.4; r.a *= 0.965; }
    rings = rings.filter((r) => r.a > 0.02);
    if (!reduce) requestAnimationFrame(frame);
  };
  frame();

  if (reduce) { root.classList.add("reduced"); later(0, () => finale()); }
  else {
    // the storm builds for a moment, then the title lands
    const t0 = performance.now();
    const build = () => {
      if (finaleShown || !running) return;
      intensity = 0.35 + Math.min(1, (performance.now() - t0) / STORM_MS) * 0.9;
      requestAnimationFrame(build);
    };
    requestAnimationFrame(build);
    later(STORM_MS, () => finale());
  }

  function finale() {
    if (finaleShown) return;
    finaleShown = true;
    timers.forEach(clearTimeout);
    stage.replaceChildren();
    intensity = 0.25;
    const t = document.createElement("div");
    t.className = "intro-title";
    t.innerHTML = `<span class="t">PRALAYA</span><span class="line"></span><span class="intro-tag">Monsoon multiverse</span>`;
    stage.append(t);
    requestAnimationFrame(() => t.classList.add("in"));
    window.setTimeout(close, reduce ? HOLD_REDUCED_MS : HOLD_AFTER_TITLE_MS);
  }

  let closing = false;
  function close() {
    if (closing) return;
    closing = true;
    timers.forEach(clearTimeout);
    removeEventListener("keydown", onKey, true); // the app takes keys again as soon as the fade starts
    root.classList.add("leaving");
    window.setTimeout(() => { running = false; removeEventListener("resize", size); root.remove(); }, reduce ? 0 : EXIT_MS);
  }

  const onKey = (e: KeyboardEvent) => {
    e.stopPropagation(); e.preventDefault();
    if (finaleShown || ["Escape", "Enter", " "].includes(e.key)) close(); else finale();
  };
  addEventListener("keydown", onKey, true);
  root.addEventListener("click", () => (finaleShown ? close() : finale()));
  const skip = root.querySelector<HTMLButtonElement>(".intro-skip")!;
  skip.addEventListener("click", (e) => { e.stopPropagation(); close(); });
  skip.focus({ preventScroll: true });
}

export const introEnabled = (): boolean => !new URLSearchParams(location.search).has("nointro");
