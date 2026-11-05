import type { Metadata } from "next";

import { GuideExperience } from "../guide/guide-experience";

export const metadata: Metadata = {
  title: "Learn with Paisaan",
  description: "Follow your curiosity, ask a money question, and connect each idea to your Paisaan plan.",
};

export default function LearnPage() {
  return <GuideExperience />;
}
