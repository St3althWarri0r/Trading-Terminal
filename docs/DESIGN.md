# Design — Trading Terminal

A short record of what this is and why it's built the way it is.

## Goal
A Bloomberg-inspired web terminal for **studying the markets** — dense, dark, amber,
keyboard-driven. Optimized for reading price action, fundamentals and news, not for
trading. Must run with **zero setup** (no API keys) and deploy in one click.

## Key decisions

**Web app, not a TUI.** A browser app reaches the widest audience (open a link, works on
any OS including Fedora/CachyOS), supports genuinely interactive charts, and deploys to
Vercel for free — while still nailing the terminal aesthetic. A Python TUI would be more
"authentic" but far less usable for a study tool.

**Yahoo Finance via `yahoo-finance2`, server-side.** No API key, broad coverage
(equities, ETFs, indices, futures, rates, commodities, crypto, FX), and one library that
handles Yahoo's cookie/crumb auth. Calls run in API routes so the browser never hits
Yahoo directly (no CORS, and a shared TTL cache softens rate limits). The tradeoff —
delayed, unofficial data — is acceptable for studying.

**Normalize at the edge.** `lib/yahoo.ts` converts Yahoo's sprawling, drifting response
shapes into small stable types (`lib/types.ts`). The UI depends on our shapes, not
Yahoo's, so upstream changes stay contained to one file.

**Client architecture.** TanStack Query owns fetching/caching/polling (a 12s "live"
pulse for quotes, longer for charts/news). Zustand holds cross-panel UI state (selected
symbol, watchlist, active view) and persists the watchlist to localStorage. The terminal
renders behind a mount gate so server and client markup match (no hydration mismatch) and
the store can safely rehydrate.

**Charts.** TradingView `lightweight-charts` v5 — candlesticks + volume + SMA/EMA
overlays, imperative API driven from React refs, with a crosshair OHLC legend.

## Layout
Command bar (top) · three columns — Market Monitor (left), Security + tabbed
Chart/Financials/News (center), Watchlist + Market News (right) · status bar (bottom).

## Non-goals
Order entry, real-time streaming, portfolios/P&L, backtesting, auth/accounts. This is a
read-only study cockpit.

## Verification
Built and type-checked with `npm run build` (strict TS); the data layer and all six API
routes were smoke-tested against live Yahoo data; the running app was confirmed to render
all panels and initialize the chart; and the codebase went through an adversarial
multi-agent review across correctness, data, framework, security and UX dimensions.
