# Agent notes — Trading Terminal

Guidance for AI coding agents (and humans) working in this repo.

## What this is
A Bloomberg-style, keyboard-driven market-study terminal. Next.js 16 (App Router,
Turbopack) + React 19 + TypeScript (strict) + Tailwind v4. Market data from Yahoo
Finance via `yahoo-finance2` — **no API keys**.

## Architecture
- **Server data layer:** `lib/yahoo.ts` wraps `yahoo-finance2` (v3, class API) with a
  TTL cache and normalizes every response into the stable types in `lib/types.ts`.
  Import it **only** from `app/api/**/route.ts` — never from a client component.
- **API routes:** `app/api/{quote,chart,search,fundamentals,news,market}/route.ts`.
  Each is `dynamic = "force-dynamic"` and sets CDN cache headers via `lib/http.ts`.
- **Client:** `lib/hooks.ts` (TanStack Query) → `lib/api-client.ts` → the API routes.
  Global UI state (selected symbol, watchlist, view) lives in `lib/store.ts` (Zustand,
  persisted to localStorage).
- **UI:** `components/Terminal.tsx` composes the shell; panels live in
  `components/panels/`, shared chrome in `components/ui/`.

## Next.js 16 gotchas (⚠️ differs from older Next)
- Turbopack is the default for `dev` **and** `build`.
- `cookies()`, `headers()`, and route/page `params`/`searchParams` are **async only**.
  (This app avoids them — routes read `req.nextUrl.searchParams`, which stays sync.)
- `export const dynamic = "force-dynamic"` is still valid **because Cache Components are
  not enabled**. Enabling `cacheComponents` would remove `dynamic`/`revalidate`.
- `yahoo-finance2` is in `serverExternalPackages` (next.config.ts) so it isn't bundled.
- Min Node 20.9, TypeScript 5.1. Authoritative docs are bundled under
  `node_modules/next/dist/docs/` — consult them before using an unfamiliar API.

## Conventions
- Keep `yahoo-finance2` and anything importing it server-side.
- Money/large numbers → `fmtCompact`; fractions (margins, yields, growth) → `fmtRatioPct`;
  ratios/multiples → `fmtMultiple`. Missing values render as `—` (helpers already handle null).
- lightweight-charts is **v5**: `chart.addSeries(CandlestickSeries, opts)` (not `addCandlestickSeries`).
- Verify with `npm run build` (runs a strict TypeScript check).
