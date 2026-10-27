import { type NextRequest } from "next/server";

import { CACHE, fetchJson, jsonResponse, problemResponse, UpstreamFailure, upstreamProblem } from "@/lib/server/api";
import { normalizeYahooChart, parseMarket, parseSymbols, yahooTicker } from "@/lib/server/market";

const ROUTE = "market-history";

export async function GET(request: NextRequest) {
  const market = parseMarket(request.nextUrl.searchParams.get("market"));
  if (!market) {
    return problemResponse("Market must be either india or us.", 400, "INVALID_MARKET", ROUTE);
  }

  const { symbols, invalid } = parseSymbols(request.nextUrl.searchParams.get("symbols"));
  if (invalid.length) {
    return problemResponse(`Invalid symbol: ${invalid[0]}.`, 400, "INVALID_SYMBOL", ROUTE);
  }
  if (!symbols.length || symbols.length > 10) {
    return problemResponse("Provide between 1 and 10 valid symbols.", 400, "INVALID_SYMBOL_COUNT", ROUTE);
  }

  try {
    const results = await Promise.all(symbols.map(async (symbol) => {
      try {
        const ticker = yahooTicker(symbol, market);
        const payload = await fetchJson(
          `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?range=2y&interval=1d&events=history`,
          {
            headers: { "User-Agent": "Paisaan/0.2 (+https://github.com/capitalsense-advisors/decision-studio)" },
            revalidate: 3_600,
          },
        );
        return { symbol, points: normalizeYahooChart(payload) };
      } catch {
        return { symbol, points: null };
      }
    }));

    const successful = results.filter((result): result is { symbol: string; points: NonNullable<typeof result.points> } => result.points !== null);
    if (!successful.length) throw new UpstreamFailure("invalid-payload");

    const failures = results.filter((result) => result.points === null).map((result) => result.symbol);
    return jsonResponse(
      { market, series: Object.fromEntries(successful.map(({ symbol, points }) => [symbol, points])), failures },
      CACHE.market,
    );
  } catch (error) {
    return upstreamProblem(error, "Market history is temporarily unavailable.", ROUTE);
  }
}
