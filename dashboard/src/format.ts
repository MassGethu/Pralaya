export const fmt = (v: number, d = 2): string => (Number.isFinite(v) ? v.toFixed(d) : "—");

/** Signed number with a real minus sign; exact zero shows as ±0. */
export const signed = (v: number, d = 2): string => (v > 0 ? "+" : v < 0 ? "−" : "±") + Math.abs(v).toFixed(d);

export function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]!);
}
