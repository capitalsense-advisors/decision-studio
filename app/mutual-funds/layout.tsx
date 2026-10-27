import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Fund Match",
  description: "Inspect Direct Growth mutual-fund returns, volatility, and drawdown together.",
};

export default function MutualFundsLayout({ children }: Readonly<{ children: ReactNode }>) {
  return children;
}
