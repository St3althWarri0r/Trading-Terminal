"use client";

import { useEffect, useState } from "react";

interface EtParts {
  hour: number;
  minute: number;
  second: number;
  weekday: string;
  clock: string;
  date: string;
}

/** Current time in US market (Eastern) time, via Intl — no external calls. */
function easternNow(): EtParts {
  const now = new Date();
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    hour12: false,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    month: "short",
    day: "2-digit",
  });
  const parts = Object.fromEntries(fmt.formatToParts(now).map((p) => [p.type, p.value]));
  const hour = Number(parts.hour === "24" ? "0" : parts.hour);
  return {
    hour,
    minute: Number(parts.minute),
    second: Number(parts.second),
    weekday: parts.weekday,
    clock: `${String(hour).padStart(2, "0")}:${parts.minute}:${parts.second}`,
    date: `${parts.weekday} ${parts.month} ${parts.day}`,
  };
}

type Session = { label: string; className: string };

function sessionFor(et: EtParts): Session {
  const weekend = et.weekday === "Sat" || et.weekday === "Sun";
  const mins = et.hour * 60 + et.minute;
  if (weekend) return { label: "MARKET CLOSED", className: "text-term-down" };
  if (mins >= 570 && mins < 960) return { label: "NYSE OPEN", className: "text-term-up" }; // 9:30–16:00
  if (mins >= 240 && mins < 570) return { label: "PRE-MARKET", className: "text-term-yellow" }; // 4:00–9:30
  if (mins >= 960 && mins < 1200) return { label: "AFTER HOURS", className: "text-term-yellow" }; // 16:00–20:00
  return { label: "MARKET CLOSED", className: "text-term-down" };
}

export default function StatusBar() {
  const [et, setEt] = useState<EtParts | null>(null);
  // Detect after mount to avoid a hydration mismatch (SSR has no navigator).
  const [modKey, setModKey] = useState("⌘K");

  useEffect(() => {
    const platform = navigator.platform || navigator.userAgent || "";
    setModKey(/mac|iphone|ipad/i.test(platform) ? "⌘K" : "Ctrl+K");
    setEt(easternNow());
    const id = setInterval(() => setEt(easternNow()), 1000);
    return () => clearInterval(id);
  }, []);

  const session = et ? sessionFor(et) : null;

  return (
    <footer className="flex h-6 shrink-0 items-center justify-between border-t border-term-line bg-term-panel-2 px-2 text-[11px] text-term-dim">
      <div className="flex items-center gap-3">
        <span className="flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-term-up animate-term-blink" aria-hidden />
          <span className="text-term-up">LIVE</span>
        </span>
        <span className="hidden sm:inline">
          DATA <span className="text-term-text">YAHOO FINANCE</span> · DELAYED
        </span>
        {session && <span className={`font-semibold ${session.className}`}>{session.label}</span>}
      </div>

      <div className="hidden items-center gap-3 md:flex">
        <span>
          <span className="text-term-dim">HELP</span> commands
        </span>
        <span>
          <kbd className="text-term-text">{modKey}</kbd> search
        </span>
      </div>

      <div className="flex items-center gap-2 tabular-nums">
        <span className="hidden text-term-dim sm:inline">{et?.date ?? "—"}</span>
        <span className="text-term-amber">{et?.clock ?? "--:--:--"}</span>
        <span className="text-term-dim">ET</span>
      </div>
    </footer>
  );
}
