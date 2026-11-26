/**
 * Opening film: "pralaya" in twelve Indian scripts over rain and ripples, resolving into the PRALAYA title, then the
 * dashboard. Runs over the app while it loads and never blocks it: Skip, Esc, Enter or Space close it at once; other keys or a click
 * jumps to the title. With prefers-reduced-motion it shows only the still title for a moment. ?nointro disables it.
 * Spellings should be checked by native speakers before the demo.
 */
const WORDS: { w: string; lang: string; font: string }[] = [
  { w: "प्रलय", lang: "Hindi", font: "'Noto Sans Devanagari'" },
  { w: "প্রলয়", lang: "Bengali", font: "'Noto Sans Bengali'" },
  { w: "பிரளயம்", lang: "Tamil", font: "'Noto Sans Tamil'" },
  { w: "ప్రళయం", lang: "Telugu", font: "'Noto Sans Telugu'" },
  { w: "ಪ್ರಳಯ", lang: "Kannada", font: "'Noto Sans Kannada'" },
  { w: "പ്രളയം", lang: "Malayalam", font: "'Noto Sans Malayalam'" },
  { w: "પ્રલય", lang: "Gujarati", font: "'Noto Sans Gujarati'" },
  { w: "ਪਰਲੋ", lang: "Punjabi", font: "'Noto Sans Gurmukhi'" },
  { w: "ପ୍ରଳୟ", lang: "Odia", font: "'Noto Sans Oriya'" },
  { w: "প্ৰলয়", lang: "Assamese", font: "'Noto Sans Bengali'" },
  { w: "پرلے", lang: "Urdu", font: "'Noto Nastaliq Urdu'" },
  { w: "प्रलयः", lang: "Sanskrit", font: "'Tiro Devanagari Sanskrit'" },
];

const HOLD_AFTER_TITLE_MS = 2200;
const HOLD_REDUCED_MS = 1400; // reduced motion: still title only, then straight to the app
const EXIT_MS = 380; // exits are quicker than the ~1 s entrances

export function playIntro(): void {
  document.querySelector(".intro")?.remove();
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const perWord = 820;
  const root = document.createElement("div");
  root.className = "intro";
  root.setAttribute("role", "dialog");
  root.setAttribute("aria-label", "PRALAYA intro. Press Escape or Enter to skip.");
  root.innerHTML = `<canvas class="intro-rain"></canvas><div class="intro-vignette"></div><div class="intro-halo"></div>
    <div class="intro-stage"></div><div class="intro-ticker"></div>
    <button class="intro-skip" type="button">Skip ▸</button>`;
  document.body.append(root);
  const stage = root.querySelector<HTMLElement>(".intro-stage")!, ticker = root.querySelector<HTMLElement>(".intro-ticker")!;
  const halo = root.querySelector<HTMLElement>(".intro-halo")!, cv = root.querySelector<HTMLCanvasElement>(".intro-rain")!;
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

  WORDS.forEach((x) => { const s = document.createElement("span"); s.textContent = x.lang; ticker.append(s); });
  if (reduce) { root.classList.add("reduced"); later(0, () => finale()); }
  else WORDS.forEach((x, i) => later(400 + i * perWord, () => {
    const prev = stage.lastElementChild;
    if (prev) { prev.classList.remove("in"); prev.classList.add("out"); later(520, () => prev.remove()); }
    const el = document.createElement("div");
    el.className = "intro-word in";
    const w = document.createElement("span"); w.className = "w"; w.style.fontFamily = x.font; w.textContent = x.w;
    const l = document.createElement("span"); l.className = "lang"; l.textContent = x.lang;
    el.append(w, l);
    stage.append(el);
    [...ticker.children].forEach((s, j) => (s.className = j < i ? "done" : j === i ? "on" : ""));
    intensity = 0.35 + (i / WORDS.length) * 0.9; // the storm builds with each language
  }));
  if (!reduce) later(400 + WORDS.length * perWord, () => finale());

  function finale() {
    if (finaleShown) return;
    finaleShown = true;
    timers.forEach(clearTimeout);
    stage.replaceChildren();
    ticker.style.opacity = "0";
    WORDS.forEach((x, i) => {
      const s = document.createElement("span");
      s.textContent = x.w; s.style.fontFamily = x.font;
      const a = (i / WORDS.length) * Math.PI * 2 - Math.PI / 2, rx = Math.min(W * 0.38, 520), ry = Math.min(H * 0.34, 300);
      s.style.transform = `translate(-50%, -50%) translate(${Math.cos(a) * rx * 1.4}px, ${Math.sin(a) * ry * 1.4}px)`;
      halo.append(s);
      requestAnimationFrame(() => requestAnimationFrame(() => { s.style.transform = `translate(-50%, -50%) translate(${Math.cos(a) * rx}px, ${Math.sin(a) * ry}px)`; }));
    });
    halo.classList.add("show");
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
