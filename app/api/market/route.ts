import { getMarketOverview } from "@/lib/yahoo";
import { ok, fail, errMessage } from "@/lib/http";

export const dynamic = "force-dynamic";

// GET /api/market -> indices, futures, rates, commodities, crypto, FX, sectors
export async function GET() {
  try {
    return ok(await getMarketOverview(), 15);
  } catch (e) {
    return fail(errMessage(e), 502);
  }
}
