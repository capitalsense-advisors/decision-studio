import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Smallcases",
  description: "Explore three CapitalSense smallcase strategies through their investment question, allocation, holdings, and risks.",
};

export default function SmallcasesLayout({ children }: Readonly<{ children: ReactNode }>) {
  return children;
}
