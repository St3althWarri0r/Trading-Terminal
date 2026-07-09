"use client";

import { useEffect, useState } from "react";
import Panel from "@/components/ui/Panel";
import { useNews } from "@/lib/hooks";
import { useTerminal } from "@/lib/store";
import { fmtRelativeTime } from "@/lib/format";

interface NewsPanelProps {
  /** Omit for a market-wide feed; pass a ticker for company news. */
  symbol?: string;
  title: string;
}

export default function NewsPanel({ symbol, title }: NewsPanelProps) {
  const setSymbol = useTerminal((s) => s.setSymbol);
  const { data: items, isLoading, isError, error, isFetching, refetch } = useNews(symbol);
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  return (
    <Panel
      title={title}
      live={isFetching}
      actions={
        <button
          type="button"
          // Guard instead of `disabled` — disabling a focused button ejects
          // keyboard focus to <body>, and isFetching also flips on background
          // polls, which would yank focus with no user action at all.
          onClick={() => {
            if (!isFetching) refetch();
          }}
          aria-busy={isFetching}
          title="Refresh news"
          aria-label="Refresh news"
          className="flex h-4 shrink-0 items-center rounded-sm bg-term-amber/10 px-1 text-term-amber-bright hover:bg-term-amber/20"
        >
          <svg
            viewBox="0 0 24 24"
            width="11"
            height="11"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
            className={isFetching ? "animate-spin motion-reduce:animate-none" : undefined}
          >
            <polyline points="23 4 23 10 17 10" />
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
          </svg>
        </button>
      }
      bodyClassName="overflow-y-auto"
    >
      {isLoading && !items ? (
        <div className="p-3 text-[12px] text-term-dim">Loading headlines…</div>
      ) : isError ? (
        <div className="p-3 text-[12px] text-term-down">{(error as Error)?.message ?? "News unavailable."}</div>
      ) : items && items.length > 0 ? (
        <ul className="divide-y divide-term-line">
          {items.map((n) => (
            <li key={n.id} className="px-2 py-1.5 hover:bg-term-row">
              <a href={n.link} target="_blank" rel="noopener noreferrer" className="block">
                <div className="flex items-baseline gap-2">
                  <span className="shrink-0 text-[10px] tabular-nums text-term-amber-dim">
                    {fmtRelativeTime(n.publishedAt, nowMs)}
                  </span>
                  <span className="text-[12px] leading-snug text-term-text hover:text-term-bright">
                    {n.title}
                  </span>
                </div>
              </a>
              <div className="mt-0.5 flex flex-wrap items-center gap-1.5 pl-[3.1rem] text-[10px] text-term-dim">
                <span className="uppercase tracking-wide">{n.publisher}</span>
                {n.tickers.slice(0, 4).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setSymbol(t)}
                    className="rounded-sm bg-term-amber/10 px-1 text-term-amber-bright hover:bg-term-amber/20"
                  >
                    {t}
                  </button>
                ))}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="p-3 text-[12px] text-term-dim">No recent headlines.</div>
      )}
    </Panel>
  );
}
