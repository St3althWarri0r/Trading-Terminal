import { NextResponse } from "next/server";

/** JSON success with CDN-friendly caching (Vercel honors `s-maxage`). */
export function ok(data: unknown, sMaxAge = 10): NextResponse {
  return NextResponse.json(data, {
    headers: {
      "Cache-Control": `public, s-maxage=${sMaxAge}, stale-while-revalidate=${sMaxAge * 4}`,
    },
  });
}

/** JSON error envelope matching the `ApiError` type. */
export function fail(message: string, status = 500): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

/** Normalize an unknown thrown value into a short message. */
export function errMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (typeof e === "string") return e;
  return "Unknown error";
}
