// @vitest-environment jsdom

import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import FutureMePage from "@/app/tools/page";

describe("Future Me journey", () => {
  it("turns a goal choice and tactile controls into a live decision", async () => {
    const user = userEvent.setup();
    render(<FutureMePage />);

    expect(screen.getByRole("heading", { name: "Make tomorrow feel touchable." })).toBeTruthy();
    await user.click(screen.getByRole("button", { name: /A place of my own/ }));

    expect(screen.getByRole("button", { name: /A place of my own/ }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByRole("heading", { name: /current plan reaches about 95%/ })).toBeTruthy();

    const monthly = screen.getByRole("slider", { name: /Monthly rhythm/ });
    fireEvent.change(monthly, { target: { value: "27000" } });
    expect(screen.getByRole("heading", { name: /current rhythm can reach/ })).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "Yes, 3–6 months" }));
    expect(screen.getByRole("heading", { name: "Your foundation is in place." })).toBeTruthy();
  });
});
