// @vitest-environment jsdom

import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import PortfolioPage from "@/app/portfolio/page";

afterEach(() => {
  cleanup();
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
    expect(screen.getByRole("heading", { name: /small number of positions dominates your stock slice/ })).toBeTruthy();
    expect(screen.getByText("Reality Check", { exact: true })).toBeTruthy();
  });
});

it("blocks reveal when even one holding remains unpriced", async () => {
 const user = userEvent.setup();
 vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({series:{RELIANCE:[{date:"2026-11-01",value:3000}]}, failures:["TCS","INFY","HDFCBANK"]})));
 render(<PortfolioPage />);
 await user.click(screen.getByRole("button", {name:/Try a sample/}));
 await user.click(screen.getByRole("button", {name:"Check Yahoo prices"}));
 await waitFor(()=>expect(screen.getByRole("button", {name:"Reveal my mirror"}).hasAttribute("disabled")).toBe(true));
});

it("adapts cash entry to a balance and reveals allocation without a price request", async () => {
 const user = userEvent.setup(); const fetchMock = vi.fn(); vi.stubGlobal("fetch",fetchMock);
 render(<PortfolioPage />);
 await user.click(screen.getByRole("button",{name:/Add them one by one/}));
 await user.selectOptions(screen.getByRole("combobox",{name:"Asset type holding 1"}),"cash");
 expect(screen.queryByRole("spinbutton",{name:/Quantity/})).toBeNull();
 expect(screen.queryByRole("textbox",{name:/Symbol holding/})).toBeNull();
 expect(screen.queryByRole("spinbutton",{name:/Average cost/})).toBeNull();
 expect(screen.getByRole("button",{name:"Check Yahoo prices"}).hasAttribute("disabled")).toBe(true);
 await user.type(screen.getByRole("spinbutton",{name:"Cash balance holding 1"}),"50000");
 await user.click(screen.getByRole("button",{name:"Reveal my mirror"}));
 expect(screen.getByRole("heading",{name:"Cash makes up 100.0% of this snapshot."})).toBeTruthy();
 expect(screen.getByText(/No individual stocks entered/)).toBeTruthy();
 expect(fetchMock).not.toHaveBeenCalled();
});
it("keeps FD and gold values out of Yahoo requests and clears stale values on type changes", async () => {
 const user = userEvent.setup();
 const fetchMock = vi.fn().mockResolvedValue(Response.json({series:{ABC:[{date:"2026-11-03",value:100}]},failures:[]}));
 vi.stubGlobal("fetch",fetchMock); render(<PortfolioPage />);
 await user.click(screen.getByRole("button",{name:/Add them one by one/}));
 await user.type(screen.getByRole("textbox",{name:"Symbol holding 1"}),"ABC");
 await user.type(screen.getByRole("spinbutton",{name:"Quantity ABC"}),"2");
 await user.type(screen.getByRole("spinbutton",{name:"Average cost ABC"}),"80");
 await user.click(screen.getByRole("button",{name:/Add holding/}));
 await user.selectOptions(screen.getByRole("combobox",{name:"Asset type holding 2"}),"debt");
 await user.type(screen.getByRole("textbox",{name:"Label holding 2"}),"My FD");
 await user.type(screen.getByRole("spinbutton",{name:"Current value holding 2"}),"11000");
 await user.click(screen.getByRole("button",{name:/Add holding/}));
 await user.selectOptions(screen.getByRole("combobox",{name:"Asset type holding 3"}),"gold");
 await user.type(screen.getByRole("spinbutton",{name:"Current value holding 3"}),"25000");
 await user.click(screen.getByRole("button",{name:"Check Yahoo prices"}));
 await waitFor(()=>expect(screen.getByRole("button",{name:"Reveal my mirror"}).hasAttribute("disabled")).toBe(false));
 expect(fetchMock).toHaveBeenCalledWith("/api/market/history?market=india&symbols=ABC");
 expect((screen.getByRole("spinbutton",{name:"Current value holding 2"}) as HTMLInputElement).value).toBe("11000");
 await user.selectOptions(screen.getByRole("combobox",{name:"Asset type holding 3"}),"cash");
 expect((screen.getByRole("spinbutton",{name:"Cash balance holding 3"}) as HTMLInputElement).value).toBe("");
 expect(screen.getByRole("button",{name:"Reveal my mirror"}).hasAttribute("disabled")).toBe(true);
});
it("allows a mutual fund statement value without an exchange symbol", async () => {
 const user = userEvent.setup(); render(<PortfolioPage />);
 await user.click(screen.getByRole("button",{name:/Add them one by one/}));
 await user.selectOptions(screen.getByRole("combobox",{name:"Asset type holding 1"}),"fund");
 await user.selectOptions(screen.getByRole("combobox",{name:"Valuation method holding 1"}),"value");
 await user.type(screen.getByRole("spinbutton",{name:"Current value holding 1"}),"30000");
 await user.click(screen.getByRole("button",{name:"Reveal my mirror"}));
 expect(screen.getByText(/Amount invested is missing/)).toBeTruthy();
 expect(screen.getByRole("button",{name:"Check Yahoo prices"}).hasAttribute("disabled")).toBe(true);
});
