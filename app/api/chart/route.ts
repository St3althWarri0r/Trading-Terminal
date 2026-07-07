import type { NextRequest } from "next/server";
import { getChart } from "@/lib/yahoo";
import { ok, fail, errMessage } from "@/lib/http";
import { RANGE_CONFIG } from "@/lib/constants";
import type { RangeKey } from "@/lib/types";

export const dynamic = "force-dynamic";

// GET /api/chart?symbol=AAPL&range=1M
export async function GET(req: NextRequest) {
  const symbol = (req.nextUrl.searchParams.get("symbol") ?? "").trim();
  const range = (req.nextUrl.searchParams.get("range") ?? "1M").toUpperCase() as RangeKey;
  if (!symbol) return fail("Missing `symbol` query parameter", 400);
  if (!(range in RANGE_CONFIG)) return fail(`Invalid range: ${range}`, 400);

  const intraday = range === "1D" || range === "5D";
  try {
    return ok(await getChart(symbol, range), intraday ? 30 : 120);
  } catch (e) {
    return fail(errMessage(e), 502);
  }
}
