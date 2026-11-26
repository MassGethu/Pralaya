/** SVG/HTML builders for the legend and the two small charts. Pure functions of their inputs. */
import { escapeHtml, fmt, signed } from "./format";
import type { ImpactResult } from "./impact";
import type { Scale } from "./render";

export type AgriMode = "abs" | "change";

export function legendHtml(sc: Scale | null, unit: string, note: string): string {
  if (!sc) return "";
  if (sc.classes) {
    const css = (c: number[]) => `rgb(${c.map(Math.round).join(",")})`;
    return `<div class="legend-steps">${sc.classes.map((k, i) => `<div class="step-cell"><i style="background:${css(k.color)}"></i><span class="mono">${i === 0 ? "0" : k.lo}</span></div>`).join("")}</div>
      <div class="legend-note">${escapeHtml(unit)} · rain-gauge bands · ≥ 10 = heavy rain${note ? ` · ${escapeHtml(note)}` : ""}</div>`;
  }
  // Five evenly spaced ticks so values can be read off the bar (zero is the middle tick on diverging scales).
  const span = sc.hi - sc.lo;
  const digits = Math.abs(span) < 2 ? 2 : Math.abs(span) < 20 ? 1 : 0;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => {
    const v = sc.lo + t * span;
    return sc.kind === "div" ? (t === 0.5 ? "0" : signed(v, digits)) : fmt(v, digits);
  });
  return `<div class="legend-bar" style="background:${sc.gradient}"></div>
    <div class="legend-ticks mono">${ticks.map((t) => `<span>${t}</span>`).join("")}</div>
    <div class="legend-note">${escapeHtml(unit)}${note ? ` · ${escapeHtml(note)}` : ""}</div>`;
}

/** Bars: share of cells outside the shock box whose |Δ| exceeds the threshold, per forecast day. */
export function rippleChartSvg(fractions: number[] | null, day: number): string {
  if (!fractions) return `<text x="150" y="64" text-anchor="middle" class="svg-empty">Needs a Prime and a non-zero Branch</text>`;
  const W = 300, H = 120, pl = 28, pb = 18, bw = (W - pl - 4) / fractions.length;
  const top = Math.max(0.1, ...fractions); // scale to the data so small reach is still visible; axis shows the real %
  const y = (v: number) => H - pb - (v / top) * (H - pb - 8);
  let s = `<line x1="${pl}" y1="${y(0)}" x2="${W}" y2="${y(0)}" class="axis"/>`;
  for (const t of [0, top / 2, top]) s += `<text x="${pl - 4}" y="${y(t) + 3}" text-anchor="end" class="svg-tick">${(t * 100).toFixed(0)}%</text>`;
  fractions.forEach((v, k) => {
    const x = pl + k * bw + 2;
    s += `<rect x="${x}" y="${y(v)}" width="${bw - 4}" height="${Math.max(0.5, y(0) - y(v))}" rx="2" class="${k + 1 === day ? "bar bar-on" : "bar"}"><title>Day ${k + 1}: ${(v * 100).toFixed(1)}%</title></rect>`;
    s += `<text x="${x + (bw - 4) / 2}" y="${H - 5}" text-anchor="middle" class="svg-tick">${k + 1}</text>`;
  });
  return s;
}

/**
 * Climate Pulse-style chart: Prime is the dashed reference, Branch the highlighted line, with a callout on the
 * selected forecast day. "abs" shows cumulative regional rainfall; "change" shows Branch − Prime cumulative.
 * Small marks under the axis flag dry days (regional mean below the dry threshold) for each timeline.
 */
export function agriChartSvg(res: Extract<ImpactResult, { empty: false }>, mode: AgriMode, day: number, dry: number): string {
  const W = 380, H = 180, pl = 38, pr = 10, pt = 26, pb = 34;
  const cum = (a: number[]) => a.reduce<number[]>((o, v) => (o.push((o.at(-1) ?? 0) + v), o), []);
  const pc = cum(res.prime.dailyRain), bc = cum(res.branch.dailyRain);
  const series = mode === "abs" ? { ref: pc, main: bc } : { ref: pc.map(() => 0), main: bc.map((v, i) => v - pc[i]) };
  const lo = Math.min(0, ...series.ref, ...series.main);
  let hi = Math.max(...series.ref, ...series.main);
  if (hi - lo < 1) hi = lo + 1;
  const n = res.days.length;
  const x = (i: number) => pl + (n === 1 ? (W - pl - pr) / 2 : (i * (W - pl - pr)) / (n - 1));
  const y = (v: number) => pt + (1 - (v - lo) / (hi - lo)) * (H - pt - pb);
  const path = (a: number[]) => a.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join("");
  let s = "";
  for (const t of [lo, (lo + hi) / 2, hi]) {
    s += `<line x1="${pl}" x2="${W - pr}" y1="${y(t)}" y2="${y(t)}" class="grid"/><text x="${pl - 6}" y="${y(t) + 3}" text-anchor="end" class="svg-tick">${fmt(t, Math.abs(hi - lo) < 10 ? 1 : 0)}</text>`;
  }
  if (lo < 0) s += `<line x1="${pl}" x2="${W - pr}" y1="${y(0)}" y2="${y(0)}" class="axis"/>`;
  s += `<path d="${path(series.ref)}" class="ln-ref"/>`;
  if (mode === "change") s += `<path d="${path(series.main)}L${x(n - 1)},${y(0)}L${x(0)},${y(0)}Z" class="${series.main.at(-1)! < 0 ? "area-neg" : "area-pos"}"/>`;
  s += `<path d="${path(series.main)}" class="ln-main"/>`;
  res.days.forEach((d, i) => {
    s += `<circle cx="${x(i)}" cy="${y(series.main[i])}" r="2.5" class="pt-main"><title>Day ${d}: Branch ${fmt(bc[i], 1)} mm, Prime ${fmt(pc[i], 1)} mm cumulative</title></circle>`;
    s += `<text x="${x(i)}" y="${H - pb + 14}" text-anchor="middle" class="svg-tick">${d}</text>`;
    if (res.prime.dailyRain[i] < dry) s += `<rect x="${x(i) - 6}" y="${H - 10}" width="5" height="4" class="dry-prime"><title>Day ${d}: Prime dry day</title></rect>`;
    if (res.branch.dailyRain[i] < dry) s += `<rect x="${x(i) + 1}" y="${H - 10}" width="5" height="4" class="dry-branch"><title>Day ${d}: Branch dry day</title></rect>`;
  });
  const k = res.days.indexOf(day);
  if (k >= 0) {
    const v = series.main[k];
    const label = mode === "abs" ? `Day ${day} · ${fmt(bc[k], 1)} mm (Prime ${fmt(pc[k], 1)})` : `Day ${day} · ${signed(v, 1)} mm vs Prime`;
    const anchor = x(k) > W - 150 ? "end" : "start";
    s += `<line x1="${x(k)}" x2="${x(k)}" y1="${pt}" y2="${H - pb}" class="cursor"/><circle cx="${x(k)}" cy="${y(v)}" r="4.5" class="pt-focus"/>`;
    // Put the label on the emptier side of the point so it never sits on the line.
    const upper = y(v) < pt + (H - pt - pb) / 2;
    const ly = upper ? Math.min(H - pb - 4, y(v) + 18) : Math.max(pt + 10, y(v) - 12);
    s += `<text x="${x(k) + (anchor === "end" ? -8 : 8)}" y="${ly}" text-anchor="${anchor}" class="callout">${label}</text>`;
  }
  s += `<text x="${pl}" y="14" class="svg-tick">${mode === "abs" ? "mm, cumulative" : "Branch − Prime, mm"} · <tspan class="lg-branch">━ Branch</tspan> <tspan class="lg-prime">┅ Prime</tspan></text>`;
  s += `<text x="${W - pr}" y="${H - 2}" text-anchor="end" class="svg-tick">dry day (&lt; ${dry} mm/day): <tspan class="lg-prime">▬</tspan> Prime <tspan class="lg-branch">▬</tspan> Branch</text>`;
  return s;
}
