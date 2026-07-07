"use client";

import { changeColor, fmtChange, fmtPct, signOf } from "@/lib/format";

/** Directional glyph: ▲ up, ▼ down, ▪ flat. */
export function Arrow({ value, className = "" }: { value: number | null | undefined; className?: string }) {
  const s = signOf(value);
  const glyph = s > 0 ? "▲" : s < 0 ? "▼" : "▪";
  return (
    <span className={`${changeColor(value)} ${className}`} aria-hidden>
      {glyph}
    </span>
  );
}

/**
 * Combined change + percent, e.g. `▲ +4.03 (+1.31%)`, colored by direction.
 * Set `arrow`/`abs`/`pct` to toggle the pieces shown.
 */
export function Delta({
  change,
  percent,
  arrow = true,
  abs = true,
  pct = true,
  digits = 2,
  className = "",
}: {
  change?: number | null;
  percent?: number | null;
  arrow?: boolean;
  abs?: boolean;
  pct?: boolean;
  digits?: number;
  className?: string;
}) {
  const basis = change ?? percent ?? 0;
  return (
    <span className={`inline-flex items-center gap-1 ${changeColor(basis)} ${className}`}>
      {arrow && <Arrow value={basis} className="text-[0.7em]" />}
      {abs && change != null && <span>{fmtChange(change, digits)}</span>}
      {pct && percent != null && (
        <span>{abs && change != null ? `(${fmtPct(percent, digits)})` : fmtPct(percent, digits)}</span>
      )}
    </span>
  );
}

/** A compact label/value stat cell used across the stat strips. */
export function Stat({
  label,
  value,
  valueClass = "text-term-bright",
  title,
}: {
  label: string;
  value: React.ReactNode;
  valueClass?: string;
  title?: string;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5 px-2 py-1" title={title}>
      <span className="truncate text-[10px] uppercase tracking-wider text-term-dim">{label}</span>
      <span className={`block truncate text-[12px] tabular-nums ${valueClass}`}>{value}</span>
    </div>
  );
}
