import type { RangeKey } from "./types";

/**
 * Static reference data: which symbols populate the market overview, how each
 * chart range maps to a Yahoo interval/lookback, and the Bloomberg-style
 * function codes the command bar understands.
 */

export const MAJOR_INDICES = [
  { symbol: "^GSPC", name: "S&P 500" },
  { symbol: "^DJI", name: "Dow Jones" },
  { symbol: "^IXIC", name: "Nasdaq" },
  { symbol: "^RUT", name: "Russell 2000" },
  { symbol: "^VIX", name: "VIX" },
] as const;

export const FUTURES = [
  { symbol: "ES=F", name: "S&P Futures" },
  { symbol: "NQ=F", name: "Nasdaq Fut" },
  { symbol: "YM=F", name: "Dow Futures" },
] as const;

export const RATES = [
  { symbol: "^TNX", name: "US 10Y" },
  { symbol: "^FVX", name: "US 5Y" },
  { symbol: "^TYX", name: "US 30Y" },
] as const;

export const COMMODITIES = [
  { symbol: "GC=F", name: "Gold" },
  { symbol: "SI=F", name: "Silver" },
  { symbol: "CL=F", name: "Crude Oil" },
  { symbol: "NG=F", name: "Nat Gas" },
] as const;

export const CRYPTO = [
  { symbol: "BTC-USD", name: "Bitcoin" },
  { symbol: "ETH-USD", name: "Ethereum" },
  { symbol: "SOL-USD", name: "Solana" },
] as const;

export const CURRENCIES = [
  { symbol: "EURUSD=X", name: "EUR/USD" },
  { symbol: "GBPUSD=X", name: "GBP/USD" },
  { symbol: "JPY=X", name: "USD/JPY" },
  { symbol: "DX-Y.NYB", name: "US Dollar" },
] as const;

/** SPDR sector ETFs — a clean proxy for sector rotation. */
export const SECTOR_ETFS = [
  { symbol: "XLK", name: "Technology" },
  { symbol: "XLF", name: "Financials" },
  { symbol: "XLV", name: "Health Care" },
  { symbol: "XLY", name: "Cons. Disc." },
  { symbol: "XLP", name: "Cons. Staples" },
  { symbol: "XLE", name: "Energy" },
  { symbol: "XLI", name: "Industrials" },
  { symbol: "XLB", name: "Materials" },
  { symbol: "XLU", name: "Utilities" },
  { symbol: "XLRE", name: "Real Estate" },
  { symbol: "XLC", name: "Comm. Svcs" },
] as const;

export const DEFAULT_WATCHLIST = [
  "AAPL",
  "MSFT",
  "NVDA",
  "AMZN",
  "GOOGL",
  "META",
  "TSLA",
  "JPM",
];

export const DEFAULT_SYMBOL = "AAPL";

/** Maps a UI range to the Yahoo `chart` interval and lookback period. */
export const RANGE_CONFIG: Record<
  RangeKey,
  { interval: string; days: number | "ytd" | "max"; label: string }
> = {
  "1D": { interval: "5m", days: 1, label: "1 Day" },
  "5D": { interval: "30m", days: 5, label: "5 Days" },
  "1M": { interval: "1d", days: 31, label: "1 Month" },
  "6M": { interval: "1d", days: 183, label: "6 Months" },
  YTD: { interval: "1d", days: "ytd", label: "Year to Date" },
  "1Y": { interval: "1d", days: 366, label: "1 Year" },
  "5Y": { interval: "1wk", days: 1827, label: "5 Years" },
  MAX: { interval: "1mo", days: "max", label: "Max" },
};

export const RANGE_ORDER: RangeKey[] = [
  "1D",
  "5D",
  "1M",
  "6M",
  "YTD",
  "1Y",
  "5Y",
  "MAX",
];

/** Bloomberg-style function codes. Typed in the command bar as e.g. `AAPL GP`. */
export interface FunctionCode {
  code: string;
  label: string;
  description: string;
  /** The view this maps to; "focus" means scroll/highlight a panel. */
  view: "overview" | "security" | "chart" | "fundamentals" | "news" | "help" | "watchlist";
}

export const FUNCTION_CODES: FunctionCode[] = [
  { code: "DES", label: "Description", description: "Company profile & key stats", view: "security" },
  { code: "GP", label: "Graph Price", description: "Interactive price chart", view: "chart" },
  { code: "GIP", label: "Intraday", description: "Intraday price chart", view: "chart" },
  { code: "FA", label: "Financials", description: "Fundamentals & financials", view: "fundamentals" },
  { code: "FN", label: "Financials", description: "Fundamentals & financials", view: "fundamentals" },
  { code: "CN", label: "Company News", description: "Latest headlines", view: "news" },
  { code: "N", label: "News", description: "Latest headlines", view: "news" },
  { code: "W", label: "Watchlist", description: "Your tracked symbols", view: "watchlist" },
  { code: "MKT", label: "Market Monitor", description: "Indices, sectors & macro", view: "overview" },
  { code: "TOP", label: "Top / Home", description: "Market overview home", view: "overview" },
  { code: "HELP", label: "Help", description: "Keyboard & command help", view: "help" },
];

/** Yahoo `quoteType` → short display tag. */
export const QUOTE_TYPE_LABEL: Record<string, string> = {
  EQUITY: "Equity",
  ETF: "ETF",
  INDEX: "Index",
  CRYPTOCURRENCY: "Crypto",
  CURRENCY: "FX",
  FUTURE: "Future",
  MUTUALFUND: "Fund",
  OPTION: "Option",
};
