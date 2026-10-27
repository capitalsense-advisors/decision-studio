import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import { GET as getFund } from "@/app/api/funds/[code]/route";
import { GET as searchFunds } from "@/app/api/funds/search/route";
import { GET as health } from "@/app/api/health/route";
import { GET as getMarketHistory } from "@/app/api/market/history/route";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("API routes", () => {
  it("returns a no-store health response", async () => {
    const response = await health();
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ status: "ok", service: "paisaan-web" });
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("x-request-id")).toBeTruthy();
  });

  it("rejects an undersized fund query before calling upstream", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const response = await searchFunds(new NextRequest("http://localhost/api/funds/search?q=ab"));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.code).toBe("INVALID_QUERY");
    expect(body.requestId).toBe(response.headers.get("x-request-id"));
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("normalizes fund-search results and applies the fund cache policy", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json([
      { schemeCode: 101, schemeName: "Alpha Direct Growth" },
      { schemeCode: null, schemeName: "Broken" },
    ])));
    const response = await searchFunds(new NextRequest("http://localhost/api/funds/search?q=alpha"));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual([{ schemeCode: 101, schemeName: "Alpha Direct Growth" }]);
    expect(response.headers.get("cache-control")).toContain("s-maxage=86400");
  });

  it("rejects an invalid scheme code", async () => {
    const response = await getFund(new Request("http://localhost/api/funds/nope"), {
      params: Promise.resolve({ code: "nope" }),
    });
    expect(response.status).toBe(400);
    expect((await response.json()).code).toBe("INVALID_SCHEME_CODE");
  });

  it("normalizes a fund detail response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({
      meta: { scheme_name: "Alpha" },
      data: [{ date: "01-01-2026", nav: "25.5" }],
    })));
    const response = await getFund(new Request("http://localhost/api/funds/12345"), {
      params: Promise.resolve({ code: "12345" }),
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      meta: { scheme_name: "Alpha" },
      points: [{ date: "2026-01-01", value: 25.5 }],
    });
  });

  it("rejects unsupported markets and too many symbols", async () => {
    const unsupported = await getMarketHistory(new NextRequest("http://localhost/api/market/history?market=uk&symbols=VOD"));
    expect(unsupported.status).toBe(400);
    expect((await unsupported.json()).code).toBe("INVALID_MARKET");

    const symbols = Array.from({ length: 11 }, (_, index) => `S${index}`).join(",");
    const excessive = await getMarketHistory(new NextRequest(`http://localhost/api/market/history?market=us&symbols=${symbols}`));
    expect(excessive.status).toBe(400);
    expect((await excessive.json()).code).toBe("INVALID_SYMBOL_COUNT");
  });

  it("returns usable market data and discloses partial failures", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(Response.json({
        chart: { result: [{ timestamp: [1_700_000_000], indicators: { quote: [{ close: [100] }] } }] },
      }))
      .mockResolvedValueOnce(new Response("upstream unavailable", { status: 503 }));
    vi.stubGlobal("fetch", fetchMock);

    const response = await getMarketHistory(new NextRequest("http://localhost/api/market/history?market=us&symbols=AAPL,MSFT"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(Object.keys(body.series)).toEqual(["AAPL"]);
    expect(body.failures).toEqual(["MSFT"]);
  });

  it("returns a stable gateway error when all market sources fail", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("unavailable", { status: 503 })));

    const response = await getMarketHistory(new NextRequest("http://localhost/api/market/history?market=us&symbols=AAPL"));
    const body = await response.json();

    expect(response.status).toBe(502);
    expect(body.code).toBe("UPSTREAM_UNAVAILABLE");
    expect(body.requestId).toBe(response.headers.get("x-request-id"));
  });
});

