import type { NextRequest } from "next/server";
import { getNews } from "@/lib/yahoo";
import { ok, fail, errMessage } from "@/lib/http";

export const dynamic = "force-dynamic";

// GET /api/news            -> market-wide headlines
// GET /api/news?symbol=AAPL -> headlines for a symbol
export async function GET(req: NextRequest) {
  const symbol = (req.nextUrl.searchParams.get("symbol") ?? "").trim() || undefined;

  try {
    return ok(await getNews(symbol), 120);
  } catch (e) {
    return fail(errMessage(e), 502);
  }
}
