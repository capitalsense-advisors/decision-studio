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
  { id: "crore", numeral: "01", name: "My first crore", line: "Build a seven-figure milestone", target: 10_000_000, targetMax: 30_000_000, years: 15, inflationAdjusted: false },
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
  const [emergencyReady, setEmergencyReady] = useState(false);
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
  const percentReady = Math.round(Math.min(1, result.fundingRatio) * 100);
  const onTrack = result.shortfall === 0;
  const recommendedMonthly = Math.ceil(result.requiredMonthly / 1000) * 1000;
  const monthlyDelta = Math.max(0, recommendedMonthly - monthly);
  const read = onTrack
    ? `Your current rhythm can reach ${goal.name.toLowerCase()} with room to absorb some uncertainty.`
    : `You are building momentum, but the current plan reaches about ${percentReady}% of this goal.`;

  return (
    <div className="future-page">
      <header className="future-hero">
        <div>
          <span className="eyebrow">Future Me · one living plan</span>
          <h1>Make tomorrow feel <em>touchable.</em></h1>
          <p>Choose the life moment. Move what feels possible. Paisaan does the maths quietly and gives you a decision—not another form to complete.</p>
        </div>
        <div className="future-seal" aria-hidden="true"><span>FM</span><small>Est. today</small></div>
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
          <RangeControl label={goal.inflationAdjusted ? "Goal value today" : "Future milestone"} value={target} min={500_000} max={goal.targetMax} step={100_000} display={money(target, true)} onChange={setTarget} />
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
              <button type="button" className={emergencyReady ? "active" : ""} aria-pressed={emergencyReady} onClick={() => setEmergencyReady(true)}>Yes, 3–6 months</button>
              <button type="button" className={!emergencyReady ? "active" : ""} aria-pressed={!emergencyReady} onClick={() => setEmergencyReady(false)}>Still building it</button>
            </div>
          </fieldset>
        </div>

        <aside className="future-result" aria-live="polite">
          <header><span>The Read</span><i className={onTrack ? "on-track" : "needs-work"}>{onTrack ? "On track" : "A gap to close"}</i></header>
          <div className="read-ring" style={{ "--progress": `${percentReady * 3.6}deg` } as React.CSSProperties}>
            <div><strong>{percentReady}<small>%</small></strong><span>funded</span></div>
          </div>
          <h2>{read}</h2>
          <p>Projected <b>{money(result.projectedCorpus, true)}</b> against a future target of <b>{money(result.futureTarget, true)}</b>.</p>
          <div className="result-split">
            <div><span>Your money</span><strong>{money(result.totalContributed, true)}</strong></div>
            <div><span>Growth doing the work</span><strong>{money(result.growthEarned, true)}</strong></div>
          </div>
          <div className="trajectory" role="img" aria-label={`Projected corpus grows to ${money(result.projectedCorpus, true)} over ${years} years`}>
            {result.series.map((point) => <i key={point.year} style={{ height: `${Math.max(6, point.corpus / Math.max(result.futureTarget, result.projectedCorpus) * 100)}%` }} />)}
          </div>
          <small className="result-caption">Illustration in nominal rupees · updates as you move a control</small>
        </aside>
      </section>

      <section className="decision-row">
        <article className="reality-card">
          <span>Reality Check</span>
          <h2>{emergencyReady ? "Your foundation is in place." : "Protect the plan before stretching it."}</h2>
          <p>{emergencyReady ? `At a 2% lower return, this plan could reach ${money(result.conservativeCorpus, true)}. Keep that range—not one forecast—in mind.` : "Build three to six months of essential expenses before increasing a long-term contribution. Resilience is part of the return."}</p>
        </article>
        <article className="moves-card">
          <span>Your Move</span><h2>Three honest ways forward.</h2>
          <div className="move-options">
            <button type="button" onClick={() => setMonthly(recommendedMonthly)} disabled={onTrack}>
              <i>01</i><span><b>{onTrack ? "Keep this rhythm" : `Add ${money(monthlyDelta, true)} monthly`}</b><small>{onTrack ? "Review once a year" : `Round contribution to ${money(recommendedMonthly, true)}`}</small></span>
            </button>
            <button type="button" onClick={() => result.extensionYears && setYears(years + result.extensionYears)} disabled={!result.extensionYears || onTrack}>
              <i>02</i><span><b>{result.extensionYears && !onTrack ? `Give it ${result.extensionYears} more ${result.extensionYears === 1 ? "year" : "years"}` : "Time is already working"}</b><small>Trade speed for a gentler monthly ask</small></span>
            </button>
            <button type="button" onClick={() => setStepUp(clamp(stepUp + 2, 0, 20))} disabled={stepUp >= 20 || onTrack}>
              <i>03</i><span><b>Step up with income</b><small>{onTrack ? `Your current ${stepUp}% step-up is enough` : `Try ${Math.min(20, stepUp + 2)}% each year`}</small></span>
            </button>
          </div>
        </article>
      </section>

      <ResultNotes
        assumptions={[
          "Contributions are modelled at each month-end and increase once a year.",
          goal.inflationAdjusted ? `The goal value rises with ${inflation}% annual inflation.` : "The selected milestone is treated as a nominal future amount.",
          "Taxes, fees, market volatility and changes in personal circumstances are not modelled.",
        ]}
        warnings={["This is an educational planning range, not a return promise or investment recommendation."]}
      />
    </div>
  );
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
