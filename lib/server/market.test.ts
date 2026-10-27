import { describe, expect, it } from "vitest";

import { normalizeYahooChart, parseMarket, parseSymbols, yahooTicker } from "@/lib/server/market";

describe("market validation and normalization", () => {
  it("validates market names and symbol lists", () => {
    expect(parseMarket("india")).toBe("india");
    expect(parseMarket("uk")).toBeNull();
    expect(parseSymbols(" reliance, TCS,RELIANCE,bad symbol ")).toEqual({
      symbols: ["RELIANCE", "TCS"],
      invalid: ["BAD SYMBOL"],
    });
  });

  it("does not append an exchange suffix twice", () => {
    expect(yahooTicker("RELIANCE", "india")).toBe("RELIANCE.NS");
    expect(yahooTicker("RELIANCE.NS", "india")).toBe("RELIANCE.NS");
    expect(yahooTicker("AAPL", "us")).toBe("AAPL");
  });

  it("keeps only valid positive price points", () => {
    expect(normalizeYahooChart({
      chart: {
        result: [{
          timestamp: [1_700_000_000, 1_700_086_400, 1_700_172_800],
          indicators: { quote: [{ close: [100, null, 102] }] },
        }],
      },
    })).toEqual([
      { date: "2023-11-14", value: 100 },
      { date: "2023-11-16", value: 102 },
    ]);
  });
});

