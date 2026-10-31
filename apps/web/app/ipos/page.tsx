"use client";

import { useEffect, useMemo, useState } from "react";
import type { IpoSnapshot, IpoSnapshotItem } from "@/lib/ipo-snapshot";
import styles from "./page.module.css";

type IpoInputs = {
  price: number;
  lotSize: number;
  freshIssueShare: number;
  ipoPe: number;
  peerPe: number;
  roe: number;
  debtEquity: number;
  patMargin: number;
  qib: number;
  retail: number;
  snii: number;
  bnii: number;
  total: number;
  gmp: number;
  capital: number;
  applicants: number;
  debtUse: number;
  growthUse: number;
  riskCount: number;
};

const initialInputs: IpoInputs = {
  price: 0,
  lotSize: 0,
  freshIssueShare: 0,
  ipoPe: 0,
  peerPe: 0,
  roe: 0,
  debtEquity: 0,
  patMargin: 0,
  qib: 0,
  retail: 0,
  snii: 0,
  bnii: 0,
  total: 0,
  gmp: 0,
  capital: 500000,
  applicants: 2,
  debtUse: 0,
  growthUse: 0,
  riskCount: 0,
};

const clamp = (value: number, low = 0, high = 100) => Math.min(high, Math.max(low, value));

export function evaluateIpo(input: IpoInputs) {
  const roeScore = clamp(input.roe / 22 * 100);
  const marginScore = clamp(input.patMargin / 18 * 100);
  const debtScore = clamp((2 - input.debtEquity) / 2 * 100);
  const quality = Math.round(clamp(roeScore * .4 + marginScore * .3 + debtScore * .3 - input.riskCount * 4));

  const peRatio = input.peerPe > 0 ? input.ipoPe / input.peerPe : null;
  const valuation = peRatio !== null
    ? peRatio <= .8 ? 92 : peRatio <= 1 ? 78 : peRatio <= 1.2 ? 58 : peRatio <= 1.5 ? 36 : 16
    : input.ipoPe > 0 ? input.ipoPe <= 15 ? 80 : input.ipoPe <= 25 ? 65 : input.ipoPe <= 40 ? 45 : 25 : 50;

  const demandBase = (
    clamp(Math.log1p(input.qib) / Math.log(51) * 100) * .42
    + clamp(Math.log1p(input.total) / Math.log(51) * 100) * .28
    + clamp(Math.log1p(input.retail) / Math.log(31) * 100) * .15
    + clamp(input.gmp / 30 * 100) * .15
  );
  const demand = Math.round(demandBase);
  const longTerm = Math.round(quality * .6 + valuation * .4);
  const lotCost = Math.max(0, input.price) * Math.max(0, input.lotSize);
  const retailAllotmentProxy = input.retail > 0 ? Math.min(1, 1 / input.retail) : null;

  const verdict = longTerm >= 72
    ? "The fundamentals clear a strong first filter."
    : longTerm >= 52
      ? "Interesting, but the price or business quality needs a closer read."
      : "The current inputs do not offer enough margin for error.";
  const nextMove = valuation < 45
    ? "Compare the offer P/E with true listed peers before applying."
    : quality < 55
      ? "The stored prospectus snapshot flags weak business quality. Check cash conversion before deciding."
      : input.riskCount >= 3
        ? "The stored prospectus snapshot has several risk flags. Test their effect on revenue, margins, and cash flow."
      : input.freshIssueShare < 35
        ? "Check why most proceeds are going to selling shareholders."
        : "Compare the captured use of proceeds, valuation, and dilution before deciding.";

  return { quality, valuation, demand, longTerm, lotCost, peRatio, retailAllotmentProxy, verdict, nextMove };
}

type ApplicationPlan = { key: "retail" | "snii" | "bnii"; label: string; minimum: number; probability: number };
type ApplicationStrategy = { chance: number; usedCapital: number; usedApplicants: number; counts: Record<string, number> };
type MainboardAllocation = ApplicationStrategy & { plans: ApplicationPlan[]; unusedCapital: number };

export function optimiseMainboardApplications(input: Pick<IpoInputs, "price" | "lotSize" | "retail" | "snii" | "bnii" | "capital" | "applicants">): MainboardAllocation | null {
  const lotValue = input.price * input.lotSize;
  if (lotValue <= 0 || input.capital <= 0 || input.applicants <= 0) return null;
  const probability = (subscription: number) => subscription > 0 ? Math.min(1, 1 / subscription) : 0;
  const smallLots = Math.floor(200000 / lotValue) + 1;
  const bigLots = Math.floor(1000000 / lotValue) + 1;
  const plans: ApplicationPlan[] = [
    ...(lotValue <= 200000 ? [{ key: "retail" as const, label: "Retail", minimum: lotValue, probability: probability(input.retail) }] : []),
    ...(smallLots * lotValue <= 1000000 ? [{ key: "snii" as const, label: "Small HNI", minimum: smallLots * lotValue, probability: probability(input.snii) }] : []),
    { key: "bnii" as const, label: "Big HNI", minimum: bigLots * lotValue, probability: probability(input.bnii) },
  ].filter((plan) => plan.probability > 0);
  if (!plans.length) return null;

  let best: ApplicationStrategy | null = null;
  const walk = (index: number, applicantsLeft: number, capitalLeft: number, counts: Record<string, number>) => {
    if (index === plans.length) {
      const usedApplicants = Object.values(counts).reduce((sum, count) => sum + count, 0);
      const usedCapital = plans.reduce((sum, plan) => sum + (counts[plan.key] ?? 0) * plan.minimum, 0);
      const missChance = plans.reduce((miss, plan) => miss * Math.pow(1 - plan.probability, counts[plan.key] ?? 0), 1);
      const candidate = { chance: usedApplicants ? 1 - missChance : 0, usedCapital, usedApplicants, counts: { ...counts } };
      if (!best || candidate.chance > best.chance + 1e-9 || (Math.abs(candidate.chance - best.chance) < 1e-9 && candidate.usedCapital < best.usedCapital)) best = candidate;
      return;
    }
    const plan = plans[index];
    const maximum = Math.min(applicantsLeft, Math.floor(capitalLeft / plan.minimum));
    for (let count = 0; count <= maximum; count += 1) {
      counts[plan.key] = count;
      walk(index + 1, applicantsLeft - count, capitalLeft - count * plan.minimum, counts);
    }
    delete counts[plan.key];
  };
  walk(0, Math.floor(input.applicants), input.capital, {});
  const winner = best as ApplicationStrategy | null;
  return winner ? { ...winner, plans, unusedCapital: input.capital - winner.usedCapital } : null;
}

function Field({ label, value, min, max, step = 1, suffix = "", onChange }: {
  label: string; value: number; min: number; max: number; step?: number; suffix?: string; onChange: (value: number) => void;
}) {
  return <label className={styles.field}>
    <span>{label}<strong>{value}{suffix}</strong></span>
    <input type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} />
    <small><i>{min}{suffix}</i><i>{max}{suffix}</i></small>
  </label>;
}

export default function IpoPage() {
  const [inputs, setInputs] = useState(initialInputs);
  const [snapshot, setSnapshot] = useState<IpoSnapshot | null>(null);
  const [selectedSlug, setSelectedSlug] = useState("");
  const [snapshotError, setSnapshotError] = useState("");
  const selectedIpo = useMemo(() => snapshot?.items.find((item) => item.slug === selectedSlug) ?? null, [snapshot, selectedSlug]);
  const result = useMemo(() => evaluateIpo(inputs), [inputs]);
  const allocation = useMemo(() => optimiseMainboardApplications(inputs), [inputs]);
  const update = (key: keyof IpoInputs, value: number) => setInputs((current) => ({ ...current, [key]: value }));

  useEffect(() => {
    let cancelled = false;
    fetch("/api/ipos/snapshot", { cache: "no-store" })
      .then((response) => {
        if (!response.ok) throw new Error("IPO snapshot is unavailable");
        return response.json() as Promise<IpoSnapshot>;
      })
      .then((next) => {
        if (cancelled) return;
        setSnapshot(next);
        const firstUseful = next.items.find((item) => item.status === "open" && item.priceHigh && item.lotSize)
          ?? next.items.find((item) => item.priceHigh && item.lotSize);
        if (firstUseful) setSelectedSlug(firstUseful.slug);
      })
      .catch(() => { if (!cancelled) setSnapshotError("The last saved IPO snapshot could not be loaded."); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!selectedIpo) return;
    setInputs((current) => ({
      ...current,
      price: selectedIpo.priceHigh ?? 0,
      lotSize: selectedIpo.lotSize ?? 0,
      freshIssueShare: selectedIpo.freshIssueShare ?? 0,
      ipoPe: selectedIpo.ipoPe ?? 0,
      peerPe: selectedIpo.peerPe ?? 0,
      roe: selectedIpo.roe ?? 0,
      debtEquity: selectedIpo.debtEquity ?? 0,
      patMargin: selectedIpo.patMargin ?? 0,
      qib: 0,
      retail: 0,
      snii: 0,
      bnii: 0,
      total: selectedIpo.subscription ?? 0,
      gmp: selectedIpo.gmpPercent ?? 0,
      riskCount: selectedIpo.risks.length,
    }));
  }, [selectedIpo]);

  const selectIpo = (item: IpoSnapshotItem) => setSelectedSlug(item.slug);
  const formatDate = (value: string | null) => value ? new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short" }).format(new Date(`${value}T00:00:00`)) : "Date pending";
  const snapshotTime = snapshot?.generatedAt ? new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(snapshot.generatedAt)) : "Loading snapshot";

  return <div className={styles.page}>
    <header className={styles.hero}>
      <div>
        <span className={styles.kicker}>IPO Lens / Mainboard only</span>
        <h1>Separate the business from <em>the opening-day noise.</em></h1>
        <p>Pick a live mainboard issue. Paisaan brings in the offer, demand, valuation, financial snapshot, and prospectus source before showing the decision read.</p>
      </div>
      <aside>
        <span>First principle</span>
        <strong>A popular IPO can still be an expensive business.</strong>
        <p>Quality, price, and demand answer different questions. They should not be blended into a fake promise.</p>
      </aside>
    </header>

    <section className={styles.feed} aria-labelledby="ipo-feed-title">
      <header>
        <div><span>Live mainboard snapshot</span><h2 id="ipo-feed-title">Choose the issue. We collect the paperwork.</h2></div>
        <p>Saved {snapshotTime}. Visitors read this snapshot, not the provider API, so browsing never burns the daily quota.</p>
      </header>
      {snapshotError && <p className={styles.snapshotError}>{snapshotError}</p>}
      <div className={styles.issuePicker}>
        {snapshot?.items.slice(0, 8).map((item) => <button type="button" key={item.id} className={selectedSlug === item.slug ? styles.selectedIssue : ""} onClick={() => selectIpo(item)}>
          <span><i className={styles[`status_${item.status}`]} />{item.status}</span>
          <strong>{item.name}</strong>
          <small>{formatDate(item.openDate)} to {formatDate(item.closeDate)}</small>
          <footer><b>{item.priceHigh ? `₹${item.priceLow ?? item.priceHigh} to ₹${item.priceHigh}` : "Price pending"}</b><b>{item.subscription ? `${item.subscription.toFixed(2)}x` : "Demand pending"}</b></footer>
        </button>)}
      </div>
      <footer className={styles.snapshotSources}>
        <span>Stored snapshot</span>
        {snapshot?.sources.map((source) => <a key={source.name} href={source.url} target="_blank" rel="noreferrer">{source.name} ↗</a>)}
        <span>{snapshot?.providerRequests.ipoAlerts ?? 0} IPOAlerts {(snapshot?.providerRequests.ipoAlerts ?? 0) === 1 ? "call" : "calls"} used for this refresh</span>
      </footer>
    </section>

    <section className={styles.lab} aria-labelledby="ipo-lab-title">
      <div className={styles.controls}>
        <header><span>01 / Collected evidence</span><h2 id="ipo-lab-title">{selectedIpo?.name ?? "Select an IPO"}</h2><p>{selectedIpo?.about ?? "Pick a mainboard issue above to load its saved offer snapshot."}</p></header>

        {selectedIpo && <div className={styles.autoFacts}>
          <div><span>Offer window</span><strong>{formatDate(selectedIpo.openDate)} to {formatDate(selectedIpo.closeDate)}</strong></div>
          <div><span>Minimum application</span><strong>{selectedIpo.minimumAmount ? `₹${new Intl.NumberFormat("en-IN").format(selectedIpo.minimumAmount)}` : "Pending"}</strong></div>
          <div><span>Issue size</span><strong>{selectedIpo.issueSizeCrore ? `₹${selectedIpo.issueSizeCrore} Cr` : "Pending"}</strong></div>
          <div><span>Subscription</span><strong>{selectedIpo.subscription ? `${selectedIpo.subscription.toFixed(2)}x` : "Pending"}</strong></div>
          <div><span>GMP context</span><strong>{selectedIpo.gmp !== null ? `₹${selectedIpo.gmp} (${selectedIpo.gmpPercent ?? 0}%)` : "Not captured"}</strong></div>
          <div><span>Financial period</span><strong>{selectedIpo.revenueCrore ? `Revenue ₹${selectedIpo.revenueCrore} Cr` : "Pending"}</strong></div>
        </div>}

        <details className={styles.demandInputs}>
          <summary>Fine-tune missing fields <span>Only when the stored source is incomplete</span></summary>
          <div className={styles.group}>
            <Field label="Listed peer P/E" value={inputs.peerPe} min={0} max={150} suffix="x" onChange={(value) => update("peerPe", value)} />
            <Field label="Fresh issue share" value={inputs.freshIssueShare} min={0} max={100} suffix="%" onChange={(value) => update("freshIssueShare", value)} />
            <Field label="Capital available" value={inputs.capital} min={15000} max={3000000} step={5000} suffix=" ₹" onChange={(value) => update("capital", value)} />
            <Field label="Distinct eligible applicants" value={inputs.applicants} min={1} max={6} onChange={(value) => update("applicants", value)} />
          </div>
        </details>

        {selectedIpo?.prospectusUrl?.startsWith("https://") && <a className={styles.prospectusLink} href={selectedIpo.prospectusUrl} target="_blank" rel="noreferrer">Open captured RHP source ↗</a>}
      </div>

      <div className={styles.readout}>
        <div className={styles.answer}>
          <span>THE LONG-TERM READ</span>
          <div className={styles.scoreDial} style={{ "--score": `${result.longTerm}%` } as React.CSSProperties} role="img" aria-label={`Long-term IPO score ${result.longTerm} out of 100`}><i><strong>{result.longTerm}</strong><small>/100</small></i></div>
          <h2>{result.verdict}</h2>
          <p>{result.nextMove}</p>
        </div>

        <div className={styles.lenses}>
          <article style={{ "--score": `${result.quality}%` } as React.CSSProperties}><span>Business quality</span><strong>{result.quality}</strong><i /><p>ROE, profit margin, and balance-sheet leverage.</p></article>
          <article style={{ "--score": `${result.valuation}%` } as React.CSSProperties}><span>Valuation room</span><strong>{result.valuation}</strong><i /><p>Offer P/E compared with the listed-peer input.</p></article>
          <article style={{ "--score": `${result.demand}%` } as React.CSSProperties}><span>Demand pulse</span><strong>{result.demand}</strong><i /><p>A time-sensitive read, not a long-term recommendation.</p></article>
        </div>

        <div className={styles.facts}>
          <div><span>Minimum application</span><strong>₹{new Intl.NumberFormat("en-IN").format(result.lotCost)}</strong></div>
          <div><span>IPO P/E vs peer</span><strong>{result.peRatio === null ? "Not available" : `${result.peRatio.toFixed(2)}x`}</strong></div>
          <div><span>Fresh issue</span><strong>{inputs.freshIssueShare}%</strong></div>
          <div><span>Retail allotment proxy</span><strong>{result.retailAllotmentProxy === null ? "Not available" : `${(result.retailAllotmentProxy * 100).toFixed(1)}%`}</strong></div>
        </div>

        {selectedIpo?.freshIssueShare !== null && <div className={styles.issueSplit}>
          <header><span>Where the offer goes</span><strong>{inputs.freshIssueShare < 35 ? "Mostly an exit for existing holders" : "Meaningful capital enters the company"}</strong></header>
          <div aria-label={`${inputs.freshIssueShare}% fresh issue and ${100 - inputs.freshIssueShare}% offer for sale`}><i style={{ width: `${inputs.freshIssueShare}%` }} /></div>
          <footer><span>Fresh issue {inputs.freshIssueShare}%</span><span>OFS {100 - inputs.freshIssueShare}%</span></footer>
        </div>}

        {(inputs.debtUse > 0 || inputs.growthUse > 0) && <div className={styles.objectsRead}>
          <div><span>Debt repayment</span><strong>{inputs.debtUse}%</strong></div>
          <div><span>Growth and working capital</span><strong>{inputs.growthUse}%</strong></div>
          <div><span>Other stated uses</span><strong>{Math.max(0, 100 - inputs.debtUse - inputs.growthUse)}%</strong></div>
        </div>}

        <section className={styles.allocator} aria-labelledby="allocator-title">
          <header><div><span>Mainboard application planner</span><h3 id="allocator-title">Use capital where competition is thinner.</h3></div><strong>{allocation ? `${(allocation.chance * 100).toFixed(1)}% proxy` : "Not available"}</strong></header>
          {allocation && <>
            <div className={styles.allocationRows}>
              {allocation.plans.filter((plan) => (allocation.counts[plan.key] ?? 0) > 0).map((plan) => <article key={plan.key}>
                <div><span>{plan.label}</span><strong>{allocation.counts[plan.key]} application{allocation.counts[plan.key] === 1 ? "" : "s"}</strong></div>
                <small>Minimum ₹{new Intl.NumberFormat("en-IN").format(plan.minimum)} each</small>
              </article>)}
            </div>
            <footer><span>Capital used ₹{new Intl.NumberFormat("en-IN").format(allocation.usedCapital)}</span><span>Unallocated ₹{new Intl.NumberFormat("en-IN").format(allocation.unusedCapital)}</span></footer>
          </>}
          <p>This maximises the proxy chance of at least one allotment using minimum valid category bids. It assumes distinct eligible applicants and independent outcomes. Never submit duplicate applications under one PAN.</p>
        </section>

        <div className={styles.boundary}>
          <strong>What this does not claim</strong>
          <p>GMP is unofficial and subscription changes during the offer. The snapshot is cached to protect provider quotas and may lag the source. Use the linked exchange or prospectus source for final verification before applying.</p>
        </div>
      </div>
    </section>
  </div>;
}
