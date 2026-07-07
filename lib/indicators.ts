import type { Candle } from "./types";

/**
 * Pure technical-indicator math. Each returns points aligned to the input
 * candles by `time`, with `null` where the lookback window isn't yet full so
 * the caller can skip plotting leading gaps.
 */

export interface LinePoint {
  time: number;
  value: number;
}

/** Simple Moving Average. */
export function sma(candles: Candle[], period: number): LinePoint[] {
  const out: LinePoint[] = [];
  if (period <= 0) return out;
  let sum = 0;
  for (let i = 0; i < candles.length; i++) {
    sum += candles[i].close;
    if (i >= period) sum -= candles[i - period].close;
    if (i >= period - 1) {
      out.push({ time: candles[i].time, value: sum / period });
    }
  }
  return out;
}

/** Exponential Moving Average, seeded with the SMA of the first `period` closes. */
export function ema(candles: Candle[], period: number): LinePoint[] {
  const out: LinePoint[] = [];
  if (period <= 0 || candles.length < period) return out;
  const k = 2 / (period + 1);
  // Warm up with a simple average so the line starts at the same bar as SMA and
  // isn't skewed by seeding from a single early close.
  let sum = 0;
  for (let i = 0; i < period; i++) sum += candles[i].close;
  let prev = sum / period;
  out.push({ time: candles[period - 1].time, value: prev });
  for (let i = period; i < candles.length; i++) {
    prev = candles[i].close * k + prev * (1 - k);
    out.push({ time: candles[i].time, value: prev });
  }
  return out;
}

/** Bare EMA over a number series (used internally by MACD). */
function emaSeries(values: number[], period: number): number[] {
  const out: number[] = [];
  if (values.length === 0) return out;
  const k = 2 / (period + 1);
  let prev = values[0];
  out.push(prev);
  for (let i = 1; i < values.length; i++) {
    prev = values[i] * k + prev * (1 - k);
    out.push(prev);
  }
  return out;
}

/**
 * Relative Strength Index using Wilder's smoothing. Returns points starting at
 * index `period` (first fully-formed value).
 */
export function rsi(candles: Candle[], period = 14): LinePoint[] {
  const out: LinePoint[] = [];
  if (candles.length <= period) return out;

  let gain = 0;
  let loss = 0;
  for (let i = 1; i <= period; i++) {
    const diff = candles[i].close - candles[i - 1].close;
    if (diff >= 0) gain += diff;
    else loss -= diff;
  }
  let avgGain = gain / period;
  let avgLoss = loss / period;

  const push = (i: number, ag: number, al: number) => {
    const rs = al === 0 ? Infinity : ag / al;
    const value = al === 0 ? 100 : 100 - 100 / (1 + rs);
    out.push({ time: candles[i].time, value });
  };
  push(period, avgGain, avgLoss);

  for (let i = period + 1; i < candles.length; i++) {
    const diff = candles[i].close - candles[i - 1].close;
    const g = diff >= 0 ? diff : 0;
    const l = diff < 0 ? -diff : 0;
    avgGain = (avgGain * (period - 1) + g) / period;
    avgLoss = (avgLoss * (period - 1) + l) / period;
    push(i, avgGain, avgLoss);
  }
  return out;
}

export interface MacdResult {
  macd: LinePoint[];
  signal: LinePoint[];
  histogram: LinePoint[];
}

/** MACD (fast/slow EMA difference) with signal line and histogram. */
export function macd(
  candles: Candle[],
  fast = 12,
  slow = 26,
  signalPeriod = 9
): MacdResult {
  const empty: MacdResult = { macd: [], signal: [], histogram: [] };
  if (candles.length < slow) return empty;

  const closes = candles.map((c) => c.close);
  const emaFast = emaSeries(closes, fast);
  const emaSlow = emaSeries(closes, slow);

  const macdLine: number[] = closes.map((_, i) => emaFast[i] - emaSlow[i]);
  const signalLine = emaSeries(macdLine, signalPeriod);

  const macdPts: LinePoint[] = [];
  const signalPts: LinePoint[] = [];
  const histPts: LinePoint[] = [];
  for (let i = 0; i < candles.length; i++) {
    // Only emit once the slow EMA has enough data to be meaningful.
    if (i < slow - 1) continue;
    macdPts.push({ time: candles[i].time, value: macdLine[i] });
    signalPts.push({ time: candles[i].time, value: signalLine[i] });
    histPts.push({ time: candles[i].time, value: macdLine[i] - signalLine[i] });
  }
  return { macd: macdPts, signal: signalPts, histogram: histPts };
}
