"use client";

import { useId, useMemo, useState } from "react";

import { ResultNotes } from "@/components/ui";
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
};

const GOALS: Goal[] = [
  { id: "crore", numeral: "01", name: "My first crore", line: "Build a seven-figure milestone", target: 10_000_000, targetMax: 30_000_000, years: 15, inflationAdjusted: true },
  { id: "home", numeral: "02", name: "A place of my own", line: "Prepare the future down payment", target: 3_000_000, targetMax: 15_000_000, years: 7, inflationAdjusted: true },
  { id: "freedom", numeral: "03", name: "Financial freedom", line: "Create room to choose your time", target: 18_000_000, targetMax: 60_000_000, years: 20, inflationAdjusted: true },
  { id: "custom", numeral: "04", name: "Something personal", line: "Shape a goal that is only yours", target: 5_000_000, targetMax: 50_000_000, years: 10, inflationAdjusted: true },
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
  const extensionWithinRange = Boolean(result.extensionYears && years + result.extensionYears <= 35);
  const status = conservativeOnTrack ? "On track" : baseOnTrack ? "Close · fragile" : "A gap to close";
  const read = conservativeOnTrack
    ? `Your current rhythm reaches ${goal.name.toLowerCase()} even in the lower-return check.`
    : baseOnTrack
      ? `The base case reaches this goal, but a 2% lower return leaves a gap. This plan is close—not cushioned.`
      : `You are building momentum, but the current plan reaches about ${percentReady}% of this goal.`;

  return (
    <div className="future-page">
      <header className="future-hero">
        <div>
          <span className="eyebrow">Future Me · one living plan</span>
          <h1>Make tomorrow feel <em>touchable.</em></h1>
          <p>Choose the life moment. Move what feels possible. Paisaan does the maths quietly and gives you a decision—not another form to complete.</p>
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
              <span>{item.numeral}</span><i aria-hidden="true" />
              <strong>{item.name}</strong><small>{item.line}</small>
            </button>
          ))}
        </div>
      </section>

      <section className="future-studio" aria-label="Plan builder">
        <div className="future-controls">
          <div className="future-section-title compact"><span>02</span><div><p>Shape the plan</p><h2>Move the levers that matter.</h2></div></div>
          <RangeControl label="Goal value today" value={target} min={500_000} max={goal.targetMax} step={100_000} display={money(target, true)} onChange={(next) => { setTarget(next); setSavings((current) => Math.min(current, clamp(next * .75, 500_000, 15_000_000))); }} />
          <RangeControl label="Already set aside" value={savings} min={0} max={clamp(target * .75, 500_000, 15_000_000)} step={50_000} display={money(savings, true)} onChange={setSavings} />
          <RangeControl label="Monthly rhythm" value={monthly} min={1_000} max={250_000} step={1_000} display={`${money(monthly, true)} / month`} onChange={setMonthly} />
          <RangeControl label="Time to grow" value={years} min={2} max={35} step={1} display={`${years} years`} onChange={setYears} />

          <details className="assumption-drawer">
            <summary><span>Fine-tune assumptions</span><small>Return, inflation and annual increase</small></summary>
            <div className="assumption-grid">
              <RangeControl label="Expected return" value={annualReturn} min={4} max={15} step={.5} display={`${annualReturn}%`} onChange={setAnnualReturn} />
              <RangeControl label="Annual investment increase" value={stepUp} min={0} max={20} step={1} display={`${stepUp}%`} onChange={setStepUp} />
              {goal.inflationAdjusted && <RangeControl label="Inflation" value={inflation} min={3} max={10} step={.5} display={`${inflation}%`} onChange={setInflation} />}
            </div>
          </details>

          <fieldset className="readiness-check">
            <legend>Before this goal, is your emergency cushion ready?</legend>
            <div>
              <label className={emergencyReady === true ? "active" : ""}><input type="radio" name="emergency-ready" checked={emergencyReady === true} onChange={() => setEmergencyReady(true)}/><span>Yes, 3–6 months</span></label>
              <label className={emergencyReady === false ? "active" : ""}><input type="radio" name="emergency-ready" checked={emergencyReady === false} onChange={() => setEmergencyReady(false)}/><span>Still building it</span></label>
            </div>
          </fieldset>
        </div>

        <aside className="future-result">
          <header><span>The Read</span><i className={conservativeOnTrack ? "on-track" : "needs-work"}>{status}</i></header>
          <div className="future-outcome">
            <span>Your clearest move</span>
            <strong>{conservativeOnTrack ? "Keep this rhythm" : saferWithinRange ? `Add ${money(saferDelta, true)} / month` : "Give the goal more time"}</strong>
            <p>{conservativeOnTrack
              ? `${money(monthly, true)} monthly already reaches the goal in the lower-return check.`
              : saferWithinRange
                ? `Move from ${money(monthly, true)} to ${money(saferMonthly, true)} monthly to target the goal even at a 2% lower return.`
                : `The safer monthly requirement is about ${money(saferMonthly, true)}, outside this planner's range. Adjust the date or target instead.`}</p>
            {!conservativeOnTrack && saferWithinRange && <button type="button" onClick={() => setMonthly(saferMonthly)} disabled={emergencyReady === false}>{emergencyReady === false ? "Build your cushion first" : "Preview the safer plan"}<span>→</span></button>}
          </div>
          <div className="future-summary"><h2>{read}</h2><strong>{percentReady}% <small>base case funded</small></strong></div>
          <div className="result-split">
            <div><span>Future target</span><strong>{money(result.futureTarget, true)}</strong></div>
            <div><span>Expected path</span><strong>{money(result.projectedCorpus, true)}</strong></div>
            <div><span>Lower-return path</span><strong>{money(result.conservativeCorpus, true)}</strong></div>
          </div>
          <FutureChart baseline={result.series} conservative={result.conservativeSeries} initialCorpus={savings} initialTarget={target} years={years} />
          <small className="result-caption">Live projection · goal entered in today&apos;s rupees · target rises with inflation</small>
        </aside>
      </section>

      <section className="decision-row">
        <article className="reality-card">
          <span>Reality Check</span>
          <h2>{emergencyReady === null ? "Start with the foundation." : emergencyReady ? "Your foundation is in place." : "Protect the plan before stretching it."}</h2>
          <p>{emergencyReady === null ? "Tell us whether you have three to six months of essential expenses set aside. That answer changes which next move is responsible." : emergencyReady ? `At a 2% lower return, this plan could reach ${money(result.conservativeCorpus, true)}. Keep that range—not one forecast—in mind.` : "Build three to six months of essential expenses before increasing a long-term contribution. Resilience is part of the return."}</p>
        </article>
        <article className="moves-card">
          <span>Your Move</span><h2>Three honest ways forward.</h2>
          <div className="move-options">
            <button type="button" onClick={() => setMonthly(saferMonthly)} disabled={conservativeOnTrack || !saferWithinRange || emergencyReady === false}>
              <i>01</i><span><b>{conservativeOnTrack ? "Keep this rhythm" : !saferWithinRange ? "Monthly fix is outside this planner" : emergencyReady === false ? "Build the cushion first" : `Use the safer ${money(saferMonthly, true)} monthly`}</b><small>{conservativeOnTrack ? "Review once a year" : !saferWithinRange ? `Required contribution is about ${money(saferMonthly, true)}` : emergencyReady === false ? "Do not stretch the contribution yet" : `${money(saferDelta, true)} more than today; lower-return tested`}</small></span>
            </button>
            <button type="button" onClick={() => result.extensionYears && extensionWithinRange && setYears(years + result.extensionYears)} disabled={!extensionWithinRange || conservativeOnTrack}>
              <i>02</i><span><b>{result.extensionYears && extensionWithinRange && !conservativeOnTrack ? `Give it ${result.extensionYears} more ${result.extensionYears === 1 ? "year" : "years"}` : result.extensionYears && !extensionWithinRange ? "More time exceeds this planner" : "Time is already working"}</b><small>{result.extensionYears && !extensionWithinRange ? "The planner supports up to 35 years" : "Trade speed for a gentler monthly ask"}</small></span>
            </button>
            <button type="button" onClick={() => setStepUp(clamp(stepUp + 2, 0, 20))} disabled={stepUp >= 20 || conservativeOnTrack}>
              <i>03</i><span><b>Step up with income</b><small>{conservativeOnTrack ? `Your current ${stepUp}% step-up is enough` : `Try ${Math.min(20, stepUp + 2)}% each year`}</small></span>
            </button>
          </div>
        </article>
      </section>

      <ResultNotes
        assumptions={[
          "Contributions are modelled at each month-end and increase once a year.",
          `The goal value rises with ${inflation}% annual inflation.`,
          "Taxes, fees, market volatility and changes in personal circumstances are not modelled.",
        ]}
        warnings={["This is an educational planning range, not a return promise or investment recommendation."]}
      />
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
  const height = 300;
  const plot = { left: 54, right: 18, top: 22, bottom: 40 };
  const basePoints = [{ year: 0, corpus: initialCorpus, target: initialTarget }, ...baseline];
  const safePoints = [{ year: 0, corpus: initialCorpus, target: initialTarget }, ...conservative];
  const maximum = Math.max(1, ...basePoints.flatMap((point) => [point.corpus, point.target]), ...safePoints.map((point) => point.corpus)) * 1.08;
  const x = (year: number) => plot.left + (year / Math.max(1, years)) * (width - plot.left - plot.right);
  const y = (value: number) => plot.top + (1 - value / maximum) * (height - plot.top - plot.bottom);
  const line = (points: typeof basePoints, key: "corpus" | "target") => points.map((point, index) => `${index ? "L" : "M"}${x(point.year).toFixed(1)},${y(point[key]).toFixed(1)}`).join(" ");
  const band = `${line(basePoints, "corpus")} ${[...safePoints].reverse().map((point) => `L${x(point.year).toFixed(1)},${y(point.corpus).toFixed(1)}`).join(" ")} Z`;
  const endBase = basePoints[basePoints.length - 1];
  const endSafe = safePoints[safePoints.length - 1];

  return <figure className="future-chart">
    <figcaption><span>Your path, year by year</span><div><i className="expected"/>Expected <i className="safer"/>Lower return <i className="target"/>Target</div></figcaption>
    <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`Line chart comparing the expected projection, lower-return projection, and inflation-adjusted target over ${years} years`} preserveAspectRatio="xMidYMid meet">
      <defs><linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#9cb0ff" stopOpacity=".22"/><stop offset="1" stopColor="#9cb0ff" stopOpacity=".02"/></linearGradient></defs>
      {[0, .25, .5, .75, 1].map((tick) => <g key={tick}><line className="chart-grid" x1={plot.left} x2={width - plot.right} y1={y(maximum * tick)} y2={y(maximum * tick)}/>{tick > 0 && <text className="chart-y-label" x={plot.left - 8} y={y(maximum * tick) + 4}>{money(maximum * tick, true)}</text>}</g>)}
      <path className="chart-band" d={band} fill={`url(#${gradientId})`}/>
      <path className="chart-line target" d={line(basePoints, "target")}/>
      <path className="chart-line safer" d={line(safePoints, "corpus")}/>
      <path className="chart-line expected" d={line(basePoints, "corpus")}/>
      <circle className="chart-dot expected" cx={x(endBase.year)} cy={y(endBase.corpus)} r="5"/>
      <circle className="chart-dot safer" cx={x(endSafe.year)} cy={y(endSafe.corpus)} r="4"/>
      <text className="chart-x-label" x={plot.left} y={height - 12}>Today</text>
      <text className="chart-x-label end" x={width - plot.right} y={height - 12}>Year {years}</text>
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
