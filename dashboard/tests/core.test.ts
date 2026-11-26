import { describe, expect, it } from "vitest";
import {
  CHANNEL_INFO, ContractError, type InitialState, NCELL, NCH, NLAT, NLON, T_IN, cellIndex, doySinCos, flatIndex, latOf, lonOf,
  nest, parseInitialState, parseRollout, type Rollout,
} from "../src/contract";
import { difference, displayField, maxAbs } from "../src/fields";
import { computeImpact, longestRun } from "../src/impact";
import { boxFromDegrees, boxMask } from "../src/region";
import { outsideMask, rippleFraction } from "../src/ripple";
import { PRESETS, ShockError, buildPerturbation, isZeroTensor } from "../src/shock";

function flatState(fill: (ch: number, i: number) => number): InitialState {
  const states = new Float32Array(T_IN * NCH * NCELL);
  for (let t = 0; t < T_IN; t++) for (let ch = 0; ch < NCH; ch++) for (let i = 0; i < NCELL; i++) states[(t * NCH + ch) * NCELL + i] = fill(ch, i);
  return { id: "x", label: "x", source: "file", states, doySinCos: doySinCos(196), meta: {} };
}
const physical = (ch: number) => [300, 5, 2, -1, 101000, 40][ch];

describe("grid orientation (official contract)", () => {
  it("maps [0,0] to 6.5N 65.5E and [31,35] to 37.5N 100.5E", () => {
    expect([latOf(0), lonOf(0)]).toEqual([6.5, 65.5]);
    expect([latOf(31), lonOf(35)]).toEqual([37.5, 100.5]);
  });

  it("selects contract boxes by cell centre, matching the kit's box_mask", () => {
    const bob = boxFromDegrees(8, 20, 82, 94)!; // lat 8.5..19.5 -> rows 2..13; lon 82.5..93.5 -> cols 17..28
    expect(bob).toEqual({ r0: 2, r1: 13, c0: 17, c1: 28 });
    const arab = boxFromDegrees(8, 20, 65, 75)!; // lon 65.5..74.5 -> cols 0..9
    expect(arab).toEqual({ r0: 2, r1: 13, c0: 0, c1: 9 });
  });

  it("flat index follows [t, channel, lat, lon] C order", () => {
    expect(flatIndex(0, 0, 0, 1)).toBe(1);
    expect(flatIndex(0, 0, 1, 0)).toBe(NLON);
    expect(flatIndex(0, 1, 0, 0)).toBe(NCELL);
  });
});

describe("contract parsing", () => {
  it("round-trips nested lists and validates a demo input", () => {
    const s = flatState((ch) => physical(ch));
    const parsed = parseInitialState({ init_states: nest(s.states, [3, 6, 32, 36]), doy_sincos: doySinCos(10) }, "f.json");
    expect(parsed.states).toEqual(s.states);
  });

  it("rejects wrong shapes, missing seasonal encoding and Celsius temperatures", () => {
    const s = flatState((ch) => physical(ch));
    expect(() => parseInitialState({ init_states: nest(s.states, [3, 6, 32, 36]) }, "f")).toThrow(/doy_sincos/);
    expect(() => parseInitialState({ init_states: [[1]], doy_sincos: [0, 1] }, "f")).toThrow(ContractError);
    const celsius = flatState((ch) => (ch === 0 ? 27 : physical(ch)));
    expect(() => parseInitialState({ init_states: nest(celsius.states, [3, 6, 32, 36]), doy_sincos: [0, 1] }, "f")).toThrow(/t2m/);
  });

  it("rejects a rollout whose horizon differs from the request", () => {
    const r = nest(new Float32Array(9 * NCH * NCELL), [9, 6, 32, 36]);
    expect(() => parseRollout({ rollout: r, inference_ms: 1 }, 10)).toThrow(/expected length 10/);
  });
});

describe("shock tensor", () => {
  const input = flatState((ch, i) => physical(ch) + (i % 7));

  it("fills only the selected cells and channels, from the final input day", () => {
    const spec = PRESETS.find((p) => p.id === "warm_ocean")!.spec();
    const d = buildPerturbation(input, spec);
    const mask = boxMask(spec.box);
    const tcwv = CHANNEL_INFO.tcwv.index, t2m = CHANNEL_INFO.t2m.index;
    for (let i = 0; i < NCELL; i++) {
      expect(d[t2m * NCELL + i]).toBeCloseTo(mask[i] ? 3 : 0, 6);
      const last = input.states[(2 * NCH + tcwv) * NCELL + i];
      expect(d[tcwv * NCELL + i]).toBeCloseTo(mask[i] ? 0.15 * last : 0, 4);
    }
    for (const ch of [1, 2, 3, 4]) for (let i = 0; i < NCELL; i++) expect(d[ch * NCELL + i]).toBe(0);
  });

  it("monsoon_stall scales each wind component by -40 % of the final day", () => {
    const d = buildPerturbation(input, PRESETS.find((p) => p.id === "monsoon_stall")!.spec());
    const i = cellIndex(5, 3);
    expect(d[2 * NCELL + i]).toBeCloseTo(-0.4 * input.states[(2 * NCH + 2) * NCELL + i], 5);
    expect(d[3 * NCELL + i]).toBeCloseTo(-0.4 * input.states[(2 * NCH + 3) * NCELL + i], 5);
  });

  it("never mutates the original input", () => {
    const before = input.states.slice();
    buildPerturbation(input, PRESETS[0].spec());
    expect(input.states).toEqual(before);
  });

  it("caps negative rain so the shocked state stays non-negative", () => {
    const spec = { box: { r0: 0, r1: 0, c0: 0, c1: 0 }, components: [{ channel: "tp" as const, mode: "add" as const, value: -100 }], label: "dry" };
    const d = buildPerturbation(input, spec);
    expect(d[CHANNEL_INFO.tp.index * NCELL]).toBeCloseTo(-input.states[(2 * NCH + 1) * NCELL], 6);
  });

  it("produces an exact zero tensor for a zero magnitude and rejects NaN", () => {
    const zero = buildPerturbation(input, { box: { r0: 3, r1: 4, c0: 3, c1: 4 }, components: [{ channel: "t2m", mode: "add", value: 0 }], label: "0" });
    expect(isZeroTensor(zero)).toBe(true);
    expect(() => buildPerturbation(input, { box: { r0: 0, r1: 0, c0: 0, c1: 0 }, components: [{ channel: "t2m", mode: "add", value: NaN }], label: "n" })).toThrow(ShockError);
  });
});

function rollout(steps: number, rain: (t: number, i: number) => number, temp = 300): Rollout {
  const data = new Float32Array(steps * NCH * NCELL);
  for (let t = 0; t < steps; t++) for (let i = 0; i < NCELL; i++) {
    data[(t * NCH + 0) * NCELL + i] = temp;
    data[(t * NCH + 1) * NCELL + i] = rain(t, i);
  }
  return { steps, data };
}

describe("difference and ripple", () => {
  it("identical rollouts give an exactly zero difference field", () => {
    const a = rollout(10, (t, i) => (t + i) % 9);
    const d = difference(displayField(a, 4, "tp"), displayField(a, 4, "tp"));
    expect(maxAbs(d)).toBe(0);
  });

  it("derives wind speed per timeline before differencing", () => {
    const a = rollout(1, () => 0), b = rollout(1, () => 0);
    a.data[2 * NCELL] = 3; a.data[3 * NCELL] = 4; // |v| = 5
    b.data[2 * NCELL] = -3; b.data[3 * NCELL] = -4; // |v| = 5, opposite direction
    expect(difference(displayField(a, 1, "wind"), displayField(b, 1, "wind"))[0]).toBe(0);
  });

  it("counts only cells outside the shock box", () => {
    const box = { r0: 0, r1: 0, c0: 0, c1: 0 };
    const diff = new Float32Array(NCELL);
    diff[0] = 100; // inside the box: ignored
    diff[1] = 2;
    expect(rippleFraction(diff, outsideMask(box), 1)).toBeCloseTo(1 / (NCELL - 1), 9);
  });
});

describe("agricultural indicators", () => {
  const land = new Float32Array(NCELL).fill(1);
  const region = boxMask({ r0: 10, r1: 11, c0: 10, c1: 11 });
  const base = { regionMask: region, landFraction: land, dayStart: 1, dayEnd: 10, dryThreshold: 2.5, heavyThreshold: 10 };

  it("computes cumulative rain, change vs Prime and longest dry spell", () => {
    const prime = rollout(10, () => 5);
    const branch = rollout(10, (t) => (t >= 2 && t <= 5 ? 0 : 5)); // days 3..6 dry
    const res = computeImpact(prime, branch, base);
    if (res.empty) throw new Error(res.reason);
    expect(res.prime.cumulativeRain).toBeCloseTo(50, 4);
    expect(res.branch.cumulativeRain).toBeCloseTo(30, 4);
    expect(res.rainChangeMm).toBeCloseTo(-20, 4);
    expect(res.rainChangePct).toBeCloseTo(-40, 4);
    expect(res.prime.longestDrySpell).toBe(0);
    expect(res.branch.longestDrySpell).toBe(4);
    expect(res.cells).toBe(4);
  });

  it("zero shock gives zero change", () => {
    const r = rollout(10, (t, i) => (t * 3 + i) % 11);
    const res = computeImpact(r, r, base);
    if (res.empty) throw new Error(res.reason);
    expect(res.rainChangeMm).toBe(0);
    expect(res.drySpellChange).toBe(0);
  });

  it("excludes sea cells and reports an empty land region", () => {
    const sea = new Float32Array(NCELL);
    const res = computeImpact(rollout(10, () => 1), rollout(10, () => 1), { ...base, landFraction: sea });
    expect(res.empty).toBe(true);
  });

  it("respects the selected forecast window and validates it", () => {
    const res = computeImpact(rollout(10, (t) => t), rollout(10, (t) => t), { ...base, dayStart: 3, dayEnd: 4 });
    if (res.empty) throw new Error(res.reason);
    expect(res.prime.cumulativeRain).toBeCloseTo(2 + 3, 4); // day 3 -> t=2, day 4 -> t=3
    expect(computeImpact(rollout(10, () => 1), rollout(10, () => 1), { ...base, dayEnd: 11 }).empty).toBe(true);
  });

  it("longestRun finds the longest consecutive true run", () => {
    expect(longestRun([true, true, false, true, true, true, false])).toBe(3);
    expect(longestRun([])).toBe(0);
  });
});

// keep NLAT referenced for clarity of the orientation tests
void NLAT;

describe("coastline contour", () => {
  it("traces the 0.5 land contour halfway between a land column and a sea column", async () => {
    const { coastline } = await import("../src/render");
    const land = new Float32Array(NCELL);
    for (let r = 0; r < NLAT; r++) for (let c = 0; c < 10; c++) land[r * NLON + c] = 1; // columns 0..9 land
    const segs = coastline(land);
    expect(segs.length).toBe(NLAT - 1); // one segment per row gap
    for (const [c0, , c1] of segs) {
      expect(c0).toBeCloseTo(9.5, 9);
      expect(c1).toBeCloseTo(9.5, 9);
    }
  });

  it("gives no coastline for an all-sea grid", async () => {
    const { coastline } = await import("../src/render");
    expect(coastline(new Float32Array(NCELL))).toHaveLength(0);
  });
});

describe("display helpers", () => {
  it("bilinear sampling returns exact values at cell centres and blends between them", async () => {
    const { sampleBilinear } = await import("../src/render");
    const f = new Float32Array(NCELL);
    f[cellIndex(5, 5)] = 10; f[cellIndex(5, 6)] = 20;
    expect(sampleBilinear(f, 5, 5)).toBe(10);
    expect(sampleBilinear(f, 5.5, 5)).toBeCloseTo(15, 9);
    expect(sampleBilinear(f, -3, -3)).toBe(0); // clamped at the edge, no wrap-around
  });

  it("labels forecast days from the last input day, across a month end", async () => {
    const { forecastDateLabel } = await import("../src/ui");
    expect(forecastDateLabel("2021-07-22", 1)).toBe("23 Jul");
    expect(forecastDateLabel("2021-07-22", 10)).toBe("1 Aug");
    expect(forecastDateLabel(undefined, 1)).toBe("");
  });

  it("makes dry rain and zero difference fully transparent", async () => {
    const { classedRainScale, divergingScale } = await import("../src/render");
    expect(classedRainScale().alpha(0.05)).toBe(0);
    expect(divergingScale("tp", 10).alpha(0)).toBe(0);
    expect(divergingScale("tp", 10).alpha(10)).toBeGreaterThan(0.9);
  });
});
