"use client";

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import {
  fetchChart,
  fetchFundamentals,
  fetchMarket,
  fetchNews,
  fetchQuotes,
  fetchSearch,
} from "./api-client";
import type { RangeKey } from "./types";

/**
 * React Query hooks. Refetch intervals give the terminal its "live" pulse;
 * they are intentionally polite (10–20s) to stay well under Yahoo's limits,
 * and the server-side TTL cache absorbs duplicate load.
 */

const LIVE = 12_000; // quote/overview refresh cadence

export function useQuotes(symbols: string[], enabled = true) {
  const key = [...symbols].map((s) => s.toUpperCase()).sort();
  return useQuery({
    queryKey: ["quotes", key],
    queryFn: ({ signal }) => fetchQuotes(symbols, signal),
    enabled: enabled && symbols.length > 0,
    refetchInterval: LIVE,
    placeholderData: keepPreviousData,
  });
}

export function useQuote(symbol: string, enabled = true) {
  const q = useQuotes(symbol ? [symbol] : [], enabled);
  return { ...q, data: q.data?.[0] };
}

export function useChart(symbol: string, range: RangeKey, enabled = true) {
  return useQuery({
    queryKey: ["chart", symbol.toUpperCase(), range],
    queryFn: ({ signal }) => fetchChart(symbol, range, signal),
    enabled: enabled && Boolean(symbol),
    refetchInterval: range === "1D" || range === "5D" ? 30_000 : 120_000,
    placeholderData: keepPreviousData,
  });
}

export function useFundamentals(symbol: string, enabled = true) {
  return useQuery({
    queryKey: ["fundamentals", symbol.toUpperCase()],
    queryFn: ({ signal }) => fetchFundamentals(symbol, signal),
    enabled: enabled && Boolean(symbol),
    staleTime: 60 * 60_000,
  });
}

export function useNews(symbol: string | undefined, enabled = true) {
  return useQuery({
    queryKey: ["news", symbol?.toUpperCase() ?? "__market__"],
    queryFn: ({ signal }) => fetchNews(symbol, signal),
    enabled,
    refetchInterval: 120_000,
    placeholderData: keepPreviousData,
  });
}

export function useMarket(enabled = true) {
  return useQuery({
    queryKey: ["market"],
    queryFn: ({ signal }) => fetchMarket(signal),
    enabled,
    refetchInterval: LIVE,
    placeholderData: keepPreviousData,
  });
}

export function useSearch(query: string) {
  const q = query.trim();
  return useQuery({
    queryKey: ["search", q.toLowerCase()],
    queryFn: ({ signal }) => fetchSearch(q, signal),
    enabled: q.length >= 1,
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  });
}
