import { describe, expect, it } from "vitest";
import { CHANNEL_INFO, type InitialState, NCELL, NCH, T_IN, doySinCos } from "../src/contract";
import { boxFromFields } from "../src/boxinput";
import { boxFromDegrees } from "../src/region";
import { buildPerturbation } from "../src/shock";
import { componentSummary, rainCap } from "../src/shocklabel";

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
