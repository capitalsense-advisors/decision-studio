// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import SmallcasesPage from "@/app/smallcases/page";

describe("Smallcases journey", () => {
  it("switches to Alpha's and reveals its supplied snapshot and holdings", async () => {
    const user = userEvent.setup();
    render(<SmallcasesPage />);

    const alphasTab = screen.getByRole("tab", { name: /Alpha’s/ });
    expect(alphasTab.getAttribute("aria-selected")).toBe("false");
    await user.click(alphasTab);

    expect(alphasTab.getAttribute("aria-selected")).toBe("true");
    expect(screen.getByRole("heading", { name: "Where could tomorrow’s category leaders emerge?" })).toBeTruthy();
    expect(screen.getByText("₹5,07,541", { exact: true })).toBeTruthy();
    expect(screen.getByText("Aegis Vopak Terminals Ltd", { exact: true })).toBeTruthy();
    expect(screen.getByText("Zerodha Gold ETF", { exact: true })).toBeTruthy();
    expect(screen.getByRole("link", { name: /Open on smallcase/ }).getAttribute("href")).toBe("https://smlc.se/WFt3j");
  });
});
