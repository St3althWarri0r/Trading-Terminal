"use client";

import { useEffect, useRef } from "react";
import { useTerminal } from "@/lib/store";
import { FUNCTION_CODES } from "@/lib/constants";

const EXAMPLES = [
  ["AAPL", "Load Apple and show its price graph"],
  ["MSFT FA", "Microsoft — jump to financials"],
  ["NVDA CN", "Nvidia — company news"],
  ["BTC-USD", "Bitcoin (crypto)"],
  ["^GSPC", "S&P 500 index"],
  ["EURUSD=X", "EUR/USD exchange rate"],
];

const SHORTCUTS = [
  ["⌘K  /  /", "Focus the command bar"],
  ["↑ ↓", "Navigate search results"],
  ["↑", "Recall previous commands"],
  ["Enter", "Run command / pick result"],
  ["Esc", "Close menus & dialogs"],
];

export default function HelpOverlay() {
  const overlay = useTerminal((s) => s.overlay);
  const setOverlay = useTerminal((s) => s.setOverlay);
  const open = overlay === "help";
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const opener = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOverlay(null);
        return;
      }
      // Trap focus within the dialog.
      if (e.key === "Tab" && dialogRef.current) {
        const items = dialogRef.current.querySelectorAll<HTMLElement>(
          'a[href], button, [tabindex]:not([tabindex="-1"])'
        );
        if (items.length === 0) return;
        const first = items[0];
        const last = items[items.length - 1];
        const active = document.activeElement;
        if (e.shiftKey && active === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && active === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      opener?.focus?.();
    };
  }, [open, setOverlay]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4"
      onMouseDown={() => setOverlay(null)}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="help-title"
        className="max-h-[85vh] w-full max-w-3xl overflow-y-auto border border-term-line-bright bg-term-panel shadow-2xl shadow-black/70"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-term-line bg-term-panel-2 px-3 py-2">
          <h2 id="help-title" className="text-[13px] font-semibold uppercase tracking-[0.14em] text-term-amber">
            Trading Terminal · Command Reference
          </h2>
          <button
            ref={closeRef}
            type="button"
            onClick={() => setOverlay(null)}
            aria-label="Close help"
            className="text-term-dim hover:text-term-bright"
          >
            ✕
          </button>
        </header>

        <div className="grid grid-cols-1 gap-4 p-3 md:grid-cols-2">
          <section>
            <h3 className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-term-amber-dim">
              How it works
            </h3>
            <p className="text-[12px] leading-relaxed text-term-text">
              Type a <span className="text-term-amber-bright">symbol</span>, optionally followed by a{" "}
              <span className="text-term-amber-bright">function code</span>, then press Enter — the Bloomberg{" "}
              <span className="text-term-dim">&lt;TICKER&gt; &lt;FUNCTION&gt; &lt;GO&gt;</span> idiom. Start typing any
              company name to search.
            </p>
            <div className="mt-2 space-y-1">
              {EXAMPLES.map(([cmd, desc]) => (
                <div key={cmd} className="flex items-baseline gap-2">
                  <code className="w-24 shrink-0 rounded-sm bg-term-amber/10 px-1 text-[11px] text-term-amber-bright">
                    {cmd}
                  </code>
                  <span className="text-[11px] text-term-dim">{desc}</span>
                </div>
              ))}
            </div>

            <h3 className="mb-1 mt-4 text-[11px] font-semibold uppercase tracking-wider text-term-amber-dim">
              Keyboard
            </h3>
            <div className="space-y-1">
              {SHORTCUTS.map(([keys, desc]) => (
                <div key={desc} className="flex items-baseline gap-2">
                  <span className="w-24 shrink-0 text-[11px] text-term-text">{keys}</span>
                  <span className="text-[11px] text-term-dim">{desc}</span>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h3 className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-term-amber-dim">
              Function codes
            </h3>
            <div className="divide-y divide-term-line">
              {FUNCTION_CODES.map((f) => (
                <div key={f.code} className="flex items-baseline gap-2 py-[3px]">
                  <code className="w-12 shrink-0 text-[11px] font-semibold text-term-amber-bright">{f.code}</code>
                  <span className="w-24 shrink-0 text-[11px] text-term-text">{f.label}</span>
                  <span className="flex-1 text-[11px] text-term-dim">{f.description}</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        <footer className="border-t border-term-line px-3 py-2 text-[10px] text-term-dim">
          Data via Yahoo Finance · for educational and informational use only · not investment advice.
        </footer>
      </div>
    </div>
  );
}
