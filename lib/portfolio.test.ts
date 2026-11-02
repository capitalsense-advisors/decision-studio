import { describe, expect, it } from "vitest";

import { analyzePortfolio, createHolding, latestPrices, parseHoldingsCsv, validateHoldings } from "@/lib/portfolio";

describe("portfolio data handling", () => {
  it("parses quoted CSV values and normalizes Indian symbols", () => {
    const result = parseHoldingsCsv('symbol,quantity,average_cost,asset_type\n"RELIANCE.NS","20","2,400",stock');
    expect(result.issues).toEqual([]);
    expect(result.rows[0]).toMatchObject({ symbol: "RELIANCE", quantity: 20, averageCost: 2400, assetType: "stock" });
  });

  it("rejects missing headers, invalid values, and duplicate symbols", () => {
    expect(parseHoldingsCsv("symbol,quantity\nTCS,2").issues[0].field).toBe("headers");
    const rows = [createHolding({ symbol: "TCS", quantity: 2 }), createHolding({ symbol: "TCS", quantity: 0 })];
    expect(validateHoldings(rows).map((issue) => issue.field)).toEqual(["symbol", "quantity"]);
  });

  it("refuses to analyze an incomplete portfolio", () => {
    const analysis = analyzePortfolio([
      createHolding({ symbol: "A", quantity: 8, averageCost: 80, currentPrice: 100 }),
      createHolding({ symbol: "B", quantity: 2, averageCost: 90, currentPrice: 100 }),
      createHolding({ symbol: "C", quantity: 10, averageCost: 10, currentPrice: null }),
    ]);
    expect(analysis).toBeNull();
  });

  it("selects the latest dated Yahoo point for every successful symbol", () => {
    expect(latestPrices({ TCS: [{ date: "2026-01-01", value: 10 }, { date: "2026-01-02", value: 12 }] })).toEqual({ TCS: { date: "2026-01-02", value: 12 } });
  });
});

it("keeps equal holdings out of the dominant-position verdict", () => {
 const rows = ["A", "B", "C", "D"].map((symbol) => createHolding({symbol, quantity: 1, averageCost: 1, currentPrice: 1}));
 expect(analyzePortfolio(rows)?.assessment).toBe("Watch concentration");
 expect(analyzePortfolio(rows)?.topWeight).toBe(.25);
});
it("imports broker aliases, prices and fund types without guessing missing costs", () => {
 const result = parseHoldingsCsv("Instrument,Qty.,Avg. cost,LTP,Type\nABC,2,100,110,ETF");
 expect(result.issues).toEqual([]);
 expect(result.rows[0]).toMatchObject({symbol:"ABC", quantity:2, averageCost:100, currentPrice:110, assetType:"fund", priceDate:null});
 expect(parseHoldingsCsv("symbol,quantity,average_cost,type\nABC,1,,crypto").issues.map(i=>i.field)).toContain("assetType");
 expect(analyzePortfolio(parseHoldingsCsv("symbol,quantity,average_cost\nABC,1,").rows)).toBeNull();
});
