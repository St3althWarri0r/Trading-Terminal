"use client";

import { useMemo, useState } from "react";
import Panel from "@/components/ui/Panel";
import { Arrow } from "@/components/ui/values";
import { useQuotes } from "@/lib/hooks";
import { useTerminal } from "@/lib/store";
import { changeColor, fmtPct, fmtPrice } from "@/lib/format";
import { normalizeSymbol } from "@/lib/command";
import type { Quote } from "@/lib/types";

export default function Watchlist() {
  const watchlist = useTerminal((s) => s.watchlist);
  const selected = useTerminal((s) => s.symbol);
  const setSymbol = useTerminal((s) => s.setSymbol);
  const addToWatchlist = useTerminal((s) => s.addToWatchlist);
  const removeFromWatchlist = useTerminal((s) => s.removeFromWatchlist);

  const [draft, setDraft] = useState("");
  const { data, isError } = useQuotes(watchlist, watchlist.length > 0);

  const bySymbol = useMemo(() => {
    const m = new Map<string, Quote>();
    for (const q of data ?? []) m.set(q.symbol, q);
    return m;
  }, [data]);

  const submitAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const sym = normalizeSymbol(draft);
    if (sym) {
      addToWatchlist(sym);
      setSymbol(sym);
      setDraft("");
    }
  };

  return (
    <Panel title="Watchlist" code="W" id="watchlist-panel" bodyClassName="flex flex-col">
      <div className="flex items-center gap-2 border-b border-term-line px-2 py-0.5 text-[10px] uppercase tracking-wider text-term-dim">
        <span className="flex-1">Symbol</span>
        <span className="w-16 text-right">Last</span>
        <span className="w-16 text-right">Chg%</span>
        <span className="w-4" />
      </div>

      {isError && watchlist.length > 0 && (
        <div className="border-b border-term-line px-2 py-1 text-[11px] text-term-down">
          Quotes unavailable — retrying…
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto">
        {watchlist.length === 0 ? (
          <div className="p-3 text-[12px] text-term-dim">
            No symbols. Add one below or type a ticker in the command bar.
          </div>
        ) : (
          watchlist.map((sym) => {
            const q = bySymbol.get(sym);
            const active = sym === selected;
            return (
              <div
                key={sym}
                className={`group flex items-center gap-2 px-2 py-[3px] ${
                  active ? "bg-term-amber/10" : "hover:bg-term-row"
                }`}
              >
                <button
                  type="button"
                  onClick={() => setSymbol(sym)}
                  className="flex flex-1 items-center gap-2 text-left"
                  title={q?.name ?? sym}
                >
                  <span
                    className={`w-16 shrink-0 truncate text-[12px] font-semibold ${
                      active ? "text-term-amber-bright" : "text-term-amber"
                    }`}
                  >
                    {sym}
                  </span>
                  <span className="w-16 shrink-0 text-right text-[12px] tabular-nums text-term-bright">
                    {q ? fmtPrice(q.price) : "—"}
                  </span>
                  <span
                    className={`flex w-16 shrink-0 items-center justify-end gap-1 text-[12px] tabular-nums ${changeColor(
                      q?.changePercent
                    )}`}
                  >
                    {q && <Arrow value={q.changePercent} className="text-[0.6em]" />}
                    {q ? fmtPct(q.changePercent) : "—"}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => removeFromWatchlist(sym)}
                  aria-label={`Remove ${sym}`}
                  className="w-4 shrink-0 text-center text-[13px] text-term-dim opacity-0 transition-opacity hover:text-term-down focus-visible:text-term-down focus-visible:opacity-100 focus-visible:outline-none group-hover:opacity-100 [@media(pointer:coarse)]:opacity-100"
                >
                  ×
                </button>
              </div>
            );
          })
        )}
      </div>

      <form
        onSubmit={submitAdd}
        className="flex shrink-0 items-center gap-1 border-t border-term-line px-2 py-1 focus-within:border-term-amber-dim"
      >
        <span className="text-term-amber-dim">+</span>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          spellCheck={false}
          autoComplete="off"
          placeholder="Add symbol…"
          className="h-5 w-full bg-transparent text-[12px] uppercase text-term-bright caret-term-amber outline-none placeholder:text-term-dim placeholder:normal-case"
        />
      </form>
    </Panel>
  );
}
