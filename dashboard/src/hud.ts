/**
 * U3-style HUD: small tags pinned to places on the map (the shock box and the farm region), with radar rings and
 * leader lines, plus a hero readout. Pure DOM, positioned in the map canvas's own pixel space so it stays aligned.
 */
import { NLAT } from "./contract";
import type { Box } from "./region";
import type { MapGeometry } from "./render";

const TAG_W = 196;
const GAP = 16;

export interface HudTag {
  box: Box;
  kind: "shock" | "farm";
  kicker: string; // small caps line
  state: "draft" | "live" | "stale" | "busy" | "empty" | "fixture";
  title: string;
  sub?: string; // one short line under the title
  rows: [string, string][];
  pin?: string; // compact value for small maps
  onOpen?: () => void;
  actions: { label: string; primary?: boolean; busy?: boolean; disabled?: boolean; onClick: () => void }[];
}

export interface HudModel {
  tags: HudTag[];
  /** Headline readout. `num` (when given) is counted to from the previous value; `tone` colours it like the legend. */
  hero: { label: string; value: string; unit: string; sub?: string; cell?: { r: number; c: number }; num?: number; digits?: number; tone?: "pos" | "neg"; onClick?: () => void } | null;
}

interface Rect { x: number; y: number; w: number; h: number }

function boxRect(b: Box, g: MapGeometry): Rect {
  const r0 = Math.min(b.r0, b.r1), r1 = Math.max(b.r0, b.r1), c0 = Math.min(b.c0, b.c1), c1 = Math.max(b.c0, b.c1);
  return { x: g.padL + c0 * g.cell, y: g.padT + (NLAT - 1 - r1) * g.cell, w: (c1 - c0 + 1) * g.cell, h: (r1 - r0 + 1) * g.cell };
}

const overlaps = (a: Rect, b: Rect) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls: string, text?: string): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  e.className = cls;
  if (text != null) e.textContent = text;
  return e;
}

export function renderHud(host: HTMLElement, g: MapGeometry, model: HudModel) {
  host.style.width = `${g.width}px`;
  host.style.height = `${g.height}px`;
  host.replaceChildren();
  const placed: Rect[] = [];
  // Small map (narrow screens): full tags would cover it, so show compact pins that open the details instead.
  const compact = g.cell < 13;
  for (const t of model.tags) {
    const r = boxRect(t.box, g);
    const cx = r.x + r.w / 2, cy = r.y + r.h / 2;

    // radar ring around the region
    const d = Math.max(36, Math.min(150, Math.min(r.w, r.h) * 0.95));
    const ring = el("div", `hud-ring ${t.kind}`);
    Object.assign(ring.style, { left: `${cx - d / 2}px`, top: `${cy - d / 2}px`, width: `${d}px`, height: `${d}px` });
    host.append(ring);

    // tag: to the right of the box, or the left if it would leave the map; nudged down if it hits another tag
    const tag = el(compact ? "button" : "div", `hud-tag ${t.kind}${compact ? " compact" : ""}`);
    tag.dataset.state = t.state;
    if (compact) {
      const head = el("div", "hud-k");
      head.append(el("i", "hud-dot"), el("span", "", t.kind === "shock" ? "Shock" : "Farm"));
      tag.append(head, el("div", "hud-pin-v", t.pin ?? ""));
      tag.addEventListener("click", () => t.onOpen?.());
      host.append(tag);
      const w = tag.offsetWidth || 110, hh = tag.offsetHeight || 40;
      const cx = r.x + r.w / 2;
      const y = t.kind === "shock" ? Math.min(g.height - hh - 4, r.y + r.h + 6) : Math.max(4, r.y - hh - 6);
      const x = Math.max(4, Math.min(g.width - w - 4, cx - w / 2));
      Object.assign(tag.style, { left: `${x}px`, top: `${y}px` });
      continue;
    }
    const head = el("div", "hud-k");
    head.append(el("i", "hud-dot"), el("span", "", t.kicker));
    tag.append(head, el("div", "hud-title", t.title));
    if (t.sub) tag.append(el("div", "hud-sub", t.sub));
    if (t.rows.length) {
      const kv = el("div", "hud-kv");
      for (const [k, v] of t.rows) kv.append(el("span", "", k), el("span", "hud-v", v));
      tag.append(kv);
    }
    if (t.actions.length) {
      const act = el("div", "hud-actions");
      for (const a of t.actions) {
        const b = el("button", `hud-btn${a.primary ? " primary" : ""}`, a.label);
        b.disabled = !!a.disabled;
        if (a.busy) { b.classList.add("is-busy"); b.setAttribute("aria-busy", "true"); }
        b.addEventListener("click", (e) => { e.stopPropagation(); a.onClick(); });
        b.addEventListener("pointerdown", (e) => e.stopPropagation());
        act.append(b);
      }
      tag.append(act);
    }
    host.append(tag);
    const h = tag.offsetHeight || 110;
    const fit = (x: number, y: number): Rect => ({ x: Math.max(4, Math.min(g.width - TAG_W - 4, x)), y: Math.max(4, Math.min(g.height - h - 4, y)), w: TAG_W, h });
    const others = model.tags.filter((o) => o !== t).map((o) => boxRect(o.box, g));
    const candidates = [
      fit(r.x + r.w + GAP, r.y), fit(r.x - GAP - TAG_W, r.y),
      fit(r.x, r.y - h - GAP), fit(r.x, r.y + r.h + GAP),
      fit(r.x + r.w + GAP, r.y + r.h - h), fit(r.x - GAP - TAG_W, r.y + r.h - h),
    ];
    const clash = (c: Rect) => placed.some((p) => overlaps(c, p)) || others.some((o) => overlaps(c, o));
    const rect = candidates.find((c) => !clash(c)) ?? candidates.find((c) => !placed.some((p) => overlaps(c, p))) ?? candidates[0];
    const x = rect.x, y = rect.y;
    placed.push(rect);
    Object.assign(tag.style, { left: `${x}px`, top: `${y}px`, width: `${TAG_W}px` });

    // leader line from the ring edge to the tag's near side
    const tx = x > cx ? x : x + TAG_W, ty = y + 18;
    const len = Math.hypot(tx - cx, ty - cy) - d / 2;
    if (len > 6) {
      const ang = Math.atan2(ty - cy, tx - cx);
      const line = el("div", `hud-line ${t.kind}`);
      Object.assign(line.style, {
        left: `${cx + Math.cos(ang) * (d / 2)}px`, top: `${cy + Math.sin(ang) * (d / 2)}px`, width: `${len}px`, transform: `rotate(${ang}rad)`,
      });
      host.append(line);
    }
  }
  if (model.hero) {
    const h = model.hero;
    const hero = el(h.onClick ? "button" : "div", "hud-hero");
    if (h.tone) hero.dataset.tone = h.tone;
    hero.append(el("span", "hud-k", h.label));
    const n = el("span", "hud-n");
    const v = el("span", "hud-n-v", h.value);
    n.append(v, el("small", "", h.unit));
    hero.append(n);
    if (h.sub) hero.append(el("span", "hud-hero-sub", h.sub));
    if (h.onClick) hero.addEventListener("click", h.onClick);
    hero.style.left = `${g.padL + 12}px`;
    host.append(hero);
    if (h.cell) {
      // mark the cell the number refers to
      const pin = el("div", `hud-peak${h.tone ? ` ${h.tone}` : ""}`);
      const px = g.padL + (h.cell.c + 0.5) * g.cell, py = g.padT + (NLAT - 1 - h.cell.r + 0.5) * g.cell;
      Object.assign(pin.style, { left: `${px}px`, top: `${py}px`, width: `${Math.max(14, g.cell * 1.6)}px`, height: `${Math.max(14, g.cell * 1.6)}px` });
      host.append(pin);
    }
    countTo(v, h);
  } else lastHero = null;
}

// Count the hero number from its previous value (ease-out, 450 ms) so a new day or Branch reads as a change.
let lastHero: number | null = null;
let heroRaf = 0;
function countTo(node: HTMLElement, h: NonNullable<HudModel["hero"]>) {
  cancelAnimationFrame(heroRaf);
  const to = h.num;
  const from = lastHero;
  lastHero = to ?? null;
  if (to == null || from == null || from === to || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const d = h.digits ?? 1, t0 = performance.now(), ms = 450;
  const fmtN = (x: number) => (x > 0 ? "+" : x < 0 ? "−" : "") + Math.abs(x).toFixed(d);
  const tick = () => {
    const k = Math.min(1, (performance.now() - t0) / ms), e = 1 - (1 - k) ** 3;
    node.textContent = fmtN(from + (to - from) * e);
    if (k < 1) heroRaf = requestAnimationFrame(tick);
  };
  heroRaf = requestAnimationFrame(tick);
}
