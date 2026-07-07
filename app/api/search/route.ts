import type { NextRequest } from "next/server";
import { search } from "@/lib/yahoo";
import { ok, fail, errMessage } from "@/lib/http";

export const dynamic = "force-dynamic";

// GET /api/search?q=apple
export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") ?? "").trim();
  if (!q) return ok([], 60);

  try {
    return ok(await search(q), 60);
  } catch (e) {
    return fail(errMessage(e), 502);
  }
}
