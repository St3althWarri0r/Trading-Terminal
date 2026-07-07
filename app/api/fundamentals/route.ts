import type { NextRequest } from "next/server";
import { getFundamentals } from "@/lib/yahoo";
import { ok, fail, errMessage } from "@/lib/http";

export const dynamic = "force-dynamic";

// GET /api/fundamentals?symbol=AAPL
export async function GET(req: NextRequest) {
  const symbol = (req.nextUrl.searchParams.get("symbol") ?? "").trim();
  if (!symbol) return fail("Missing `symbol` query parameter", 400);

  try {
    return ok(await getFundamentals(symbol), 3600);
  } catch (e) {
    return fail(errMessage(e), 502);
  }
}
