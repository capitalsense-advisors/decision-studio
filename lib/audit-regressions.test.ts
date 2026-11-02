import { describe, expect, it } from "vitest";
import { portfolioRisk, monteCarloVar, futurePlan } from "@/lib/calculations";
import { freshnessWarning } from "@/lib/freshness";
import { ipoStatusAt, snapshotIsStale } from "@/lib/ipo-snapshot";
import { money } from "@/lib/format";
import { evaluateIpo } from "@/app/ipos/page";
import { classifyFund, benchmarkForCategory, evaluateFundFit } from "@/app/mutual-funds/page";

const complete = {price:125,lotSize:120,freshIssueShare:60,ipoPe:20,peerPe:25,roe:18,debtEquity:1.5,patMargin:12,qib:5,retail:3,snii:5,bnii:4,total:4,gmp:5,capital:500000,applicants:2,debtUse:40,growthUse:35,riskCount:0};
describe("financial audit regressions", () => {
 it("does not reward missing IPO debt or invent demand", () => {
  expect(evaluateIpo(complete).quality).not.toBeNull();
  const missing = evaluateIpo({...complete,debtEquity:null,qib:null});
  expect(missing.quality).toBeNull(); expect(missing.longTerm).toBeNull(); expect(missing.demand).toBeNull();
  expect(missing.verdict).toContain("Not enough data");
  expect(evaluateIpo({...complete,peerPe:null}).valuation).toBeNull();
 });
 it("derives IPO status by Indian calendar dates and detects expiration", () => {
  const item = {status:"open" as const,openDate:"2026-11-01",closeDate:"2026-11-02",listingDate:null};
  expect(ipoStatusAt(item,new Date("2026-10-31T12:00Z"))).toBe("upcoming");
  expect(ipoStatusAt(item,new Date("2026-11-02T12:00Z"))).toBe("open");
  expect(ipoStatusAt(item,new Date("2026-11-02T19:00Z"))).toBe("closed");
  expect(snapshotIsStale({expiresAt:"2026-11-02T12:00Z"},new Date("2026-11-03T12:00Z"))).toBe(true);
 });
 it("uses consistent nearest-rank historical tails at exact confidence boundaries", () => {
  const returns=Array.from({length:100},(_,i)=>(i-50)/1000);
  const risk=portfolioRisk(returns,.9)!;
  expect(risk.tailObservations).toBe(10);
  expect(risk.historicalVar).toBeCloseTo(.041);
  expect(portfolioRisk(returns.slice(0,60),.99)?.tailObservations).toBe(1);
  expect(monteCarloVar(returns)?.varValue).toBe(monteCarloVar(returns)?.varValue);
 });
 it("classifies hybrid before equity and leaves ambiguous index categories unassigned", () => {
  expect(classifyFund("Hybrid Scheme - Equity Savings")).toBe("hybrid");
  expect(classifyFund("Debt Scheme - Gilt Index Fund")).toBe("debt");
  expect(benchmarkForCategory("Other Scheme - Index Funds")).toBeNull();
  expect(benchmarkForCategory("Equity Scheme - Large & Mid Cap Fund")).toBeNull();
  expect(benchmarkForCategory("Equity Scheme - Sectoral Fund")).toBeNull();
  expect(evaluateFundFit({category:"Equity Scheme - Large Cap Fund",observations:1000,maxDrawdown:-.14,brief:{goal:"wealth",horizonYears:8,dropComfort:"low"}}).dropMismatch).toBe(true);
 });
 it("rejects out-of-range planning assumptions instead of silently clamping", () => {
  expect(() => futurePlan({targetToday:100000,currentSavings:0,monthlyContribution:1000,years:10,annualReturn:.5,inflation:.06,annualStepUp:0,inflationAdjusted:true})).toThrow(RangeError);
 });
 it("marks old or undated data and formats US values in dollars", () => {
  expect(freshnessWarning("2026-10-01",new Date("2026-11-01"))).toContain("old");
  expect(freshnessWarning(null)).toContain("unavailable");
  expect(freshnessWarning("2026-11-01",new Date("2026-11-02"))).toBeNull();
  expect(money(1000,false,"USD")).toBe("$1,000");
 });
});
