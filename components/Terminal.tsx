"use client";

import { useEffect, useState } from "react";
import CommandBar from "./CommandBar";
import StatusBar from "./StatusBar";
import HelpOverlay from "./HelpOverlay";
import MarketOverview from "./panels/MarketOverview";
import Watchlist from "./panels/Watchlist";
import SecurityHeader from "./panels/SecurityHeader";
import ChartPanel from "./panels/ChartPanel";
import Fundamentals from "./panels/Fundamentals";
import NewsPanel from "./panels/NewsPanel";
import { useTerminal, type CenterTab } from "@/lib/store";

const TABS: { key: CenterTab; code: string; label: string }[] = [
  { key: "chart", code: "GP", label: "Graph" },
  { key: "fundamentals", code: "FA", label: "Financials" },
  { key: "news", code: "CN", label: "News" },
];

function BootSplash() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 bg-term-bg text-center">
      <div className="text-2xl font-bold tracking-[0.3em] text-term-amber text-glow-amber">
        TRADING TERMINAL
      </div>
      <div className="flex items-center gap-2 text-[12px] text-term-dim">
        <span className="size-1.5 rounded-full bg-term-amber animate-term-blink" />
        INITIALIZING MARKET DATA…
      </div>
    </div>
  );
}

export default function Terminal() {
  const [mounted, setMounted] = useState(false);
  const symbol = useTerminal((s) => s.symbol);
  const tab = useTerminal((s) => s.tab);
  const setTab = useTerminal((s) => s.setTab);
  const setOverlay = useTerminal((s) => s.setOverlay);

  // Render the live terminal only after mount: the store rehydrates from
  // localStorage on the client, and the clock is client-only — gating here
  // keeps server and client markup identical (no hydration mismatch).
  useEffect(() => setMounted(true), []);
  if (!mounted) return <BootSplash />;

  return (
    <div className="flex h-full flex-col bg-term-bg">
      {/* Command header */}
      <header className="flex shrink-0 items-center gap-2 border-b border-term-line bg-term-panel-2 px-2 py-1.5">
        <div className="hidden shrink-0 items-baseline gap-1 sm:flex">
          <span className="text-[13px] font-bold tracking-[0.18em] text-term-amber text-glow-amber">
            TT
          </span>
          <span className="hidden text-[10px] uppercase tracking-widest text-term-dim lg:inline">
            Terminal
          </span>
        </div>
        <CommandBar />
        <button
          type="button"
          onClick={() => setOverlay("help")}
          className="shrink-0 border border-term-line px-2 py-1 text-[11px] text-term-dim hover:border-term-amber-dim hover:text-term-amber"
        >
          HELP
        </button>
      </header>

      {/* Panel grid */}
      <main className="min-h-0 flex-1 overflow-y-auto p-1 lg:overflow-hidden">
        <div className="grid gap-1 lg:h-full lg:grid-cols-[19rem_minmax(0,1fr)_22rem]">
          {/* Left: market monitor */}
          <div className="flex min-h-[26rem] flex-col lg:min-h-0 lg:h-full">
            <MarketOverview />
          </div>

          {/* Center: security + tabbed work area */}
          <div className="flex min-h-0 flex-col gap-1 lg:h-full">
            <SecurityHeader />
            <div className="flex items-center gap-px border border-term-line bg-term-panel">
              {TABS.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setTab(t.key)}
                  aria-pressed={tab === t.key}
                  className={`flex items-center gap-1.5 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider ${
                    tab === t.key
                      ? "bg-term-amber/15 text-term-amber-bright"
                      : "text-term-dim hover:text-term-text"
                  }`}
                >
                  <span className="text-[10px] opacity-70">{t.code}</span>
                  {t.label}
                </button>
              ))}
            </div>
            <div className="flex min-h-[28rem] flex-col lg:min-h-0 lg:flex-1">
              {tab === "chart" && <ChartPanel />}
              {tab === "fundamentals" && <Fundamentals />}
              {tab === "news" && (
                <NewsPanel symbol={symbol} title={`${symbol} · Company News`} />
              )}
            </div>
          </div>

          {/* Right: watchlist + market news */}
          <div className="grid min-h-0 grid-rows-[minmax(14rem,1fr)_minmax(14rem,1fr)] gap-1 lg:h-full">
            <Watchlist />
            <NewsPanel title="Market News" />
          </div>
        </div>
      </main>

      <StatusBar />
      <HelpOverlay />
    </div>
  );
}
