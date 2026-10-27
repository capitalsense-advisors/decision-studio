import { describe, expect, it } from "vitest";

import { futurePlan } from "@/lib/calculations";

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
    expect(result.totalContributed).toBe(1_800_000);
  });
});
