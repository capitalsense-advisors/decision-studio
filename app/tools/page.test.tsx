// @vitest-environment jsdom

import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import FutureMePage from "@/app/tools/page";

describe("Future Me journey", () => {
  it("turns a goal choice and tactile controls into a live decision", async () => {
    const user = userEvent.setup();
    const { container } = render(<FutureMePage />);

    expect(screen.getByRole("heading", { name: "Make tomorrow feel touchable." })).toBeTruthy();
    expect(screen.getByRole("img", { name: /Line chart comparing the expected projection/ })).toBeTruthy();
    const initialPath = container.querySelector(".chart-line.expected")?.getAttribute("d");
    expect((screen.getByRole("radio", { name: "Yes, 3–6 months" }) as HTMLInputElement).checked).toBe(false);
    expect((screen.getByRole("radio", { name: "Still building it" }) as HTMLInputElement).checked).toBe(false);
    await user.click(screen.getByRole("button", { name: /A place of my own/ }));

    expect(screen.getByRole("button", { name: /A place of my own/ }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByRole("heading", { name: /current plan reaches about 94%/ })).toBeTruthy();

    const monthly = screen.getByRole("slider", { name: /Monthly rhythm/ });
    fireEvent.change(monthly, { target: { value: "27000" } });
    expect(screen.getByRole("heading", { name: /base case reaches/ })).toBeTruthy();
    expect(container.querySelector(".chart-line.expected")?.getAttribute("d")).not.toBe(initialPath);

    await user.click(screen.getByRole("radio", { name: "Yes, 3–6 months" }));
    expect(screen.getByRole("heading", { name: "Your foundation is in place." })).toBeTruthy();
  });
});
