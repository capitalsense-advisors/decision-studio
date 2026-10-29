import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Baskets",
  description: "Explore three CapitalSense baskets through their investment question, allocation, holdings, and risks.",
};

export default function SmallcasesLayout({ children }: Readonly<{ children: ReactNode }>) {
  return children;
}
