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
 expect(analyzePortfolio(rows)?.stockConcentration?.assessment).toBe("Watch concentration");
 expect(analyzePortfolio(rows)?.stockConcentration?.topWeight).toBe(.25);
});
it("imports broker aliases, prices and fund types without guessing missing costs", () => {
 const result = parseHoldingsCsv("Instrument,Qty.,Avg. cost,LTP,Type\nABC,2,100,110,ETF");
 expect(result.issues).toEqual([]);
 expect(result.rows[0]).toMatchObject({symbol:"ABC", quantity:2, averageCost:100, currentPrice:110, assetType:"fund", priceDate:null});
 expect(parseHoldingsCsv("symbol,quantity,average_cost,type\nABC,1,,crypto").issues.map(i=>i.field)).toContain("assetType");
 expect(analyzePortfolio(parseHoldingsCsv("symbol,quantity,average_cost\nABC,1,").rows)).toBeNull();
});

it("values cash, debt and physical gold without tickers or dummy quantities", () => {
 const result = analyzePortfolio([
  createHolding({assetType:"cash",currentValue:50000}),
  createHolding({assetType:"debt",name:"Bank FD",currentValue:100000}),
  createHolding({assetType:"gold",name:"Physical gold",currentValue:25000}),
 ]);
 expect(result?.totalValue).toBe(175000);
 expect(result?.stockConcentration).toBeNull();
 expect(result?.gain).toBeNull();
 expect(result?.assetMix.map(item=>item.assetType)).toEqual(["debt","cash","gold"]);
});
it("keeps stock concentration independent of cash balances and pooled funds", () => {
 const stocks = [createHolding({symbol:"A",quantity:1,averageCost:80,currentPrice:100}),createHolding({symbol:"B",quantity:1,averageCost:90,currentPrice:100})];
 const result = analyzePortfolio([...stocks,createHolding({assetType:"cash",currentValue:1000000}),createHolding({assetType:"fund",valuationMode:"value",currentValue:500000})])!;
 expect(result.totalValue).toBe(1500200);
 expect(result.stockConcentration?.topWeight).toBe(.5);
 expect(result.stockConcentration?.effectiveHoldings).toBe(2);
 expect(result.stockConcentration?.weighted.map(row=>row.symbol)).toEqual(["A","B"]);
 expect(result.weighted[0].assetType).toBe("cash");
});
it("does not fabricate a gain when an asset's original investment is unknown", () => {
 const debt = createHolding({assetType:"debt",currentValue:1100});
 expect(analyzePortfolio([debt])?.gain).toBeNull();
 expect(analyzePortfolio([{...debt,investedValue:1000}])?.gain).toBe(100);
 expect(analyzePortfolio([createHolding({assetType:"cash",currentValue:1000})])?.gain).toBe(0);
});
it("validates entered balances and does not treat legacy unit prices as current values", () => {
 expect(analyzePortfolio([createHolding({assetType:"cash",quantity:1,currentPrice:100})])).toBeNull();
 for (const currentValue of [-1,0,NaN,Infinity]) expect(validateHoldings([createHolding({assetType:"cash",currentValue})])[0].field).toBe("currentValue");
});
it("imports a mixed asset CSV without requiring unit fields on balance rows", () => {
 const imported = parseHoldingsCsv("asset_type,label,symbol,quantity,average_cost,current_price,current_value,invested_value\nstock,,ABC,2,80,100,,\ncash,Savings,,,,,50000,\ndebt,Bank FD,,,,,11000,10000\nfund,My mutual fund,,,,,30000,25000");
 expect(imported.issues).toEqual([]);
 expect(analyzePortfolio(imported.rows)?.totalValue).toBe(91200);
 expect(imported.rows[3].valuationMode).toBe("value");
 expect(parseHoldingsCsv("asset_type,label,current_value\ncash,Savings,50000").issues).toEqual([]);
});
