import Link from "next/link";
import type { Metadata } from "next";

import { MotionReady } from "@/components/motion-ready";

export const metadata: Metadata = {
  title: "Know your money. Make your move.",
};

const paths = [
  {
    number: "I",
    name: "Future Me",
    prompt: "Can I afford the life I’m planning?",
    copy: "Turn a home, freedom fund or first crore into a plan you can actually follow.",
    href: "/tools",
    action: "Meet your future",
    className: "future",
  },
  {
    number: "II",
    name: "Money Mirror",
    prompt: "What is my portfolio really saying?",
    copy: "See concentration, hidden overlap and risk without getting buried beneath ratios.",
    href: "/portfolio",
    action: "See the full picture",
    className: "mirror",
  },
  {
    number: "III",
    name: "Fund Match",
    prompt: "Does this fund fit me, or does it only look good?",
    copy: "Compare fit, cost and consistency before a recent return becomes an expensive decision.",
    href: "/mutual-funds",
    action: "Find your fit",
    className: "match",
  },
  {
    number: "IV",
    name: "Basket Stories",
    prompt: "What am I really buying into?",
    copy: "See the thesis, concentration and trade-offs inside a research-led basket before opening it on Smallcase.",
    href: "/smallcases",
    action: "Read the portfolios",
    className: "research",
  },
];

export default function HomePage() {
  return (
    <div className="home-page">
      <MotionReady />

      <section className="atelier-hero" aria-labelledby="hero-title">
        <div className="hero-halo halo-one" aria-hidden="true" />
        <div className="hero-halo halo-two" aria-hidden="true" />
        <div className="atelier-copy">
          <span className="eyebrow">A new language for your money</span>
          <h1 id="hero-title">Know your money.<br /><em>Make your move.</em></h1>
          <p className="hero-lede">Money decisions get hard when every app adds another metric. Paisaan shows what matters, why it matters, and what you can do next.</p>
          <div className="hero-actions">
            <Link className="button button-luminous" href="#choose">Find my starting point <span aria-hidden="true">↘</span></Link>
            <Link className="text-link" href="/guide">See how we think <span aria-hidden="true">→</span></Link>
          </div>
        </div>
        <div className="hero-stage" aria-label="Example financial plan">
          <div className="stage-card stage-card-back" aria-hidden="true"><span>What if?</span></div>
          <div className="stage-card stage-card-main">
            <header><span>Future Me</span><i aria-hidden="true" /></header>
            <p>Your freedom fund</p>
            <strong>72<small>%</small></strong>
            <div className="progress-track" aria-hidden="true"><i /></div>
            <div className="stage-insight"><span>One useful move</span><b>₹6,200 more each month</b></div>
          </div>
          <p className="stage-caption"><span>01</span> One answer at a time</p>
        </div>
        <div className="scroll-cue" aria-hidden="true"><i /><span>Scroll to explore</span></div>
      </section>

      <section className="promise-strip reveal" aria-label="Product principles">
        <span>Plain language</span><i>✦</i><span>Clear assumptions</span><i>✦</i><span>No sales pressure</span>
      </section>

      <section className="choice-section" id="choose">
        <div className="section-intro reveal">
          <span className="eyebrow">Four decisions · one calm system</span>
          <h2>Start with the question<br /><em>already on your mind.</em></h2>
          <p>Choose the question that brought you here. Each workspace follows the same rhythm: a clear read, visible evidence, an honest risk check and a useful next move.</p>
        </div>
        <div className="decision-cards">
          {paths.map((path, index) => (
            <Link
              className={`decision-card ${path.className} reveal`}
              href={path.href}
              key={path.name}
              style={{ "--delay": `${index * 110}ms` } as React.CSSProperties}
            >
              <div className="card-index"><span>{path.number}</span><i /></div>
              <div className="card-glyph" aria-hidden="true"><i /><i /><i /></div>
              <div className="card-copy">
                <span>{path.name}</span>
                <h3>{path.prompt}</h3>
                <p>{path.copy}</p>
              </div>
              <b>{path.action}<span aria-hidden="true">↗</span></b>
            </Link>
          ))}
        </div>
      </section>

      <section className="story-section">
        <div className="story-heading reveal">
          <span className="eyebrow">A clear order of thinking</span>
          <h2>Get the answer first. <em>Check the maths when you need it.</em></h2>
          <p>Each workspace follows the same order: conclusion, trade-off, evidence, and next step. You can open the detailed maths whenever you want to verify the result.</p>
        </div>
        <div className="story-stack">
          <article className="story-card reveal">
            <div className="story-number">01</div>
            <div><span>THE READ</span><h3>One honest conclusion.</h3><p>“You are close, but your plan relies on an aggressive return.” Human language before financial language.</p></div>
            <div className="mini-result"><small>Your readiness</small><strong>72%</strong><i><b /></i></div>
          </article>
          <article className="story-card reveal">
            <div className="story-number">02</div>
            <div><span>WHAT IF?</span><h3>Touch the possibilities.</h3><p>Change one assumption and feel the plan respond. The effect is immediate, visual and reversible.</p></div>
            <div className="mini-slider"><small>Monthly investment</small><strong>₹18,200</strong><i><b /></i><em>+ ₹6,200</em></div>
          </article>
          <article className="story-card reveal">
            <div className="story-number">03</div>
            <div><span>YOUR MOVE</span><h3>Leave with a next step.</h3><p>Every journey ends with two or three concrete choices. You do not need another dashboard to decode.</p></div>
            <div className="mini-actions"><span>Raise my SIP <b>↗</b></span><span>Give it 18 months <b>→</b></span></div>
          </article>
        </div>
      </section>

      <section className="manifesto reveal">
        <div className="manifesto-seal" aria-hidden="true"><span>P</span></div>
        <p>“The interface should disappear.<br />The decision should remain.”</p>
        <span>Paisaan design principle · MMXXVI</span>
      </section>

      <section className="closing-section reveal">
        <span className="eyebrow">Your money, in focus</span>
        <h2>Less noise.<br /><em>More knowing.</em></h2>
        <p>Choose the question that matters today. Paisaan will keep the rest out of your way.</p>
        <Link className="button button-luminous" href="#choose">Choose my starting point <span aria-hidden="true">↑</span></Link>
      </section>
    </div>
  );
}
