import { FUNCTION_CODES, type FunctionCode } from "./constants";

/**
 * Parses Bloomberg-style command-bar input into an intent.
 *
 * Grammar (case-insensitive), mirroring the `<TICKER> <FUNCTION> <GO>` idiom:
 *   AAPL            -> load symbol
 *   AAPL GP         -> load symbol + open price graph
 *   GP              -> apply function to the current symbol
 *   AAPL US Equity  -> descriptors (US/EQUITY/GO...) are ignored
 *   HELP            -> function with no symbol
 */

// Yellow-key / descriptor noise people carry over from a real terminal.
const DESCRIPTORS = new Set([
  "US",
  "EQUITY",
  "EQ",
  "INDEX",
  "INDX",
  "CURNCY",
  "COMDTY",
  "CORP",
  "GO",
]);

const CODE_MAP = new Map<string, FunctionCode>(FUNCTION_CODES.map((f) => [f.code, f]));

export interface ParsedCommand {
  raw: string;
  symbol?: string;
  fn?: FunctionCode;
  recognized: boolean;
}

function isCode(token: string): boolean {
  return CODE_MAP.has(token);
}

export function parseCommand(input: string): ParsedCommand {
  const raw = input.trim();
  const tokens = raw
    .toUpperCase()
    .split(/\s+/)
    .filter(Boolean)
    .filter((t) => !DESCRIPTORS.has(t));

  if (tokens.length === 0) return { raw, recognized: false };

  const codeToken = tokens.find(isCode);
  const symbolToken = tokens.find((t) => !isCode(t));

  const fn = codeToken ? CODE_MAP.get(codeToken) : undefined;
  const symbol = symbolToken ? normalizeSymbol(symbolToken) : undefined;

  return { raw, symbol, fn, recognized: Boolean(symbol || fn) };
}

/** Light normalization: keep the characters Yahoo tickers actually use. */
export function normalizeSymbol(token: string): string {
  return token
    .toUpperCase()
    .replace(/[^A-Z0-9.^=\-]/g, "")
    .slice(0, 16);
}
