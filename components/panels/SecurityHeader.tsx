"use client";

import { Arrow, Delta, Stat } from "@/components/ui/values";
import { useQuote } from "@/lib/hooks";
import { useTerminal } from "@/lib/store";
import {
  changeColor,
  fmtCompact,
  fmtPct,
  fmtPrice,
  fmtRange,
} from "@/lib/format";
import { QUOTE_TYPE_LABEL } from "@/lib/constants";
import type { Quote } from "@/lib/types";

function extendedHours(q: Quote) {
  const state = q.marketState ?? "";
  if (state.startsWith("PRE") && q.preMarketPrice != null) {
    return { label: "Pre-Market", price: q.preMarketPrice, change: q.preMarketChange, pct: q.preMarketChangePercent };
  }
  if (state.startsWith("POST") && q.postMarketPrice != null) {
    return { label: "After Hours", price: q.postMarketPrice, change: q.postMarketChange, pct: q.postMarketChangePercent };
  }
  return null;
}

export default function SecurityHeader() {
  const symbol = useTerminal((s) => s.symbol);
  const watchlist = useTerminal((s) => s.watchlist);
  const toggleWatchlist = useTerminal((s) => s.toggleWatchlist);
  const { data: q, isLoading, isError, error } = useQuote(symbol);

  const inWatchlist = watchlist.includes(symbol);
  const ext = q ? extendedHours(q) : null;
  const loading = isLoading && !q;

  return (
    <section className="border border-term-line bg-term-panel">
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-2 p-3">
        {/* Identity + price */}
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-term-amber text-glow-amber">{symbol}</h1>
            {q?.quoteType && (
              <span className="rounded-sm border border-term-line-bright px-1 text-[10px] uppercase tracking-wide text-term-dim">
                {QUOTE_TYPE_LABEL[q.quoteType] ?? q.quoteType}
              </span>
            )}
            <button
              type="button"
              onClick={() => toggleWatchlist(symbol)}
              aria-label={inWatchlist ? "Remove from watchlist" : "Add to watchlist"}
              className={`text-[15px] leading-none ${inWatchlist ? "text-term-yellow" : "text-term-dim hover:text-term-yellow"}`}
              title={inWatchlist ? "In watchlist" : "Add to watchlist"}
            >
              {inWatchlist ? "★" : "☆"}
            </button>
          </div>
          <div className="mt-0.5 truncate text-[13px] text-term-text">
            {q?.name ?? (isError ? "" : "Loading…")}
            {q?.exchange && <span className="text-term-dim"> · {q.exchange}</span>}
            {q?.currency && <span className="text-term-dim"> · {q.currency}</span>}
          </div>
          {isError && (
            <div className="mt-1 text-[12px] text-term-down">
              {(error as Error)?.message ?? "Could not load quote."}
            </div>
          )}
        </div>

        <div className="text-right">
          <div className="flex items-baseline justify-end gap-2">
            <span
              className={`text-3xl font-bold tabular-nums ${
                loading ? "animate-pulse text-term-dim" : changeColor(q?.change)
              }`}
            >
              {loading ? "····" : fmtPrice(q?.price)}
            </span>
            <Arrow value={q?.change} className="text-lg" />
          </div>
          <div className="mt-0.5 text-[14px] tabular-nums">
            <Delta change={q?.change} percent={q?.changePercent} />
          </div>
          {ext && (
            <div className="mt-0.5 text-[11px] text-term-dim">
              {ext.label}: <span className="tabular-nums text-term-text">{fmtPrice(ext.price)}</span>{" "}
              <span className={`tabular-nums ${changeColor(ext.change)}`}>
                {fmtPct(ext.pct)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Key stats strip */}
      <div className="grid grid-cols-3 gap-px border-t border-term-line bg-term-line sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
        <StatCell label="Open" value={fmtPrice(q?.open)} />
        <StatCell label="Prev Close" value={fmtPrice(q?.previousClose)} />
        <StatCell label="Day Range" value={fmtRange(q?.dayLow, q?.dayHigh)} />
        <StatCell label="52W Range" value={fmtRange(q?.fiftyTwoWeekLow, q?.fiftyTwoWeekHigh)} />
        <StatCell label="Volume" value={fmtCompact(q?.volume)} />
        <StatCell label="Avg Vol" value={fmtCompact(q?.avgVolume)} />
        <StatCell label="Mkt Cap" value={fmtCompact(q?.marketCap)} />
        <StatCell label="P/E (TTM)" value={q?.trailingPE != null ? q.trailingPE.toFixed(2) : "—"} />
      </div>
    </section>
  );
}

function StatCell({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="bg-term-panel">
      <Stat label={label} value={value} />
    </div>
  );
}
