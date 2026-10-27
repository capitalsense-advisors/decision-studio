import { type NextRequest } from "next/server";

import { CACHE, fetchJson, jsonResponse, problemResponse, upstreamProblem } from "@/lib/server/api";
import { normalizeFundSearch } from "@/lib/server/funds";

const ROUTE = "fund-search";

export async function GET(request: NextRequest) {
  const rawQuery = request.nextUrl.searchParams.get("q") ?? "";
  const query = rawQuery.trim().replace(/\s+/g, " ");

  if (query.length < 3 || query.length > 80) {
    return problemResponse("Enter between 3 and 80 characters.", 400, "INVALID_QUERY", ROUTE);
  }

  try {
    const payload = await fetchJson(`https://api.mfapi.in/mf/search?q=${encodeURIComponent(query)}`, {
      revalidate: 86_400,
    });
    return jsonResponse(normalizeFundSearch(payload), CACHE.funds);
  } catch (error) {
    return upstreamProblem(error, "Fund search is temporarily unavailable.", ROUTE);
  }
}
