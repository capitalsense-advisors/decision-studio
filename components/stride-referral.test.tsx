// @vitest-environment jsdom
import {cleanup,render,screen} from "@testing-library/react";
import {afterEach,expect,it} from "vitest";
import {StrideReferral,STRIDE_URL} from "./stride-referral";
afterEach(cleanup);
it("offers an optional, disclosed free referral without transferring financial context",()=>{
 render(<StrideReferral/>);
 const link=screen.getByRole("link",{name:/Explore Stride for free/});
 expect(link.getAttribute("href")).toBe("https://shubham404-error.github.io/CapitalSense-portfolio-/stride/");
 expect(new URL(STRIDE_URL).search).toBe("");
 expect(link.getAttribute("target")).toBe("_blank");
 expect(link.getAttribute("rel")).toContain("noopener");
 expect(link.getAttribute("referrerpolicy")).toBe("no-referrer");
 expect(screen.getByText(/social and investing demos are labelled/)).toBeTruthy();
 expect(screen.getByText(/financial details are not passed/)).toBeTruthy();
});
