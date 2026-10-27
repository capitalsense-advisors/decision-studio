// @vitest-environment jsdom

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import PortfolioPage from "@/app/portfolio/page";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("Money Mirror journey", () => {
  it("reviews holdings, refreshes Yahoo prices, and reveals a concentration read", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({
      market: "india",
      failures: [],
      series: {
        RELIANCE: [{ date: "2026-10-24", value: 3000 }],
        HDFCBANK: [{ date: "2026-10-24", value: 1800 }],
        INFY: [{ date: "2026-10-24", value: 1600 }],
        TCS: [{ date: "2026-10-24", value: 3500 }],
      },
    })));
    render(<PortfolioPage />);

    await user.click(screen.getByRole("button", { name: /Try a sample/ }));
    expect(screen.getByRole("heading", { name: "Make the data yours." })).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Check Yahoo prices" }));

    await waitFor(() => expect(screen.getByRole("button", { name: "Reveal my mirror" }).hasAttribute("disabled")).toBe(false));
    expect(screen.getAllByText("Yahoo · 2026-10-24", { exact: true })).toHaveLength(4);
    await user.click(screen.getByRole("button", { name: "Reveal my mirror" }));

    expect(screen.getByText("The Read", { exact: true })).toBeTruthy();
    expect(screen.getByRole("heading", { name: /doing too much of the portfolio's work/ })).toBeTruthy();
    expect(screen.getByText("Reality Check", { exact: true })).toBeTruthy();
  });
});
