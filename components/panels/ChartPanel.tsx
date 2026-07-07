"use client";

import { useEffect, useRef, useState } from "react";
import {
  createChart,
  CandlestickSeries,
  HistogramSeries,
  LineSeries,
  ColorType,
  CrosshairMode,
  LineStyle,
  type IChartApi,
  type ISeriesApi,
  type UTCTimestamp,
} from "lightweight-charts";
import Panel from "@/components/ui/Panel";
import { useChart } from "@/lib/hooks";
import { useTerminal } from "@/lib/store";
import { RANGE_ORDER } from "@/lib/constants";
import { ema, sma } from "@/lib/indicators";
import { fmtPrice } from "@/lib/format";
import type { Candle, RangeKey } from "@/lib/types";

const UP = "#26d17c";
const DOWN = "#ff5b52";

interface IndicatorCfg {
  key: "sma20" | "sma50" | "ema200";
  label: string;
  color: string;
  compute: (c: Candle[]) => { time: number; value: number }[];
}

const INDICATORS: IndicatorCfg[] = [
  { key: "sma20", label: "SMA 20", color: "#46c9dd", compute: (c) => sma(c, 20) },
  { key: "sma50", label: "SMA 50", color: "#ffa028", compute: (c) => sma(c, 50) },
  { key: "ema200", label: "EMA 200", color: "#c678dd", compute: (c) => ema(c, 200) },
];

type OHLC = { open: number; high: number; low: number; close: number };

export default function ChartPanel() {
  const symbol = useTerminal((s) => s.symbol);
  const range = useTerminal((s) => s.range);
  const setRange = useTerminal((s) => s.setRange);
  const { data, isLoading, isError, error, isFetching } = useChart(symbol, range);

  const [showVol, setShowVol] = useState(true);
  const [enabled, setEnabled] = useState<Record<string, boolean>>({
    sma20: true,
    sma50: true,
    ema200: false,
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volumeRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  const indicatorRefs = useRef<Record<string, ISeriesApi<"Line">>>({});
  // Tracks the symbol:range the view is fitted to, so live polls don't reset zoom.
  const fitKeyRef = useRef<string>("");

  // Legend value nodes, updated imperatively via textContent (no innerHTML).
  const oRef = useRef<HTMLSpanElement>(null);
  const hRef = useRef<HTMLSpanElement>(null);
  const lRef = useRef<HTMLSpanElement>(null);
  const cRef = useRef<HTMLSpanElement>(null);
  const latestRef = useRef<OHLC | null>(null);

  const paintLegend = (bar: OHLC | null) => {
    const b = bar ?? latestRef.current;
    if (!oRef.current || !hRef.current || !lRef.current || !cRef.current) return;
    if (!b) {
      oRef.current.textContent = hRef.current.textContent = "";
      lRef.current.textContent = cRef.current.textContent = "";
      return;
    }
    oRef.current.textContent = fmtPrice(b.open);
    hRef.current.textContent = fmtPrice(b.high);
    lRef.current.textContent = fmtPrice(b.low);
    cRef.current.textContent = fmtPrice(b.close);
    cRef.current.style.color = b.close >= b.open ? UP : DOWN;
  };

  // Create the chart once.
  useEffect(() => {
    if (!containerRef.current) return;
    const chart = createChart(containerRef.current, {
      autoSize: true,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#66727f",
        fontFamily: "var(--font-plex-mono), monospace",
        fontSize: 11,
      },
      grid: {
        vertLines: { color: "rgba(43,55,68,0.25)" },
        horzLines: { color: "rgba(43,55,68,0.25)" },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: "#66727f", width: 1, style: LineStyle.Dotted, labelBackgroundColor: "#1a2029" },
        horzLine: { color: "#66727f", width: 1, style: LineStyle.Dotted, labelBackgroundColor: "#1a2029" },
      },
      rightPriceScale: { borderColor: "#1a2029" },
      timeScale: { borderColor: "#1a2029", timeVisible: true, secondsVisible: false, rightOffset: 4 },
    });

    const candle = chart.addSeries(CandlestickSeries, {
      upColor: UP,
      downColor: DOWN,
      borderVisible: false,
      wickUpColor: UP,
      wickDownColor: DOWN,
      priceLineColor: "#66727f",
    });
    const volume = chart.addSeries(HistogramSeries, {
      priceScaleId: "vol",
      priceFormat: { type: "volume" },
    });
    chart.priceScale("vol").applyOptions({ scaleMargins: { top: 0.82, bottom: 0 } });

    chartRef.current = chart;
    candleRef.current = candle;
    volumeRef.current = volume;

    chart.subscribeCrosshairMove((param) => {
      const bar = param.seriesData.get(candle) as OHLC | undefined;
      paintLegend(bar ?? null);
    });

    return () => {
      chart.remove();
      chartRef.current = null;
      candleRef.current = null;
      volumeRef.current = null;
      indicatorRefs.current = {};
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Push candle + volume data whenever the series changes.
  useEffect(() => {
    const candles = data?.candles;
    if (!candleRef.current || !volumeRef.current || !candles) return;

    candleRef.current.setData(
      candles.map((c) => ({
        time: c.time as UTCTimestamp,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      }))
    );
    volumeRef.current.setData(
      candles.map((c) => ({
        time: c.time as UTCTimestamp,
        value: c.volume,
        color: c.close >= c.open ? "rgba(38,209,124,0.35)" : "rgba(255,91,82,0.35)",
      }))
    );
    // Fit only when the symbol/range changes; preserve the user's zoom/pan across
    // live polls (setData already keeps the current visible range).
    const fitKey = `${symbol}:${range}`;
    if (fitKeyRef.current !== fitKey) {
      chartRef.current?.timeScale().fitContent();
      fitKeyRef.current = fitKey;
    }

    const last = candles[candles.length - 1];
    latestRef.current = last ? { open: last.open, high: last.high, low: last.low, close: last.close } : null;
    paintLegend(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  // Toggle volume visibility.
  useEffect(() => {
    volumeRef.current?.applyOptions({ visible: showVol });
  }, [showVol]);

  // Reconcile indicator overlays with the enabled set + current data.
  useEffect(() => {
    const chart = chartRef.current;
    const candles = data?.candles;
    if (!chart || !candles) return;

    for (const ind of INDICATORS) {
      const on = enabled[ind.key];
      const existing = indicatorRefs.current[ind.key];
      if (on && !existing) {
        indicatorRefs.current[ind.key] = chart.addSeries(LineSeries, {
          color: ind.color,
          lineWidth: 1,
          priceLineVisible: false,
          lastValueVisible: false,
          crosshairMarkerVisible: false,
        });
      } else if (!on && existing) {
        chart.removeSeries(existing);
        delete indicatorRefs.current[ind.key];
      }
      const series = indicatorRefs.current[ind.key];
      if (series) {
        series.setData(
          ind.compute(candles).map((p) => ({ time: p.time as UTCTimestamp, value: p.value }))
        );
      }
    }
  }, [data, enabled]);

  const hasData = (data?.candles?.length ?? 0) > 0;

  return (
    <Panel
      title={`${symbol} · Price`}
      code="GP"
      live={isFetching}
      className="min-h-0 flex-1"
      bodyClassName="flex flex-col"
    >
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-term-line px-2 py-1">
        <div className="flex items-center gap-0.5">
          {RANGE_ORDER.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRange(r as RangeKey)}
              aria-pressed={range === r}
              className={`px-1.5 py-0.5 text-[11px] font-semibold ${
                range === r ? "bg-term-amber/20 text-term-amber-bright" : "text-term-dim hover:text-term-text"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          {INDICATORS.map((ind) => (
            <button
              key={ind.key}
              type="button"
              onClick={() => setEnabled((e) => ({ ...e, [ind.key]: !e[ind.key] }))}
              aria-pressed={enabled[ind.key]}
              className={`flex items-center gap-1 px-1.5 py-0.5 text-[10px] ${
                enabled[ind.key] ? "text-term-text" : "text-term-dim hover:text-term-text"
              }`}
            >
              <span
                className="size-2"
                style={{
                  backgroundColor: enabled[ind.key] ? ind.color : "transparent",
                  border: `1px solid ${ind.color}`,
                }}
              />
              {ind.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setShowVol((v) => !v)}
            aria-pressed={showVol}
            className={`px-1.5 py-0.5 text-[10px] ${showVol ? "text-term-text" : "text-term-dim hover:text-term-text"}`}
          >
            VOL
          </button>
        </div>
      </div>

      {/* Chart area */}
      <div className="relative min-h-0 flex-1">
        <div ref={containerRef} className="absolute inset-0" />
        <div className="pointer-events-none absolute left-2 top-1 z-10 flex gap-2 text-[11px] tabular-nums">
          <span>
            <span className="text-term-dim">O</span> <span ref={oRef} className="text-term-text" />
          </span>
          <span>
            <span className="text-term-dim">H</span> <span ref={hRef} className="text-term-text" />
          </span>
          <span>
            <span className="text-term-dim">L</span> <span ref={lRef} className="text-term-text" />
          </span>
          <span>
            <span className="text-term-dim">C</span> <span ref={cRef} className="text-term-text" />
          </span>
        </div>
        {!hasData && (
          <div className="absolute inset-0 flex items-center justify-center text-[12px] text-term-dim">
            {isLoading
              ? "Loading chart…"
              : isError
                ? (error as Error)?.message ?? "Failed to load chart."
                : "No price data available."}
          </div>
        )}
      </div>
    </Panel>
  );
}
