"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTerminal } from "@/lib/store";
import { useSearch } from "@/lib/hooks";
import { parseCommand, type ParsedCommand } from "@/lib/command";
import { FUNCTION_CODES, QUOTE_TYPE_LABEL } from "@/lib/constants";
import type { FunctionCode } from "@/lib/constants";

const CODE_SET = new Set(FUNCTION_CODES.map((f) => f.code));
const DESCRIPTORS = new Set(["US", "EQUITY", "EQ", "INDEX", "INDX", "CURNCY", "COMDTY", "CORP", "GO"]);

/** Build the free-text search query from input, dropping codes/descriptors. */
function searchQueryFrom(input: string): string {
  return input
    .trim()
    .toUpperCase()
    .split(/\s+/)
    .filter((t) => t && !CODE_SET.has(t) && !DESCRIPTORS.has(t))
    .join(" ");
}

function scrollToId(id: string) {
  if (typeof document === "undefined") return;
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

/** Delays a value so search only fires once typing settles. */
function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);
  return debounced;
}

export default function CommandBar() {
  const setSymbol = useTerminal((s) => s.setSymbol);
  const setTab = useTerminal((s) => s.setTab);
  const setRange = useTerminal((s) => s.setRange);
  const setOverlay = useTerminal((s) => s.setOverlay);
  const pushHistory = useTerminal((s) => s.pushHistory);
  const history = useTerminal((s) => s.history);

  const [input, setInput] = useState("");
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const [histIndex, setHistIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  const query = useDebouncedValue(searchQueryFrom(input), 160);
  const { data: results = [] } = useSearch(query);
  const parsed = useMemo(() => parseCommand(input), [input]);
  const listRef = useRef<HTMLUListElement>(null);

  // Reset highlight whenever the result set changes.
  useEffect(() => setHighlight(0), [query]);

  // Keep the highlighted option scrolled into view.
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-idx="${highlight}"]`);
    (el as HTMLElement | null)?.scrollIntoView({ block: "nearest" });
  }, [highlight]);

  // Global "/" or Ctrl/Cmd+K focuses the command bar.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && document.activeElement?.tagName !== "INPUT")) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Close the dropdown on outside click.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, []);

  const applyFunction = (fn: FunctionCode) => {
    switch (fn.view) {
      case "chart":
        setTab("chart");
        if (fn.code === "GIP") setRange("1D");
        break;
      case "fundamentals":
      case "security":
        setTab("fundamentals");
        break;
      case "news":
        setTab("news");
        break;
      case "help":
        setOverlay("help");
        break;
      case "overview":
        scrollToId("market-col");
        break;
      case "watchlist":
        scrollToId("watchlist-panel");
        break;
    }
  };

  const commit = (p: ParsedCommand, explicitSymbol?: string) => {
    const sym = explicitSymbol ?? p.symbol;
    if (sym) setSymbol(sym);
    if (p.fn) applyFunction(p.fn);
    if (p.raw) pushHistory(p.raw);
    setInput("");
    setOpen(false);
    setHistIndex(-1);
  };

  const showDropdown = open && query.length >= 1 && results.length > 0;

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      if (showDropdown) {
        e.preventDefault();
        setHighlight((h) => Math.min(h + 1, results.length - 1));
      }
    } else if (e.key === "ArrowUp") {
      if (showDropdown) {
        e.preventDefault();
        setHighlight((h) => Math.max(h - 1, 0));
      } else if (input === "" || histIndex >= 0) {
        // Recall command history when there's no live dropdown.
        e.preventDefault();
        const next = Math.min(histIndex + 1, history.length - 1);
        if (history[next] != null) {
          setHistIndex(next);
          setInput(history[next]);
          // Keep the dropdown closed so the next ↑ keeps walking history
          // instead of being captured by the search suggestions.
          setOpen(false);
        }
      }
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (showDropdown && results[highlight]) {
        commit(parsed, results[highlight].symbol);
      } else if (parsed.recognized) {
        commit(parsed);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
    }
  };

  return (
    <div ref={boxRef} className="relative flex-1">
      <div className="flex h-8 items-center gap-2 border border-term-line bg-term-panel px-2 focus-within:border-term-amber-dim">
        <span className="select-none text-term-amber">{">"}</span>
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setOpen(true);
            setHistIndex(-1);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          spellCheck={false}
          autoComplete="off"
          aria-label="Command input"
          role="combobox"
          aria-expanded={showDropdown}
          aria-controls="command-listbox"
          aria-autocomplete="list"
          aria-activedescendant={showDropdown ? `command-option-${highlight}` : undefined}
          placeholder="Enter symbol or command — e.g.  AAPL GP  ·  MSFT FA  ·  BTC-USD  ·  HELP"
          className="h-full w-full bg-transparent text-[13px] text-term-bright caret-term-amber outline-none placeholder:text-term-dim"
        />
        {parsed.fn && (
          <span className="hidden shrink-0 items-center gap-1 text-[11px] text-term-dim sm:flex">
            <span className="text-term-amber-bright">{parsed.fn.code}</span>
            {parsed.fn.label}
          </span>
        )}
        <kbd className="hidden shrink-0 rounded-sm border border-term-line px-1 text-[10px] text-term-dim md:block">
          ⌘K
        </kbd>
      </div>

      {showDropdown && (
        <ul
          ref={listRef}
          id="command-listbox"
          role="listbox"
          className="absolute left-0 right-0 top-9 z-50 max-h-80 overflow-y-auto border border-term-line-bright bg-term-panel-2 shadow-2xl shadow-black/60"
        >
          {results.map((r, i) => (
            <li key={`${r.symbol}-${i}`} role="option" aria-selected={i === highlight} data-idx={i}>
              <button
                type="button"
                id={`command-option-${i}`}
                tabIndex={-1}
                onMouseEnter={() => setHighlight(i)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  commit(parsed, r.symbol);
                }}
                className={`flex w-full items-center gap-2 px-2 py-1.5 text-left ${
                  i === highlight ? "bg-term-amber/15" : "hover:bg-term-row"
                }`}
              >
                <span className="w-20 shrink-0 truncate text-[12px] font-semibold text-term-amber-bright">
                  {r.symbol}
                </span>
                <span className="flex-1 truncate text-[12px] text-term-text">{r.name}</span>
                <span className="shrink-0 text-[10px] uppercase tracking-wide text-term-dim">
                  {QUOTE_TYPE_LABEL[r.type] ?? r.type}
                </span>
                <span className="hidden w-24 shrink-0 truncate text-right text-[10px] text-term-dim sm:block">
                  {r.exchange}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
