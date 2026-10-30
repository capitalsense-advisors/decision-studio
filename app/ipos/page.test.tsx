import { describe, expect, it } from "vitest";
import { evaluateIpo, optimiseMainboardApplications } from "@/app/ipos/page";

const base = {
  price: 125, lotSize: 120, freshIssueShare: 60, ipoPe: 20, peerPe: 25,
  roe: 18, debtEquity: .4, patMargin: 12, qib: 5, retail: 3, snii: 5, bnii: 4,
  total: 4, gmp: 5, capital: 500000, applicants: 2, debtUse: 40, growthUse: 35, riskCount: 0,
};

describe("IPO Lens", () => {
  it("keeps quality and demand as separate signals", () => {
    const weakBusinessWithDemand = evaluateIpo({ ...base,
      price: 100, lotSize: 100, freshIssueShare: 20, ipoPe: 70, peerPe: 25,
      roe: 4, debtEquity: 2.5, patMargin: 2, qib: 100, retail: 50, total: 100, gmp: 60,
    });
    expect(weakBusinessWithDemand.demand).toBeGreaterThan(80);
    expect(weakBusinessWithDemand.longTerm).toBeLessThan(40);
  });

  it("calculates the minimum application from price and lot size", () => {
    const result = evaluateIpo(base);
    expect(result.lotCost).toBe(15_000);
    expect(result.retailAllotmentProxy).toBeCloseTo(1 / 3, 5);
  });

  it("keeps mainboard category minimums and capital constraints explicit", () => {
    const strategy = optimiseMainboardApplications(base);
    expect(strategy?.usedCapital).toBeLessThanOrEqual(base.capital);
    expect(strategy?.usedApplicants).toBeLessThanOrEqual(base.applicants);
    expect(strategy?.plans.find((plan) => plan.key === "snii")?.minimum).toBeGreaterThan(200000);
  });
});
