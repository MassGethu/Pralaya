import { ApiError, buildRequest, postScenario } from "./api";
import { type InitialState, NCH, NLAT, NLON, flattenExact, latOf, lonOf, parseRollout, type Rollout } from "./contract";
import { escapeHtml, fmt, signed } from "./format";
import { computeImpact } from "./impact";
import { type Box, boxFromDegrees, boxMask, describeBox } from "./region";
import type { ShockSpec } from "./shock";

type Recipe = "warm_ocean" | "monsoon_stall";
type Bounds = [number, number, number, number];
interface Candidate {
  recipe: Recipe;
  amplitude: number;
  amplitude_unit: string;
  box: Bounds | null;
  rain_mm: number;
  within_recommended_range?: boolean | null;
  within_b3_recommended_range: boolean;
  qualifies: boolean;
}

interface Report {
  checkpoint: { model_id: string; sha256: string };
  days: number[];
  land_cells: number;
  prime_daily_rain_mm: number[];
  prime_total_rain_mm: number;
  baseline_meets_threshold: boolean;
  candidates: Candidate[];
  best: (Candidate & { perturbation: unknown; rollout: unknown }) | null;
  ensemble: {
    p10_cumulative_mm: number[];
    p50_cumulative_mm: number[];
    p90_cumulative_mm: number[];
    qualifying_count: number;
    scenario_count: number;
  };
  actions: {
    name: string;
    daily_supplement_mm: number;
    shortfall_mm_by_scenario: number[];
    average_shortfall_mm: number;
    worst_shortfall_mm: number;
  }[];
}

interface Context { input: InitialState; prime: Rollout; land: Float32Array; primeRun: number }
export interface ScenarioReplay { spec: ShockSpec; delta: Float32Array; expected: Rollout; dayStart: number; dayEnd: number }

const RECIPES = {
  warm_ocean: { label: "Bay of Bengal", bounds: [8, 20, 82, 94] as Bounds, expanded: [-2, -1, -0.5, 0.5, 1, 1.5, 2, 3] },
  monsoon_stall: { label: "Arabian Sea", bounds: [8, 20, 65, 75] as Bounds, expanded: [-50, -40, -30, -20, -10, 10, 20, 30] },
};

const candidateLabel = (c: Candidate) => `${RECIPES[c.recipe].label} ${signed(c.amplitude, c.amplitude % 1 ? 1 : 0)} ${c.amplitude_unit}`;
const recommendedRange = (c: Candidate) => c.within_recommended_range === undefined ? c.within_b3_recommended_range : c.within_recommended_range;

function parseReport(value: unknown): Report {
  const r = value as Report;
  if (typeof r?.checkpoint?.model_id !== "string" || !Array.isArray(r.days) || !r.days.length || !r.days.every(Number.isInteger) ||
      !Number.isFinite(r.prime_total_rain_mm) || !Number.isInteger(r.land_cells) ||
      !Array.isArray(r.candidates) || !Array.isArray(r.actions) || !r.ensemble) {
    throw new Error("The scenario service returned an invalid report.");
  }
  for (const series of [r.prime_daily_rain_mm, r.ensemble.p10_cumulative_mm, r.ensemble.p50_cumulative_mm, r.ensemble.p90_cumulative_mm]) {
    if (!Array.isArray(series) || series.length !== r.days.length || !series.every(Number.isFinite)) {
      throw new Error("The scenario report has invalid rainfall values.");
    }
  }
  if (!r.candidates.every(c => Object.hasOwn(RECIPES, c.recipe) && Number.isFinite(c.amplitude) && Number.isFinite(c.rain_mm)) ||
      r.ensemble.scenario_count !== r.candidates.length || !Number.isInteger(r.ensemble.qualifying_count) ||
      (r.best !== null && (!r.best || !Object.hasOwn(RECIPES, r.best.recipe)))) {
    throw new Error("The scenario report has invalid candidates.");
  }
  return r;
}

function ensembleChart(r: Report): string {
  const { p10_cumulative_mm: low, p50_cumulative_mm: median, p90_cumulative_mm: high } = r.ensemble;
  let total = 0;
  const prime = r.prime_daily_rain_mm.map(v => (total += v));
  const left = 40, right = 296, top = 12, bottom = 104;
  const max = Math.max(1, ...high, ...prime);
  const x = (i: number) => r.days.length === 1 ? (left + right) / 2 : left + i * (right - left) / (r.days.length - 1);
  const y = (v: number) => bottom - v * (bottom - top) / max;
  const points = (series: number[]) => series.map((v, i) => `${x(i)},${y(v)}`);
  const grid = [0, max / 2, max].map(v => `<line x1="${left}" x2="${right}" y1="${y(v)}" y2="${y(v)}" class="grid"/><text x="${left - 6}" y="${y(v) + 3}" text-anchor="end" class="svg-tick">${fmt(v, max < 10 ? 1 : 0)}</text>`);
  const days = [...new Set([0, Math.floor((r.days.length - 1) / 2), r.days.length - 1])];
  return `<svg viewBox="0 0 322 127" role="img" aria-label="Cumulative rainfall in millimetres. Shaded 10th to 90th percentile, median and Prime.">
    ${grid.join("")}
    <polygon class="scenario-band" points="${[...points(low), ...points(high).reverse()].join(" ")}"/>
    ${r.days.length === 1 ? `<rect class="scenario-band" x="${x(0) - 8}" y="${y(high[0])}" width="16" height="${y(low[0]) - y(high[0])}"/>` : ""}
    <polyline class="scenario-prime" points="${points(prime).join(" ")}"/><circle class="scenario-prime-dot" cx="${x(prime.length - 1)}" cy="${y(prime.at(-1)!)}" r="2.4"/>
    <polyline class="scenario-median" points="${points(median).join(" ")}"/><circle class="scenario-median-dot" cx="${x(median.length - 1)}" cy="${y(median.at(-1)!)}" r="2.4"/>
    ${days.map(i => `<text x="${x(i)}" y="123" text-anchor="middle" class="svg-tick">Day ${r.days[i]}</text>`).join("")}
  </svg>`;
}

function resultHtml(r: Report): string {
  const best = r.best;
  const { qualifying_count: hits, scenario_count: count, p10_cumulative_mm: low, p90_cumulative_mm: high } = r.ensemble;
  const verdict = best
    ? `<p class="scenario-winner"><strong>${escapeHtml(candidateLabel(best))}</strong><br>${fmt(r.prime_total_rain_mm, 2)} → ${fmt(best.rain_mm, 2)} mm versus Prime</p>
       ${recommendedRange(best) === false ? '<p class="warn">Outside the recommended model range.</p>' : ""}
       <button type="button" id="scenario-replay" class="btn btn-shock">Replay as Branch</button>`
    : `<p class="scenario-winner">${r.baseline_meets_threshold ? "Prime already meets this rainfall threshold." : "No tested shock reaches this target."}</p>`;

  return `
    <section class="scenario-block" aria-labelledby="scenario-found">
      <h4 id="scenario-found">Search result</h4>${verdict}
      <p class="hint">${escapeHtml(r.checkpoint.model_id)} · ${r.land_cells} land cells · days ${r.days[0]}–${r.days.at(-1)}</p>
      ${r.candidates.some(c => recommendedRange(c) === null) ? '<p class="warn">Recommended ranges have not been established for this checkpoint.</p>' : ""}
      <details class="method"><summary>Tested shocks</summary><ul class="scenario-candidates">${r.candidates.map(c => `<li><span>${escapeHtml(candidateLabel(c))}${recommendedRange(c) === false ? ' <span class="warn">· outside range</span>' : ""}</span><span class="mono">${fmt(c.rain_mm, 2)} mm${c.qualifies ? ' <span class="pos">✓</span>' : ""}</span></li>`).join("")}</ul></details>
    </section>
    <section class="scenario-block" aria-labelledby="scenario-spread">
      <h4 id="scenario-spread">Rainfall ensemble</h4>
      <p><strong>${hits} of ${count}</strong> tested shocks reach the target.</p>
      ${ensembleChart(r)}
      <div class="scenario-chart-key"><span class="key-interval">10th–90th percentile</span><span class="key-median">Median</span><span class="key-prime">Prime</span></div>
      <p class="hint">Cumulative range on day ${r.days.at(-1)}: ${fmt(low.at(-1)!, 2)}–${fmt(high.at(-1)!, 2)} mm. Spread across the shocks tested.</p>
    </section>
    <section class="scenario-block" aria-labelledby="scenario-prep">
      <h4 id="scenario-prep">Preparedness comparison</h4>
      <table class="agri-table scenario-table"><thead><tr><th scope="col">Supplement</th><th scope="col">Avg. shortfall</th><th scope="col">Worst</th></tr></thead><tbody>
      ${r.actions.map(a => `<tr><th scope="row">${fmt(a.daily_supplement_mm, a.daily_supplement_mm % 1 ? 2 : 0)} mm/day</th><td class="mono">${fmt(a.average_shortfall_mm, 2)} mm</td><td class="mono">${fmt(a.worst_shortfall_mm, 2)} mm</td></tr>`).join("")}
      </tbody></table>
      <details class="method"><summary>Shortfall by scenario</summary><div class="scenario-table-scroll"><table class="agri-table scenario-table"><thead><tr><th scope="col">Shock</th>${r.actions.map(a => `<th scope="col">${fmt(a.daily_supplement_mm, 1)} mm/day</th>`).join("")}</tr></thead><tbody>${r.candidates.map((c, i) => `<tr><th scope="row">${escapeHtml(candidateLabel(c))}</th>${r.actions.map(a => `<td class="mono">${fmt(a.shortfall_mm_by_scenario[i], 2)} mm</td>`).join("")}</tr>`).join("")}</tbody></table></div></details>
      <p class="hint">Shortfall sums each day’s unmet water target using the assumptions above.</p>
    </section>`;
}

export class ScenarioPanel {
  private context: Context | null = null;
  private region: Box | null = null;
  private key = "";
  private pending: AbortController | null = null;
  private readonly form = document.querySelector<HTMLFormElement>("#scenario-form")!;
  private readonly submit = document.querySelector<HTMLButtonElement>("#run-scenarios")!;
  private readonly feedback = document.querySelector<HTMLElement>("#scenario-feedback")!;
  private readonly results = document.querySelector<HTMLElement>("#scenario-results")!;

  constructor(onDraw: () => void, private onReplay: (replay: ScenarioReplay) => Promise<void>) {
    document.querySelector("#scenario-draw")!.addEventListener("click", onDraw);
    this.form.addEventListener("input", () => this.reset());
    this.form.addEventListener("invalid", (event) => {
      const details = (event.target as HTMLElement).closest<HTMLDetailsElement>("details");
      if (details) details.open = true;
    }, true);
    this.form.addEventListener("submit", (event) => { event.preventDefault(); void this.run(); });
  }

  update(context: Context | null, region: Box) {
    const key = JSON.stringify([context?.input.id, context?.primeRun, region]);
    if (key === this.key) return;
    this.key = key;
    this.context = context;
    this.region = region;
    document.querySelector("#scenario-region")!.textContent = `Farm region · ${describeBox(region).split(" (")[0]}`;
    this.reset();
  }

  private reset() {
    this.pending?.abort();
    this.pending = null;
    this.results.replaceChildren();
    this.results.hidden = true;
    this.submit.textContent = "Run scenario search";
    this.submit.disabled = !this.context;
    this.feedback.className = "hint";
    this.feedback.textContent = this.context ? "" : "Load a history and run Prime on the trained server.";
  }

  private async run() {
    if (!this.context || !this.region) return;
    this.reset();
    const { input, prime, land } = this.context;
    const steps = prime.steps;
    const region = this.region;
    const control = (id: string) => document.querySelector<HTMLInputElement>(`#scenario-${id}`)!;
    const number = (id: string) => control(id).valueAsNumber;
    const start = number("start"), end = number("end");
    if (start > end || end > steps) {
      this.feedback.textContent = `Choose an ordered day range within days 1–${steps}.`;
      this.feedback.className = "err";
      return;
    }
    const { init_states, doy_sincos } = buildRequest(input, steps, null);
    const body = {
      init_states, doy_sincos, steps,
      impact_box: [latOf(region.r0), latOf(region.r1), lonOf(region.c0), lonOf(region.c1)],
      day_start: start, day_end: end,
      [control("objective").value]: number("threshold"),
      daily_water_target_mm: number("water"),
      actions: [{ name: "Supplement A", daily_supplement_mm: number("action-a") }, { name: "Supplement B", daily_supplement_mm: number("action-b") }],
      ...(control("expanded").checked ? {
        candidates: Object.entries(RECIPES).flatMap(([recipe, spec]) => spec.expanded.map(amplitude => ({ recipe, amplitude }))),
      } : {}),
    };
    const pending = new AbortController();
    this.pending = pending;
    this.submit.disabled = true;
    this.submit.textContent = "Running search…";
    this.feedback.textContent = "Forecasting the selected shocks.";
    try {
      const report = parseReport(await postScenario(body, pending.signal));
      if (this.pending !== pending) return;
      const primeImpact = computeImpact(prime, prime, {
        regionMask: boxMask(region), landFraction: land, dayStart: start, dayEnd: end, dryThreshold: 2.5, heavyThreshold: 10,
      });
      if (primeImpact.empty || primeImpact.cells !== report.land_cells ||
          !primeImpact.prime.dailyRain.every((value, i) => Math.abs(value - report.prime_daily_rain_mm[i]) <= 1e-4)) {
        throw new Error("Scenario Prime differs from the live dashboard run. Check that both services use the same checkpoint and run Prime again.");
      }
      this.results.innerHTML = resultHtml(report);
      this.results.hidden = false;
      this.feedback.textContent = `Evaluated ${report.ensemble.scenario_count} shocks.`;
      const button = this.results.querySelector<HTMLButtonElement>("#scenario-replay");
      button?.addEventListener("click", () => void this.replay(report, steps, button));
    } catch (err) {
      if (this.pending !== pending) return;
      this.feedback.className = "err";
      this.feedback.textContent = err instanceof ApiError && err.kind === "unreachable"
        ? "Scenario service unavailable. Start python -m scripts.scenario_service and try again."
        : (err as Error).message;
    } finally {
      if (this.pending === pending) {
        this.pending = null;
        this.submit.disabled = false;
        this.submit.textContent = "Run scenario search";
      }
    }
  }

  private async replay(report: Report, steps: number, button: HTMLButtonElement) {
    const best = report.best!;
    button.disabled = true;
    try {
      const box = boxFromDegrees(...(best.box ?? RECIPES[best.recipe].bounds));
      if (!box) throw new Error("The winning shock has an invalid region.");
      const components: ShockSpec["components"] = best.recipe === "warm_ocean"
        ? [{ channel: "t2m", mode: "add", value: best.amplitude }, { channel: "tcwv", mode: "percent", value: 5 * best.amplitude }]
        : [{ channel: "u10", mode: "percent", value: best.amplitude }, { channel: "v10", mode: "percent", value: best.amplitude }];
      await this.onReplay({
        spec: { box, components, label: candidateLabel(best) },
        delta: flattenExact(best.perturbation, [NCH, NLAT, NLON], "winning perturbation"),
        expected: parseRollout({ rollout: best.rollout }, steps),
        dayStart: report.days[0], dayEnd: report.days.at(-1)!,
      });
    } catch (err) {
      if (!button.isConnected) return;
      this.feedback.className = "err";
      this.feedback.textContent = (err as Error).message;
    } finally {
      button.disabled = false;
    }
  }
}
