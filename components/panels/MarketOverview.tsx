"use client";

import Panel from "@/components/ui/Panel";
import { Arrow } from "@/components/ui/values";
import { useMarket } from "@/lib/hooks";
import { useTerminal } from "@/lib/store";
import { changeColor, fmtPct, fmtPrice } from "@/lib/format";
import type { Quote, SectorPerf } from "@/lib/types";

function QuoteRow({ q, onPick }: { q: Quote; onPick: (s: string) => void }) {
  return (
    <button
      type="button"
      onClick={() => onPick(q.symbol)}
      className="flex w-full items-center gap-2 px-2 py-[3px] text-left hover:bg-term-row"
      title={q.name}
    >
      <span className="w-24 shrink-0 truncate text-[12px] text-term-text">{q.name}</span>
      <span className="flex-1 text-right text-[12px] tabular-nums text-term-bright">
        {fmtPrice(q.price)}
      </span>
      <span className={`flex w-20 shrink-0 items-center justify-end gap-1 text-[12px] tabular-nums ${changeColor(q.changePercent)}`}>
        <Arrow value={q.changePercent} className="text-[0.65em]" />
        {fmtPct(q.changePercent)}
      </span>
    </button>
  );
}

function Section({
  label,
  quotes,
  onPick,
}: {
  label: string;
  quotes: Quote[];
  onPick: (s: string) => void;
}) {
  if (quotes.length === 0) return null;
  return (
    <div>
      <div className="sticky top-0 z-10 bg-term-panel px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-term-amber-dim">
        {label}
      </div>
      {quotes.map((q) => (
        <QuoteRow key={q.symbol} q={q} onPick={onPick} />
      ))}
    </div>
  );
}

function SectorBar({ s, onPick }: { s: SectorPerf; onPick: (sym: string) => void }) {
  const pct = s.changePercent ?? 0;
  const width = Math.min(100, Math.abs(pct) * 12);
  const up = pct >= 0;
  return (
    <button
      type="button"
      onClick={() => onPick(s.symbol)}
      className="flex w-full items-center gap-2 px-2 py-[3px] text-left hover:bg-term-row"
    >
      <span className="w-24 shrink-0 truncate text-[12px] text-term-text">{s.name}</span>
      <span className="relative flex h-2.5 flex-1 items-center">
        <span className="absolute left-1/2 h-full w-px bg-term-line-bright" />
        <span
          className={up ? "absolute left-1/2 h-full bg-term-up/70" : "absolute right-1/2 h-full bg-term-down/70"}
          style={{ width: `${width / 2}%` }}
        />
      </span>
      <span className={`w-16 shrink-0 text-right text-[12px] tabular-nums ${changeColor(pct)}`}>
        {fmtPct(pct)}
      </span>
    </button>
  );
}

export default function MarketOverview() {
  const setSymbol = useTerminal((s) => s.setSymbol);
  const { data, isLoading, isError, error } = useMarket();

  const pick = (s: string) => setSymbol(s);

  return (
    <Panel title="Market Monitor" code="MKT" live id="market-col" bodyClassName="overflow-y-auto">
      {isLoading && !data ? (
        <div className="p-3 text-[12px] text-term-dim">Loading market data…</div>
      ) : isError ? (
        <div className="p-3 text-[12px] text-term-down">{(error as Error)?.message ?? "Failed to load."}</div>
      ) : data ? (
        <div className="pb-2">
          <Section label="Indices" quotes={data.indices} onPick={pick} />
          <Section label="Futures" quotes={data.futures} onPick={pick} />
          <Section label="Rates" quotes={data.rates} onPick={pick} />
          <Section label="Commodities" quotes={data.commodities} onPick={pick} />
          <Section label="Crypto" quotes={data.crypto} onPick={pick} />
          <Section label="FX" quotes={data.currencies} onPick={pick} />
          {data.sectors.length > 0 && (
            <div>
              <div className="sticky top-0 z-10 bg-term-panel px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-term-amber-dim">
                Sectors
              </div>
              {data.sectors.map((s) => (
                <SectorBar key={s.symbol} s={s} onPick={pick} />
              ))}
            </div>
          )}
        </div>
      ) : null}
    </Panel>
  );
}
