import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Future Me",
  description: "Turn a future goal into a clear, adjustable monthly plan.",
};

export default function ToolsLayout({ children }: Readonly<{ children: ReactNode }>) {
  return children;
}
