/**
 * Shared types for the Trading Terminal.
 *
 * These describe the *normalized* shapes our API routes return to the client —
 * deliberately a small, stable subset of what Yahoo Finance emits, so the UI
 * never depends on upstream field churn.
 */

export type MarketState =
  | "PRE"
  | "PREPRE"
  | "REGULAR"
  | "POST"
  | "POSTPOST"
  | "CLOSED"
  | string;

/** A normalized quote for a single security or index. */
export interface Quote {
  symbol: string;
  name: string;
  quoteType: string;
  currency: string;
  exchange: string;
  marketState: MarketState;

  price: number | null;
  change: number | null;
  changePercent: number | null;
  previousClose: number | null;
  open: number | null;
  dayHigh: number | null;
  dayLow: number | null;

  volume: number | null;
  avgVolume: number | null;

  marketCap: number | null;
  trailingPE: number | null;
  forwardPE: number | null;
  eps: number | null;
  dividendYield: number | null;
  beta: number | null;

  fiftyTwoWeekHigh: number | null;
  fiftyTwoWeekLow: number | null;
  fiftyDayAverage: number | null;
  twoHundredDayAverage: number | null;
  sharesOutstanding: number | null;

  /** Extended-hours price, present when the market is pre/post. */
  postMarketPrice: number | null;
  postMarketChange: number | null;
  postMarketChangePercent: number | null;
  preMarketPrice: number | null;
  preMarketChange: number | null;
  preMarketChangePercent: number | null;
}

/** One OHLCV bar. `time` is a UNIX timestamp in **seconds** (UTC). */
export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface ChartResponse {
  symbol: string;
  currency: string;
  exchangeName: string;
  /** Price the instrument last traded at, per the chart meta. */
  regularMarketPrice: number | null;
  previousClose: number | null;
  candles: Candle[];
}

export interface SearchResultItem {
  symbol: string;
  name: string;
  exchange: string;
  type: string; // "EQUITY" | "ETF" | "INDEX" | "CRYPTOCURRENCY" | "CURRENCY" | ...
  sector?: string;
  industry?: string;
}

export interface NewsItem {
  id: string;
  title: string;
  publisher: string;
  link: string;
  /** Publish time as epoch milliseconds. */
  publishedAt: number | null;
  thumbnail: string | null;
  tickers: string[];
}

export interface Fundamentals {
  symbol: string;
  profile: {
    name: string;
    sector: string | null;
    industry: string | null;
    employees: number | null;
    country: string | null;
    city: string | null;
    website: string | null;
    summary: string | null;
  };
  valuation: {
    marketCap: number | null;
    enterpriseValue: number | null;
    trailingPE: number | null;
    forwardPE: number | null;
    pegRatio: number | null;
    priceToBook: number | null;
    priceToSales: number | null;
    enterpriseToEbitda: number | null;
    beta: number | null;
  };
  financials: {
    revenue: number | null;
    revenueGrowth: number | null;
    grossMargins: number | null;
    operatingMargins: number | null;
    profitMargins: number | null;
    ebitda: number | null;
    freeCashflow: number | null;
    operatingCashflow: number | null;
    totalCash: number | null;
    totalDebt: number | null;
    debtToEquity: number | null;
    returnOnEquity: number | null;
    returnOnAssets: number | null;
    currentRatio: number | null;
  };
  perShare: {
    eps: number | null;
    forwardEps: number | null;
    bookValue: number | null;
    dividendRate: number | null;
    dividendYield: number | null;
    payoutRatio: number | null;
  };
  targets: {
    currentPrice: number | null;
    targetMean: number | null;
    targetHigh: number | null;
    targetLow: number | null;
    recommendationKey: string | null;
    numberOfAnalysts: number | null;
  };
}

export interface SectorPerf {
  symbol: string;
  name: string;
  changePercent: number | null;
}

export interface MarketOverview {
  indices: Quote[];
  futures: Quote[];
  rates: Quote[];
  commodities: Quote[];
  crypto: Quote[];
  currencies: Quote[];
  sectors: SectorPerf[];
}

/** Range keys drive both the lookback window and the sampling interval. */
export type RangeKey = "1D" | "5D" | "1M" | "6M" | "YTD" | "1Y" | "5Y" | "MAX";

export interface ApiError {
  error: string;
}
