import { describe, expect, it } from "vitest";
import { multiverseStrip, scenarioReportHtml } from "../src/scenarios";

type Report = Parameters<typeof scenarioReportHtml>[0];
type Candidate = Report["candidates"][number];

const warm: Candidate = {
  recipe: "warm_ocean", amplitude: 2, amplitude_unit: "K", box: null, cost: 1,
  rain_mm: 115.6, within_b3_recommended_range: false, within_recommended_range: true, qualifies: true,
};
const wind: Candidate = {
  ...warm, recipe: "monsoon_stall", amplitude: -30, amplitude_unit: "%", cost: 2, rain_mm: 107.8, qualifies: false,
};

function report(overrides: Partial<Report> = {}): Report {
  return {
    checkpoint: { model_id: "e3_rainstab", sha256: "example" },
    days: [2, 3, 4], land_cells: 19, prime_daily_rain_mm: [20, 40, 53.1], prime_total_rain_mm: 113.1,
    baseline_meets_threshold: false, deficit_threshold_mm: null, rainfall_at_least_mm: 115,
    candidates: [wind, warm], best: { ...warm, rollout: null, perturbation: null },
    ensemble: {
      p10_cumulative_mm: [25, 51, 109], p50_cumulative_mm: [30, 58, 111], p90_cumulative_mm: [34, 63, 115],
      qualifying_count: 1, scenario_count: 2,
    },
    actions: [
      { name: "No supplemental water", daily_supplement_mm: 0, shortfall_mm_by_scenario: [10, 6], average_shortfall_mm: 8, worst_shortfall_mm: 10 },
      { name: "Supplement A", daily_supplement_mm: 2, shortfall_mm_by_scenario: [4, 2], average_shortfall_mm: 3, worst_shortfall_mm: 4 },
    ],
    ...overrides,
  };
}

describe("scenario decision results", () => {
  it("shows the rainfall target, winner and margin next to the water trade-off", () => {
    const html = scenarioReportHtml(report());
    expect(html).toContain("At least 115.00 mm total");
    expect(html).toContain("113.10 mm total");
    expect(html).toContain("Lowest-cost qualifying shock");
    expect(html).toContain("Exceeds the target by 0.60 mm");
    expect(html).toContain("Replay as Branch");
    expect(html).toMatch(/Supplement A<\/th>\s*<td class="mono">6\.00 mm<\/td>/);
    expect(html).toContain("<strong>4.00 mm</strong>");
    expect(html).toContain("6.00 mm less");
    expect(html.indexOf("Water shortfall trade-off")).toBeLessThan(html.indexOf("Rainfall ensemble"));
  });

  it("shows the wettest tested candidate when a total-rainfall target is missed", () => {
    const html = scenarioReportHtml(report({ best: null, rainfall_at_least_mm: 120 }));
    expect(html).toMatch(/Closest tested shock[\s\S]*Bay of Bengal \+2 K[\s\S]*Misses the target by 4.40 mm/);
    expect(html).not.toContain("Replay as Branch");
  });

  it("shows the driest tested candidate when a deficit target is missed", () => {
    const html = scenarioReportHtml(report({ best: null, rainfall_at_least_mm: null, deficit_threshold_mm: 7 }));
    expect(html).toContain("At least 7.00 mm below Prime");
    expect(html).toMatch(/Closest tested shock[\s\S]*Arabian Sea −30 %[\s\S]*Misses the target by 1.70 mm/);
  });

  it("labels a threshold Prime meets without assigning a shock", () => {
    const html = scenarioReportHtml(report({ best: null, baseline_meets_threshold: true, rainfall_at_least_mm: 110 }));
    expect(html).toContain("Prime already meets this rainfall target");
    expect(html).not.toContain("Closest tested shock");
    expect(html).not.toContain("Replay as Branch");
  });
});

describe("multiverse strip", () => {
  it("draws one dot per tested shock, fills the ones that reach the target and marks the winner", () => {
    const svg = multiverseStrip(report());
    expect(svg.match(/<circle /g)).toHaveLength(2);
    expect(svg.match(/class="mv-dot hit best"/g)).toHaveLength(1);
    expect(svg).toContain("Bay of Bengal +2 K: 115.60 mm (+2.50 mm vs Prime), reaches the target");
    expect(svg).toContain(">Prime<");
    expect(svg).toContain("Target: total ≥ 115.0 mm");
  });

  it("shades the drier side for a deficit target", () => {
    const svg = multiverseStrip(report({ rainfall_at_least_mm: null, deficit_threshold_mm: 5 }));
    expect(svg).toContain("Target: ≥ 5.00 mm drier");
  });
});
