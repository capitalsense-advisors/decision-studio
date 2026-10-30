"use client";

import Image from "next/image";
import { useId, useMemo, useState } from "react";

import { futurePlan } from "@/lib/calculations";
import { money } from "@/lib/format";

type GoalId = "crore" | "home" | "freedom" | "custom";

type Goal = {
  id: GoalId;
  numeral: string;
  name: string;
  line: string;
  target: number;
  targetMax: number;
  years: number;
  inflationAdjusted: boolean;
  media: string;
};

const GOALS: Goal[] = [
  { id: "crore", numeral: "01", name: "My first crore", line: "Build a seven-figure milestone", target: 10_000_000, targetMax: 30_000_000, years: 15, inflationAdjusted: true, media: "/media/cards/goal-first-crore.png" },
  { id: "home", numeral: "02", name: "A place of my own", line: "Prepare the future down payment", target: 3_000_000, targetMax: 15_000_000, years: 7, inflationAdjusted: true, media: "/media/cards/goal-home.png" },
  { id: "freedom", numeral: "03", name: "Financial freedom", line: "Create room to choose your time", target: 18_000_000, targetMax: 60_000_000, years: 20, inflationAdjusted: true, media: "/media/cards/goal-freedom.png" },
  { id: "custom", numeral: "04", name: "Something personal", line: "Shape a goal that is only yours", target: 5_000_000, targetMax: 50_000_000, years: 10, inflationAdjusted: true, media: "/media/cards/goal-personal.png" },
];

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export default function FutureMePage() {
  const [goalId, setGoalId] = useState<GoalId>("crore");
  const [target, setTarget] = useState(GOALS[0].target);
  const [years, setYears] = useState(GOALS[0].years);
  const [monthly, setMonthly] = useState(25_000);
  const [savings, setSavings] = useState(300_000);
  const [annualReturn, setAnnualReturn] = useState(10);
  const [inflation, setInflation] = useState(6);
  const [stepUp, setStepUp] = useState(8);
  const [emergencyReady, setEmergencyReady] = useState<boolean | null>(null);
  const goal = GOALS.find((item) => item.id === goalId) ?? GOALS[0];

  const result = useMemo(() => futurePlan({
    targetToday: target,
    currentSavings: savings,
    monthlyContribution: monthly,
    years,
    annualReturn: annualReturn / 100,
    inflation: inflation / 100,
    annualStepUp: stepUp / 100,
    inflationAdjusted: goal.inflationAdjusted,
  }), [annualReturn, goal.inflationAdjusted, inflation, monthly, savings, stepUp, target, years]);

  const onGoal = (next: Goal) => {
    setGoalId(next.id);
    setTarget(next.target);
    setYears(next.years);
    setSavings((current) => Math.min(current, clamp(next.target * .75, 500_000, 15_000_000)));
  };
  const percentReady = Math.floor(Math.min(1, result.fundingRatio) * 100);
  const baseOnTrack = result.shortfall === 0;
  const conservativeOnTrack = result.conservativeCorpus >= result.futureTarget;
  const saferMonthly = Math.ceil(result.conservativeRequiredMonthly / 1000) * 1000;
  const saferDelta = Math.max(0, saferMonthly - monthly);
  const saferWithinRange = saferMonthly <= 250_000;
  const status = conservativeOnTrack ? "On track" : baseOnTrack ? "Close, but fragile" : "A gap to close";
  const read = conservativeOnTrack
    ? `Your current rhythm reaches ${goal.name.toLowerCase()} even in the lower-return check.`
    : baseOnTrack
      ? `The base case reaches this goal, but a 2% lower return leaves a gap. This plan is close, but it has little room for error.`
      : `You are building momentum, but the current plan reaches about ${percentReady}% of this goal.`;

  return (
    <div className="future-page">
      <header className="future-hero">
        <div>
          <span className="eyebrow">Future Me · one living plan</span>
          <h1>Make tomorrow feel <em>touchable.</em></h1>
          <p>Choose the life moment and set what feels possible. Paisaan handles the maths and gives you a decision instead of another long form.</p>
        </div>
        <div className="future-hero-proof" aria-hidden="true"><span>One plan</span><strong>3 paths</strong><small>Expected · safer · more time</small></div>
      </header>

      <section className="goal-picker" aria-labelledby="goal-heading">
        <div className="future-section-title"><span>01</span><div><p>Choose your chapter</p><h2 id="goal-heading">What are we making possible?</h2></div></div>
        <div className="goal-cards">
          {GOALS.map((item) => (
            <button
              type="button"
              key={item.id}
              className={goalId === item.id ? "goal-card active" : "goal-card"}
              aria-pressed={goalId === item.id}
              onClick={() => onGoal(item)}
            >
              <span>{item.numeral}</span><Image className="goal-card-media" src={item.media} alt="" width={220} height={220} sizes="(max-width: 620px) 38vw, 150px" aria-hidden="true" />
              <strong>{item.name}</strong><small>{item.line}</small>
            </button>
          ))}
        </div>
      </section>

      <section className="future-studio" aria-label="Plan builder">
        <div className="future-controls">
          <div className="future-section-title compact"><span>02</span><div><p>Shape the plan</p><h2>Set four numbers.</h2></div></div>
          <div className="plan-input-grid">
            <RangeControl label="Goal today" value={target} min={500_000} max={goal.targetMax} step={100_000} display={money(target, true)} onChange={(next) => { setTarget(next); setSavings((current) => Math.min(current, clamp(next * .75, 500_000, 15_000_000))); }} />
            <RangeControl label="Already saved" value={savings} min={0} max={clamp(target * .75, 500_000, 15_000_000)} step={50_000} display={money(savings, true)} onChange={setSavings} />
            <RangeControl label="Invest monthly" value={monthly} min={1_000} max={250_000} step={1_000} display={money(monthly, true)} onChange={setMonthly} />
            <RangeControl label="Time available" value={years} min={2} max={35} step={1} display={`${years} years`} onChange={setYears} />
          </div>

          <details className="assumption-drawer">
            <summary><span>Advanced assumptions</span><small>{annualReturn}% return, {inflation}% inflation, {stepUp}% yearly increase</small></summary>
            <div className="assumption-grid">
              <RangeControl label="Expected return" value={annualReturn} min={4} max={15} step={.5} display={`${annualReturn}%`} onChange={setAnnualReturn} />
              <RangeControl label="Annual investment increase" value={stepUp} min={0} max={20} step={1} display={`${stepUp}%`} onChange={setStepUp} />
              {goal.inflationAdjusted && <RangeControl label="Inflation" value={inflation} min={3} max={10} step={.5} display={`${inflation}%`} onChange={setInflation} />}
            </div>
          </details>

          <fieldset className="readiness-check">
            <legend>Emergency cushion ready?</legend>
            <div>
              <label className={emergencyReady === true ? "active" : ""}><input type="radio" name="emergency-ready" checked={emergencyReady === true} onChange={() => setEmergencyReady(true)}/><span>Yes, 3 to 6 months</span></label>
              <label className={emergencyReady === false ? "active" : ""}><input type="radio" name="emergency-ready" checked={emergencyReady === false} onChange={() => setEmergencyReady(false)}/><span>Not yet</span></label>
            </div>
          </fieldset>
        </div>

        <aside className="future-result">
          <header><span>Your decision</span><i className={conservativeOnTrack ? "on-track" : "needs-work"}>{status}</i></header>
          <div className="future-outcome">
            <span>Best next move</span>
            <strong>{conservativeOnTrack ? "Keep this rhythm" : saferWithinRange ? `Add ${money(saferDelta, true)} / month` : "Give the goal more time"}</strong>
            <p>{conservativeOnTrack
              ? `${money(monthly, true)} monthly reaches the goal even with a lower return.`
              : saferWithinRange
                ? `Invest ${money(saferMonthly, true)} monthly to stay on track even if returns are 2% lower.`
                : `The safer monthly amount is ${money(saferMonthly, true)}. Extend the timeline or lower the goal.`}</p>
            {!conservativeOnTrack && saferWithinRange && <button type="button" onClick={() => setMonthly(saferMonthly)} disabled={emergencyReady === false}>{emergencyReady === false ? "Build your cushion first" : `Use ${money(saferMonthly, true)} monthly`}<span>→</span></button>}
          </div>
          <div className="future-summary"><p>{read}</p><strong>{percentReady}% <small>funded</small></strong></div>
          <div className="result-split">
            <div><span>Target then</span><strong>{money(result.futureTarget, true)}</strong></div>
            <div><span>Likely corpus</span><strong>{money(result.projectedCorpus, true)}</strong></div>
            <div><span>Safer check</span><strong>{money(result.conservativeCorpus, true)}</strong></div>
          </div>
          <FutureChart baseline={result.series} conservative={result.conservativeSeries} initialCorpus={savings} initialTarget={target} years={years} />
          <small className="result-caption">Educational estimate using your assumptions. Taxes, fees, and market swings are not included.</small>
        </aside>
      </section>
    </div>
  );
}

function FutureChart({ baseline, conservative, initialCorpus, initialTarget, years }: {
  baseline: Array<{ year: number; corpus: number; target: number }>;
  conservative: Array<{ year: number; corpus: number; target: number }>;
  initialCorpus: number;
  initialTarget: number;
  years: number;
}) {
  const gradientId = useId().replace(/:/g, "");
  const width = 720;
  const height = 220;
  const plot = { left: 54, right: 18, top: 18, bottom: 32 };
  const basePoints = [{ year: 0, corpus: initialCorpus, target: initialTarget }, ...baseline];
  const safePoints = [{ year: 0, corpus: initialCorpus, target: initialTarget }, ...conservative];
  const maximum = Math.max(1, ...basePoints.flatMap((point) => [point.corpus, point.target]), ...safePoints.map((point) => point.corpus)) * 1.08;
  const x = (year: number) => plot.left + (year / Math.max(1, years)) * (width - plot.left - plot.right);
  const y = (value: number) => plot.top + (1 - value / maximum) * (height - plot.top - plot.bottom);
  const line = (points: typeof basePoints, key: "corpus" | "target") => points.map((point, index) => `${index ? "L" : "M"}${x(point.year).toFixed(1)},${y(point[key]).toFixed(1)}`).join(" ");
  const band = `${line(basePoints, "corpus")} ${[...safePoints].reverse().map((point) => `L${x(point.year).toFixed(1)},${y(point.corpus).toFixed(1)}`).join(" ")} Z`;
  const endBase = basePoints[basePoints.length - 1];
  const endSafe = safePoints[safePoints.length - 1];

  return <figure className="future-chart compact-chart">
    <figcaption><span>Projection</span><div><i className="expected"/>Expected <i className="safer"/>Safer <i className="target"/>Target</div></figcaption>
    <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`Projection chart comparing expected, safer, and target paths over ${years} years`} preserveAspectRatio="xMidYMid meet">
      <defs><linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#9cb0ff" stopOpacity=".22"/><stop offset="1" stopColor="#9cb0ff" stopOpacity=".02"/></linearGradient></defs>
      {[0, .5, 1].map((tick) => <g key={tick}><line className="chart-grid" x1={plot.left} x2={width - plot.right} y1={y(maximum * tick)} y2={y(maximum * tick)}/>{tick > 0 && <text className="chart-y-label" x={plot.left - 8} y={y(maximum * tick) + 4}>{money(maximum * tick, true)}</text>}</g>)}
      <path className="chart-band" d={band} fill={`url(#${gradientId})`}/>
      <path className="chart-line target" d={line(basePoints, "target")}/>
      <path className="chart-line safer" d={line(safePoints, "corpus")}/>
      <path className="chart-line expected" d={line(basePoints, "corpus")}/>
      <circle className="chart-dot expected" cx={x(endBase.year)} cy={y(endBase.corpus)} r="4"/>
      <circle className="chart-dot safer" cx={x(endSafe.year)} cy={y(endSafe.corpus)} r="3.5"/>
      <text className="chart-x-label" x={plot.left} y={height - 8}>Today</text>
      <text className="chart-x-label end" x={width - plot.right} y={height - 8}>Year {years}</text>
    </svg>
  </figure>;
}

function RangeControl({ label, value, min, max, step, display, onChange }: { label: string; value: number; min: number; max: number; step: number; display: string; onChange: (value: number) => void }) {
  const id = useId();
  const bounded = clamp(value, min, max);
  const progress = ((bounded - min) / Math.max(1, max - min)) * 100;
  return (
    <label className="range-control" htmlFor={id}>
      <span>{label}<output htmlFor={id}>{display}</output></span>
      <input id={id} type="range" min={min} max={max} step={step} value={bounded} onChange={(event) => onChange(Number(event.target.value))} style={{ "--range-progress": `${progress}%` } as React.CSSProperties} />
      <small><i>{formatRangeEdge(min)}</i><i>{formatRangeEdge(max)}</i></small>
    </label>
  );
}

function formatRangeEdge(value: number) {
  return value >= 1000 ? money(value, true) : String(value);
}
