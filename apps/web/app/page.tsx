import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Overview" };

const journeys = [
  ["01", "Make a money decision", "Plan a goal, value a stock, estimate tax or size a trade.", "/tools"],
  ["02", "Understand your holdings", "Add a portfolio, check concentration and review performance.", "/portfolio"],
  ["03", "Measure downside risk", "Compare VaR methods and stress-test an equity portfolio.", "/risk"],
  ["04", "Analyse a mutual fund", "Review trailing returns, drawdown and risk-adjusted performance.", "/mutual-funds"],
  ["05", "Learn the workflow", "See what each tool needs, calculates and deliberately does not claim.", "/guide"],
];

export default function OverviewPage() {
  return <div className="page-stack">
    <section className="hero">
      <div className="hero-copy"><span className="eyebrow">CapitalSense presents</span><h1>Make the decision.<br/><span>Then follow the money.</span></h1><p>Decision Studio turns your confirmed inputs into transparent calculations for goals, valuation, tax, trades, holdings and risk. No brokerage connection. No permanent storage.</p><div className="form-actions"><Link className="button" href="/tools">Open decision tools</Link><Link className="button secondary" href="/guide">How it works</Link></div></div>
      <aside className="hero-panel"><span>The operating principle</span><strong>Pehchaan → Soch → Plan.</strong><p>Understand what you own, inspect the assumptions, and compare scenarios before acting.</p></aside>
    </section>
    <section><div className="section-heading"><div><span className="eyebrow">Your workspaces</span><h2>Start with one question.</h2></div><p>Each workspace keeps the calculation and its limitations together.</p></div><div className="journey-grid">{journeys.map(([number,title,copy,href])=><Link className="journey-card" href={href} key={href}><span>{number}</span><h3>{title}</h3><p>{copy}</p><b>Open workspace →</b></Link>)}</div></section>
    <section className="notice"><strong>Privacy by design.</strong> Holdings and calculator inputs stay in this browser session unless you explicitly use a server-backed data or AI feature. The app does not connect to a broker or execute transactions.</section>
  </div>;
}
