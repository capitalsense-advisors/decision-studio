import { type NextRequest } from "next/server";

import { CACHE, jsonResponse, problemResponse } from "@/lib/server/api";
import { getFundSuggestions } from "@/lib/server/fund-catalog";

const ROUTE = "fund-suggest";

export async function GET(request: NextRequest) {
  const query = (request.nextUrl.searchParams.get("q") ?? "").trim().replace(/\s+/g, " ");
  if (query.length < 2 || query.length > 80) {
    return problemResponse("Enter between 2 and 80 characters.", 400, "INVALID_QUERY", ROUTE);
  }

  return jsonResponse(getFundSuggestions(query), CACHE.funds);
}
