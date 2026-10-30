import type { Metadata } from "next";

import { GuideExperience } from "./guide-experience";

export const metadata: Metadata = {
  title: "Ask Paisaan",
  description: "Ask a money question and find the right Paisaan workspace in a few messages.",
};

export default function GuidePage() {
  return <GuideExperience />;
}
