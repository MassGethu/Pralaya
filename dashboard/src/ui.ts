/** Small, state-free UI helpers: layer icons, tab switching and forecast-date labels. */
import type { InitialState } from "./contract";
import type { ViewVar } from "./fields";
import { escapeHtml, fmt, signed } from "./format";
import { CHANNEL_INFO } from "./contract";
import { describeBox } from "./region";
import type { ShockSpec } from "./shock";

const svgIcon = (d: string) => `<svg class="vi" viewBox="0 0 16 16" aria-hidden="true"><path d="${d}"/></svg>`;

export const VAR_ICONS: Record<ViewVar, string> = {
  tp: svgIcon("M8 1.5C8 1.5 3.5 7 3.5 10a4.5 4.5 0 0 0 9 0C12.5 7 8 1.5 8 1.5z"),
  t2m: svgIcon("M6.5 2.5a1.5 1.5 0 0 1 3 0v6.8a3 3 0 1 1-3 0z"),
  wind: svgIcon("M1.5 6h8a2 2 0 1 0-2-2M1.5 10h10.5a2 2 0 1 1-2 2"),
  u10: svgIcon("M2 8h11M9.5 4.5 13 8l-3.5 3.5"),
  v10: svgIcon("M8 14V3M4.5 6.5 8 3l3.5 3.5"),
  msl: svgIcon("M2.5 11a5.5 5.5 0 0 1 11 0M8 11l2.5-3.5"),
  tcwv: svgIcon("M4.5 11.5h7.5a2.5 2.5 0 0 0 0-5 4 4 0 0 0-7.6-1A3 3 0 0 0 4.5 11.5z"),
};

export type TabName = "shock" | "impact" | "ripple" | "setup";

export function setTab(name: TabName) {
  document.querySelectorAll<HTMLButtonElement>(".tab[data-tab]").forEach((t) => t.setAttribute("aria-selected", String(t.dataset.tab === name)));
  document.querySelectorAll<HTMLElement>(".tab-panel[data-panel]").forEach((p) => (p.hidden = p.dataset.panel !== name));
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/**
 * Calendar label for forecast day `day` (1 = the day after the last input day), when the input's metadata names
 * its last day. Returns "" when unknown. Display only: no date is ever sent to the server.
 */
export function forecastDateLabel(lastInputDay: unknown, day: number): string {
  if (typeof lastInputDay !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(lastInputDay)) return "";
  const [y, m, d] = lastInputDay.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + day));
  return `${t.getUTCDate()} ${MONTHS[t.getUTCMonth()]}`;
}

/** One short highlight when a new Branch lands: the peak moment of the demo. */
export function flash(el: Element | null) {
  if (!el) return;
  el.classList.remove("fresh");
  void (el as HTMLElement).offsetWidth; // restart the animation
  el.classList.add("fresh");
}

export const SHORT_LABEL: Record<ViewVar, string> = { tp: "Rain", t2m: "Temp", wind: "Wind", u10: "u10", v10: "v10", msl: "Pressure", tcwv: "Moisture" };

/** Summary of a loaded initial state: source, last input day, seasonal encoding and validation result. */
export function inputInfoHtml(inp: InitialState): string {
  const m = inp.meta;
  const doy = typeof m.day_of_year === "number" ? m.day_of_year : null;
  const ang = Math.atan2(inp.doySinCos[0], inp.doySinCos[1]);
  const derivedDoy = Math.round(((ang < 0 ? ang + 2 * Math.PI : ang) * 365) / (2 * Math.PI));
  return `
    <dl class="kv">
      <dt>Source</dt><dd>${escapeHtml(inp.label)}</dd>
      ${m.last_input_day ? `<dt>Last input day</dt><dd class="mono">${escapeHtml(String(m.last_input_day))}</dd>` : ""}
      <dt>doy_sincos</dt><dd class="mono">[${fmt(inp.doySinCos[0], 4)}, ${fmt(inp.doySinCos[1], 4)}] ≈ doy ${doy ?? derivedDoy}</dd>
      <dt>Shape</dt><dd class="mono">[3, 6, 32, 36] ✓ finite, physical ranges ✓</dd>
    </dl>`;
}

/** Live IST clock for the command header (display only). */
export function startClock(el: HTMLElement) {
  const tick = () => {
    const t = new Date().toLocaleTimeString("en-GB", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit" });
    el.textContent = `IST ${t}`;
  };
  tick();
  setInterval(tick, 15_000);
}

/** One-line description of the Branch currently on screen, flagging when the shock was edited after it ran. */
export function scenarioLine(
  b: { runNo: number; zero: boolean; spec: ShockSpec | null; specKey: string } | null, primeRunNo: number | null, currentKey: string,
): { html: string; state: "idle" | "stale" | "current" } {
  if (!b) return { html: primeRunNo ? `<span>Prime run #${primeRunNo} ready. Choose a shock and run Branch.</span>` : "", state: "idle" };
  const title = b.zero ? "Zero shock (all-zero tensor)" : `${escapeHtml(b.spec!.label)} · ${describeBox(b.spec!.box)}`;
  const stale = !b.zero && b.specKey !== currentKey;
  const comps = b.spec ? `<span class="mono">${b.spec.components.map((c) => `${c.channel} ${c.mode === "add" ? signed(c.value, 2) + " " + CHANNEL_INFO[c.channel].unit : signed(c.value, 0) + " %"}`).join(" · ")}</span>` : "";
  const warn = stale ? `<span class="warn">Shock edited since this run: maps show Branch #${b.runNo}. Run Branch to update.</span>` : "";
  return { html: `<span class="tag">Branch #${b.runNo}</span><span>${title}</span>${comps}${warn}`, state: stale ? "stale" : "current" };
}

/** Hover readout for one grid cell: position, land fraction, Prime / Branch / Δ in display units, and region flags. */
export function showTooltip(
  tip: HTMLElement, ev: PointerEvent, i: number | null, land: Float32Array, prime: number | null, branch: number | null,
  vi: { unit: string; deltaUnit: string }, inShock: boolean, inFarm: boolean,
) {
  if (i == null) { tip.hidden = true; return; }
  const r = Math.floor(i / 36), c = i % 36;
  const rows = [`<b>${(6.5 + r).toFixed(1)}°N, ${(65.5 + c).toFixed(1)}°E</b>`, `<span class="mono">cell [${r}, ${c}] · land ${land[i].toFixed(2)}</span>`];
  if (prime != null) rows.push(`Prime: <span class="mono">${fmt(prime)} ${vi.unit}</span>`);
  if (prime != null && branch != null) rows.push(`Branch: <span class="mono">${fmt(branch)} ${vi.unit}</span>`, `Δ: <span class="mono">${signed(branch - prime, 3)} ${vi.deltaUnit}</span>`);
  if (inShock) rows.push(`<span class="tag-shock">in shock box</span>`);
  if (inFarm) rows.push(`<span class="tag-impact">in farm region</span>`);
  tip.innerHTML = rows.join("<br>");
  tip.hidden = false;
  tip.style.left = `${ev.clientX + 14}px`;
  tip.style.top = `${ev.clientY + 14}px`;
}
