/** Number/date formatting helpers shared across every panel. */

const DASH = "—";

/** Price with adaptive precision: tiny prices show more decimals. */
export function fmtPrice(v: number | null | undefined, digits?: number): string {
  if (v == null || !Number.isFinite(v)) return DASH;
  const d =
    digits ??
    (Math.abs(v) >= 1000 ? 2 : Math.abs(v) >= 1 ? 2 : Math.abs(v) >= 0.01 ? 4 : 6);
  return v.toLocaleString("en-US", {
    minimumFractionDigits: d,
    maximumFractionDigits: d,
  });
}

/** Signed number, e.g. `+1.34` / `-0.87`. */
export function fmtChange(v: number | null | undefined, digits = 2): string {
  if (v == null || !Number.isFinite(v)) return DASH;
  const sign = v > 0 ? "+" : v < 0 ? "" : "";
  return `${sign}${v.toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })}`;
}

/** Signed percentage, e.g. `+0.59%`. */
export function fmtPct(v: number | null | undefined, digits = 2): string {
  if (v == null || !Number.isFinite(v)) return DASH;
  const sign = v > 0 ? "+" : "";
  return `${sign}${v.toFixed(digits)}%`;
}

/** Compact large numbers: 1.2T / 41.2B / 3.4M / 12.5K. */
export function fmtCompact(v: number | null | undefined, digits = 2): string {
  if (v == null || !Number.isFinite(v)) return DASH;
  const abs = Math.abs(v);
  const sign = v < 0 ? "-" : "";
  if (abs >= 1e12) return `${sign}${(abs / 1e12).toFixed(digits)}T`;
  if (abs >= 1e9) return `${sign}${(abs / 1e9).toFixed(digits)}B`;
  if (abs >= 1e6) return `${sign}${(abs / 1e6).toFixed(digits)}M`;
  if (abs >= 1e3) return `${sign}${(abs / 1e3).toFixed(digits)}K`;
  return `${sign}${abs.toFixed(0)}`;
}

/** Whole-number volume with thousands separators. */
export function fmtVolume(v: number | null | undefined): string {
  if (v == null || !Number.isFinite(v)) return DASH;
  return Math.round(v).toLocaleString("en-US");
}

export function fmtInt(v: number | null | undefined): string {
  if (v == null || !Number.isFinite(v)) return DASH;
  return Math.round(v).toLocaleString("en-US");
}

/** A number that is already a fraction (0.23 → "23.00%"). */
export function fmtRatioPct(
  v: number | null | undefined,
  digits = 2
): string {
  if (v == null || !Number.isFinite(v)) return DASH;
  return `${(v * 100).toFixed(digits)}%`;
}

export function fmtMultiple(v: number | null | undefined, digits = 2): string {
  if (v == null || !Number.isFinite(v)) return DASH;
  return v.toFixed(digits);
}

/** "228.10 - 229.40" style range. */
export function fmtRange(
  low: number | null | undefined,
  high: number | null | undefined
): string {
  if (low == null || high == null) return DASH;
  return `${fmtPrice(low)} - ${fmtPrice(high)}`;
}

/** Where `value` sits inside [low, high], as a 0–100 percentage (clamped). */
export function rangePosition(
  value: number | null | undefined,
  low: number | null | undefined,
  high: number | null | undefined
): number | null {
  if (value == null || low == null || high == null || high <= low) return null;
  return Math.min(100, Math.max(0, ((value - low) / (high - low)) * 100));
}

/** Sign helper used to pick up/down/flat coloring. */
export function signOf(v: number | null | undefined): 1 | -1 | 0 {
  if (v == null || !Number.isFinite(v) || v === 0) return 0;
  return v > 0 ? 1 : -1;
}

/** Tailwind text-color class for a directional value. */
export function changeColor(v: number | null | undefined): string {
  const s = signOf(v);
  return s > 0 ? "text-term-up" : s < 0 ? "text-term-down" : "text-term-dim";
}

/** Relative "3h ago" / "2d ago" from an epoch-ms timestamp. */
export function fmtRelativeTime(ms: number | null | undefined, nowMs: number): string {
  if (ms == null || !Number.isFinite(ms)) return DASH;
  const diff = Math.max(0, nowMs - ms);
  const min = Math.floor(diff / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const d = Math.floor(hr / 24);
  if (d < 30) return `${d}d ago`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `${mo}mo ago`;
  return `${Math.floor(mo / 12)}y ago`;
}

const MARKET_STATE_LABEL: Record<string, string> = {
  REGULAR: "MKT OPEN",
  PRE: "PRE-MKT",
  PREPRE: "PRE-MKT",
  POST: "AFTER HRS",
  POSTPOST: "CLOSED",
  CLOSED: "MKT CLOSED",
};

export function marketStateLabel(state: string | null | undefined): string {
  if (!state) return "—";
  return MARKET_STATE_LABEL[state] ?? state;
}
