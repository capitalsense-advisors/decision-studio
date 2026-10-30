import { describe, expect, it } from "vitest";

import { benchmarkForCategory, evaluateFundFit, isDirectGrowth } from "@/app/mutual-funds/page";

describe("Fund Match plan filtering", () => {
  it("keeps Direct Growth plans and excludes Regular or IDCW variants", () => {
    expect(isDirectGrowth({ schemeCode: 1, schemeName: "Example Fund Direct Plan Growth" })).toBe(true);
    expect(isDirectGrowth({ schemeCode: 2, schemeName: "Example Fund Regular Plan Growth" })).toBe(false);
    expect(isDirectGrowth({ schemeCode: 3, schemeName: "Example Fund Direct Plan IDCW" })).toBe(false);
  });
});

describe("Fund Match benchmark proxies", () => {
  it("uses category-specific equity proxies and avoids inventing a debt benchmark", () => {
    expect(benchmarkForCategory("Equity Scheme - Mid Cap Fund")?.ticker).toBe("^NSEMDCP50");
    expect(benchmarkForCategory("Equity Scheme - Small Cap Fund")?.ticker).toBe("HDFCSML250.NS");
    expect(benchmarkForCategory("Debt Scheme - Corporate Bond Fund")).toBeNull();
  });
});

describe("Fund Match decision framing", () => {
  it("flags an equity fund when the money is needed soon", () => {
    const result = evaluateFundFit({
      category: "Equity Scheme - Flexi Cap Fund",
      observations: 2_000,
      maxDrawdown: -0.22,
      brief: { goal: "soon", horizonYears: 2, dropComfort: "medium" },
    });

    expect(result.status).toBe("mismatch");
    expect(result.timeMismatch).toBe(true);
  });

  it("treats a long timeline as a first-pass filter, not a recommendation", () => {
    const result = evaluateFundFit({
      category: "Equity Scheme - Flexi Cap Fund",
      observations: 2_000,
      maxDrawdown: -0.18,
      brief: { goal: "wealth", horizonYears: 8, dropComfort: "medium" },
    });

    expect(result.status).toBe("possible");
    expect(result.title).toContain("closer look");
  });

  it("surfaces limited history and concentrated categories as cautions", () => {
    const result = evaluateFundFit({
      category: "Equity Scheme - Sectoral Fund",
      observations: 500,
      maxDrawdown: -0.18,
      brief: { goal: "wealth", horizonYears: 8, dropComfort: "medium" },
    });

    expect(result.status).toBe("caution");
    expect(result.shortHistory).toBe(true);
    expect(result.concentrated).toBe(true);
  });
});
