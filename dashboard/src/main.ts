import { ApiError, type Health, health, simulate } from "./api";
import {
  CHANNELS, CHANNEL_INFO, CHANNEL_STD, type Channel, DEFAULT_STEPS, type InitialState, NCELL, NCH, NLON, type Rollout,
  latOf, lonOf, parseInitialState,
} from "./contract";
import { type ViewVar, VIEW_VARS, difference, displayField, maxAbs, sharedRange } from "./fields";
import { fixtureSimulate, syntheticInput } from "./fixture";
import { type ImpactResult, computeImpact } from "./impact";
import { type Box, boxCellCount, boxFromDegrees, boxMask, clampBox, describeBox } from "./region";
import { CITIES, MapView, type Scale, classedRainScale, divergingScale, landFrom, sequentialScale } from "./render";
import { RIPPLE_THRESHOLDS, outsideMask, rippleFraction } from "./ripple";
import { PRESETS, type ShockComponent, type ShockSpec, ShockError, buildPerturbation, summarisePerturbation } from "./shock";

// ---------------- state ----------------
type Engine = { kind: "live"; model: string } | { kind: "fixture" };
interface PrimeRun { rollout: Rollout; inputId: string; engine: Engine; ms: number | null; wallMs: number; runNo: number }
interface BranchRun extends PrimeRun { spec: ShockSpec | null; specKey: string; delta: Float32Array; zero: boolean }

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const fmt = (v: number, d = 2) => (Number.isFinite(v) ? v.toFixed(d) : "—");
const signed = (v: number, d = 2) => (v > 0 ? "+" : v < 0 ? "−" : "±") + Math.abs(v).toFixed(d);
const engineLabel = (e: Engine) => (e.kind === "live" ? `LIVE · ${e.model}` : "FIXTURE ENGINE");
const sameEngine = (a: Engine, b: Engine) => a.kind === b.kind && (a.kind === "fixture" || (b.kind === "live" && a.model === b.model));

const S = {
  land: new Float32Array(NCELL) as Float32Array<ArrayBufferLike>,
  input: null as InitialState | null,
  inputError: "",
  steps: DEFAULT_STEPS,
  prime: null as PrimeRun | null,
  branch: null as BranchRun | null,
  primeErr: "",
  branchErr: "",
  busy: { prime: false, branch: false },
  seq: { prime: 0, branch: 0 },
  ctrl: { prime: null as AbortController | null, branch: null as AbortController | null },
  runCounter: 0,
  shock: {
    box: boxFromDegrees(8, 20, 82, 94)!,
    components: [{ channel: "t2m", mode: "add", value: 3 }] as ShockComponent[],
    label: "Custom shock",
  } as ShockSpec,
  impactBox: boxFromDegrees(18, 26, 74, 84)!,
  brush: "shock" as "shock" | "impact",
  draft: null as Box | null,
  view: "tp" as ViewVar,
  day: 1,
  hover: null as number | null,
  fixtureEngine: false,
  health: null as Health | null,
};

const specKey = (s: ShockSpec) => JSON.stringify({ b: s.box, c: s.components });

// ---------------- boot ----------------
async function boot() {
  try {
    const res = await fetch("/static/static_fields.json");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const js = await res.json();
    S.land = landFrom(js.land_sea_mask);
  } catch (e) {
    showFatal(`Could not load local static fields (land-sea mask): ${(e as Error).message}`);
    return;
  }
  setupMaps();
  setupControls();
  pollHealth();
  setInterval(pollHealth, 5000);
  renderAll();
}

function showFatal(msg: string) {
  document.body.insertAdjacentHTML("afterbegin", `<div class="fatal">${msg}</div>`);
}

// ---------------- maps ----------------
let mapDiff: MapView, mapPrime: MapView, mapBranch: MapView, mapShock: MapView;

function setupMaps() {
  const geo = { land: S.land, cities: CITIES };
  mapDiff = new MapView($("map-diff"), 15, geo, true);
  mapPrime = new MapView($("map-prime"), 8, geo, true);
  mapBranch = new MapView($("map-branch"), 8, geo, true);
  mapShock = new MapView($("map-shock"), 7, geo, false);
  for (const m of [mapDiff, mapPrime, mapBranch]) {
    m.onHover = (cell, ev) => {
      S.hover = cell;
      renderMaps();
      renderTooltip(ev);
    };
    m.onBox = (b, final) => {
      const box = clampBox(b);
      if (!final) {
        S.draft = box;
      } else {
        S.draft = null;
        if (S.brush === "shock") S.shock = { ...S.shock, box, label: "Custom shock" };
        else S.impactBox = box;
      }
      renderAll();
    };
  }
}

// ---------------- controls ----------------
function setupControls() {
  $("steps-label").textContent = String(S.steps);
  $<HTMLInputElement>("file-input").addEventListener("change", onFile);
  $("load-fixture").addEventListener("click", () => setInput(syntheticInput(S.land)));
  $<HTMLInputElement>("fixture-engine").addEventListener("change", (e) => {
    S.fixtureEngine = (e.target as HTMLInputElement).checked;
    invalidateResults("engine changed");
    pollHealth();
    renderAll();
  });
  $("run-prime").addEventListener("click", runPrime);
  $("run-branch").addEventListener("click", () => runBranch(false));
  $("zero-check").addEventListener("click", () => runBranch(true));
  $("reset-shock").addEventListener("click", () => {
    S.shock = { box: boxFromDegrees(8, 20, 82, 94)!, components: [{ channel: "t2m", mode: "add", value: 0 }], label: "Custom shock" };
    renderAll();
  });
  $("add-comp").addEventListener("click", () => {
    const used = new Set(S.shock.components.map((c) => c.channel));
    const ch = CHANNELS.find((c) => !used.has(c)) ?? "t2m";
    S.shock = { ...S.shock, components: [...S.shock.components, { channel: ch, mode: "add", value: 0 }], label: "Custom shock" };
    renderAll();
  });
  const preset = $<HTMLSelectElement>("preset");
  for (const p of PRESETS) preset.add(new Option(p.label, p.id));
  preset.addEventListener("change", () => {
    const p = PRESETS.find((x) => x.id === preset.value);
    if (p) S.shock = p.spec();
    preset.value = "";
    renderAll();
  });
  for (const id of ["shock-lat0", "shock-lat1", "shock-lon0", "shock-lon1"]) {
    $<HTMLInputElement>(id).addEventListener("change", () => {
      const v = (k: string) => Number($<HTMLInputElement>(k).value);
      const box = boxFromDegrees(v("shock-lat0"), v("shock-lat1"), v("shock-lon0"), v("shock-lon1"));
      if (box) S.shock = { ...S.shock, box, label: "Custom shock" };
      else $("shock-preview").innerHTML = `<p class="err">No cell centres inside that box.</p>`;
      renderAll();
    });
  }
  document.querySelectorAll<HTMLButtonElement>("[data-brush]").forEach((b) =>
    b.addEventListener("click", () => {
      S.brush = b.dataset.brush as "shock" | "impact";
      renderAll();
    }),
  );
  const seg = $("var-seg");
  for (const v of VIEW_VARS) {
    const b = document.createElement("button");
    b.className = "seg-btn";
    b.innerHTML = `${VAR_ICONS[v.id]}<span>${v.label}</span>`;
    b.dataset.var = v.id;
    b.addEventListener("click", () => { S.view = v.id; renderAll(); });
    seg.append(b);
  }
  const step = (d: number) => {
    const steps = S.prime?.rollout.steps ?? S.steps;
    const next = Math.min(steps, Math.max(1, S.day + d));
    if (next !== S.day) { S.day = next; renderAll(); }
  };
  $("day-play").addEventListener("click", togglePlay);
  $("day-prev").addEventListener("click", () => { stopPlay(); step(-1); });
  $("day-next").addEventListener("click", () => { stopPlay(); step(1); });
  $("day-strip").addEventListener("click", (e) => {
    const b = (e.target as HTMLElement).closest<HTMLButtonElement>("[data-day]");
    if (b) { stopPlay(); S.day = Number(b.dataset.day); renderAll(); }
  });
  document.querySelectorAll<HTMLButtonElement>("[data-agri-mode]").forEach((b) =>
    b.addEventListener("click", () => { agriMode = b.dataset.agriMode as "abs" | "change"; renderAgri(); }),
  );
  // ← / → step through forecast days unless the user is typing in a field.
  document.addEventListener("keydown", (e) => {
    if ((e.target as HTMLElement).closest("input, select, textarea")) return;
    if (e.key === "ArrowLeft") { stopPlay(); step(-1); e.preventDefault(); }
    if (e.key === "ArrowRight") { stopPlay(); step(1); e.preventDefault(); }
  });
  for (const id of ["agri-d0", "agri-d1", "agri-dry", "agri-heavy"]) $(id).addEventListener("input", () => { renderAgri(); renderOutcome(); });
}

async function onFile(e: Event) {
  const f = (e.target as HTMLInputElement).files?.[0];
  if (!f) return;
  try {
    const js = JSON.parse(await f.text());
    setInput(parseInitialState(js, f.name));
  } catch (err) {
    S.input = null;
    S.inputError = `${f.name}: ${(err as Error).message}`;
    invalidateResults("input rejected");
    renderAll();
  } finally {
    (e.target as HTMLInputElement).value = "";
  }
}

function setInput(inp: InitialState) {
  S.input = inp;
  S.inputError = "";
  invalidateResults("new input");
  renderAll();
}

/** Any change of input or engine voids earlier results and cancels in-flight requests. */
function invalidateResults(_why: string) {
  stopPlay();
  S.ctrl.prime?.abort();
  S.ctrl.branch?.abort();
  S.seq.prime++;
  S.seq.branch++;
  S.busy = { prime: false, branch: false };
  S.prime = null;
  S.branch = null;
  S.primeErr = "";
  S.branchErr = "";
}

function currentEngine(): Engine | null {
  if (S.fixtureEngine) return { kind: "fixture" };
  if (S.health?.ready) return { kind: "live", model: S.health.modelName ?? "unnamed" };
  return null;
}

async function pollHealth() {
  if (S.fixtureEngine) { renderStatus(); return; }
  S.health = await health();
  renderStatus();
  renderButtons();
}

async function execute(perturbation: Float32Array | null, slot: "prime" | "branch"): Promise<{ r: Rollout; ms: number | null; wall: number; engine: Engine } | null> {
  const input = S.input!;
  const engine = currentEngine();
  if (!engine) throw new ApiError("unreachable", "inference server is not ready (POST /health)");
  if (engine.kind === "fixture") {
    const t0 = performance.now();
    const r = fixtureSimulate(input, S.steps, perturbation);
    return { r, ms: null, wall: performance.now() - t0, engine };
  }
  S.ctrl[slot]?.abort();
  const ctrl = new AbortController();
  S.ctrl[slot] = ctrl;
  const res = await simulate(input, S.steps, perturbation, ctrl.signal);
  return { r: res, ms: res.inferenceMs, wall: res.wallMs, engine };
}

async function runPrime() {
  if (!S.input) return;
  const seq = ++S.seq.prime;
  const inputId = S.input.id;
  S.busy.prime = true; S.primeErr = "";
  renderAll();
  try {
    const out = await execute(null, "prime");
    if (seq !== S.seq.prime || S.input?.id !== inputId || !out) return; // superseded
    S.prime = { rollout: out.r, inputId, engine: out.engine, ms: out.ms, wallMs: out.wall, runNo: ++S.runCounter };
    if (S.branch && !sameEngine(S.branch.engine, out.engine)) S.branch = null;
    S.day = Math.min(S.day, out.r.steps);
  } catch (e) {
    if (seq !== S.seq.prime || (e instanceof ApiError && e.kind === "aborted")) return;
    S.primeErr = (e as Error).message;
  } finally {
    if (seq === S.seq.prime) S.busy.prime = false;
    renderAll();
  }
}

async function runBranch(zero: boolean) {
  if (!S.input || !S.prime) return;
  let delta: Float32Array;
  const spec = zero ? null : structuredClone(S.shock);
  try {
    delta = zero ? new Float32Array(NCH * NCELL) : buildPerturbation(S.input, spec!);
  } catch (e) {
    S.branchErr = e instanceof ShockError ? e.message : String(e);
    renderAll();
    return;
  }
  const seq = ++S.seq.branch;
  const inputId = S.input.id;
  S.busy.branch = true; S.branchErr = "";
  renderAll();
  try {
    const out = await execute(delta, "branch");
    if (seq !== S.seq.branch || S.input?.id !== inputId || !out) return;
    S.branch = {
      rollout: out.r, inputId, engine: out.engine, ms: out.ms, wallMs: out.wall, runNo: ++S.runCounter,
      spec, specKey: spec ? specKey(spec) : "zero", delta, zero,
    };
    flash(document.querySelector(".map-hero"));
  } catch (e) {
    if (seq !== S.seq.branch || (e instanceof ApiError && e.kind === "aborted")) return;
    S.branchErr = (e as Error).message;
  } finally {
    if (seq === S.seq.branch) S.busy.branch = false;
    renderAll();
  }
}

// ---------------- derived ----------------
/** Branch and Prime are comparable only if made from the same input, horizon and engine. */
function comparable(): boolean {
  const p = S.prime, b = S.branch;
  return !!(p && b && S.input && p.inputId === S.input.id && b.inputId === S.input.id && p.rollout.steps === b.rollout.steps && sameEngine(p.engine, b.engine));
}

// Memoised per (prime run, branch run, variable) so hover redraws stay cheap.
const memo = new Map<string, unknown>();
function cached<T>(key: string, f: () => T): T {
  const k = `${S.prime?.runNo ?? 0}|${S.branch?.runNo ?? 0}|${S.view}|${key}`;
  if (!memo.has(k)) { if (memo.size > 64) memo.clear(); memo.set(k, f()); }
  return memo.get(k) as T;
}

function absScale(): Scale | null {
  return cached("abs", absScaleRaw);
}

function absScaleRaw(): Scale | null {
  if (S.view === "tp" && (S.prime || S.branch)) return classedRainScale();
  const fields: Float32Array[] = [];
  for (const run of [S.prime, S.branch]) {
    if (!run) continue;
    for (let d = 1; d <= run.rollout.steps; d++) fields.push(displayField(run.rollout, d, S.view));
  }
  if (!fields.length) return null;
  const [lo, hi] = sharedRange(fields);
  return sequentialScale(S.view, S.view === "tp" ? 0 : lo, hi);
}

function diffFields(): Float32Array[] | null {
  if (!comparable()) return null;
  return cached("diff", diffFieldsRaw);
}

function diffFieldsRaw(): Float32Array[] {
  const out: Float32Array[] = [];
  for (let d = 1; d <= S.prime!.rollout.steps; d++) {
    out.push(difference(displayField(S.prime!.rollout, d, S.view), displayField(S.branch!.rollout, d, S.view)));
  }
  return out;
}

const varInfo = () => VIEW_VARS.find((v) => v.id === S.view)!;

// ---------------- rendering ----------------
function renderAll() {
  renderStatus();
  renderInputInfo();
  renderShockControls();
  renderButtons();
  renderToolbar();
  renderMaps();
  renderRipple();
  renderAgri();
}

function renderStatus() {
  const pill = $("engine-pill");
  if (S.fixtureEngine) { pill.dataset.state = "fixture"; pill.textContent = "FIXTURE ENGINE (toy, not the model)"; }
  else if (!S.health) { pill.dataset.state = "unknown"; pill.textContent = "Checking server…"; }
  else if (S.health.ready) { pill.dataset.state = "ok"; pill.textContent = `Server ready · ${S.health.modelName ?? "unnamed model"}`; }
  else { pill.dataset.state = "down"; pill.textContent = `Server unavailable · ${S.health.detail}`; pill.title = S.health.detail; }
  const ip = $("input-pill");
  if (!S.input) { ip.dataset.state = "idle"; ip.textContent = "No initial state"; }
  else if (S.input.source === "synthetic-fixture") { ip.dataset.state = "fixture"; ip.textContent = "Synthetic fixture input"; }
  else { ip.dataset.state = "ok"; ip.textContent = S.input.label; }
  const fixtureOn = S.fixtureEngine || S.input?.source === "synthetic-fixture";
  $("fixture-banner").hidden = !fixtureOn;
  document.body.classList.toggle("is-fixture", fixtureOn);
}

function renderInputInfo() {
  const el = $("input-info");
  if (S.inputError) { el.innerHTML = `<p class="err">${escapeHtml(S.inputError)}</p>`; return; }
  if (!S.input) { el.innerHTML = ""; return; }
  const m = S.input.meta;
  const doy = typeof m.day_of_year === "number" ? m.day_of_year : null;
  const ang = Math.atan2(S.input.doySinCos[0], S.input.doySinCos[1]);
  const derivedDoy = Math.round(((ang < 0 ? ang + 2 * Math.PI : ang) * 365) / (2 * Math.PI));
  el.innerHTML = `
    <dl class="kv">
      <dt>Source</dt><dd>${escapeHtml(S.input.label)}</dd>
      ${m.last_input_day ? `<dt>Last input day</dt><dd class="mono">${escapeHtml(String(m.last_input_day))}</dd>` : ""}
      <dt>doy_sincos</dt><dd class="mono">[${fmt(S.input.doySinCos[0], 4)}, ${fmt(S.input.doySinCos[1], 4)}] ≈ doy ${doy ?? derivedDoy}</dd>
      <dt>Shape</dt><dd class="mono">[3, 6, 32, 36] ✓ finite, physical ranges ✓</dd>
    </dl>`;
}

function renderShockControls() {
  const b = S.shock.box;
  const set = (id: string, v: number) => { const el = $<HTMLInputElement>(id); if (document.activeElement !== el) el.value = v.toFixed(1); };
  set("shock-lat0", latOf(b.r0)); set("shock-lat1", latOf(b.r1)); set("shock-lon0", lonOf(b.c0)); set("shock-lon1", lonOf(b.c1));
  document.querySelectorAll<HTMLButtonElement>("[data-brush]").forEach((x) => x.setAttribute("aria-pressed", String(x.dataset.brush === S.brush)));

  const wrap = $("components");
  wrap.replaceChildren();
  S.shock.components.forEach((comp, idx) => {
    const row = document.createElement("div");
    row.className = "comp";
    const ch = document.createElement("select");
    for (const c of CHANNELS) ch.add(new Option(`${c} (${CHANNEL_INFO[c].unit})`, c, false, c === comp.channel));
    const mode = document.createElement("select");
    mode.add(new Option("add Δ", "add", false, comp.mode === "add"));
    mode.add(new Option("% of day 3", "percent", false, comp.mode === "percent"));
    const val = document.createElement("input");
    val.type = "number"; val.step = "any"; val.value = String(comp.value);
    const unit = document.createElement("span");
    unit.className = "unit";
    unit.textContent = comp.mode === "percent" ? "%" : CHANNEL_INFO[comp.channel].unit;
    const rm = document.createElement("button");
    rm.className = "btn btn-icon"; rm.textContent = "×"; rm.title = "Remove"; rm.setAttribute("aria-label", "Remove variable");
    const update = (patch: Partial<ShockComponent>) => {
      const comps = S.shock.components.map((c, i) => (i === idx ? { ...c, ...patch } : c));
      S.shock = { ...S.shock, components: comps, label: "Custom shock" };
      renderAll();
    };
    ch.addEventListener("change", () => update({ channel: ch.value as Channel }));
    mode.addEventListener("change", () => update({ mode: mode.value as "add" | "percent" }));
    val.addEventListener("change", () => update({ value: val.value.trim() === "" ? NaN : Number(val.value) }));
    rm.addEventListener("click", () => {
      S.shock = { ...S.shock, components: S.shock.components.filter((_, i) => i !== idx) };
      renderAll();
    });
    row.append(ch, mode, val, unit, rm);
    wrap.append(row);
  });

  const pv = $("shock-preview");
  const lines = [`<p><b>${escapeHtml(S.shock.label)}</b> · ${boxCellCount(b)} cells · ${describeBox(b)}</p>`];
  if (!S.input) lines.push(`<p class="hint">Load an initial state to see the physical delta per cell.</p>`);
  else {
    try {
      const delta = buildPerturbation(S.input, S.shock);
      const sums = summarisePerturbation(delta, S.shock);
      lines.push(
        `<table class="mini"><thead><tr><th>Channel</th><th>Δ min</th><th>Δ mean</th><th>Δ max</th></tr></thead><tbody>` +
          sums.map((s) => `<tr><td>${s.channel} <span class="unit">${CHANNEL_INFO[s.channel].unit}</span></td><td class="mono">${signed(s.min, 3)}</td><td class="mono">${signed(s.mean, 3)}</td><td class="mono">${signed(s.max, 3)}</td></tr>`).join("") +
          `</tbody></table>`,
      );
    } catch (e) {
      lines.push(`<p class="err">${escapeHtml((e as Error).message)}</p>`);
    }
  }
  pv.innerHTML = lines.join("");
}

function renderButtons() {
  const engine = currentEngine();
  const primeBtn = $<HTMLButtonElement>("run-prime");
  primeBtn.disabled = !S.input || S.busy.prime || !engine;
  primeBtn.textContent = S.busy.prime ? "Running Prime…" : S.prime ? "Re-run Prime" : "Run Prime";
  const ok = !!S.input && !!S.prime && S.prime.inputId === S.input.id && !!engine;
  $<HTMLButtonElement>("run-branch").disabled = !ok || S.busy.branch;
  $<HTMLButtonElement>("run-branch").textContent = S.busy.branch ? "Running Branch…" : "Run Branch";
  $<HTMLButtonElement>("zero-check").disabled = !ok || S.busy.branch;

  const pi = $("prime-info");
  if (S.primeErr) pi.innerHTML = `<p class="err">Prime failed: ${escapeHtml(S.primeErr)}</p>`;
  else if (S.busy.prime) pi.innerHTML = `<p class="hint pulse">Waiting for /simulate…</p>`;
  else {
    const down = !engine && S.input ? `<p class="err">Server not ready (${escapeHtml(S.health?.detail ?? "no answer")}). Start it with <code>python serve.py --port 8000</code>; results below stay tied to their run numbers.</p>` : "";
    const last = S.prime ? `<p class="ok">Run #${S.prime.runNo} · ${engineLabel(S.prime.engine)} · ${S.prime.rollout.steps} days · ${S.prime.ms != null ? `${fmt(S.prime.ms, 0)} ms server` : ""} ${fmt(S.prime.wallMs, 0)} ms round trip</p>` : "";
    pi.innerHTML = down + last;
  }

  const bi = $("branch-info");
  if (S.branchErr) bi.innerHTML = `<p class="err">Branch failed: ${escapeHtml(S.branchErr)}</p>`;
  else if (S.busy.branch) bi.innerHTML = `<p class="hint pulse">Waiting for /simulate…</p>`;
  else if (S.branch && S.prime && comparable()) {
    if (S.branch.zero) {
      const rows = CHANNELS.map((c, ch) => {
        let m = 0;
        const a = S.prime!.rollout.data, b = S.branch!.rollout.data;
        for (let t = 0; t < S.prime!.rollout.steps; t++) {
          const base = (t * NCH + ch) * NCELL;
          for (let i = 0; i < NCELL; i++) m = Math.max(m, Math.abs(a[base + i] - b[base + i]));
        }
        const tol = 1e-3 * CHANNEL_STD[ch];
        return { c, m, tol, pass: m <= tol };
      });
      const allPass = rows.every((r) => r.pass);
      bi.innerHTML = `<p class="${allPass ? "ok" : "err"}">Zero-shock check ${allPass ? "passed" : "FAILED"}: max |Branch − Prime| per channel (tolerance 1e-3 × std)</p>
        <table class="mini"><tbody>${rows.map((r) => `<tr><td>${r.c}</td><td class="mono">${r.m.toExponential(2)}</td><td class="mono">≤ ${r.tol.toExponential(1)}</td><td>${r.pass ? "✓" : "✗"}</td></tr>`).join("")}</tbody></table>`;
    } else {
      bi.innerHTML = `<p class="ok">Run #${S.branch.runNo} · ${engineLabel(S.branch.engine)} · ${S.branch.ms != null ? `${fmt(S.branch.ms, 0)} ms server` : ""} ${fmt(S.branch.wallMs, 0)} ms round trip</p>`;
    }
  } else bi.innerHTML = "";
}

function renderToolbar() {
  document.querySelectorAll<HTMLButtonElement>("#var-seg .seg-btn").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.var === S.view)));
  const steps = S.prime?.rollout.steps ?? S.steps;
  renderDayStrip(steps);
  $("day-out").textContent = `Day ${S.day} of ${steps}`;
  renderOutcome();

  const line = $("scenario-line");
  if (!S.branch) {
    line.innerHTML = S.prime ? `<span>Prime run #${S.prime.runNo} ready. Choose a shock and run Branch.</span>` : "";
    line.dataset.state = "idle";
    return;
  }
  const b = S.branch;
  const title = b.zero ? "Zero shock (all-zero tensor)" : `${escapeHtml(b.spec!.label)} · ${describeBox(b.spec!.box)}`;
  const stale = !b.zero && b.specKey !== specKey(S.shock);
  line.dataset.state = stale ? "stale" : "current";
  line.innerHTML = `<span class="tag">Branch #${b.runNo}</span><span>${title}</span>${
    b.spec ? `<span class="mono">${b.spec.components.map((c) => `${c.channel} ${c.mode === "add" ? signed(c.value, 2) + " " + CHANNEL_INFO[c.channel].unit : signed(c.value, 0) + " %"}`).join(" · ")}</span>` : ""
  }${stale ? `<span class="warn">Shock edited since this run — maps show Branch #${b.runNo}. Run Branch to update.</span>` : ""}`;
}

// ---------------- play through forecast days (Ventusky-style timeline) ----------------
const PLAY_MS = 900;
let playTimer: number | null = null;
function stopPlay() {
  if (playTimer != null) { clearInterval(playTimer); playTimer = null; }
  const b = $("day-play"); b.textContent = "▶"; b.setAttribute("aria-label", "Play forecast days"); b.setAttribute("aria-pressed", "false");
}
function togglePlay() {
  if (playTimer != null) { stopPlay(); return; }
  const steps = S.prime?.rollout.steps ?? S.steps;
  if (S.day >= steps) S.day = 1; // replay from the start
  const b = $("day-play"); b.textContent = "❚❚"; b.setAttribute("aria-label", "Pause"); b.setAttribute("aria-pressed", "true");
  renderAll();
  playTimer = window.setInterval(() => {
    const n = S.prime?.rollout.steps ?? S.steps;
    if (S.day >= n) { stopPlay(); return; }
    S.day += 1; renderAll();
  }, PLAY_MS);
}

const svgIcon = (d: string) => `<svg class="vi" viewBox="0 0 16 16" aria-hidden="true"><path d="${d}"/></svg>`;
const VAR_ICONS: Record<ViewVar, string> = {
  tp: svgIcon("M8 1.5C8 1.5 3.5 7 3.5 10a4.5 4.5 0 0 0 9 0C12.5 7 8 1.5 8 1.5z"),
  t2m: svgIcon("M6.5 2.5a1.5 1.5 0 0 1 3 0v6.8a3 3 0 1 1-3 0z"),
  wind: svgIcon("M1.5 6h8a2 2 0 1 0-2-2M1.5 10h10.5a2 2 0 1 1-2 2"),
  u10: svgIcon("M2 8h11M9.5 4.5 13 8l-3.5 3.5"),
  v10: svgIcon("M8 14V3M4.5 6.5 8 3l3.5 3.5"),
  msl: svgIcon("M2.5 11a5.5 5.5 0 0 1 11 0M8 11l2.5-3.5"),
  tcwv: svgIcon("M4.5 11.5h7.5a2.5 2.5 0 0 0 0-5 4 4 0 0 0-7.6-1A3 3 0 0 0 4.5 11.5z"),
};

let agriMode: "abs" | "change" = "abs";

/** Ripple reach per day for the active view, or null when there is no non-zero Branch. */
function rippleSeries(): number[] | null {
  const diffs = diffFields();
  if (!diffs || !S.branch || S.branch.zero) return null;
  return cached(`ripple`, () => {
    const out = outsideMask(S.branch!.spec!.box);
    return diffs.map((d) => rippleFraction(d, out, RIPPLE_THRESHOLDS[S.view]));
  });
}

function renderDayStrip(steps: number) {
  const strip = $("day-strip");
  const ripple = rippleSeries();
  if (strip.childElementCount !== steps) {
    strip.replaceChildren();
    for (let d = 1; d <= steps; d++) {
      const b = document.createElement("button");
      b.className = "day-stop";
      b.dataset.day = String(d);
      b.setAttribute("role", "radio");
      b.innerHTML = `<span class="day-n">${d}</span><span class="day-bar"><i></i></span>`;
      strip.append(b);
    }
  }
  strip.querySelectorAll<HTMLButtonElement>(".day-stop").forEach((b) => {
    const d = Number(b.dataset.day);
    b.setAttribute("aria-checked", String(d === S.day));
    b.tabIndex = d === S.day ? 0 : -1;
    const v = ripple ? ripple[d - 1] : 0;
    // Bars are relative to the largest day so the trend is visible; the tooltip gives the absolute share.
    const peak = ripple ? Math.max(...ripple) : 0;
    b.querySelector<HTMLElement>(".day-bar i")!.style.transform = `scaleX(${peak > 0 ? v / peak : 0})`;
    b.title = ripple ? `Day ${d}: ripple reach ${(v * 100).toFixed(1)} % of cells outside the shock box (bar relative to the largest day)` : `Forecast day ${d}`;
  });
  $<HTMLButtonElement>("day-prev").disabled = S.day <= 1;
  $<HTMLButtonElement>("day-next").disabled = S.day >= steps;
}

function currentImpact(): ImpactResult | null {
  if (!comparable()) return null;
  const num = (id: string) => Number($<HTMLInputElement>(id).value);
  return computeImpact(S.prime!.rollout, S.branch!.rollout, {
    regionMask: boxMask(S.impactBox), landFraction: S.land,
    dayStart: num("agri-d0"), dayEnd: num("agri-d1"), dryThreshold: num("agri-dry"), heavyThreshold: num("agri-heavy"),
  });
}

/** Signature ribbon: shock → reach on the selected day → farm-region outcome, all from the same two rollouts. */
function renderOutcome() {
  const el = $("outcome");
  const diffs = diffFields();
  if (!diffs || !S.branch || S.branch.zero) { el.hidden = true; return; }
  el.hidden = false;
  const vi = varInfo();
  const ripple = rippleSeries();
  const reach = ripple ? ripple[S.day - 1] : 0;
  const peak = maxAbs(diffs[S.day - 1]);
  const imp = currentImpact();
  const farm = !imp || imp.empty
    ? `<span class="hint">${escapeHtml(imp?.empty ? imp.reason : "—")}</span>`
    : `<b class="mono ${imp.rainChangeMm < 0 ? "neg" : imp.rainChangeMm > 0 ? "pos" : ""}">${signed(imp.rainChangeMm, 1)} mm</b><span>rain, days ${imp.days[0]}–${imp.days[imp.days.length - 1]} · dry spell ${signed(imp.drySpellChange, 0)} d</span>`;
  el.innerHTML = `
    <div class="oc oc-shock"><span class="oc-k">Shock</span><span>${escapeHtml(S.branch.spec!.label)}</span></div>
    <div class="oc-arrow" aria-hidden="true">→</div>
    <div class="oc"><span class="oc-k">Day ${S.day} reach</span><b class="mono">${(reach * 100).toFixed(0)} %</b><span>of cells outside the box · peak |Δ| ${fmt(peak, 2)} ${escapeHtml(vi.deltaUnit)}</span></div>
    <div class="oc-arrow" aria-hidden="true">→</div>
    <div class="oc oc-farm"><span class="oc-k">Farm region vs Prime</span>${farm}</div>`;
}

function renderMaps() {
  const vi = varInfo();
  const ov = { shockBox: S.branch?.spec?.box ?? S.shock.box, impactBox: S.impactBox, draftBox: S.draft, draftKind: S.brush, hoverCell: S.hover };
  const scale = absScale();
  const pf = S.prime ? displayField(S.prime.rollout, S.day, S.view) : null;
  const bf = S.branch && S.prime && comparable() ? displayField(S.branch.rollout, S.day, S.view) : null;
  mapPrime.draw(pf, scale, ov, S.busy.prime ? "Running…" : "Run Prime");
  mapBranch.draw(bf, scale, ov, S.busy.branch ? "Running…" : "Run Branch");
  $("cap-prime").textContent = S.prime ? `${engineLabel(S.prime.engine)} · day ${S.day} · ${vi.unit}` : "";
  $("cap-branch").textContent = bf ? `${engineLabel(S.branch!.engine)} · day ${S.day} · ${vi.unit}` : "";
  legend($("legend-abs"), scale, vi.unit, "Shared scale, Prime & Branch, all days");

  const diffs = diffFields();
  if (diffs) {
    const m = Math.max(...diffs.map(maxAbs));
    const ds = divergingScale(S.view, m);
    mapDiff.draw(diffs[S.day - 1], ds, ov);
    $("cap-diff").textContent = m === 0 ? `day ${S.day} · zero everywhere (identical rollouts)` : `day ${S.day} · ${vi.deltaUnit} · max |Δ| ${fmt(maxAbs(diffs[S.day - 1]), 3)} today`;
    legend($("legend-diff"), ds, vi.deltaUnit, m === 0 ? "No difference on any day" : "Zero-centred, fixed across days");
  } else {
    mapDiff.draw(null, null, ov, !S.prime ? "Load an initial state and run Prime" : "Run Branch to see Branch − Prime");
    $("cap-diff").textContent = "";
    legend($("legend-diff"), null, "", "");
  }

  // Initial shock footprint (day 0)
  let delta: Float32Array | null = null, label = "";
  if (S.branch && !S.branch.zero && comparable()) { delta = S.branch.delta; label = `applied in Branch #${S.branch.runNo}`; }
  else if (S.input) { try { delta = buildPerturbation(S.input, S.shock); label = "preview, not yet run"; } catch { delta = null; } }
  const spec = S.branch && !S.branch.zero && comparable() ? S.branch.spec! : S.shock;
  const ch = spec.components[0]?.channel ?? "t2m";
  if (delta) {
    const f = delta.subarray(CHANNEL_INFO[ch].index * NCELL, (CHANNEL_INFO[ch].index + 1) * NCELL);
    const sc = divergingScale(ch === "tp" || ch === "tcwv" ? "tp" : ch === "t2m" ? "t2m" : "u10", maxAbs(f));
    mapShock.draw(f, sc, { shockBox: spec.box });
    legend($("legend-shock"), sc, CHANNEL_INFO[ch].unit, `${ch} · ${label}`);
  } else {
    mapShock.draw(null, null, { shockBox: spec.box }, "No input");
    legend($("legend-shock"), null, "", "");
  }
}

function legend(el: HTMLElement, sc: Scale | null, unit: string, note: string) {
  if (!sc) { el.innerHTML = ""; return; }
  if (sc.classes) {
    const css = (c: number[]) => `rgb(${c.map(Math.round).join(",")})`;
    el.innerHTML = `<div class="legend-steps">${sc.classes.map((k, i) => `<div class="step-cell"><i style="background:${css(k.color)}"></i><span class="mono">${i === 0 ? "0" : k.lo}</span></div>`).join("")}</div>
      <div class="legend-note">${escapeHtml(unit)} · classed like rain-gauge bands · ≥ 10 = contract heavy rain${note ? ` · ${escapeHtml(note)}` : ""}</div>`;
    return;
  }
  // Five evenly spaced ticks so values can be read off the bar (zero is the middle tick on diverging scales).
  const span = sc.hi - sc.lo;
  const digits = Math.abs(span) < 2 ? 2 : Math.abs(span) < 20 ? 1 : 0;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => {
    const v = sc.lo + t * span;
    return sc.kind === "div" ? (t === 0.5 ? "0" : signed(v, digits)) : fmt(v, digits);
  });
  el.innerHTML = `<div class="legend-bar" style="background:${sc.gradient}"></div>
    <div class="legend-ticks mono">${ticks.map((t) => `<span>${t}</span>`).join("")}</div>
    <div class="legend-note">${escapeHtml(unit)}${note ? ` · ${escapeHtml(note)}` : ""}</div>`;
}

function renderTooltip(ev: PointerEvent) {
  const tip = $("tooltip");
  if (S.hover == null) { tip.hidden = true; return; }
  const i = S.hover, r = Math.floor(i / NLON), c = i % NLON, vi = varInfo();
  const rows = [`<b>${latOf(r).toFixed(1)}°N, ${lonOf(c).toFixed(1)}°E</b>`, `<span class="mono">cell [${r}, ${c}] · land ${S.land[i].toFixed(2)}</span>`];
  if (S.prime) rows.push(`Prime: <span class="mono">${fmt(displayField(S.prime.rollout, S.day, S.view)[i])} ${vi.unit}</span>`);
  if (S.branch && comparable()) {
    const p = displayField(S.prime!.rollout, S.day, S.view)[i], b = displayField(S.branch.rollout, S.day, S.view)[i];
    rows.push(`Branch: <span class="mono">${fmt(b)} ${vi.unit}</span>`, `Δ: <span class="mono">${signed(b - p, 3)} ${vi.deltaUnit}</span>`);
  }
  if (boxMask(S.shock.box)[i]) rows.push(`<span class="tag-shock">in shock box</span>`);
  if (boxMask(S.impactBox)[i]) rows.push(`<span class="tag-impact">in impact region</span>`);
  tip.innerHTML = rows.join("<br>");
  tip.hidden = false;
  tip.style.left = `${ev.clientX + 14}px`;
  tip.style.top = `${ev.clientY + 14}px`;
}

function renderRipple() {
  const svg = $("ripple-chart");
  const diffs = diffFields();
  const th = RIPPLE_THRESHOLDS[S.view];
  $("ripple-hint").textContent = `Share of cells outside the shock box with |Δ ${varInfo().label.toLowerCase()}| > ${th} ${varInfo().deltaUnit}, per day. Measures how far the model's response reaches.`;
  if (!diffs || !S.branch || S.branch.zero) {
    svg.innerHTML = `<text x="150" y="64" text-anchor="middle" class="svg-empty">Needs a Prime and a non-zero Branch</text>`;
    return;
  }
  const out = outsideMask(S.branch.spec!.box);
  const fr = diffs.map((d) => rippleFraction(d, out, th));
  const W = 300, H = 120, pl = 28, pb = 18, bw = (W - pl - 4) / fr.length;
  const y = (v: number) => H - pb - v * (H - pb - 8);
  let s = `<line x1="${pl}" y1="${y(0)}" x2="${W}" y2="${y(0)}" class="axis"/>`;
  for (const t of [0, 0.5, 1]) s += `<text x="${pl - 4}" y="${y(t) + 3}" text-anchor="end" class="svg-tick">${t * 100}%</text>`;
  fr.forEach((v, k) => {
    const x = pl + k * bw + 2;
    s += `<rect x="${x}" y="${y(v)}" width="${bw - 4}" height="${Math.max(0.5, y(0) - y(v))}" class="${k + 1 === S.day ? "bar bar-on" : "bar"}"><title>Day ${k + 1}: ${(v * 100).toFixed(1)}%</title></rect>`;
    s += `<text x="${x + (bw - 4) / 2}" y="${H - 5}" text-anchor="middle" class="svg-tick">${k + 1}</text>`;
  });
  svg.innerHTML = s;
}

function renderAgri() {
  const out = $("agri-out"), chart = $("agri-chart");
  $("agri-region").innerHTML = `<span class="tag-impact">Impact region</span> ${describeBox(S.impactBox)} — independent of the shock box. Use “Draw impact region” to change it.`;
  if (!comparable()) {
    out.innerHTML = `<p class="hint">Runs after both Prime and Branch exist for the same input.</p>`;
    chart.innerHTML = "";
    return;
  }
  const num = (id: string) => Number($<HTMLInputElement>(id).value);
  const res = currentImpact()!;
  if (res.empty) {
    out.innerHTML = `<p class="err">${escapeHtml(res.reason)}</p>`;
    chart.innerHTML = "";
    return;
  }
  const p = res.prime, b = res.branch;
  const pct = res.rainChangePct == null ? "" : ` (${signed(res.rainChangePct, 1)} %)`;
  out.innerHTML = `
    <p class="agri-headline"><span class="mono big ${res.rainChangeMm < 0 ? "neg" : res.rainChangeMm > 0 ? "pos" : ""}">${signed(res.rainChangeMm, 1)} mm</span>
      cumulative rainfall vs Timeline Prime${pct}, days ${res.days[0]}–${res.days[res.days.length - 1]}, ${res.cells} land cells.</p>
    <table class="agri-table">
      <thead><tr><th></th><th>Prime</th><th>Branch #${S.branch!.runNo}</th><th>Branch − Prime</th></tr></thead>
      <tbody>
        <tr><td>Cumulative rainfall</td><td class="mono">${fmt(p.cumulativeRain, 1)} mm</td><td class="mono">${fmt(b.cumulativeRain, 1)} mm</td><td class="mono">${signed(res.rainChangeMm, 1)} mm</td></tr>
        <tr><td>Longest dry spell</td><td class="mono">${p.longestDrySpell} d</td><td class="mono">${b.longestDrySpell} d</td><td class="mono">${signed(res.drySpellChange, 0)} d</td></tr>
        <tr><td>Dry days (&lt; ${num("agri-dry")} mm/day)</td><td class="mono">${p.dryDays}</td><td class="mono">${b.dryDays}</td><td class="mono">${signed(b.dryDays - p.dryDays, 0)}</td></tr>
        <tr><td>Heavy-rain exposure (≥ ${num("agri-heavy")} mm/day)</td><td class="mono">${fmt(100 * p.heavyShare, 1)} %</td><td class="mono">${fmt(100 * b.heavyShare, 1)} %</td><td class="mono">${signed(100 * (b.heavyShare - p.heavyShare), 1)} pp</td></tr>
        <tr><td>Mean 2 m temperature</td><td class="mono">${fmt(p.meanTempC, 1)} °C</td><td class="mono">${fmt(b.meanTempC, 1)} °C</td><td class="mono">${signed(b.meanTempC - p.meanTempC, 2)} K</td></tr>
      </tbody>
    </table>`;
  renderAgriChart(res, chart);
  document.querySelectorAll<HTMLButtonElement>("[data-agri-mode]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.agriMode === agriMode)));
  $("agri-source").textContent = `Data: ${engineLabel(S.prime!.engine)} · Prime #${S.prime!.runNo} vs Branch #${S.branch!.runNo} · cos(lat)-weighted land mean`;
}

/**
 * Climate Pulse-style chart: Prime is the dashed reference, Branch the highlighted line, with a callout on the
 * selected forecast day. "Absolute" shows cumulative regional rainfall; "Change" shows Branch − Prime cumulative.
 * Small marks under the axis flag dry days (regional mean below the dry threshold) for each timeline.
 */
function renderAgriChart(res: Extract<ImpactResult, { empty: false }>, chart: HTMLElement) {
  const W = 440, H = 170, pl = 40, pr = 12, pt = 26, pb = 34;
  const cum = (a: number[]) => a.reduce<number[]>((o, v) => (o.push((o.at(-1) ?? 0) + v), o), []);
  const pc = cum(res.prime.dailyRain), bc = cum(res.branch.dailyRain);
  const series = agriMode === "abs" ? { ref: pc, main: bc } : { ref: pc.map(() => 0), main: bc.map((v, i) => v - pc[i]) };
  let lo = Math.min(0, ...series.ref, ...series.main), hi = Math.max(...series.ref, ...series.main);
  if (hi - lo < 1) hi = lo + 1;
  const n = res.days.length;
  const x = (i: number) => pl + (n === 1 ? (W - pl - pr) / 2 : (i * (W - pl - pr)) / (n - 1));
  const y = (v: number) => pt + (1 - (v - lo) / (hi - lo)) * (H - pt - pb);
  const path = (a: number[]) => a.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join("");
  const unit = "mm";
  let s = "";
  for (const t of [lo, (lo + hi) / 2, hi]) {
    s += `<line x1="${pl}" x2="${W - pr}" y1="${y(t)}" y2="${y(t)}" class="grid"/><text x="${pl - 6}" y="${y(t) + 3}" text-anchor="end" class="svg-tick">${fmt(t, Math.abs(hi - lo) < 10 ? 1 : 0)}</text>`;
  }
  if (lo < 0) s += `<line x1="${pl}" x2="${W - pr}" y1="${y(0)}" y2="${y(0)}" class="axis"/>`;
  s += `<path d="${path(series.ref)}" class="ln-ref"/>`;
  if (agriMode === "change") s += `<path d="${path(series.main)}L${x(n - 1)},${y(0)}L${x(0)},${y(0)}Z" class="${series.main.at(-1)! < 0 ? "area-neg" : "area-pos"}"/>`;
  s += `<path d="${path(series.main)}" class="ln-main"/>`;
  const dry = Number($<HTMLInputElement>("agri-dry").value);
  res.days.forEach((d, i) => {
    s += `<circle cx="${x(i)}" cy="${y(series.main[i])}" r="2.5" class="pt-main"><title>Day ${d}: Branch ${fmt(bc[i], 1)} mm, Prime ${fmt(pc[i], 1)} mm cumulative</title></circle>`;
    s += `<text x="${x(i)}" y="${H - pb + 14}" text-anchor="middle" class="svg-tick">${d}</text>`;
    if (res.prime.dailyRain[i] < dry) s += `<rect x="${x(i) - 6}" y="${H - 10}" width="5" height="4" class="dry-prime"><title>Day ${d}: Prime dry day</title></rect>`;
    if (res.branch.dailyRain[i] < dry) s += `<rect x="${x(i) + 1}" y="${H - 10}" width="5" height="4" class="dry-branch"><title>Day ${d}: Branch dry day</title></rect>`;
  });
  // Callout on the selected forecast day, if it is inside the window.
  const k = res.days.indexOf(S.day);
  if (k >= 0) {
    const v = series.main[k];
    const label = agriMode === "abs" ? `Day ${S.day} · ${fmt(bc[k], 1)} ${unit} (Prime ${fmt(pc[k], 1)})` : `Day ${S.day} · ${signed(v, 1)} ${unit} vs Prime`;
    const anchor = x(k) > W - 150 ? "end" : "start";
    s += `<line x1="${x(k)}" x2="${x(k)}" y1="${pt}" y2="${H - pb}" class="cursor"/><circle cx="${x(k)}" cy="${y(v)}" r="4.5" class="pt-focus"/>`;
    // Put the label on the emptier side of the point so it never sits on the line.
    const upper = y(v) < pt + (H - pt - pb) / 2;
    const ly = upper ? Math.min(H - pb - 4, y(v) + 18) : Math.max(pt + 10, y(v) - 12);
    s += `<text x="${x(k) + (anchor === "end" ? -8 : 8)}" y="${ly}" text-anchor="${anchor}" class="callout">${label}</text>`;
  }
  s += `<text x="${pl}" y="14" class="svg-tick">${agriMode === "abs" ? "Cumulative regional rainfall, mm" : "Branch − Prime cumulative rainfall, mm"} · <tspan class="lg-branch">━ Branch</tspan> <tspan class="lg-prime">┅ Prime</tspan></text>`;
  s += `<text x="${W - pr}" y="${H - 2}" text-anchor="end" class="svg-tick">dry day (&lt; ${dry} mm/day): <tspan class="lg-prime">▬</tspan> Prime <tspan class="lg-branch">▬</tspan> Branch</text>`;
  chart.innerHTML = s;
}

/** One short highlight when a new Branch lands: the peak moment of the demo. */
function flash(el: Element | null) {
  if (!el) return;
  el.classList.remove("fresh");
  void (el as HTMLElement).offsetWidth; // restart the animation
  el.classList.add("fresh");
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]!);
}

boot();
