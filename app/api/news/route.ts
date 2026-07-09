import type { NextRequest } from "next/server";
import { getNews } from "@/lib/yahoo";
import { ok, fail, errMessage } from "@/lib/http";

export const dynamic = "force-dynamic";

// GET /api/news            -> market-wide headlines
// GET /api/news?symbol=AAPL -> headlines for a symbol
export async function GET(req: NextRequest) {
  const symbol = (req.nextUrl.searchParams.get("symbol") ?? "").trim() || undefined;

  try {
    // s-maxage matches the 30s server TTL in getNews — a longer edge window
    // would turn the news panel's manual refresh into a silent no-op on CDN
    // deployments (Vercel) by serving the same cached payload back.
    return ok(await getNews(symbol), 30);
  } catch (e) {
    return fail(errMessage(e), 502);
  }
}
