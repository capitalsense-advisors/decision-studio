import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Deep Dive",
  description: "Estimate portfolio downside from transparent, equal-weight return history.",
};

export default function RiskLayout({ children }: Readonly<{ children: ReactNode }>) {
  return children;
}
