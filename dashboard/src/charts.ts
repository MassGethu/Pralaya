/** SVG/HTML builders for the legend and the two small charts. Pure functions of their inputs. */
import { escapeHtml, fmt, signed } from "./format";
import type { ImpactResult } from "./impact";
import type { Scale } from "./render";

export type AgriMode = "abs" | "change";

export interface LegendHead { title: string; day: number; ends: [string, string] }

export function legendHtml(sc: Scale | null, unit: string, note: string, head?: LegendHead): string {
  if (!sc) return "";
  // Hero (difference) legend: a title with units and day, plain-language ends, then the bar and ticks.
  const top = head
    ? `<div class="legend-head"><b>${escapeHtml(head.title)}</b><span class="mono">${escapeHtml(unit)} · day ${head.day}</span></div>
       <div class="legend-ends"><span>← ${escapeHtml(head.ends[0])}</span><span>${escapeHtml(head.ends[1])} →</span></div>`
    : "";
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
  return `${top}<div class="legend-bar" style="background:${sc.gradient}"></div>
    <div class="legend-ticks mono">${ticks.map((t) => `<span>${t}</span>`).join("")}</div>
    <div class="legend-note">${head ? "" : `${escapeHtml(unit)}${note ? " · " : ""}`}${escapeHtml(note)}</div>`;
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
  // pb leaves three rows under the plot: day numbers, dry-day marks, and the dry-day key on its own line.
  const W = 380, H = 196, pl = 38, pr = 10, pt = 26, pb = 50;
  const cum = (a: number[]) => a.reduce<number[]>((o, v) => (o.push((o.at(-1) ?? 0) + v), o), []);
  const pc = cum(res.prime.dailyRain), bc = cum(res.branch.dailyRain);
  const series = mode === "abs" ? { ref: pc, main: bc } : { ref: pc.map(() => 0), main: bc.map((v, i) => v - pc[i]) };
  // Round axis steps (1, 2, 2.5 or 5 × 10ⁿ) so the gridlines read as 0 / 25 / 50 / 75, not 0 / 34 / 67.
  const rawLo = Math.min(0, ...series.ref, ...series.main);
  let rawHi = Math.max(...series.ref, ...series.main);
  if (rawHi - rawLo < 1e-9) rawHi = rawLo + 1;
  const step = niceStep((rawHi - rawLo) / 3);
  const lo = Math.floor(rawLo / step - 1e-9) * step, hi = Math.ceil(rawHi / step - 1e-9) * step;
  const stepDigits = (String(Number(step.toPrecision(6))).split(".")[1] ?? "").length; // 25 -> 0, 2.5 -> 1, 0.25 -> 2
  const n = res.days.length;
  const x = (i: number) => pl + (n === 1 ? (W - pl - pr) / 2 : (i * (W - pl - pr)) / (n - 1));
  const y = (v: number) => pt + (1 - (v - lo) / (hi - lo)) * (H - pt - pb);
  const path = (a: number[]) => a.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join("");
  let s = "";
  for (let t = lo; t <= hi + step / 2; t += step) {
    const v = Math.abs(t) < step / 1e6 ? 0 : t;
    s += `<line x1="${pl}" x2="${W - pr}" y1="${y(v)}" y2="${y(v)}" class="grid"/><text x="${pl - 6}" y="${y(v) + 3}" text-anchor="end" class="svg-tick">${fmt(v, stepDigits)}</text>`;
  }
  if (lo < 0) s += `<line x1="${pl}" x2="${W - pr}" y1="${y(0)}" y2="${y(0)}" class="axis"/>`;
  s += `<path d="${path(series.ref)}" class="ln-ref"/>`;
  if (mode === "change") s += `<path d="${path(series.main)}L${x(n - 1)},${y(0)}L${x(0)},${y(0)}Z" class="${series.main.at(-1)! < 0 ? "area-neg" : "area-pos"}"/>`;
  s += `<path d="${path(series.main)}" class="ln-main"/>`;
  res.days.forEach((d, i) => {
    s += `<circle cx="${x(i)}" cy="${y(series.main[i])}" r="2.5" class="pt-main"><title>Day ${d}: Branch ${fmt(bc[i], 1)} mm, Prime ${fmt(pc[i], 1)} mm cumulative</title></circle>`;
    s += `<text x="${x(i)}" y="${H - pb + 14}" text-anchor="middle" class="svg-tick">${d}</text>`;
    if (res.prime.dailyRain[i] < dry) s += `<rect x="${x(i) - 6}" y="${H - pb + 21}" width="5" height="4" class="dry-prime"><title>Day ${d}: Prime dry day</title></rect>`;
    if (res.branch.dailyRain[i] < dry) s += `<rect x="${x(i) + 1}" y="${H - pb + 21}" width="5" height="4" class="dry-branch"><title>Day ${d}: Branch dry day</title></rect>`;
  });
  const k = res.days.indexOf(day);
  if (k >= 0) {
    const v = series.main[k];
    const label = mode === "abs" ? `Day ${day} · ${fmt(bc[k], 1)} mm (Prime ${fmt(pc[k], 1)})` : `Day ${day} · ${signed(v, 1)} mm vs Prime`;
    s += `<line x1="${x(k)}" x2="${x(k)}" y1="${pt}" y2="${H - pb}" class="cursor"/><circle cx="${x(k)}" cy="${y(v)}" r="4.5" class="pt-focus"/>`;
    const spot = calloutSpot({ px: x(k), py: y(v), width: label.length * 6.6, box: [pl, pt, W - pr, H - pb], lines: [series.main, series.ref].map((a) => a.map((val, i) => [x(i), y(val)] as [number, number])) });
    s += `<text x="${spot.x}" y="${spot.y}" text-anchor="${spot.anchor}" class="callout">${label}</text>`;
  }
  s += `<text x="${pl}" y="14" class="svg-tick">${mode === "abs" ? "mm, cumulative" : "Branch − Prime, mm"} · <tspan class="lg-branch">━ Branch</tspan> <tspan class="lg-prime">┅ Prime</tspan></text>`;
  s += `<text x="${pl}" y="${H - 3}" class="svg-tick">Dry day (&lt; ${dry} mm/day): <tspan class="lg-prime">▬</tspan> Prime <tspan class="lg-branch">▬</tspan> Branch</text>`;
  return s;
}

/** A round step near `raw`: 1, 2, 2.5 or 5 times a power of ten. */
export function niceStep(raw: number): number {
  const p = 10 ** Math.floor(Math.log10(raw));
  const m = raw / p;
  return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 2.5 ? 2.5 : m <= 5 ? 5 : 10) * p;
}

/**
 * Where to put a chart callout so its text crosses neither line: try beside the point (above or below, right or
 * left), then the plot's top corners. Text is ~12 units tall with its baseline at y.
 */
export function calloutSpot(o: { px: number; py: number; width: number; box: [number, number, number, number]; lines: [number, number][][] }):
  { x: number; y: number; anchor: "start" | "end" } {
  const [x0, y0, x1, y1] = o.box;
  const lineY = (pts: [number, number][], qx: number): number | null => {
    for (let i = 1; i < pts.length; i++) {
      const [ax, ay] = pts[i - 1], [bx, by] = pts[i];
      if (qx >= ax && qx <= bx) return bx === ax ? ay : ay + ((qx - ax) / (bx - ax)) * (by - ay);
    }
    return null;
  };
  const fits = (left: number, base: number) => {
    if (left < x0 || left + o.width > x1 || base - 11 < y0 || base + 3 > y1) return false;
    for (let qx = left - 2; qx <= left + o.width + 2; qx += 3) {
      for (const pts of o.lines) { const ly = lineY(pts, qx); if (ly != null && ly > base - 14 && ly < base + 6) return false; }
    }
    // keep clear of the highlighted point itself
    return !(o.px > left - 6 && o.px < left + o.width + 6 && o.py > base - 16 && o.py < base + 8);
  };
  const cands: { x: number; y: number; anchor: "start" | "end" }[] = [];
  for (const dy of [-14, 22, -28, 36]) {
    cands.push({ x: o.px + 8, y: o.py + dy, anchor: "start" }, { x: o.px - 8, y: o.py + dy, anchor: "end" });
  }
  cands.push({ x: x0 + 6, y: y0 + 12, anchor: "start" }, { x: x1 - 4, y: y0 + 12, anchor: "end" }, { x: x1 - 4, y: y1 - 6, anchor: "end" });
  for (const c of cands) if (fits(c.anchor === "start" ? c.x : c.x - o.width, c.y)) return c;
  return { x: x0 + 6, y: y0 + 12, anchor: "start" };
}

type Impact = Extract<ImpactResult, { empty: false }>;

/** Climate Pulse-style headline cards: farm-region rain change, dry-spell change and ripple reach for the day. */
export function outcomeCardsHtml(imp: Impact, day: number, reach: number): string {
  const cls = (v: number) => (v < 0 ? "neg" : v > 0 ? "pos" : "");
  const pct = imp.rainChangePct == null ? "" : ` (${signed(imp.rainChangePct, 0)} %)`;
  return `
    <div class="kpi kpi-hero"><span class="kpi-k">Farm-region rain vs Prime · days ${imp.days[0]}–${imp.days[imp.days.length - 1]}</span>
      <b class="${cls(imp.rainChangeMm)}">${signed(imp.rainChangeMm, 1)} mm</b><span>${fmt(imp.prime.cumulativeRain, 1)} → ${fmt(imp.branch.cumulativeRain, 1)} mm${pct}</span></div>
    <div class="kpi"><span class="kpi-k">Longest dry spell</span><b class="${cls(-imp.drySpellChange)}">${signed(imp.drySpellChange, 0)} d</b><span>${imp.prime.longestDrySpell} → ${imp.branch.longestDrySpell} days</span></div>
    <div class="kpi"><span class="kpi-k">Ripple reach · day ${day}</span><b>${(reach * 100).toFixed(0)} %</b><span>cells outside the box changed</span></div>`;
}

export function indicatorTableHtml(res: Impact, branchRunNo: number, dry: number, heavy: number): string {
  const p = res.prime, b = res.branch;
  return `
    <p class="hint">${res.cells} land cells · days ${res.days[0]}–${res.days[res.days.length - 1]}</p>
    <table class="agri-table">
      <thead><tr><th></th><th>Prime</th><th>Branch #${branchRunNo}</th><th>Branch − Prime</th></tr></thead>
      <tbody>
        <tr><td>Cumulative rainfall</td><td class="mono">${fmt(p.cumulativeRain, 1)} mm</td><td class="mono">${fmt(b.cumulativeRain, 1)} mm</td><td class="mono">${signed(res.rainChangeMm, 1)} mm</td></tr>
        <tr><td>Longest dry spell</td><td class="mono">${p.longestDrySpell} d</td><td class="mono">${b.longestDrySpell} d</td><td class="mono">${signed(res.drySpellChange, 0)} d</td></tr>
        <tr><td>Dry days (&lt; ${dry} mm/day)</td><td class="mono">${p.dryDays}</td><td class="mono">${b.dryDays}</td><td class="mono">${signed(b.dryDays - p.dryDays, 0)}</td></tr>
        <tr><td>Heavy-rain exposure (≥ ${heavy} mm/day)</td><td class="mono">${fmt(100 * p.heavyShare, 1)} %</td><td class="mono">${fmt(100 * b.heavyShare, 1)} %</td><td class="mono">${signed(100 * (b.heavyShare - p.heavyShare), 1)} pp</td></tr>
        <tr><td>Mean 2 m temperature</td><td class="mono">${fmt(p.meanTempC, 1)} °C</td><td class="mono">${fmt(b.meanTempC, 1)} °C</td><td class="mono">${signed(b.meanTempC - p.meanTempC, 2)} K</td></tr>
      </tbody>
    </table>`;
}
