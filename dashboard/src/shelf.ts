/**
 * Multiverse shelf: every non-zero Branch run for the current input, as a small card with its "fingerprint"
 * (the day-by-day peak change it caused). Clicking a card brings that future back on the map. Display only:
 * runs are kept in memory exactly as the server returned them; nothing is recomputed or re-sent.
 */
import { escapeHtml, fmt } from "./format";

export interface ShelfItem {
  runNo: number;
  label: string;
  detail: string; // e.g. "t2m +3.0 K · tcwv +15%"
  peaks: number[]; // max |Δ rain| (mm/day) per forecast day, vs the Prime it was compared with
}

const MAX_ITEMS = 8;

/** Newest first; the same run is never listed twice; at most MAX_ITEMS kept. */
export function addToShelf(items: ShelfItem[], item: ShelfItem): ShelfItem[] {
  return [item, ...items.filter((x) => x.runNo !== item.runNo)].slice(0, MAX_ITEMS);
}

/** Tiny bar chart of the per-day peak change; the selected day is highlighted. All cards share one scale. */
export function fingerprintSvg(peaks: number[], day: number, scaleMax: number): string {
  const W = 120, H = 22, n = peaks.length, gap = 2, bw = (W - gap * (n - 1)) / n;
  const top = Math.max(scaleMax, 1e-9);
  return `<svg viewBox="0 0 ${W} ${H}" class="fp" aria-hidden="true">${peaks.map((v, i) => {
    const h = Math.max(1.5, (v / top) * H);
    return `<rect x="${(i * (bw + gap)).toFixed(1)}" y="${(H - h).toFixed(1)}" width="${bw.toFixed(1)}" height="${h.toFixed(1)}" rx="1" class="${i + 1 === day ? "on" : ""}"/>`;
  }).join("")}</svg>`;
}

export function shelfHtml(items: ShelfItem[], activeRun: number | null, day: number): string {
  if (!items.length) return "";
  const scaleMax = Math.max(...items.flatMap((x) => x.peaks));
  const cards = items.map((x) => {
    const peak = Math.max(...x.peaks);
    const on = x.runNo === activeRun;
    return `<li><button type="button" class="shelf-card${on ? " on" : ""}" data-run="${x.runNo}" aria-pressed="${on}"
        aria-label="Branch ${x.runNo}: ${escapeHtml(x.label)}, peak rain change ${fmt(peak, 1)} millimetres per day${on ? ", on the map" : ""}">
      <span class="shelf-top"><span class="shelf-no">#${x.runNo}</span><span class="shelf-peak mono">${fmt(peak, 1)}<small> mm/d</small></span></span>
      <span class="shelf-name">${escapeHtml(x.label)}</span>
      <span class="shelf-detail">${escapeHtml(x.detail)}</span>
      ${fingerprintSvg(x.peaks, day, scaleMax)}
    </button></li>`;
  }).join("");
  return `<h3 class="shelf-h">Futures <span>${items.length}</span></h3><ul class="shelf-list">${cards}</ul>
    <p class="shelf-note">Bars: biggest rain change each day. Click to bring one back.</p>`;
}
