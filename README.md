<div align="center">

# 📈 Trading Terminal

**A Bloomberg-inspired market terminal for studying the markets.**

Live quotes · interactive charts · fundamentals · news — for equities, ETFs, indices, futures, crypto and FX.
Built with Next.js 16, React 19 and TypeScript. **No API key required.**

</div>

---

## What is this?

Trading Terminal is a dense, keyboard-driven, dark-amber "market cockpit" in the spirit of a Bloomberg Terminal — built for **learning and studying the markets**, not for placing trades. Type a ticker, hit a function code, and read the tape: price action, company financials, and the news wire, all on one screen.

Market data comes from **Yahoo Finance** (via the [`yahoo-finance2`](https://github.com/gadicc/yahoo-finance2) library), served through the app's own API routes — so there are **no API keys to configure** and nothing to sign up for. Quotes are lightly delayed (typical of free market data), which is ideal for study.

> ⚠️ **For educational and informational use only. This is not investment advice, and quotes may be delayed. Do your own research.**

## Features

- **⌘ Command bar** — Bloomberg-style `<TICKER> <FUNCTION>` input (e.g. `AAPL GP`, `MSFT FA`, `NVDA CN`) with live symbol search-as-you-type.
- **Market Monitor** — indices, futures, treasury rates, commodities, crypto, FX, and a live sector-performance heat list.
- **Interactive charts** — candlesticks with volume and toggleable SMA 20 / SMA 50 / EMA 200 overlays, across 1D → MAX timeframes, powered by TradingView's [`lightweight-charts`](https://github.com/tradingview/lightweight-charts). Crosshair shows O/H/L/C.
- **Security detail** — big price display, day/52-week ranges, market cap, P/E, volume, and extended-hours pricing.
- **Fundamentals** — company profile, valuation multiples, margins & returns, cash/debt, per-share metrics, and analyst price targets.
- **News wire** — company and market headlines with clickable related tickers.
- **Watchlist** — your own tracked symbols, saved in the browser and updating live.
- **Keyboard-first** — `⌘K` / `/` to focus the command bar, arrow keys to navigate, `↑` to recall history, `HELP` for the full reference.

## Tech stack

| | |
|---|---|
| Framework | **Next.js 16** (App Router, Turbopack) |
| UI | **React 19** · **Tailwind CSS v4** |
| Charts | **lightweight-charts v5** (TradingView) |
| Data | **yahoo-finance2 v3** (server-side, no key) |
| State / data-fetching | **Zustand** · **TanStack Query v5** |
| Language | **TypeScript** (strict) |

---

## Getting started

### 1. Prerequisites — install Node.js (20.9 or newer)

You only need **Node.js ≥ 20.9** and its bundled `npm`. Pick your distro:

<details open>
<summary><b>CachyOS / Arch Linux</b> (<code>pacman</code>)</summary>

```bash
sudo pacman -S nodejs npm
```
</details>

<details>
<summary><b>Fedora</b> (<code>dnf</code>)</summary>

```bash
sudo dnf install nodejs npm
```
If Fedora's repo Node is older than 20.9, enable a current module stream:
```bash
sudo dnf module reset nodejs
sudo dnf module install nodejs:22/common
```
</details>

<details>
<summary><b>Any Linux / macOS</b> (via <a href="https://github.com/nvm-sh/nvm">nvm</a> — no root needed)</summary>

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
# restart your shell, then:
nvm install 22
nvm use 22
```
</details>

Verify:
```bash
node --version   # should print v20.9+ (v22 or v26 are great)
```

### 2. Clone & install

```bash
git clone https://github.com/St3althWarri0r/Trading-Terminal.git
cd Trading-Terminal
npm install
```

### 3. Run it

```bash
npm run dev
```

Then open **http://localhost:3000**. That's it — no `.env`, no keys, no signup.

To run an optimized production build instead:
```bash
npm run build
npm start
```

> **fish shell (CachyOS default):** all commands above work as-is in fish.

---

## Using the terminal

Type in the command bar at the top and press **Enter**:

| Command | Does |
|---|---|
| `AAPL` | Load Apple |
| `AAPL GP` | Apple → price graph |
| `MSFT FA` | Microsoft → financials |
| `NVDA CN` | Nvidia → company news |
| `BTC-USD` | Bitcoin |
| `^GSPC` | S&P 500 index |
| `EURUSD=X` | EUR/USD |
| `HELP` | Full command & keyboard reference |

**Function codes:** `DES` description · `GP` graph · `GIP` intraday · `FA` financials · `CN`/`N` news · `W` watchlist · `MKT`/`TOP` market monitor · `HELP`.

**Keyboard:** `⌘K` or `/` focus command bar · `↑`/`↓` navigate results · `↑` recall history · `Enter` run · `Esc` close.

You can also click anything — market rows, watchlist entries, sectors, and tickers in news all load that symbol.

---

## Deploy

**Vercel (recommended, zero-config):**

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/St3althWarri0r/Trading-Terminal)

Push the repo to GitHub, import it at [vercel.com/new](https://vercel.com/new), and deploy — no environment variables needed. The API routes run as serverless functions.

**Self-host:** `npm run build && npm start` behind any Node host (a `PORT` env var picks the port).

---

## Project structure

```
app/
  api/            # server route handlers (quote, chart, search, fundamentals, news, market)
  layout.tsx      # root layout, fonts, providers
  page.tsx        # renders <Terminal/>
components/
  Terminal.tsx    # top-level layout + boot splash
  CommandBar.tsx  # command input + symbol search
  StatusBar.tsx   # clock + market session
  panels/         # MarketOverview, Watchlist, SecurityHeader, ChartPanel, Fundamentals, NewsPanel
  ui/             # shared Panel chrome + value primitives
lib/
  yahoo.ts        # server-side market-data service (yahoo-finance2 + TTL cache)
  hooks.ts        # TanStack Query hooks
  store.ts        # Zustand store (symbol, watchlist, view)
  indicators.ts   # SMA / EMA / RSI / MACD math
  format.ts       # number & date formatting
  types.ts        # shared types
```

## Notes & limitations

- **Data is delayed** and sourced from an unofficial Yahoo Finance endpoint; it can occasionally rate-limit or change. A short server-side cache smooths this out.
- Not every field is available for every instrument (indices, FX and crypto expose fewer fundamentals than equities) — missing values render as `—`.
- This is a study tool. **Not investment advice.**

## License

[MIT](./LICENSE) © St3althWarri0r

---

<div align="center">
<sub>Built as a market-study cockpit. Data via Yahoo Finance. Charting by TradingView Lightweight Charts.</sub>
</div>
