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
  return getJSON<Quote[]>(`/api/quote?symbols=${q}`, signal);
}

export function fetchChart(
  symbol: string,
  range: RangeKey,
  signal?: AbortSignal
): Promise<ChartResponse> {
  return getJSON<ChartResponse>(
    `/api/chart?symbol=${encodeURIComponent(symbol)}&range=${range}`,
    signal
  );
}

export function fetchSearch(q: string, signal?: AbortSignal): Promise<SearchResultItem[]> {
  return getJSON<SearchResultItem[]>(`/api/search?q=${encodeURIComponent(q)}`, signal);
}

export function fetchFundamentals(symbol: string, signal?: AbortSignal): Promise<Fundamentals> {
  return getJSON<Fundamentals>(`/api/fundamentals?symbol=${encodeURIComponent(symbol)}`, signal);
}

export function fetchNews(symbol: string | undefined, signal?: AbortSignal): Promise<NewsItem[]> {
  const suffix = symbol ? `?symbol=${encodeURIComponent(symbol)}` : "";
  return getJSON<NewsItem[]>(`/api/news${suffix}`, signal);
}

export function fetchMarket(signal?: AbortSignal): Promise<MarketOverview> {
  return getJSON<MarketOverview>(`/api/market`, signal);
}
