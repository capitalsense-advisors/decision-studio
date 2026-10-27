import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = { title: "Money Mirror", description: "Review holdings, verify market prices, and understand portfolio concentration." };

export default function PortfolioLayout({ children }: Readonly<{ children: ReactNode }>) { return children; }
