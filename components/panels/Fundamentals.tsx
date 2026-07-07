"use client";

import Panel from "@/components/ui/Panel";
import { useFundamentals } from "@/lib/hooks";
import { useTerminal } from "@/lib/store";
import {
  changeColor,
  fmtCompact,
  fmtMultiple,
  fmtPrice,
  fmtRatioPct,
} from "@/lib/format";

function Row({
  label,
  value,
  valueClass = "text-term-bright",
}: {
  label: string;
  value: React.ReactNode;
  valueClass?: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-2 px-2 py-[3px] odd:bg-term-row/40">
      <span className="text-[11px] text-term-dim">{label}</span>
      <span className={`text-[12px] tabular-nums ${valueClass}`}>{value}</span>
    </div>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="break-inside-avoid">
      <div className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-term-amber-dim">
        {title}
      </div>
      <div>{children}</div>
    </div>
  );
}

function prettyRec(key: string | null): string {
  if (!key) return "—";
  return key.replace(/_/g, " ").toUpperCase();
}

export default function Fundamentals() {
  const symbol = useTerminal((s) => s.symbol);
  const { data: f, isLoading, isError, error } = useFundamentals(symbol);

  return (
    <Panel title={`${symbol} · Financials`} code="FA" bodyClassName="overflow-y-auto">
      {isLoading && !f ? (
        <div className="p-3 text-[12px] text-term-dim">Loading fundamentals…</div>
      ) : isError ? (
        <div className="p-3 text-[12px] text-term-down">
          {(error as Error)?.message ?? "Fundamentals unavailable for this security."}
        </div>
      ) : f ? (
        <div className="pb-3">
          {/* Profile */}
          <div className="border-b border-term-line px-2 py-2">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px]">
              {f.profile.sector && <span className="text-term-text">{f.profile.sector}</span>}
              {f.profile.industry && <span className="text-term-dim">· {f.profile.industry}</span>}
              {f.profile.employees != null && (
                <span className="text-term-dim">· {fmtCompact(f.profile.employees, 1)} employees</span>
              )}
              {f.profile.country && <span className="text-term-dim">· {f.profile.country}</span>}
            </div>
            {f.profile.website && (
              <a
                href={f.profile.website}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-block text-[11px] text-term-cyan hover:underline"
              >
                {f.profile.website.replace(/^https?:\/\//, "")}
              </a>
            )}
            {f.profile.summary && (
              <p className="mt-1.5 max-h-24 overflow-y-auto text-[11px] leading-relaxed text-term-text">
                {f.profile.summary}
              </p>
            )}
          </div>

          <div className="columns-1 gap-0 lg:columns-2">
            <Group title="Valuation">
              <Row label="Market Cap" value={fmtCompact(f.valuation.marketCap)} />
              <Row label="Enterprise Value" value={fmtCompact(f.valuation.enterpriseValue)} />
              <Row label="P/E (TTM)" value={fmtMultiple(f.valuation.trailingPE)} />
              <Row label="P/E (Fwd)" value={fmtMultiple(f.valuation.forwardPE)} />
              <Row label="PEG Ratio" value={fmtMultiple(f.valuation.pegRatio)} />
              <Row label="Price / Book" value={fmtMultiple(f.valuation.priceToBook)} />
              <Row label="Price / Sales" value={fmtMultiple(f.valuation.priceToSales)} />
              <Row label="EV / EBITDA" value={fmtMultiple(f.valuation.enterpriseToEbitda)} />
              <Row label="Beta" value={fmtMultiple(f.valuation.beta)} />
            </Group>

            <Group title="Financials">
              <Row label="Revenue (TTM)" value={fmtCompact(f.financials.revenue)} />
              <Row
                label="Revenue Growth"
                value={fmtRatioPct(f.financials.revenueGrowth)}
                valueClass={`tabular-nums ${changeColor(f.financials.revenueGrowth)}`}
              />
              <Row label="Gross Margin" value={fmtRatioPct(f.financials.grossMargins)} />
              <Row label="Operating Margin" value={fmtRatioPct(f.financials.operatingMargins)} />
              <Row label="Profit Margin" value={fmtRatioPct(f.financials.profitMargins)} />
              <Row label="EBITDA" value={fmtCompact(f.financials.ebitda)} />
              <Row label="Free Cash Flow" value={fmtCompact(f.financials.freeCashflow)} />
              <Row label="Total Cash" value={fmtCompact(f.financials.totalCash)} />
              <Row label="Total Debt" value={fmtCompact(f.financials.totalDebt)} />
              <Row label="Debt / Equity" value={fmtMultiple(f.financials.debtToEquity)} />
              <Row label="Return on Equity" value={fmtRatioPct(f.financials.returnOnEquity)} />
              <Row label="Return on Assets" value={fmtRatioPct(f.financials.returnOnAssets)} />
              <Row label="Current Ratio" value={fmtMultiple(f.financials.currentRatio)} />
            </Group>

            <Group title="Per Share">
              <Row label="EPS (TTM)" value={fmtPrice(f.perShare.eps)} />
              <Row label="EPS (Fwd)" value={fmtPrice(f.perShare.forwardEps)} />
              <Row label="Book Value" value={fmtPrice(f.perShare.bookValue)} />
              <Row label="Dividend Rate" value={f.perShare.dividendRate != null ? fmtPrice(f.perShare.dividendRate) : "—"} />
              <Row label="Dividend Yield" value={fmtRatioPct(f.perShare.dividendYield)} />
              <Row label="Payout Ratio" value={fmtRatioPct(f.perShare.payoutRatio)} />
            </Group>

            <Group title="Analyst Targets">
              <Row label="Current Price" value={fmtPrice(f.targets.currentPrice)} />
              <Row label="Mean Target" value={fmtPrice(f.targets.targetMean)} valueClass="tabular-nums text-term-amber-bright" />
              <Row label="High Target" value={fmtPrice(f.targets.targetHigh)} />
              <Row label="Low Target" value={fmtPrice(f.targets.targetLow)} />
              <Row label="Rating" value={prettyRec(f.targets.recommendationKey)} valueClass="text-term-cyan" />
              <Row label="# Analysts" value={f.targets.numberOfAnalysts ?? "—"} />
            </Group>
          </div>
        </div>
      ) : null}
    </Panel>
  );
}
