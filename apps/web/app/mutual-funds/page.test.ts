import { describe, expect, it } from "vitest";

import { isDirectGrowth } from "@/app/mutual-funds/page";

describe("Fund Match plan filtering", () => {
  it("keeps Direct Growth plans and excludes Regular or IDCW variants", () => {
    expect(isDirectGrowth({ schemeCode: 1, schemeName: "Example Fund Direct Plan Growth" })).toBe(true);
    expect(isDirectGrowth({ schemeCode: 2, schemeName: "Example Fund Regular Plan Growth" })).toBe(false);
    expect(isDirectGrowth({ schemeCode: 3, schemeName: "Example Fund Direct Plan IDCW" })).toBe(false);
  });
});
