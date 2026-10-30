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
    expect(screen.getByText("Set four numbers.")).toBeTruthy();
    expect(screen.getByRole("img", { name: /Projection chart comparing expected, safer, and target paths/ })).toBeTruthy();
    expect((screen.getByRole("radio", { name: "Yes, 3 to 6 months" }) as HTMLInputElement).checked).toBe(false);
    expect((screen.getByRole("radio", { name: "Not yet" }) as HTMLInputElement).checked).toBe(false);
    await user.click(screen.getByRole("button", { name: /A place of my own/ }));

    expect(screen.getByRole("button", { name: /A place of my own/ }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByText(/current plan reaches about 94%/)).toBeTruthy();

    const monthly = screen.getByRole("slider", { name: /Invest monthly/ });
    fireEvent.change(monthly, { target: { value: "27000" } });
    expect(screen.getByText(/base case reaches/)).toBeTruthy();

    await user.click(screen.getByRole("radio", { name: "Yes, 3 to 6 months" }));
    expect((screen.getByRole("radio", { name: "Yes, 3 to 6 months" }) as HTMLInputElement).checked).toBe(true);
  });
});
