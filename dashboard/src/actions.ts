/** Everything the command field can do, and the single "next action" it shows. Built from callbacks into the app. */
import type { Command, NextAction } from "./command";
import { VIEW_VARS, type ViewVar } from "./fields";
import { PRESETS } from "./shock";
import type { TabName } from "./ui";

export interface AppApi {
  hasInput: () => boolean;
  hasPrime: () => boolean;
  hasBranch: () => boolean; // a current, non-zero Branch is on screen
  stale: () => boolean; // shock edited since the Branch on screen
  serverReady: () => boolean;
  busy: () => boolean;
  shockLabel: () => string;
  loadState: () => void;
  runPrime: () => void;
  runBranch: () => void;
  zeroCheck: () => void;
  preset: (id: string) => void;
  setView: (v: "prime" | "branch" | "diff" | "swipe") => void;
  setVar: (v: ViewVar) => void;
  play: () => void;
  open: (t: TabName) => void;
  drawFarm: () => void;
  replayIntro: () => void;
}

export function nextAction(a: AppApi): NextAction {
  if (!a.hasInput()) return { label: "Load state", detail: "a three-day input JSON", run: a.loadState, enabled: true };
  if (!a.serverReady()) return { label: "Waiting for the server", detail: "start serve.py", run: () => {}, enabled: false };
  if (!a.hasPrime()) return { label: "Run Prime", detail: "10-day forecast, no shock", run: a.runPrime, enabled: !a.busy() };
  if (!a.hasBranch() || a.stale()) return { label: "Run Branch", detail: a.shockLabel(), run: a.runBranch, enabled: !a.busy() };
  return { label: "Play the days", detail: "or ⌘K for another shock", run: a.play, enabled: true };
}

export function buildCommands(a: AppApi): Command[] {
  const always = () => true;
  const prime = () => a.hasPrime() && a.serverReady() && !a.busy();
  return [
    { id: "load", group: "Run", label: "Load state", hint: "input JSON", enabled: always, run: a.loadState },
    { id: "prime", group: "Run", label: "Run Prime", hint: "no shock", enabled: () => a.hasInput() && a.serverReady() && !a.busy(), run: a.runPrime },
    { id: "branch", group: "Run", label: "Run Branch", hint: a.shockLabel(), enabled: prime, run: a.runBranch },
    { id: "zero", group: "Run", label: "Zero-shock check", hint: "all-zero tensor", enabled: prime, run: a.zeroCheck },
    ...PRESETS.map((p) => ({ id: `preset-${p.id}`, group: "Shock presets", label: p.label, enabled: always, run: () => a.preset(p.id) })),
    { id: "edit", group: "Shock presets", label: "Edit shock by hand", hint: "box, variables, size", enabled: always, run: () => a.open("shock") },
    { id: "farm", group: "Shock presets", label: "Draw farm region", hint: "drag on the map", enabled: always, run: a.drawFarm },
    { id: "v-prime", group: "Map view", label: "Show Prime", enabled: a.hasPrime, run: () => a.setView("prime") },
    { id: "v-branch", group: "Map view", label: "Show Branch", enabled: a.hasBranch, run: () => a.setView("branch") },
    { id: "v-diff", group: "Map view", label: "Show Difference", hint: "Branch − Prime", enabled: a.hasBranch, run: () => a.setView("diff") },
    { id: "v-swipe", group: "Map view", label: "Swipe Prime | Branch", enabled: a.hasBranch, run: () => a.setView("swipe") },
    { id: "play", group: "Map view", label: "Play the days", enabled: a.hasPrime, run: a.play },
    ...VIEW_VARS.map((v) => ({ id: `var-${v.id}`, group: "Weather layer", label: v.label, hint: v.unit, enabled: always, run: () => a.setVar(v.id) })),
    { id: "impact", group: "Details", label: "Farm impact", hint: "cards and chart", enabled: always, run: () => a.open("impact") },
    { id: "ripple", group: "Details", label: "Ripple reach", enabled: always, run: () => a.open("ripple") },
    { id: "setup", group: "Details", label: "Setup", hint: "run info, display, developer", enabled: always, run: () => a.open("setup") },
    { id: "intro", group: "Details", label: "Replay intro", hint: "Pralaya in 12 languages", enabled: always, run: a.replayIntro },
  ];
}
