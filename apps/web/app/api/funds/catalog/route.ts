import { type NextRequest } from "next/server";

import { getFundCatalogPeers } from "@/lib/server/fund-catalog";
import { CACHE, jsonResponse, problemResponse } from "@/lib/server/api";

const ROUTE = "fund-catalog";

export async function GET(request: NextRequest) {
  const name = (request.nextUrl.searchParams.get("name") ?? "").trim().replace(/\s+/g, " ");
  if (name.length < 3 || name.length > 240) {
    return problemResponse("Enter a valid fund name.", 400, "INVALID_FUND_NAME", ROUTE);
  }

  return jsonResponse(getFundCatalogPeers(name), CACHE.funds);
}
