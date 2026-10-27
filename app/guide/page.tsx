import type { Metadata } from "next";
import { PageHeading } from "@/components/ui";

export const metadata: Metadata = { title: "Guide" };

const cards = [
  ["Decision tools", "Goal planning, DCF valuation, capital-gains estimates, trade sizing and one-input money guides.", "Use when you have one specific decision and can inspect the assumptions."],
  ["Holdings", "Manual entry or CSV import, concentration review and a confirmed portfolio snapshot.", "Analysis starts only after you confirm the editable table."],
  ["Portfolio risk", "Historical price returns, volatility, drawdown and multiple Value-at-Risk views.", "Risk models describe history; they do not predict the next crisis."],
  ["Mutual funds", "AMFI scheme search, NAV history, trailing returns and risk-adjusted measures.", "Compare against the fund category and a suitable benchmark."],
  ["Private by default", "Calculator and holdings state remains in the current browser session.", "Only server-backed market lookups receive symbols or public scheme identifiers."],
  ["Deterministic first", "The numbers come from versioned formulas, not an AI-generated answer.", "AI explanations, when configured, can explain results but cannot change them."],
];

export default function GuidePage(){return <div className="page-stack"><PageHeading kicker="Product guide" title={<>Know what each<br/><span>workspace can prove.</span></>} copy="Decision Studio is educational decision support for self-directed investors. Its job is to make assumptions visible—not to manufacture certainty."/><section><div className="tool-grid">{cards.map(([title,copy,note],index)=><article className="tool-card" key={title} style={{padding:"1.4rem"}}><span className="eyebrow">0{index+1}</span><h2 style={{fontFamily:"Georgia,serif",fontWeight:500}}>{title}</h2><p style={{color:"var(--muted)",lineHeight:1.55}}>{copy}</p><p><strong>Remember:</strong> {note}</p></article>)}</div></section><section className="notice"><strong>Garbage in, garbage out.</strong> Confirm uploaded data, expand assumptions, and compare at least one conservative scenario before relying on a result.</section></div>}
