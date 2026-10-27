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

  it("calculates concentration and ignores holdings without a usable price", () => {
    const analysis = analyzePortfolio([
      createHolding({ symbol: "A", quantity: 8, averageCost: 80, currentPrice: 100 }),
      createHolding({ symbol: "B", quantity: 2, averageCost: 90, currentPrice: 100 }),
      createHolding({ symbol: "C", quantity: 10, averageCost: 10, currentPrice: null }),
    ]);
    expect(analysis).not.toBeNull();
    expect(analysis?.totalValue).toBe(1000);
    expect(analysis?.topWeight).toBeCloseTo(0.8);
    expect(analysis?.assessment).toBe("Focused");
    expect(analysis?.weighted).toHaveLength(2);
  });

  it("selects the latest dated Yahoo point for every successful symbol", () => {
    expect(latestPrices({ TCS: [{ date: "2026-01-01", value: 10 }, { date: "2026-01-02", value: 12 }] })).toEqual({ TCS: { date: "2026-01-02", value: 12 } });
  });
});
