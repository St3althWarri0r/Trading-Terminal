"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { DEFAULT_SYMBOL, DEFAULT_WATCHLIST } from "./constants";
import type { RangeKey } from "./types";

export type CenterTab = "chart" | "fundamentals" | "news";
export type Overlay = null | "help";

interface TerminalState {
  /** Currently focused security. */
  symbol: string;
  /** Which panel fills the main work area. */
  tab: CenterTab;
  /** Default chart range, driven by GP/GIP commands and the chart toolbar. */
  range: RangeKey;
  /** Modal overlay (help). */
  overlay: Overlay;
  /** Persisted watchlist symbols. */
  watchlist: string[];
  /** Recent command-bar entries (most-recent-first), for up-arrow recall. */
  history: string[];

  setSymbol: (s: string) => void;
  setTab: (t: CenterTab) => void;
  setRange: (r: RangeKey) => void;
  setOverlay: (o: Overlay) => void;
  addToWatchlist: (s: string) => void;
  removeFromWatchlist: (s: string) => void;
  toggleWatchlist: (s: string) => void;
  pushHistory: (cmd: string) => void;
}

// SSR-safe storage: on the server there is no localStorage, so hand persist a
// no-op store instead of letting it dereference an undefined global.
const noopStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

export const useTerminal = create<TerminalState>()(
  persist(
    (set, get) => ({
      symbol: DEFAULT_SYMBOL,
      tab: "chart",
      range: "1Y",
      overlay: null,
      watchlist: DEFAULT_WATCHLIST,
      history: [],

      setSymbol: (s) => set({ symbol: s.trim().toUpperCase() }),
      setTab: (t) => set({ tab: t }),
      setRange: (r) => set({ range: r }),
      setOverlay: (o) => set({ overlay: o }),

      addToWatchlist: (s) => {
        const sym = s.trim().toUpperCase();
        if (!sym) return;
        const wl = get().watchlist;
        if (!wl.includes(sym)) set({ watchlist: [...wl, sym] });
      },
      removeFromWatchlist: (s) => {
        const sym = s.trim().toUpperCase();
        set({ watchlist: get().watchlist.filter((w) => w !== sym) });
      },
      toggleWatchlist: (s) => {
        const sym = s.trim().toUpperCase();
        if (!sym) return;
        const wl = get().watchlist;
        set({
          watchlist: wl.includes(sym) ? wl.filter((w) => w !== sym) : [...wl, sym],
        });
      },
      pushHistory: (cmd) => {
        const c = cmd.trim();
        if (!c) return;
        const prev = get().history.filter((h) => h !== c);
        set({ history: [c, ...prev].slice(0, 50) });
      },
    }),
    {
      name: "trading-terminal:v1",
      storage: createJSONStorage(() =>
        typeof window !== "undefined" ? window.localStorage : noopStorage
      ),
      // Only persist user data, not transient view state.
      partialize: (s) => ({ watchlist: s.watchlist, history: s.history, symbol: s.symbol }),
    }
  )
);
