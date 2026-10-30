import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Fund Match",
  description: "Test whether a Direct Growth mutual fund fits your goal, timeline, and comfort with market falls.",
};

export default function MutualFundsLayout({ children }: Readonly<{ children: ReactNode }>) {
  return children;
}
