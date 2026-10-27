import { CACHE, fetchJson, jsonResponse, problemResponse, upstreamProblem } from "@/lib/server/api";
import { normalizeFundDetail } from "@/lib/server/funds";

const ROUTE = "fund-detail";

export async function GET(_: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  if (!/^\d{3,12}$/.test(code)) {
    return problemResponse("Invalid scheme code.", 400, "INVALID_SCHEME_CODE", ROUTE);
  }

  try {
    const payload = await fetchJson(`https://api.mfapi.in/mf/${code}`, { revalidate: 86_400 });
    const fund = normalizeFundDetail(payload);
    if (!fund.points.length) {
      return problemResponse("No NAV history was found for this scheme.", 404, "FUND_NOT_FOUND", ROUTE);
    }
    return jsonResponse(fund, CACHE.funds);
  } catch (error) {
    return upstreamProblem(error, "NAV history is temporarily unavailable.", ROUTE);
  }
}
