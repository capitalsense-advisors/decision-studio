import { describe, expect, it } from "vitest";

import { getFundCatalogPeers, getFundSuggestions, normalizeCatalogName } from "@/lib/server/fund-catalog";

describe("fund catalog", () => {
  it("normalizes plan labels away from the base fund name", () => {
    expect(normalizeCatalogName("Parag Parikh Flexi Cap Fund - Direct Plan - Growth"))
      .toBe("parag parikh flexi cap fund");
  });

  it("returns same-category peers from the supplied catalog", () => {
    const result = getFundCatalogPeers("Parag Parikh Flexi Cap Fund - Direct Plan - Growth");

    expect(result.selected?.category).toBe("Flexi Cap Fund");
    expect(result.peers.length).toBeGreaterThan(5);
    expect(result.peers.every((peer) => peer.category === "Flexi Cap Fund")).toBe(true);
  });

  it("returns an empty peer set when the fund cannot be matched", () => {
    expect(getFundCatalogPeers("Definitely Not A Real Fund").peers).toEqual([]);
  });

  it("recommends likely funds despite spelling mistakes", () => {
    const suggestions = getFundSuggestions("parg parik flex cap");

    expect(suggestions[0]?.name).toContain("Parag Parikh Flexi Cap Fund");
    expect(suggestions[0]?.category).toBe("Flexi Cap Fund");
  });

  it("includes funds from the appended catalog", () => {
    expect(getFundSuggestions("WOC Special Opp")[0]?.name).toBe("WOC Special Opp Fund");
  });
});
