import type { Metadata } from "next";
import { PageHeading } from "@/components/ui";

export const metadata: Metadata = { title: "Guide" };

const cards = [
  ["Future Me", "Turn a life goal into a contribution plan, then test it with a more conservative return.", "Use it to test feasibility. One forecast is never a promise."],
  ["Money Mirror", "Confirm holdings, inspect concentration, and reveal advanced risk only when the portfolio needs a deeper look.", "Analysis starts after you verify the editable portfolio snapshot."],
  ["Fund Match", "Read return, consistency and downside evidence before deciding whether a fund fits your actual goal.", "A strong recent return is not the same thing as suitability."],
  ["Basket Stories", "Understand a basket’s thesis, allocation and shared risks before continuing to the official Smallcase page.", "The story explains construction; the live factsheet remains the source of truth."],
  ["Private by default", "Calculator and holdings state remains in the current browser session.", "Only server-backed market lookups receive symbols or public scheme identifiers."],
  ["Deterministic first", "The numbers come from versioned formulas, not an AI-generated answer.", "AI explanations, when configured, can explain results but cannot change them."],
];

export default function GuidePage(){return <div className="page-stack"><PageHeading kicker="How Paisaan works" title={<>One rhythm across<br/><span>every decision.</span></>} copy="Start with a question. Read the conclusion. Inspect the evidence. Test the weak assumption. Leave with a next move. Paisaan supports your decision, but it does not manufacture certainty."/><section><div className="tool-grid">{cards.map(([title,copy,note],index)=><article className="tool-card" key={title} style={{padding:"1.4rem"}}><span className="eyebrow">0{index+1}</span><h2>{title}</h2><p style={{color:"var(--muted)",lineHeight:1.55}}>{copy}</p><p><strong>Remember:</strong> {note}</p></article>)}</div></section><section className="notice"><strong>Verify before you trust.</strong> Confirm uploaded data, check the source date, expand assumptions, and compare at least one conservative scenario before relying on a result.</section></div>}
