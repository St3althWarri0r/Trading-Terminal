import "server-only";
import YahooFinance from "yahoo-finance2";
import type {
  Candle,
  ChartResponse,
  Fundamentals,
  MarketOverview,
  NewsItem,
  Quote,
  RangeKey,
  SearchResultItem,
  SectorPerf,
} from "./types";
import {
  COMMODITIES,
  CRYPTO,
  CURRENCIES,
  FUTURES,
  MAJOR_INDICES,
  RANGE_CONFIG,
  RATES,
  SECTOR_ETFS,
} from "./constants";

/**
 * Server-only market-data service. Wraps yahoo-finance2 (v3, class API) with a
 * small in-memory TTL cache to soften rate limits, and normalizes every
 * response into the stable shapes in `types.ts`. Import ONLY from route
 * handlers / server code — never from a client component.
 */

const yf = new YahooFinance({
  suppressNotices: ["yahooSurvey", "ripHistorical"],
});

// ---------------------------------------------------------------------------
// Tiny TTL cache
// ---------------------------------------------------------------------------

interface CacheEntry {
  expires: number;
  value: unknown;
}
const cache = new Map<string, CacheEntry>();

async function cached<T>(key: string, ttlMs: number, fn: () => Promise<T>): Promise<T> {
  const hit = cache.get(key);
  const now = Date.now();
  if (hit && hit.expires > now) return hit.value as T;
  const value = await fn();
  cache.set(key, { expires: now + ttlMs, value });
  // Opportunistic eviction so the map can't grow unbounded on a warm instance.
  if (cache.size > 512) {
    for (const [k, v] of cache) if (v.expires <= now) cache.delete(k);
  }
  return value;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Coerce to a finite number, else null. */
function num(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

/** A Yahoo percent figure (e.g. 79.5) as a true fraction (0.795), or null. */
function fracFromPct(v: unknown): number | null {
  const n = num(v);
  return n != null ? n / 100 : null;
}

function str(v: unknown, fallback = ""): string {
  return typeof v === "string" && v.length > 0 ? v : fallback;
}

/** Restrict a symbol to the characters real Yahoo tickers use (defense in depth). */
function safeSym(s: string): string {
  return s.trim().toUpperCase().replace(/[^A-Z0-9.^=\-]/g, "").slice(0, 20);
}

/* eslint-disable @typescript-eslint/no-explicit-any */

function normalizeQuote(q: any): Quote {
  return {
    symbol: str(q?.symbol),
    name: str(q?.longName) || str(q?.shortName) || str(q?.symbol),
    quoteType: str(q?.quoteType, "EQUITY"),
    currency: str(q?.currency, "USD"),
    exchange: str(q?.fullExchangeName) || str(q?.exchange),
    marketState: str(q?.marketState, "CLOSED"),

    price: num(q?.regularMarketPrice),
    change: num(q?.regularMarketChange),
    changePercent: num(q?.regularMarketChangePercent),
    previousClose: num(q?.regularMarketPreviousClose),
    open: num(q?.regularMarketOpen),
    dayHigh: num(q?.regularMarketDayHigh),
    dayLow: num(q?.regularMarketDayLow),

    volume: num(q?.regularMarketVolume),
    avgVolume: num(q?.averageDailyVolume3Month) ?? num(q?.averageDailyVolume10Day),

    marketCap: num(q?.marketCap),
    trailingPE: num(q?.trailingPE),
    forwardPE: num(q?.forwardPE),
    eps: num(q?.epsTrailingTwelveMonths),
    // Yahoo's quote `dividendYield` is a percent (e.g. 0.44 = 0.44%); store a
    // fraction so it matches the fundamentals yield and the fmtRatioPct helper.
    dividendYield: fracFromPct(q?.dividendYield),
    beta: num(q?.beta),

    fiftyTwoWeekHigh: num(q?.fiftyTwoWeekHigh),
    fiftyTwoWeekLow: num(q?.fiftyTwoWeekLow),
    fiftyDayAverage: num(q?.fiftyDayAverage),
    twoHundredDayAverage: num(q?.twoHundredDayAverage),
    sharesOutstanding: num(q?.sharesOutstanding),

    postMarketPrice: num(q?.postMarketPrice),
    postMarketChange: num(q?.postMarketChange),
    postMarketChangePercent: num(q?.postMarketChangePercent),
    preMarketPrice: num(q?.preMarketPrice),
    preMarketChange: num(q?.preMarketChange),
    preMarketChangePercent: num(q?.preMarketChangePercent),
  };
}

// ---------------------------------------------------------------------------
// Quotes
// ---------------------------------------------------------------------------

/**
 * Batch quote with graceful degradation: tries a single multi-symbol call, and
 * if that throws (bad symbol, validation hiccup) falls back to per-symbol
 * fetches so one failure can't blank an entire panel. Order is not guaranteed;
 * callers that care re-sort by their input.
 */
export async function getQuotes(symbols: string[]): Promise<Quote[]> {
  // Sanitize + de-dupe + sort so the cache key is order-insensitive and no
  // unexpected characters ever reach the upstream request path.
  const clean = [...new Set(symbols.map(safeSym).filter(Boolean))].sort();
  if (clean.length === 0) return [];

  const key = `quotes:${clean.join(",")}`;
  return cached(key, 10_000, async () => {
    try {
      const res = await yf.quote(clean);
      const arr = Array.isArray(res) ? res : [res];
      return arr.filter(Boolean).map(normalizeQuote);
    } catch {
      const settled = await Promise.allSettled(clean.map((s) => yf.quote(s)));
      const out: Quote[] = [];
      for (const r of settled) {
        if (r.status === "fulfilled" && r.value) out.push(normalizeQuote(r.value));
      }
      return out;
    }
  });
}

export async function getQuote(symbol: string): Promise<Quote | null> {
  const [q] = await getQuotes([symbol]);
  return q ?? null;
}

// ---------------------------------------------------------------------------
// Chart
// ---------------------------------------------------------------------------

function periodStart(range: RangeKey): Date {
  const cfg = RANGE_CONFIG[range];
  const now = new Date();
  if (cfg.days === "ytd") return new Date(now.getFullYear(), 0, 1);
  if (cfg.days === "max") return new Date("1970-01-02T00:00:00Z");
  const d = new Date(now);
  d.setDate(d.getDate() - cfg.days);
  return d;
}

export async function getChart(symbol: string, range: RangeKey): Promise<ChartResponse> {
  const sym = safeSym(symbol);
  const cfg = RANGE_CONFIG[range];
  const key = `chart:${sym}:${range}`;
  // Intraday ranges update fast; longer ranges barely move — cache accordingly.
  const ttl = range === "1D" || range === "5D" ? 30_000 : 120_000;

  return cached(key, ttl, async () => {
    const result: any = await yf.chart(sym, {
      period1: periodStart(range),
      interval: cfg.interval as any,
    });

    const rawQuotes: any[] = Array.isArray(result?.quotes) ? result.quotes : [];
    const candles: Candle[] = [];
    for (const q of rawQuotes) {
      const o = num(q?.open);
      const h = num(q?.high);
      const l = num(q?.low);
      const c = num(q?.close);
      const t = q?.date instanceof Date ? q.date : q?.date ? new Date(q.date) : null;
      // Skip gap rows Yahoo pads with nulls — they'd break the chart series.
      if (o == null || h == null || l == null || c == null || !t) continue;
      candles.push({
        time: Math.floor(t.getTime() / 1000),
        open: o,
        high: h,
        low: l,
        close: c,
        volume: num(q?.volume) ?? 0,
      });
    }
    // lightweight-charts requires strictly-ascending, de-duplicated timestamps.
    candles.sort((a, b) => a.time - b.time);
    const deduped: Candle[] = [];
    for (const c of candles) {
      const prev = deduped[deduped.length - 1];
      if (prev && prev.time === c.time) deduped[deduped.length - 1] = c;
      else deduped.push(c);
    }

    return {
      symbol: str(result?.meta?.symbol, sym),
      currency: str(result?.meta?.currency, "USD"),
      exchangeName: str(result?.meta?.fullExchangeName) || str(result?.meta?.exchangeName),
      regularMarketPrice: num(result?.meta?.regularMarketPrice),
      previousClose:
        num(result?.meta?.previousClose) ?? num(result?.meta?.chartPreviousClose),
      candles: deduped,
    };
  });
}

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------

export async function search(query: string): Promise<SearchResultItem[]> {
  const q = query.trim();
  if (!q) return [];
  return cached(`search:${q.toLowerCase()}`, 60_000, async () => {
    const res: any = await yf.search(q, { newsCount: 0, quotesCount: 10 });
    const quotes: any[] = Array.isArray(res?.quotes) ? res.quotes : [];
    return quotes
      .filter((r) => r?.symbol)
      .map(
        (r): SearchResultItem => ({
          symbol: str(r.symbol),
          name: str(r.longname) || str(r.shortname) || str(r.symbol),
          exchange: str(r.exchDisp) || str(r.exchange),
          type: str(r.quoteType, "EQUITY"),
          sector: r.sector ? str(r.sector) : undefined,
          industry: r.industry ? str(r.industry) : undefined,
        })
      );
  });
}

// ---------------------------------------------------------------------------
// News
// ---------------------------------------------------------------------------

function normalizeNews(items: any[]): NewsItem[] {
  return items
    .filter((n) => n?.title && n?.link)
    .map((n): NewsItem => {
      const t = n?.providerPublishTime;
      const ms =
        t instanceof Date ? t.getTime() : typeof t === "number" ? t * 1000 : t ? Date.parse(t) : null;
      const thumbs = n?.thumbnail?.resolutions;
      return {
        id: str(n.uuid) || str(n.link),
        title: str(n.title),
        publisher: str(n.publisher, "—"),
        link: str(n.link),
        publishedAt: Number.isFinite(ms) ? (ms as number) : null,
        thumbnail: Array.isArray(thumbs) && thumbs.length ? str(thumbs[0]?.url) || null : null,
        tickers: Array.isArray(n?.relatedTickers) ? n.relatedTickers.map(String) : [],
      };
    });
}

export async function getNews(symbol?: string): Promise<NewsItem[]> {
  // Yahoo's search endpoint doubles as a decent news source. For a market-wide
  // feed we query a broad market term; for a symbol we query the symbol.
  const query = symbol?.trim() ? safeSym(symbol) : "stock market";
  return cached(`news:${query.toLowerCase()}`, 120_000, async () => {
    const res: any = await yf.search(query, { newsCount: 12, quotesCount: 0 });
    return normalizeNews(Array.isArray(res?.news) ? res.news : []);
  });
}

// ---------------------------------------------------------------------------
// Fundamentals
// ---------------------------------------------------------------------------

export async function getFundamentals(symbol: string): Promise<Fundamentals> {
  const sym = safeSym(symbol);
  return cached(`fundamentals:${sym}`, 6 * 60 * 60_000, async () => {
    const qs: any = await yf.quoteSummary(sym, {
      modules: [
        "assetProfile",
        "summaryDetail",
        "financialData",
        "defaultKeyStatistics",
        "price",
      ],
    });
    const ap = qs?.assetProfile ?? {};
    const sd = qs?.summaryDetail ?? {};
    const fd = qs?.financialData ?? {};
    const ks = qs?.defaultKeyStatistics ?? {};
    const pr = qs?.price ?? {};

    return {
      symbol: sym,
      profile: {
        name: str(pr?.longName) || str(pr?.shortName) || sym,
        sector: ap.sector ? str(ap.sector) : null,
        industry: ap.industry ? str(ap.industry) : null,
        employees: num(ap.fullTimeEmployees),
        country: ap.country ? str(ap.country) : null,
        city: ap.city ? str(ap.city) : null,
        website: ap.website ? str(ap.website) : null,
        summary: ap.longBusinessSummary ? str(ap.longBusinessSummary) : null,
      },
      valuation: {
        marketCap: num(sd.marketCap) ?? num(pr.marketCap),
        enterpriseValue: num(ks.enterpriseValue),
        trailingPE: num(sd.trailingPE),
        forwardPE: num(sd.forwardPE) ?? num(ks.forwardPE),
        pegRatio: num(ks.pegRatio),
        priceToBook: num(ks.priceToBook),
        priceToSales: num(sd.priceToSalesTrailing12Months),
        enterpriseToEbitda: num(ks.enterpriseToEbitda),
        beta: num(sd.beta) ?? num(ks.beta),
      },
      financials: {
        revenue: num(fd.totalRevenue),
        revenueGrowth: num(fd.revenueGrowth),
        grossMargins: num(fd.grossMargins),
        operatingMargins: num(fd.operatingMargins),
        profitMargins: num(fd.profitMargins) ?? num(ks.profitMargins),
        ebitda: num(fd.ebitda),
        freeCashflow: num(fd.freeCashflow),
        operatingCashflow: num(fd.operatingCashflow),
        totalCash: num(fd.totalCash),
        totalDebt: num(fd.totalDebt),
        // Yahoo delivers debtToEquity as a percent (e.g. 79.5 = 0.795x); store
        // the true ratio so fmtMultiple renders "0.80", not "79.55".
        debtToEquity: fracFromPct(fd.debtToEquity),
        returnOnEquity: num(fd.returnOnEquity),
        returnOnAssets: num(fd.returnOnAssets),
        currentRatio: num(fd.currentRatio),
      },
      perShare: {
        eps: num(ks.trailingEps),
        forwardEps: num(ks.forwardEps),
        bookValue: num(ks.bookValue),
        dividendRate: num(sd.dividendRate),
        dividendYield: num(sd.dividendYield),
        payoutRatio: num(sd.payoutRatio),
      },
      targets: {
        currentPrice: num(fd.currentPrice),
        targetMean: num(fd.targetMeanPrice),
        targetHigh: num(fd.targetHighPrice),
        targetLow: num(fd.targetLowPrice),
        recommendationKey: fd.recommendationKey ? str(fd.recommendationKey) : null,
        numberOfAnalysts: num(fd.numberOfAnalystOpinions),
      },
    };
  });
}

// ---------------------------------------------------------------------------
// Market overview
// ---------------------------------------------------------------------------

async function quotesFor(list: readonly { symbol: string }[]): Promise<Quote[]> {
  try {
    const quotes = await getQuotes(list.map((x) => x.symbol));
    const bySym = new Map(quotes.map((q) => [q.symbol, q]));
    // Preserve the configured display order.
    return list.map((x) => bySym.get(x.symbol)).filter((q): q is Quote => Boolean(q));
  } catch {
    return [];
  }
}

export async function getMarketOverview(): Promise<MarketOverview> {
  return cached("market-overview", 15_000, async () => {
    const [indices, futures, rates, commodities, crypto, currencies, sectorQuotes] =
      await Promise.all([
        quotesFor(MAJOR_INDICES),
        quotesFor(FUTURES),
        quotesFor(RATES),
        quotesFor(COMMODITIES),
        quotesFor(CRYPTO),
        quotesFor(CURRENCIES),
        quotesFor(SECTOR_ETFS),
      ]);

    const sectorName = new Map<string, string>(SECTOR_ETFS.map((s) => [s.symbol, s.name]));
    const sectors: SectorPerf[] = sectorQuotes
      .map((q) => ({
        symbol: q.symbol,
        name: sectorName.get(q.symbol) ?? q.symbol,
        changePercent: q.changePercent,
      }))
      .sort((a, b) => (b.changePercent ?? -Infinity) - (a.changePercent ?? -Infinity));

    return { indices, futures, rates, commodities, crypto, currencies, sectors };
  });
}
