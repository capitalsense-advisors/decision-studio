// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import RiskPage from "@/app/risk/page";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("Deep Dive risk journey", () => {
  it("rejects an out-of-range holding period before requesting data", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    render(<RiskPage />);

    fireEvent.change(screen.getByRole("spinbutton", { name: /Holding period/ }), { target: { value: "0" } });
    await user.click(screen.getByRole("button", { name: "Calculate VaR" }));

    expect(screen.getByRole("alert").textContent).toContain("1 to 30 days");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("discloses symbols omitted from an otherwise valid calculation", async () => {
    const points = Array.from({ length: 60 }, (_, index) => ({
      date: new Date(Date.UTC(2026, 0, index + 1)).toISOString().slice(0, 10),
      value: 100 + index,
    }));
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({
      series: { RELIANCE: points, TCS: points.map((point) => ({ ...point, value: point.value * 2 })) },
      failures: ["INFY"],
    }), { status: 200, headers: { "Content-Type": "application/json" } })));
    const user = userEvent.setup();
    render(<RiskPage />);

    await user.click(screen.getByRole("button", { name: "Calculate VaR" }));

    expect(await screen.findByRole("heading", { name: "Parametric VaR" })).toBeTruthy();
    expect(screen.getByRole("status").textContent).toContain("INFY");
    expect(screen.getByText(/59 aligned returns/)).toBeTruthy();
  });
});
