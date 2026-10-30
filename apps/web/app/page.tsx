import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";

import { MotionReady } from "@/components/motion-ready";
import styles from "./home.module.css";

export const metadata: Metadata = {
  title: "Money clarity without the finance-bro energy",
  description: "Understand your goals, portfolio, funds and investment baskets in plain language.",
};

const paths = [
  {
    number: "01",
    label: "Plan my life",
    title: "Can I actually afford the life I want?",
    copy: "Turn the big thing in your head into a monthly number you can act on.",
    outcome: "Get a realistic plan",
    href: "/tools",
    tone: styles.blue,
    media: "/media/cards/plan-life.png",
  },
  {
    number: "02",
    label: "Check my portfolio",
    title: "Is my money diversified, or just scattered?",
    copy: "Spot concentration, overlap and risk without decoding a wall of ratios.",
    outcome: "See what you really own",
    href: "/portfolio",
    tone: styles.coral,
    media: "/media/cards/portfolio-balance.png",
  },
  {
    number: "03",
    label: "Pick a fund",
    title: "Does this fund fit me, or is it just trending?",
    copy: "Compare cost, consistency and fit before recent returns steal the show.",
    outcome: "Find a better match",
    href: "/mutual-funds",
    tone: styles.mint,
    media: "/media/cards/fund-compare.png",
  },
  {
    number: "04",
    label: "Explore a basket",
    title: "What am I really buying into?",
    copy: "Understand the idea, concentration and trade-offs behind curated baskets.",
    outcome: "Read the full story",
    href: "/smallcases",
    tone: styles.violet,
    media: "/media/cards/investment-basket.png",
  },
];

export default function HomePage() {
  return (
    <div className={`home-page ${styles.page}`}>
      <MotionReady />

      <section className={styles.hero} aria-labelledby="hero-title">
        <div className={styles.heroGlow} aria-hidden="true" />
        <div className={styles.heroCopy}>
          <div className={styles.eyebrow}><i /> Money clarity for real life</div>
          <h1 id="hero-title">Your money is not a spreadsheet. <span>It&apos;s your next move.</span></h1>
          <p>Ask the question already living rent-free in your head. Paisaan turns the noise into one clear answer and a next step that makes sense.</p>
          <div className={styles.heroActions}>
            <Link className={styles.primaryAction} href="#choose">
              Find my starting point <span aria-hidden="true">↓</span>
            </Link>
            <Link className={styles.secondaryAction} href="/guide">How Paisaan thinks <span aria-hidden="true">↗</span></Link>
          </div>
        </div>

        <div className={styles.answerPreview} aria-label="Example Paisaan answer">
          <div className={styles.previewTop}>
            <span>YOUR QUICK READ</span>
            <b><i /> Live example</b>
          </div>
          <p className={styles.previewQuestion}>“Can I move out next year without wrecking my savings?”</p>
          <div className={styles.scoreRow}>
            <div className={styles.score} aria-label="72 percent ready"><strong>72</strong><span>% ready</span></div>
            <div className={styles.scoreCopy}>
              <span>THE READ</span>
              <strong>Yes, but your emergency buffer needs one more push.</strong>
            </div>
          </div>
          <div className={styles.previewMove}>
            <div><span>YOUR NEXT MOVE</span><strong>Add ₹2,400/month for 8 months</strong></div>
            <span aria-hidden="true">↗</span>
          </div>
          <div className={styles.previewFooter}><span>Clear answer</span><i /><span>Visible maths</span><i /><span>Useful action</span></div>
        </div>
      </section>

      <section className={styles.choose} id="choose" aria-labelledby="choose-title">
        <header className={`${styles.sectionHead} reveal`}>
          <div><span className={styles.kicker}>Choose your current brain tab</span><h2 id="choose-title">What&apos;s taking up <span>headspace?</span></h2></div>
          <p>Skip the dashboard tour. Start with the question that matters today.</p>
        </header>
        <div className={styles.pathGrid}>
          {paths.map((path, index) => (
            <Link className={`${styles.pathCard} ${path.tone} reveal`} href={path.href} key={path.href} style={{ "--delay": `${index * 80}ms` } as CSSProperties}>
              <div className={styles.pathTop}><span>{path.number} / 04</span></div>
              <div className={styles.pathMedia} aria-hidden="true"><Image src={path.media} alt="" width={320} height={320} sizes="(max-width: 700px) 42vw, 190px" /></div>
              <div className={styles.pathCopy}><span>{path.label}</span><h3>{path.title}</h3><p>{path.copy}</p></div>
              <div className={styles.pathAction}><span>{path.outcome}</span><b aria-hidden="true">↗</b></div>
            </Link>
          ))}
        </div>
      </section>

      <section className={styles.rhythm} aria-labelledby="rhythm-title">
        <div className={`${styles.rhythmIntro} reveal`}>
          <span className={styles.kicker}>One calm rhythm</span>
          <h2 id="rhythm-title">The answer first.<br /><span>The maths on tap.</span></h2>
          <p>Made for a short attention span, without treating you like you&apos;re incapable of depth.</p>
        </div>
        <ol className={styles.rhythmList}>
          <li className="reveal"><span>01</span><div><small>THE READ</small><h3>Know where you stand.</h3><p>A direct answer in human language. No twelve-chart warm-up.</p></div><b>“You&apos;re close.”</b></li>
          <li className="reveal"><span>02</span><div><small>THE WHY</small><h3>See what changes the answer.</h3><p>Only the assumptions and trade-offs that actually move the result.</p></div><b>Risk · time · cost</b></li>
          <li className="reveal"><span>03</span><div><small>YOUR MOVE</small><h3>Leave knowing what to do.</h3><p>Two or three concrete options. Never a vague one-line “tip”.</p></div><b>Pick your next step →</b></li>
        </ol>
      </section>

      <section className={`${styles.manifesto} reveal`}>
        <div className={styles.manifestoMark}>P</div>
        <p>We don&apos;t want you to spend more time on finance apps.</p>
        <h2>We want the time you spend here to <span>actually count.</span></h2>
        <div><span>Private by default</span><i /><span>Assumptions shown</span><i /><span>Decisions, not dopamine</span></div>
      </section>

      <section className={styles.closing}>
        <span className={styles.kicker}>Ready when you are</span>
        <h2>One question.<br /><span>One useful move.</span></h2>
        <p>No signup. No sales call. Just a clearer way to think about your money.</p>
        <Link className={styles.primaryAction} href="#choose">Choose my question <span aria-hidden="true">↑</span></Link>
      </section>
    </div>
  );
}
