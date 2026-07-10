import type {
  ChartResponse,
  Fundamentals,
  MarketOverview,
  NewsItem,
  Quote,
  RangeKey,
  SearchResultItem,
} from "./types";

/** Client-side fetchers hitting our own /api routes. */

/** Base path for the data API. Standalone serves /api; the Poseidon embed
 *  build points at /api/terminal (inlined at build time via env). */
const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "/api";

async function getJSON<T>(url: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(url, { signal });
  if (!res.ok) {
    let msg = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.error) msg = body.error;
    } catch {
      /* non-JSON error body — keep the status message */
    }
    throw new Error(msg);
  }
  return res.json() as Promise<T>;
}

export function fetchQuotes(symbols: string[], signal?: AbortSignal): Promise<Quote[]> {
  const q = encodeURIComponent(symbols.join(","));
  return getJSON<Quote[]>(`${API_BASE}/quote?symbols=${q}`, signal);
}

export function fetchChart(
  symbol: string,
  range: RangeKey,
  signal?: AbortSignal
): Promise<ChartResponse> {
  return getJSON<ChartResponse>(
    `${API_BASE}/chart?symbol=${encodeURIComponent(symbol)}&range=${range}`,
    signal
  );
}

export function fetchSearch(q: string, signal?: AbortSignal): Promise<SearchResultItem[]> {
  return getJSON<SearchResultItem[]>(`${API_BASE}/search?q=${encodeURIComponent(q)}`, signal);
}

export function fetchFundamentals(symbol: string, signal?: AbortSignal): Promise<Fundamentals> {
  return getJSON<Fundamentals>(`${API_BASE}/fundamentals?symbol=${encodeURIComponent(symbol)}`, signal);
}

export function fetchNews(symbol: string | undefined, signal?: AbortSignal): Promise<NewsItem[]> {
  const suffix = symbol ? `?symbol=${encodeURIComponent(symbol)}` : "";
  return getJSON<NewsItem[]>(`${API_BASE}/news${suffix}`, signal);
}

export function fetchMarket(signal?: AbortSignal): Promise<MarketOverview> {
  return getJSON<MarketOverview>(`${API_BASE}/market`, signal);
}
