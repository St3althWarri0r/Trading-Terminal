import type { NextRequest } from "next/server";
import { getQuotes } from "@/lib/yahoo";
import { ok, fail, errMessage } from "@/lib/http";

export const dynamic = "force-dynamic";

// GET /api/quote?symbols=AAPL,MSFT,^GSPC
export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("symbols") ?? "";
  const symbols = raw.split(",").map((s) => s.trim()).filter(Boolean);
  if (symbols.length === 0) return fail("Missing `symbols` query parameter", 400);
  if (symbols.length > 60) return fail("Too many symbols (max 60)", 400);

  try {
    return ok(await getQuotes(symbols), 10);
  } catch (e) {
    return fail(errMessage(e), 502);
  }
}
