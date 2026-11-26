import { ApiError, type Health, health, simulate } from "./api";
import {
  CHANNELS, CHANNEL_INFO, CHANNEL_STD, type Channel, DEFAULT_STEPS, type InitialState, NCELL, NCH, type Rollout,
  latOf, lonOf, parseInitialState,
} from "./contract";
import { type ViewVar, VIEW_VARS, difference, displayField, maxAbs, sharedRange } from "./fields";
import { fixtureSimulate, syntheticInput } from "./fixture";
import { type ImpactResult, computeImpact } from "./impact";
import { type Box, boxCellCount, boxFromDegrees, boxMask, clampBox, describeBox } from "./region";
import { type AgriMode, agriChartSvg, indicatorTableHtml, legendHtml, outcomeCardsHtml, rippleChartSvg } from "./charts";
import { escapeHtml, fmt, signed } from "./format";
import { WindFlow, type WindSource } from "./particles";
import { CITIES, type MapContent, MapView, type Scale, classedRainScale, divergingScale, gridFrom, sequentialScale } from "./render";
import { RIPPLE_THRESHOLDS, outsideMask, rippleFraction } from "./ripple";
import { type HudTag, renderHud } from "./hud";
import { Timeline } from "./timeline";
import { CommandField } from "./command";
import { type AppApi, buildCommands, nextAction } from "./actions";
import { introEnabled, playIntro } from "./intro";
import { ScenarioPanel, type ScenarioReplay } from "./scenarios";
import { type TabName, scenarioLine, showTooltip, VAR_ICONS, flash, forecastDateLabel, inputInfoHtml, setTab, startClock } from "./ui";
import { PRESETS, type ShockComponent, type ShockSpec, ShockError, buildPerturbation, summarisePerturbation } from "./shock";

// ---------------- state ----------------
type Engine = { kind: "live"; model: string } | { kind: "fixture" };
interface PrimeRun { rollout: Rollout; inputId: string; engine: Engine; ms: number | null; wallMs: number; runNo: number }
interface BranchRun extends PrimeRun { spec: ShockSpec | null; specKey: string; delta: Float32Array; zero: boolean }

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const engineLabel = (e: Engine) => (e.kind === "live" ? `LIVE · ${e.model}` : "FIXTURE ENGINE");
const sameEngine = (a: Engine, b: Engine) => a.kind === b.kind && (a.kind === "fixture" || (b.kind === "live" && a.model === b.model));

const S = {
  land: new Float32Array(NCELL) as Float32Array<ArrayBufferLike>,
  oro: new Float32Array(NCELL) as Float32Array<ArrayBufferLike>,
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
  mapView: "prime" as MapMode,
  split: 0.5,
  day: 1,
  hover: null as number | null,
  fixtureEngine: false,
  health: null as Health | null,
};

type MapMode = "prime" | "swipe" | "branch" | "diff";
const specKey = (s: ShockSpec) => JSON.stringify({ b: s.box, c: s.components });

// ---------------- boot ----------------
async function boot() {
  try {
    const res = await fetch("/static/static_fields.json");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const js = await res.json();
    S.land = gridFrom(js.land_sea_mask);
    S.oro = gridFrom(js.orography_m);
  } catch (e) {
    showFatal(`Could not load local static fields (land-sea mask): ${(e as Error).message}`);
    return;
  }
  setupMaps();
  setupControls();
  pollHealth();
  setInterval(pollHealth, 5000);
  startClock($("clock"));
  renderAll();
}

const showFatal = (msg: string) => document.body.insertAdjacentHTML("afterbegin", `<div class="fatal">${escapeHtml(msg)}</div>`);

// ---------------- maps ----------------
let mapMain: MapView, mapShock: MapView, flow: WindFlow;
let scenarioPanel: ScenarioPanel | null = null;
let drawingScenarioRegion = false;

function setupMaps() {
  const geo = { land: S.land, orography: S.oro, cities: CITIES };
  flow = new WindFlow($<HTMLCanvasElement>("map-flow"));
  mapMain = new MapView($("map-main"), geo, true);
  mapMain.onResize = (g) => { flow.resize(g); renderHudNow(); };
  flow.resize(mapMain.geometry());
  mapShock = new MapView($("map-shock"), geo, false, 6);
  mapShock.setOptions({ smooth: false });
  mapMain.onHover = (cell, ev) => {
    S.hover = cell;
    renderMaps();
    renderTooltip(ev);
  };
  mapMain.onSplit = (split) => {
    S.split = split;
    renderMaps();
  };
  mapMain.onBox = (b, final) => {
    const box = clampBox(b);
    if (!final) {
      S.draft = box;
    } else {
      S.draft = null;
      if (S.brush === "shock") S.shock = { ...S.shock, box, label: "Custom shock" };
      else {
        S.impactBox = box;
        if (drawingScenarioRegion) {
          drawingScenarioRegion = false;
          openDrawer("scenarios");
        }
      }
    }
    renderAll();
  };
}

// ---------------- controls ----------------
let cmd: CommandField | null = null;
const api: AppApi = {
  hasInput: () => !!S.input, hasPrime: () => !!S.prime && S.prime.inputId === S.input?.id,
  hasBranch: () => comparable() && !!S.branch && !S.branch.zero,
  stale: () => !!S.branch && !S.branch.zero && S.branch.specKey !== specKey(S.shock),
  serverReady: () => !!currentEngine(), busy: () => S.busy.prime || S.busy.branch, shockLabel: () => S.shock.label,
  loadState: () => $<HTMLInputElement>("file-input").click(), runPrime: () => void runPrime(), runBranch: () => void runBranch(false),
  zeroCheck: () => void runBranch(true), play: () => { if (!playTimer) togglePlay(); }, open: (t) => openDrawer(t),
  preset: (id) => { const p = PRESETS.find((x) => x.id === id); if (p) { S.shock = p.spec(); renderAll(); } },
  setView: (v) => { S.mapView = v; renderAll(); }, setVar: (v) => { S.view = v; renderAll(); },
  drawFarm: () => { S.brush = "impact"; renderAll(); }, replayIntro: playIntro,
};

function setupControls() {
  scenarioPanel = new ScenarioPanel(() => {
    drawingScenarioRegion = true;
    S.brush = "impact";
    closeDrawer();
    renderAll();
  }, async (replay) => {
    if (!scenarioContext() || S.busy.branch) throw new Error("Wait for the trained server and the current Branch run.");
    S.shock = replay.spec;
    if (!await runBranch(false, replay)) throw new Error(S.branchErr || "Replay was superseded. Run the search again.");
  });
  cmd = new CommandField($("cmd-field"), $("cmd-text"), $<HTMLButtonElement>("cmd-go"), $("cmd-panel"), $<HTMLInputElement>("cmd-input"), $("cmd-list"), () => buildCommands(api));
  $("cmd-field").addEventListener("keydown", (e) => { if (e.key === "Enter" && e.target === e.currentTarget) cmd?.runNext(); });
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
      drawingScenarioRegion = false;
      S.brush = b.dataset.brush as "shock" | "impact";
      renderAll();
    }),
  );
  const seg = $("var-seg");
  for (const v of VIEW_VARS) {
    const b = document.createElement("button");
    b.className = "layer-row";
    b.setAttribute("role", "radio");
    b.title = `${v.label} (${v.unit})`;
    b.setAttribute("aria-label", v.label);
    b.innerHTML = `<span class="pill-ic">${VAR_ICONS[v.id]}</span><span class="layer-name">${v.label}</span>`;
    b.dataset.var = v.id;
    b.addEventListener("click", () => { S.view = v.id; renderAll(); });
    seg.append(b);
  }
  document.querySelectorAll<HTMLButtonElement>("#view-seg [data-view]").forEach((b) =>
    b.addEventListener("click", () => { S.mapView = b.dataset.view as MapMode; renderAll(); }),
  );
  $("drawer-close").addEventListener("click", closeDrawer);
  $("open-setup").addEventListener("click", () => openDrawer("setup"));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeDrawer(); });
  document.querySelectorAll<HTMLButtonElement>(".tab[data-tab]").forEach((t) =>
    t.addEventListener("click", () => setTab(t.dataset.tab as TabName)),
  );
  document.querySelectorAll<HTMLButtonElement>(".st-btn[data-step]").forEach((b) =>
    b.addEventListener("click", () => {
      const s = b.dataset.step;
      if (s === "input") $<HTMLInputElement>("file-input").click();
      else if (s === "prime") void runPrime();
      else if (s === "shock") { openDrawer("shock"); S.brush = "shock"; renderAll(); }
      else if (s === "branch") void runBranch(false);
    }),
  );
  const flowToggle = $<HTMLInputElement>("tg-flow");
  flowToggle.checked = !WindFlow.reducedMotion();
  flow.setEnabled(flowToggle.checked);
  flowToggle.addEventListener("change", () => flow.setEnabled(flowToggle.checked));
  $<HTMLInputElement>("tg-terrain").addEventListener("change", (e) => mapMain.setOptions({ terrain: (e.target as HTMLInputElement).checked }));
  $<HTMLInputElement>("tg-smooth").addEventListener("change", (e) => mapMain.setOptions({ smooth: (e.target as HTMLInputElement).checked }));
  const step = (d: number) => {
    const steps = S.prime?.rollout.steps ?? S.steps;
    const next = Math.min(steps, Math.max(1, S.day + d));
    if (next !== S.day) { S.day = next; renderAll(); }
  };
  $("day-play").addEventListener("click", togglePlay);
  $("day-prev").addEventListener("click", () => { stopPlay(); step(-1); });
  $("day-next").addEventListener("click", () => { stopPlay(); step(1); });
  timeline = new Timeline($("day-strip"), (d) => { stopPlay(); S.day = d; renderAll(); });
  document.querySelectorAll<HTMLButtonElement>("[data-agri-mode]").forEach((b) =>
    b.addEventListener("click", () => { agriMode = b.dataset.agriMode as AgriMode; renderAgri(); }),
  );
  // ← / → step through forecast days unless the user is typing in a field.
  document.addEventListener("keydown", (e) => {
    if ((e.target as HTMLElement).closest("input, select, textarea")) return;
    // [ and ] move the swipe divider, so the comparison works without a mouse too.
    if (S.mapView === "swipe" && (e.key === "[" || e.key === "]")) {
      S.split = Math.min(1, Math.max(0, S.split + (e.key === "]" ? 0.05 : -0.05)));
      renderMaps();
      e.preventDefault();
    }
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

function scenarioContext() {
  const prime = S.prime, input = S.input, engine = currentEngine();
  if (!input || !prime || prime.inputId !== input.id || engine?.kind !== "live" || engine.model !== "PRALAYA" || !sameEngine(prime.engine, engine)) return null;
  return { input, prime: prime.rollout, land: S.land, primeRun: prime.runNo };
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
    if (!S.branch) S.mapView = "prime";
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

async function runBranch(zero: boolean, replay?: ScenarioReplay) {
  if (!S.input || !S.prime) return;
  let delta: Float32Array;
  const spec = zero ? null : structuredClone(S.shock);
  try {
    delta = replay?.delta ?? (zero ? new Float32Array(NCH * NCELL) : buildPerturbation(S.input, spec!));
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
    if (replay && !out.r.data.every((value, index) => value === replay.expected.data[index])) {
      throw new Error("The replay differed from the scenario forecast. Check that both services use the same checkpoint.");
    }
    S.branch = {
      rollout: out.r, inputId, engine: out.engine, ms: out.ms, wallMs: out.wall, runNo: ++S.runCounter,
      spec, specKey: spec ? specKey(spec) : "zero", delta, zero,
    };
    S.mapView = "diff"; // the shock's effect is the point of the demo
    if (replay) {
      $<HTMLInputElement>("agri-d0").value = String(replay.dayStart);
      $<HTMLInputElement>("agri-d1").value = String(replay.dayEnd);
    }
    if (!zero) setTab("impact");
    flash(document.querySelector(".map-host"));
    return true;
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
  renderStepper();
  renderHudNow();
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
  $("input-info").innerHTML = S.inputError ? `<p class="err">${escapeHtml(S.inputError)}</p>` : S.input ? inputInfoHtml(S.input) : "";
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
  scenarioPanel?.update(scenarioContext(), S.impactBox);
  const primeBtn = $<HTMLButtonElement>("run-prime");
  primeBtn.disabled = !S.input || S.busy.prime || !engine;
  primeBtn.textContent = S.busy.prime ? "Running Prime…" : S.prime ? "Re-run Prime" : "Run Prime";
  const ok = !!S.input && !!S.prime && S.prime.inputId === S.input.id && !!engine;
  $<HTMLButtonElement>("run-branch").disabled = !ok || S.busy.branch;
  $<HTMLButtonElement>("run-branch").textContent = S.busy.branch ? "Running Branch…" : "Run Branch";
  $<HTMLButtonElement>("zero-check").disabled = !ok || S.busy.branch;

  const pi = $("prime-info");
  $("prime-err").innerHTML = S.primeErr ? `<p class="err">Prime failed: ${escapeHtml(S.primeErr)}</p>` : "";
  if (S.primeErr) pi.innerHTML = "";
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
  document.querySelectorAll<HTMLButtonElement>("#var-seg .layer-row").forEach((b) => b.setAttribute("aria-checked", String(b.dataset.var === S.view)));
  renderEventHead();
  const steps = S.prime?.rollout.steps ?? S.steps;
  renderDayStrip(steps);
  const date = forecastDateLabel(S.input?.meta.last_input_day, S.day);
  $("day-out").textContent = `Day ${S.day}${date ? ` · ${date}` : ` of ${steps}`}`;
  renderOutcome();

  const line = $("scenario-line");
  const r = scenarioLine(S.branch, S.prime?.runNo ?? null, specKey(S.shock));
  line.innerHTML = r.html;
  line.dataset.state = r.state;
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

let agriMode: AgriMode = "abs";

/** Ripple reach per day for the active view, or null when there is no non-zero Branch. */
function rippleSeries(): number[] | null {
  const diffs = diffFields();
  if (!diffs || !S.branch || S.branch.zero) return null;
  return cached(`ripple`, () => {
    const out = outsideMask(S.branch!.spec!.box);
    return diffs.map((d) => rippleFraction(d, out, RIPPLE_THRESHOLDS[S.view]));
  });
}

let timeline: Timeline | null = null;

function renderDayStrip(steps: number) {
  const dates = Array.from({ length: steps }, (_, i) => forecastDateLabel(S.input?.meta.last_input_day, i + 1));
  timeline?.set({ steps, day: S.day, dates, ripple: rippleSeries() });
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

/** Climate Pulse-style headline cards: farm-region rain change, dry-spell change and ripple reach for the day. */
function renderOutcome() {
  const el = $("outcome");
  const imp = currentImpact();
  if (!imp || !S.branch || S.branch.zero) {
    el.innerHTML = `<div class="kpi kpi-empty"><span class="kpi-k">Farm-region rain vs Prime</span><b class="mono">—</b><span>${S.branch?.zero ? "Zero shock: nothing changes" : "Run Prime, then Branch"}</span></div>`;
    return;
  }
  if (imp.empty) { el.innerHTML = `<div class="kpi kpi-empty"><span class="kpi-k">Farm region</span><span class="err">${escapeHtml(imp.reason)}</span></div>`; return; }
  const ripple = rippleSeries();
  el.innerHTML = outcomeCardsHtml(imp, S.day, ripple ? ripple[S.day - 1] : 0);
}

/** Header stepper + "what next" hint so a first-time user always knows the next click. */
function renderStepper() {
  const hasInput = !!S.input, hasPrime = !!S.prime && S.prime.inputId === S.input?.id;
  const hasBranch = comparable() && !!S.branch && !S.branch.zero;
  const set = (id: string, state: "done" | "now" | "todo") => ($(id).dataset.state = state);
  set("st-input", hasInput ? "done" : "now");
  set("st-prime", hasPrime ? "done" : hasInput ? "now" : "todo");
  set("st-shock", hasBranch ? "done" : hasPrime ? "now" : "todo");
  set("st-branch", hasBranch ? "done" : hasPrime ? "now" : "todo");
  const n = nextAction(api);
  cmd?.setNext(n);
  $("next-hint").textContent = `Next: ${n.label}${n.detail ? ` · ${n.detail}` : ""}`;
}

/** Wind particles follow the timeline on screen: Prime, Branch, or both halves in swipe view. */
function updateFlow(mode: MapMode, hasBranch: boolean) {
  const wind = (r: Rollout | undefined): WindSource | null => {
    if (!r) return null;
    const base = (S.day - 1) * NCH * NCELL;
    return { u: r.data.subarray(base + 2 * NCELL, base + 3 * NCELL), v: r.data.subarray(base + 3 * NCELL, base + 4 * NCELL) };
  };
  const p = wind(S.prime?.rollout), b = hasBranch ? wind(S.branch?.rollout) : null;
  if (mode === "swipe" && b) flow.setWind(p, b, S.split);
  else flow.setWind((mode === "branch" || mode === "diff") && b ? b : p);
}

function openDrawer(tab: TabName) { setTab(tab); $("drawer").dataset.open = "true"; }
function closeDrawer() { $("drawer").dataset.open = "false"; }

/** U3 HUD: the shock and farm region carry their own live readouts and actions, pinned on the map. */
function renderHudNow() {
  if (!mapMain) return;
  const b = S.branch && comparable() ? S.branch : null;
  const stale = !!b && !b.zero && b.specKey !== specKey(S.shock);
  const ready = !!S.input && !!S.prime && S.prime.inputId === S.input.id && !!currentEngine();
  const comp = S.shock.components.map((c) => `${c.channel} ${c.mode === "add" ? `${signed(c.value, 1)} ${CHANNEL_INFO[c.channel].unit}` : `${signed(c.value, 0)}%`}`).join(" · ");
  const diffs = diffFields();
  const peak: [string, string][] = b && !b.zero && !stale && diffs ? [[`Peak Δ today`, `${fmt(maxAbs(diffs[S.day - 1]), 1)} ${varInfo().unit}`]] : [];
  const shock: HudTag = {
    box: S.shock.box, kind: "shock",
    kicker: b && !b.zero ? (stale ? `Shock · edited since #${b.runNo}` : `Shock · Branch #${b.runNo}`) : S.busy.branch ? "Shock · running" : "Shock · draft",
    state: S.busy.branch ? "busy" : b && !b.zero ? (stale ? "stale" : b.engine.kind === "fixture" ? "fixture" : "live") : "draft",
    title: S.shock.label, sub: comp, rows: peak, pin: b && !b.zero ? `#${b.runNo}` : "Draft", onOpen: () => openDrawer("shock"),
    actions: [
      { label: "Edit", onClick: () => openDrawer("shock") },
      { label: S.busy.branch ? "Running…" : "Run Branch", primary: true, disabled: !ready || S.busy.branch, onClick: () => void runBranch(false) },
    ],
  };
  const imp = currentImpact();
  const f = S.impactBox;
  const farmRows: [string, string][] = imp && !imp.empty ? [[`Rain vs Prime, days ${imp.days[0]}–${imp.days[imp.days.length - 1]}`, `${signed(imp.rainChangeMm, 1)} mm`]] : [];
  const farm: HudTag = {
    box: f, kind: "farm", kicker: "Farm region", state: imp && !imp.empty ? "live" : "empty",
    title: "Farm region",
    sub: !imp ? (S.prime ? "Run Branch to compare" : "Waiting for Prime") : imp.empty ? imp.reason : `${latOf(f.r0).toFixed(0)}–${latOf(f.r1).toFixed(0)}°N · ${lonOf(f.c0).toFixed(0)}–${lonOf(f.c1).toFixed(0)}°E`,
    rows: farmRows, pin: imp && !imp.empty ? `${signed(imp.rainChangeMm, 1)} mm` : "–", onOpen: () => openDrawer("impact"), actions: [{ label: "Details", onClick: () => openDrawer("impact") }],
  };
  renderHud($("hud"), mapMain.geometry(), { tags: S.input ? [shock, farm] : [], hero: null });
}

/** Tempest-style event header: what scenario the card is about and whether the maps are current. */
function renderEventHead() {
  const b = S.branch && comparable() ? S.branch : null;
  const stale = !!b && !b.zero && b.specKey !== specKey(S.shock);
  const title = b ? (b.zero ? "Zero shock (all-zero tensor)" : b.spec!.label) : S.prime ? `${S.shock.label} (not run yet)` : "Scenario";
  const status = b ? `Branch #${b.runNo} · ${engineLabel(b.engine)}${stale ? " · shock edited since" : ""}`
    : S.busy.branch ? "Running Branch…" : S.prime ? "Draft · pick a shock, then Run Branch" : "No scenario yet";
  $("ev-title").textContent = title;
  $("ev-status").textContent = status;
  $("ev-dot").dataset.state = b ? (stale ? "stale" : b.engine.kind === "fixture" ? "fixture" : "live") : S.busy.branch ? "busy" : "idle";
}

function renderMaps() {
  const vi = varInfo();
  const ov = { shockBox: S.shock.box, impactBox: S.impactBox, draftBox: S.draft, draftKind: S.brush, hoverCell: S.hover };
  const scale = absScale();
  const pf = S.prime ? displayField(S.prime.rollout, S.day, S.view) : null;
  const bf = S.branch && comparable() ? displayField(S.branch.rollout, S.day, S.view) : null;
  const diffs = diffFields();
  const branchLabel = S.branch ? `Branch #${S.branch.runNo}` : "Branch";
  let content: MapContent, caption = "", leg = "";
  const mode = S.mapView;
  if (!pf || !scale) {
    content = { kind: "empty", text: S.busy.prime ? "Running Prime…" : S.input ? "Run Prime to see the forecast" : "Load an initial state to begin" };
  } else if (mode === "prime" || ((mode === "branch" || mode === "swipe") && !bf) || (mode === "diff" && !diffs)) {
    content = { kind: "single", field: pf, scale };
    caption = mode === "prime" ? `Timeline Prime · day ${S.day}` : `Timeline Prime · day ${S.day} · run Branch to compare`;
    leg = legendHtml(scale, vi.unit, "Prime & Branch share this scale");
  } else if (mode === "branch") {
    content = { kind: "single", field: bf!, scale };
    caption = `${branchLabel} · day ${S.day}`;
    leg = legendHtml(scale, vi.unit, "Prime & Branch share this scale");
  } else if (mode === "swipe") {
    content = { kind: "swipe", left: pf, right: bf!, scale, split: S.split, leftLabel: "Prime", rightLabel: branchLabel };
    caption = `Drag the divider · day ${S.day}`;
    leg = legendHtml(scale, vi.unit, "Prime & Branch share this scale");
  } else {
    const m = Math.max(...diffs!.map(maxAbs));
    const ds = divergingScale(S.view, m);
    content = { kind: "single", field: diffs![S.day - 1], scale: ds };
    caption = m === 0 ? `Branch − Prime · day ${S.day} · identical everywhere` : `Branch − Prime · day ${S.day} · max |Δ| ${fmt(maxAbs(diffs![S.day - 1]), 2)} ${vi.deltaUnit}`;
    leg = legendHtml(ds, vi.deltaUnit, m === 0 ? "no difference on any day" : "zero-centred, fixed across days");
  }
  mapMain.draw(content, ov);
  $("map-host").dataset.view = mode;
  updateFlow(mode, !!bf);
  const engine = S.prime ? `<span class="cap-engine" data-kind="${S.prime.engine.kind}">${escapeHtml(engineLabel(S.prime.engine))}</span>` : "";
  $("map-caption").innerHTML = caption ? `${engine}<span>${escapeHtml(caption)} · ${escapeHtml(vi.label)}</span>` : "";
  $("map-caption").hidden = !caption;
  $("legend-main").innerHTML = leg;
  $("legend-main").hidden = !leg;
  document.querySelectorAll<HTMLButtonElement>("#view-seg [data-view]").forEach((b) => {
    const v = b.dataset.view as MapMode;
    b.setAttribute("aria-pressed", String(v === mode));
    b.disabled = v === "prime" ? !pf : !bf;
  });

  // Initial shock footprint (day 0)
  let delta: Float32Array | null = null, label = "";
  if (S.branch && !S.branch.zero && comparable()) { delta = S.branch.delta; label = `applied in Branch #${S.branch.runNo}`; }
  else if (S.input) { try { delta = buildPerturbation(S.input, S.shock); label = "preview, not yet run"; } catch { delta = null; } }
  const spec = S.branch && !S.branch.zero && comparable() ? S.branch.spec! : S.shock;
  const ch = spec.components[0]?.channel ?? "t2m";
  if (delta) {
    const f = delta.subarray(CHANNEL_INFO[ch].index * NCELL, (CHANNEL_INFO[ch].index + 1) * NCELL);
    const sc = divergingScale(ch === "tp" || ch === "tcwv" ? "tp" : ch === "t2m" ? "t2m" : "u10", maxAbs(f));
    mapShock.drawField(f, sc, { shockBox: spec.box });
    $("legend-shock").innerHTML = legendHtml(sc, CHANNEL_INFO[ch].unit, `${ch} · ${label}`);
  } else {
    mapShock.drawField(null, null, { shockBox: spec.box }, "No input");
    $("legend-shock").innerHTML = "";
  }
}

function renderTooltip(ev: PointerEvent) {
  const i = S.hover, vi = varInfo();
  const pv = S.prime ? displayField(S.prime.rollout, S.day, S.view)[i ?? 0] : null;
  const bv = S.branch && comparable() ? displayField(S.branch.rollout, S.day, S.view)[i ?? 0] : null;
  showTooltip($("tooltip"), ev, i, S.land, pv, bv, vi, i != null && !!boxMask(S.shock.box)[i], i != null && !!boxMask(S.impactBox)[i]);
}

function renderRipple() {
  const th = RIPPLE_THRESHOLDS[S.view];
  $("ripple-hint").textContent = `Share of cells outside the shock box with |Δ ${varInfo().label.toLowerCase()}| > ${th} ${varInfo().deltaUnit}. Shows how far the model's response reaches each day.`;
  $("ripple-chart").innerHTML = rippleChartSvg(rippleSeries(), S.day);
}

function renderAgri() {
  const out = $("agri-out"), chart = $("agri-chart");
  $("agri-region").innerHTML = `<span class="tag-impact">Farm region</span> ${describeBox(S.impactBox)}. Independent of the shock box: use “Draw farm region” to move it.`;
  if (!comparable()) {
    out.innerHTML = `<p class="hint">Runs after both Prime and Branch exist for the same input.</p>`;
    chart.innerHTML = `<text x="190" y="92" text-anchor="middle" class="svg-empty">Run Prime, then a Branch, to compare rainfall here</text>`;
    return;
  }
  const num = (id: string) => Number($<HTMLInputElement>(id).value);
  const res = currentImpact()!;
  if (res.empty) {
    out.innerHTML = `<p class="err">${escapeHtml(res.reason)}</p>`;
    chart.innerHTML = "";
    return;
  }
  out.innerHTML = indicatorTableHtml(res, S.branch!.runNo, num("agri-dry"), num("agri-heavy"));
  chart.innerHTML = agriChartSvg(res, agriMode, S.day, num("agri-dry"));
  document.querySelectorAll<HTMLButtonElement>("[data-agri-mode]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.agriMode === agriMode)));
  $("agri-source").textContent = `Data: ${engineLabel(S.prime!.engine)} · Prime #${S.prime!.runNo} vs Branch #${S.branch!.runNo} · land-cell mean, cos(lat) weighted`;
}


if (introEnabled()) playIntro();
boot();
