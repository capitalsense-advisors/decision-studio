import { describe, expect, it } from "vitest";

import { benchmarkComparison, equalWeightReturns, futurePlan, portfolioRisk, rollingReturnSummary } from "@/lib/calculations";

const base = {
  targetToday: 120_000,
  currentSavings: 0,
  monthlyContribution: 1_000,
  years: 10,
  annualReturn: 0,
  inflation: 0,
  annualStepUp: 0,
  inflationAdjusted: false,
};

describe("futurePlan", () => {
  it("projects a no-growth contribution plan deterministically", () => {
    const result = futurePlan(base);

    expect(result.projectedCorpus).toBeCloseTo(120_000, 5);
    expect(result.requiredMonthly).toBeCloseTo(1_000, 5);
    expect(result.shortfall).toBeCloseTo(0, 5);
    expect(result.fundingRatio).toBeCloseTo(1, 5);
    expect(result.series).toHaveLength(10);
  });

  it("inflates goals expressed in today's money", () => {
    const result = futurePlan({ ...base, targetToday: 1_000_000, inflation: 0.06, inflationAdjusted: true });

    expect(result.futureTarget).toBeCloseTo(1_790_847.7, 0);
    expect(result.requiredMonthly).toBeGreaterThan(10_000);
  });

  it("shows the contribution reduction created by existing savings", () => {
    const withoutSavings = futurePlan({ ...base, annualReturn: 0.1, targetToday: 2_000_000 });
    const withSavings = futurePlan({ ...base, annualReturn: 0.1, targetToday: 2_000_000, currentSavings: 500_000 });

    expect(withSavings.requiredMonthly).toBeLessThan(withoutSavings.requiredMonthly);
    expect(withSavings.growthEarned).toBeGreaterThan(0);
  });

  it("returns a conservative scenario below the baseline when returns are positive", () => {
    const result = futurePlan({ ...base, annualReturn: 0.1, monthlyContribution: 15_000 });

    expect(result.conservativeCorpus).toBeLessThan(result.projectedCorpus);
    expect(result.conservativeRequiredMonthly).toBeGreaterThan(result.requiredMonthly);
    expect(result.conservativeSeries).toHaveLength(10);
    expect(result.totalContributed).toBe(1_800_000);
  });
});

describe("portfolio risk inputs", () => {
  it("builds an equal-weight return series instead of averaging raw prices", () => {
    const returns = equalWeightReturns({
      EXPENSIVE: [{ date: "2026-01-01", value: 5_000 }, { date: "2026-01-02", value: 5_000 }],
      CHEAP: [{ date: "2026-01-01", value: 100 }, { date: "2026-01-02", value: 110 }],
    });

    expect(returns).toHaveLength(1);
    expect(returns[0]).toBeCloseTo(0.05, 12);
  });

  it("annualises the realised compounded path rather than the arithmetic mean", () => {
    const result = portfolioRisk([0.1, -0.1], 0.95, 1);

    expect(result?.annualReturn).toBeCloseTo(Math.pow(0.99, 126) - 1, 10);
  });
});

describe("rolling return summary", () => {
  it("shows how one-year outcomes changed across starting dates", () => {
    const points = Array.from({ length: 731 }, (_, day) => ({
      date: new Date(Date.UTC(2024, 0, 1 + day)).toISOString().slice(0, 10),
      value: day < 365 ? 100 + day * .1 : 136.5 - (day - 365) * .05,
    }));
    const result = rollingReturnSummary(points);

    expect(result?.observations).toBeGreaterThan(300);
    expect(result?.median).not.toBeNull();
    expect(result?.worst).toBeLessThan(result?.median ?? 0);
    expect(result?.positiveShare).toBeGreaterThanOrEqual(0);
    expect(result?.positiveShare).toBeLessThanOrEqual(1);
  });
});

describe("benchmark comparison", () => {
  it("calculates active return from aligned dates", () => {
    const fund = Array.from({ length: 366 }, (_, day) => ({
      date: new Date(Date.UTC(2025, 0, 1 + day)).toISOString().slice(0, 10), value: 100 * Math.pow(1.12, day / 365),
    }));
    const benchmark = Array.from({ length: 366 }, (_, day) => ({
      date: new Date(Date.UTC(2025, 0, 1 + day)).toISOString().slice(0, 10), value: 100 * Math.pow(1.08, day / 365),
    }));
    const result = benchmarkComparison(fund, benchmark);

    expect(result?.fundAnnualReturn).toBeCloseTo(.12, 3);
    expect(result?.benchmarkAnnualReturn).toBeCloseTo(.08, 3);
    expect(result?.activeAnnualReturn).toBeCloseTo(.04, 3);
  });
});
