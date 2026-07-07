"use client";

import type { ReactNode } from "react";

interface PanelProps {
  title: string;
  /** Optional Bloomberg-style function code shown at the right of the header. */
  code?: string;
  /** Right-aligned header controls (toolbar buttons, tabs, etc.). */
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  /** Show a blinking "live" dot in the header. */
  live?: boolean;
  id?: string;
}

/**
 * The chrome every panel shares: a dense amber header bar and a bordered body.
 * Panels are flex columns so their bodies can own an internal scroll region.
 */
export default function Panel({
  title,
  code,
  actions,
  children,
  className = "",
  bodyClassName = "",
  live = false,
  id,
}: PanelProps) {
  return (
    <section
      id={id}
      className={`flex min-h-0 flex-col border border-term-line bg-term-panel ${className}`}
    >
      <header className="flex h-6 shrink-0 items-center justify-between border-b border-term-line bg-term-panel-2 pl-2 pr-1.5">
        <div className="flex items-center gap-1.5 overflow-hidden">
          {live && (
            <span
              className="size-1.5 shrink-0 rounded-full bg-term-up animate-term-blink"
              aria-hidden
            />
          )}
          <h2 className="truncate text-[11px] font-semibold uppercase tracking-[0.14em] text-term-amber">
            {title}
          </h2>
        </div>
        <div className="flex items-center gap-1.5">
          {actions}
          {code && (
            <span className="shrink-0 rounded-sm bg-term-amber/10 px-1 text-[10px] font-semibold text-term-amber-bright">
              {code}
            </span>
          )}
        </div>
      </header>
      <div className={`min-h-0 flex-1 ${bodyClassName}`}>{children}</div>
    </section>
  );
}
