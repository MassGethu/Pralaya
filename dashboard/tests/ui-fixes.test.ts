import { describe, expect, it } from "vitest";
import { CHANNEL_INFO, type InitialState, NCELL, NCH, T_IN, doySinCos } from "../src/contract";
import { boxFromFields } from "../src/boxinput";
import { boxFromDegrees } from "../src/region";
import { buildPerturbation } from "../src/shock";
import { componentSummary, rainCap } from "../src/shocklabel";
import { calloutSpot, niceStep } from "../src/charts";

describe("typed shock box (bug 1: invalid coordinates must not fail silently)", () => {
  const T = (latMin: number, latMax: number, lonMin: number, lonMax: number) => ({ latMin, latMax, lonMin, lonMax });

  it("refuses lat min > max with a clear message and offers the swapped box", () => {
    const r = boxFromFields(T(25, 10, 82, 94));
    expect(r.kind).toBe("inverted");
    expect(r.box).toBeNull();
    expect(r.message).toBe("Lat min 25 is above lat max 10. The shock box was not changed.");
    expect(r.fix).toEqual(T(10, 25, 82, 94));
    expect(boxFromFields(r.fix!).box).toEqual(boxFromDegrees(10, 25, 82, 94));
  });

  it("names both pairs when latitude and longitude are inverted", () => {
    const r = boxFromFields(T(25, 10, 94, 82));
    expect(r.message).toMatch(/lat min 25 is above lat max 10 and lon min 94 is above lon max 82/i);
    expect(r.fix).toEqual(T(10, 25, 82, 94));
  });

  it("explains a box with no cell centres and keeps the old box", () => {
    const r = boxFromFields(T(40, 45, 82, 94));
    expect(r.kind).toBe("error");
    expect(r.box).toBeNull();
    expect(r.message).toMatch(/No 1° cell centre/);
    expect(r.message).toMatch(/6.5–37.5°N/);
  });

  it("offers no swap when the swapped box would still be empty", () => {
    expect(boxFromFields(T(45, 40, 82, 94)).fix).toBeUndefined();
  });

  it("rejects empty fields with a message", () => {
    const r = boxFromFields(T(NaN, 20, 82, 94));
    expect(r.kind).toBe("error");
    expect(r.message).toMatch(/all four/);
  });

  it("accepts a valid box silently, matching the region rule exactly", () => {
    expect(boxFromFields(T(8, 20, 82, 94))).toEqual({ box: { r0: 2, r1: 13, c0: 17, c1: 28 }, kind: "ok", message: "" });
  });
});

describe("rain-cap labels (bug 2: show the applied delta, not the requested one)", () => {
  // Last input day rain = 5 mm/day everywhere, so a −30 mm/day request is capped to −5.
  const input: InitialState = (() => {
    const states = new Float32Array(T_IN * NCH * NCELL);
    const tp = CHANNEL_INFO.tp.index;
    for (let t = 0; t < T_IN; t++) for (let i = 0; i < NCELL; i++) states[(t * NCH + tp) * NCELL + i] = 5;
    return { id: "x", label: "x", source: "file", states, doySinCos: doySinCos(196), meta: {} };
  })();
  const box = boxFromDegrees(8, 20, 82, 94)!;

  it("reports capped cells and the applied mean", () => {
    const spec = { box, label: "dry", components: [{ channel: "tp" as const, mode: "add" as const, value: -30 }] };
    const delta = buildPerturbation(input, spec);
    const cap = rainCap(input, spec, delta)!;
    expect(cap.capped).toBe(cap.cells);
    expect(cap.appliedMean).toBeCloseTo(-5, 5);
    const text = componentSummary(spec, input, delta);
    expect(text).toContain("capped so rain ≥ 0");
    expect(text).toContain("−5.0");
    expect(text).not.toContain("30");
  });

  it("leaves uncapped and non-rain components as typed", () => {
    const spec = { box, label: "s", components: [{ channel: "tp" as const, mode: "add" as const, value: -2 }, { channel: "t2m" as const, mode: "add" as const, value: 3 }] };
    const delta = buildPerturbation(input, spec);
    expect(rainCap(input, spec, delta)!.capped).toBe(0);
    expect(componentSummary(spec, input, delta)).toBe("tp −2.0 mm/day · t2m +3.0 K");
  });

  it("has no rain info when rain is not shocked", () => {
    const spec = { box, label: "s", components: [{ channel: "t2m" as const, mode: "add" as const, value: 3 }] };
    expect(rainCap(input, spec, buildPerturbation(input, spec))).toBeNull();
  });
});

describe("chart callout placement (never on a line)", () => {
  // The Impact chart's day-1 case: cumulative rain rises left to right from the bottom-left corner.
  const box: [number, number, number, number] = [38, 26, 370, 146];
  const rising: [number, number][] = [[38, 144], [93, 140], [148, 130], [203, 110], [259, 80], [314, 50], [370, 28]];
  const lineY = (qx: number) => {
    for (let i = 1; i < rising.length; i++) {
      const [ax, ay] = rising[i - 1], [bx, by] = rising[i];
      if (qx >= ax && qx <= bx) return ay + ((qx - ax) / (bx - ax)) * (by - ay);
    }
    return null;
  };
  for (const [px, py] of [rising[0], rising[3], rising[6]]) {
    it(`keeps the label off the line for the point at x=${px}`, () => {
      const width = 160;
      const spot = calloutSpot({ px, py, width, box, lines: [rising] });
      const left = spot.anchor === "start" ? spot.x : spot.x - width;
      expect(left).toBeGreaterThanOrEqual(box[0]);
      expect(left + width).toBeLessThanOrEqual(box[2]);
      for (let qx = left; qx <= left + width; qx += 2) {
        const ly = lineY(qx);
        if (ly != null) expect(ly < spot.y - 13 || ly > spot.y + 4).toBe(true);
      }
    });
  }
});

describe("chart axis steps", () => {
  it("rounds to 1, 2, 2.5 or 5 times a power of ten", () => {
    expect(niceStep(66.2 / 3)).toBe(25); // cumulative rain up to 66.2 mm -> 0 / 25 / 50 / 75
    expect(niceStep(0.3 / 3)).toBe(0.1);
    expect(niceStep(1.4)).toBe(2);
    expect(niceStep(7)).toBe(10);
  });
});
