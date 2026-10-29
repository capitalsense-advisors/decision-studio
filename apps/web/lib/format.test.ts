import { describe, expect, it } from "vitest";

import { money, number, percent } from "@/lib/format";

describe("display precision", () => {
  it("uses one decimal place for product metrics", () => {
    expect(percent(0.7648)).toBe("76.5%");
    expect(number(76.48)).toBe("76.5");
    expect(money(7_648_000, true)).toBe("₹76.5 L");
  });
});
