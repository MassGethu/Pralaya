"""Build the two-page brief: draw its charts from evaluation/results, fill brief.template.html, print the PDF.

    python brief/build_brief.py              # writes brief/brief.html and brief/PRALAYA_brief.pdf
    python brief/build_brief.py --no-pdf     # HTML only

Every plotted number is read from the committed result files; nothing is typed in by hand here.
The PDF step needs a Chromium-based browser (set CHROME=/path/to/chrome if it is not found).
"""

import argparse
import json
import math
import os
import shutil
import subprocess
import sys
from html import escape
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BRIEF = ROOT / "brief"
RESULTS = ROOT / "evaluation" / "results"

INK = "#1f2933"
MUTED = "#5b6670"
GRID = "#e3e7ea"
PAST = ("#c3cad1", "#a2acb6", "#7f8a95")  # earlier releases, light to dark
SERVED = "#2a78d6"  # Prime and the served model
SHOCK = "#e08600"  # Branch and the warm Bay shock
WIND = "#6250d6"  # Arabian Sea wind shock
BAND = "#eaf2fb"
FONT = "Tomorrow, 'Avenir Next', sans-serif"


def load(name: str) -> dict:
    return json.loads((RESULTS / name).read_text())


def score(doc: dict) -> float:
    agg, shocks = doc["aggregate"], doc["shocks"]
    return (agg["rmse_points_proxy"] + agg["csi_points_proxy"] + agg["anti_blur_points_proxy"]
            + shocks["causality_points_proxy_mean"])


def text(x: float, y: float, s: str, size: float = 6.2, fill: str = INK, anchor: str = "start",
         weight: int = 400) -> str:
    return (f'<text x="{x:.1f}" y="{y:.1f}" font-size="{size}" fill="{fill}" text-anchor="{anchor}" '
            f'font-weight="{weight}">{escape(s)}</text>')


def svg(width: float, height: float, body: list[str], label: str) -> str:
    return (f'<svg viewBox="0 0 {width} {height}" role="img" aria-label="{escape(label)}" '
            f'font-family="{FONT}" xmlns="http://www.w3.org/2000/svg">' + "".join(body) + "</svg>")


def bar(x: float, y: float, w: float, h: float, fill: str) -> str:
    # Rounded data end, square baseline end.
    r = min(2.0, h / 2, w)
    return (f'<path d="M{x:.1f},{y:.1f} h{w - r:.1f} a{r},{r} 0 0 1 {r},{r} v{h - 2 * r:.1f} '
            f'a{r},{r} 0 0 1 -{r},{r} h-{w - r:.1f} z" fill="{fill}"/>')


def releases_chart() -> str:
    rows = [
        ("b1: one-step training", score(load("b1_onestep_test.json")), PAST[0]),
        ("b3: 4-day rollout fine-tune", score(load("b3_roll4_test.json")), PAST[0]),
        ("e3_roll8_ocean: 8-day rollout", score(load("e3_roll8_ocean_test.json")), PAST[1]),
        ("e3_rainstab: stability fine-tune", score(load("e3_rainstab_test.json")), PAST[1]),
        ("+ seasonal calibration", load("a5b/a5b_vs_release_test_followup.json")["release"]["S"], PAST[2]),
        ("+ 3-seed ensemble (served)", score(load("a5b/served_test.json")), SERVED),
    ]
    width, left, right, top, row = 256, 104, 22, 4, 15
    plot = width - left - right
    height = top + row * len(rows) + 14
    body = []
    for tick in range(0, 71, 10):
        x = left + plot * tick / 70
        body.append(f'<line x1="{x:.1f}" x2="{x:.1f}" y1="{top}" y2="{top + row * len(rows)}" stroke="{GRID}" stroke-width="0.5"/>')
        body.append(text(x, top + row * len(rows) + 8, str(tick), 5.6, MUTED, "middle"))
    for i, (name, value, color) in enumerate(rows):
        y = top + i * row
        served = color == SERVED
        body.append(text(left - 4, y + 9.4, name, 6.1, INK, "end", 600 if served else 400))
        body.append(bar(left, y + 4, plot * value / 70, 7, color))
        body.append(text(left + plot * value / 70 + 3, y + 9.6, f"{value:.1f}", 6.2, INK, "start", 600 if served else 400))
    return svg(width, height, body, "Local kit score on 2021 by release, out of 70")


LABEL_GAP = 7.0  # minimum vertical spacing between end labels, in SVG units


def skill_chart() -> str:
    series = [
        ("b1", load("b1_onestep_test.json"), PAST[0]),
        ("b3", load("b3_roll4_test.json"), PAST[1]),
        ("e3_rainstab", load("e3_rainstab_test.json"), PAST[2]),
        ("Served", load("a5b/served_test.json"), SERVED),
    ]
    width, height, left, right, top, bottom = 256, 96, 26, 52, 5, 16
    lo, hi = -0.25, 0.30
    px = lambda lead: left + (width - left - right) * (lead - 1) / 7
    py = lambda v: top + (height - top - bottom) * (hi - v) / (hi - lo)
    body = []
    for v in (-0.2, -0.1, 0.0, 0.1, 0.2, 0.3):
        y = py(v)
        stroke, w = (MUTED, 0.8) if v == 0 else (GRID, 0.5)
        body.append(f'<line x1="{left}" x2="{width - right}" y1="{y:.1f}" y2="{y:.1f}" stroke="{stroke}" stroke-width="{w}"/>')
        body.append(text(left - 3, y + 2, f"{v:+.1f}" if v else "0", 5.6, MUTED, "end"))
    body.append(text(px(1) + 2, py(0) + 7, "better baseline", 5.4, MUTED))
    for lead in (1, 4, 8):
        body.append(text(px(lead), height - bottom + 9, f"day {lead}", 5.8, MUTED, "middle"))
    labels = []
    for name, doc, color in series:
        pts = [(px(int(k)), py(doc["uncertainty"]["ss_by_lead"][k]["mean"])) for k in ("1", "4", "8")]
        width_line = 1.6 if color == SERVED else 1.1
        body.append(f'<polyline points="{" ".join(f"{x:.1f},{y:.1f}" for x, y in pts)}" fill="none" stroke="{color}" stroke-width="{width_line}" stroke-linejoin="round"/>')
        for x, y in pts:
            body.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="1.9" fill="{color}" stroke="#fff" stroke-width="0.8"/>')
        day8 = doc["uncertainty"]["ss_by_lead"]["8"]["mean"]
        labels.append([pts[-1][1] + 2, pts[-1][0] + 4, f"{name} {day8:+.2f}", 600 if color == SERVED else 400])
    labels.sort()
    for i in range(1, len(labels)):  # keep end labels at least one line apart
        labels[i][0] = max(labels[i][0], labels[i - 1][0] + LABEL_GAP)
    for y, x, label, weight in labels:
        body.append(text(x, y, label, 5.8, INK, "start", weight))
    return svg(width, height, body, "Forecast skill against the better baseline at days 1, 4 and 8, test year 2021")


def variance_chart() -> str:
    ratios = load("a5b/served_test.json")["aggregate"]["day8_variance_ratio"]
    names = {"t2m": "temperature", "tp": "rain", "u10": "east wind", "v10": "north wind", "msl": "pressure", "tcwv": "moisture"}
    width, left, right, top, row = 256, 60, 12, 11, 10.5
    height = top + row * len(ratios) + 14
    lo, hi = math.log(0.3), math.log(3.0)
    px = lambda v: left + (width - left - right) * (math.log(v) - lo) / (hi - lo)
    bottom = top + row * len(ratios)
    body = [f'<rect x="{px(0.4):.1f}" y="{top - 2}" width="{px(2.5) - px(0.4):.1f}" height="{bottom - top + 2}" fill="{BAND}"/>',
            text((px(0.4) + px(2.5)) / 2, top - 4.5, "kit band 0.4–2.5 (no blur, no noise)", 5.6, MUTED, "middle")]
    for v in (0.4, 1.0, 2.5):
        x = px(v)
        body.append(f'<line x1="{x:.1f}" x2="{x:.1f}" y1="{top - 2}" y2="{bottom}" stroke="{MUTED if v == 1 else GRID}" stroke-width="{0.8 if v == 1 else 0.5}"/>')
        body.append(text(x, bottom + 8, "observed" if v == 1 else str(v), 5.6, MUTED, "middle"))
    for i, (key, value) in enumerate(ratios.items()):
        y = top + i * row + row / 2
        body.append(text(left - 4, y + 2, names[key], 6.1, INK, "end"))
        body.append(f'<line x1="{px(1):.1f}" x2="{px(value):.1f}" y1="{y:.1f}" y2="{y:.1f}" stroke="{SERVED}" stroke-width="1"/>')
        body.append(f'<circle cx="{px(value):.1f}" cy="{y:.1f}" r="2.6" fill="{SERVED}" stroke="#fff" stroke-width="0.8"/>')
        anchor, dx = ("end", -5) if value < 1 else ("start", 5)
        body.append(text(px(value) + dx, y + 2, f"{value:.2f}", 5.8, INK, anchor))
    return svg(width, height, body, "Day-8 spatial variance as a share of observed, per channel, test year 2021")


def shock_chart() -> str:
    shocks = load("a5b/served_test.json")["shocks"]
    series = [("warm Bay of Bengal", shocks["warm_ocean"], SHOCK), ("weaker Arabian Sea wind", shocks["monsoon_stall"], WIND)]
    width, height, left, right, top, bottom = 256, 92, 22, 86, 6, 16
    hi = 5.5
    px = lambda day: left + (width - left - right) * (day - 1) / 9
    py = lambda v: top + (height - top - bottom) * (hi - v) / hi
    body = []
    for v in (0, 1, 2, 3, 4, 5):
        y = py(v)
        limit = v == 5
        body.append(f'<line x1="{left}" x2="{width - right}" y1="{y:.1f}" y2="{y:.1f}" stroke="{MUTED if limit else GRID}" stroke-width="{0.8 if limit else 0.5}"{" stroke-dasharray=\"3 2\"" if limit else ""}/>')
        body.append(text(left - 3, y + 2, str(v), 5.6, MUTED, "end"))
    body.append(text(width - right + 4, py(5) + 2, "stability limit", 5.6, MUTED))
    for day in (1, 4, 8, 10):
        body.append(text(px(day), height - bottom + 9, f"day {day}", 5.8, MUTED, "middle"))
    for name, shock, color in series:
        values = shock["peak_resp_std_by_day_mean"]
        pts = [(px(i + 1), py(v)) for i, v in enumerate(values)]
        body.append(f'<polyline points="{" ".join(f"{x:.1f},{y:.1f}" for x, y in pts)}" fill="none" stroke="{color}" stroke-width="1.6" stroke-linejoin="round"/>')
        body.append(text(pts[-1][0] + 4, pts[-1][1] + (-1.5 if color == SHOCK else 6.5), name, 5.8, INK))
    return svg(width, height, body, "Mean peak shock response in channel standard deviations by forecast day, 2021")


def worked_chart() -> str:
    worked = load("a5b/worked_example_2021-07-15.json")
    series = [("Prime", worked["prime"]["daily"], SERVED), ("Branch", worked["branch"]["daily"], SHOCK)]
    width, height, left, right, top, bottom = 256, 88, 22, 12, 6, 16
    hi = 16
    px = lambda day: left + (width - left - right) * (day - 1) / 6
    py = lambda v: top + (height - top - bottom) * (hi - v) / hi
    body = []
    for v in (0, 4, 8, 12, 16):
        y = py(v)
        body.append(f'<line x1="{left}" x2="{width - right}" y1="{y:.1f}" y2="{y:.1f}" stroke="{GRID}" stroke-width="0.5"/>')
        body.append(text(left - 3, y + 2, str(v), 5.6, MUTED, "end"))
    for day in range(1, 8):
        body.append(text(px(day), height - bottom + 9, f"day {day}", 5.6, MUTED, "middle"))
    for name, values, color in series:
        pts = [(px(i + 1), py(v)) for i, v in enumerate(values)]
        body.append(f'<polyline points="{" ".join(f"{x:.1f},{y:.1f}" for x, y in pts)}" fill="none" stroke="{color}" stroke-width="1.6" stroke-linejoin="round"/>')
        for x, y in pts:
            body.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="1.9" fill="{color}" stroke="#fff" stroke-width="0.8"/>')
        body.append(text(pts[5][0], pts[5][1] + (-4.5 if name == "Prime" else 9), name, 5.8, INK, "middle", 600))
    return svg(width, height, body, "Central India regional rain per day, Prime and Branch, window ending 15 July 2021")


def box(x: float, y: float, w: float, h: float, title: str, lines: list[str], accent: str = INK, fill: str = "#fff") -> str:
    parts = [f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="3" fill="{fill}" stroke="{accent}" stroke-width="0.8"/>']
    base = y + h / 2 - (len(lines) * 7.2 + 7.6) / 2 + 6.4
    parts.append(text(x + 6, base, title, 6.6, INK, "start", 600))
    for i, line in enumerate(lines):
        parts.append(text(x + 6, base + 7.8 + i * 7.2, line, 5.8, MUTED))
    return "".join(parts)


def arrow(x1: float, y1: float, x2: float, y2: float, color: str = MUTED) -> str:
    return (f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{color}" stroke-width="0.9" '
            f'marker-end="url(#head)"/>')


def architecture() -> str:
    body = ['<defs><marker id="head" viewBox="0 0 6 6" refX="5" refY="3" markerWidth="5" markerHeight="5" orient="auto">'
            f'<path d="M0,0 L6,3 L0,6 z" fill="{MUTED}"/></marker></defs>']
    r1, r2, h = 4, 50, 40
    body.append(box(0, r1, 84, r2 + h - r1, "Request", ["last 3 days, 6 variables", "on a 32 × 36 grid", "+ day of year", "+ optional shock δ", "(physical units)"]))
    body.append(box(98, r1, 118, h, "Three residual CNNs", ["seeds 0, 1, 2; each predicts", "tomorrow's change, 10 steps"]))
    body.append(box(230, r1, 124, h, "Mean and calibration", ["blend toward a seasonal curve", "and the last day; rain untouched"]))
    body.append(box(98, r2, 118, h, "Shock on the last input day", ["seed 0 runs with and", "without δ"], SHOCK))
    body.append(box(230, r2, 124, h, "Paired response", ["seed 0 shocked minus", "seed 0 unshocked"], SHOCK))
    body.append(box(368, r1, 64, h, "Prime", ["calibrated mean"], SERVED))
    body.append(box(368, r2, 64, h, "Branch", ["Prime + response"], SHOCK))
    body.append(box(446, r1, 81, r2 + h - r1, "POST /simulate", ["rain ≥ 0, t2m in", "233–333 K, JSON lists", "to the dashboard and", "scenario service"]))
    body += [arrow(84, r1 + h / 2, 97, r1 + h / 2), arrow(84, r2 + h / 2, 97, r2 + h / 2, SHOCK),
             arrow(216, r1 + h / 2, 229, r1 + h / 2), arrow(216, r2 + h / 2, 229, r2 + h / 2, SHOCK),
             arrow(354, r1 + h / 2, 367, r1 + h / 2), arrow(354, r2 + h / 2, 367, r2 + h / 2, SHOCK),
             arrow(400, r1 + h, 400, r2 - 1), arrow(432, r1 + h / 2, 445, r1 + h / 2), arrow(432, r2 + h / 2, 445, r2 + h / 2)]
    return svg(527, r2 + h + 2, body, "Serving pipeline from request to Prime and Branch")


def find_chrome() -> str | None:
    candidates = [os.environ.get("CHROME"), shutil.which("chromium"), shutil.which("google-chrome"),
                  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
                  "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser"]
    candidates += sorted(str(p) for p in Path.home().glob("Library/Caches/ms-playwright/chromium_headless_shell-*/*/chrome-headless-shell"))
    return next((c for c in candidates if c and Path(c).exists()), None)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--no-pdf", action="store_true")
    args = parser.parse_args()
    html = (BRIEF / "brief.template.html").read_text()
    figures = {"ARCH": architecture(), "RELEASES": releases_chart(), "SKILL": skill_chart(),
               "VARIANCE": variance_chart(), "SHOCK": shock_chart(), "WORKED": worked_chart()}
    for key, figure in figures.items():
        token = "{{" + key + "}}"
        if token not in html:
            sys.exit(f"brief.template.html has no {token}")
        html = html.replace(token, figure)
    out = BRIEF / "brief.html"
    out.write_text(html)
    print(f"wrote {out.relative_to(ROOT)}")
    if args.no_pdf:
        return
    chrome = find_chrome()
    if chrome is None:
        sys.exit("No Chromium-based browser found; set CHROME=/path/to/chrome or pass --no-pdf")
    pdf = BRIEF / "PRALAYA_brief.pdf"
    subprocess.run([chrome, "--headless", "--disable-gpu", "--no-pdf-header-footer", "--allow-file-access-from-files",
                    f"--print-to-pdf={pdf}", out.as_uri()], check=True, capture_output=True)
    print(f"wrote {pdf.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
