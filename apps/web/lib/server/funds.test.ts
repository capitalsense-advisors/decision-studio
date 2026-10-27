import { describe, expect, it } from "vitest";

import { normalizeFundDetail, normalizeFundSearch } from "@/lib/server/funds";

describe("fund normalization", () => {
  it("deduplicates schemes and drops malformed records", () => {
    expect(normalizeFundSearch([
      { schemeCode: 100, schemeName: " First Fund " },
      { schemeCode: "100", schemeName: "First Fund Updated" },
      { schemeCode: 0, schemeName: "Invalid" },
      { schemeCode: 200, schemeName: "Second Fund" },
      null,
    ])).toEqual([
      { schemeCode: 100, schemeName: "First Fund Updated" },
      { schemeCode: 200, schemeName: "Second Fund" },
    ]);
  });

  it("normalizes, sorts, and deduplicates NAV history", () => {
    expect(normalizeFundDetail({
      meta: { scheme_name: "Example", nested: { ignored: true } },
      data: [
        { date: "02-01-2026", nav: "12.5" },
        { date: "01-01-2026", nav: "11" },
        { date: "02-01-2026", nav: "13" },
        { date: "bad", nav: "14" },
        { date: "03-01-2026", nav: "NaN" },
      ],
    })).toEqual({
      meta: { scheme_name: "Example" },
      points: [
        { date: "2026-01-01", value: 11 },
        { date: "2026-01-02", value: 13 },
      ],
    });
  });
});
