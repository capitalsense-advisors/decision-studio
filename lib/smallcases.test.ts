import { describe, expect, it } from "vitest";

import { smallcaseStrategies, strategyHoldings, strategyTotalWeight } from "@/lib/smallcases";

describe("smallcase strategy data", () => {
  it("keeps every strategy fully allocated and every theme internally consistent", () => {
    expect(smallcaseStrategies).toHaveLength(3);

    for (const strategy of smallcaseStrategies) {
      expect(strategyTotalWeight(strategy)).toBeCloseTo(100, 8);
      for (const theme of strategy.themes) {
        const holdingsWeight = theme.holdings.reduce((total, holding) => total + holding.weight, 0);
        expect(holdingsWeight).toBeCloseTo(theme.weight, 8);
      }
    }
  });

  it("preserves the supplied Alpha's basket details", () => {
    const strategy = smallcaseStrategies.find((item) => item.id === "alphas-of-the-pack");
    expect(strategy?.smallcaseUrl).toBe("https://smlc.se/WFt3j");
    expect(strategy?.snapshot?.basketAmount).toBe(507540.89);
    expect(strategy?.snapshot?.periodReturn).toBe(-7.84);
    expect(strategy && strategyHoldings(strategy)).toHaveLength(30);
  });
});
