"use client";

import type { CSSProperties } from "react";

import { money } from "@/lib/format";
import { planSummary, projectGoal, type Goal } from "@/lib/planner";
import { usePlanner } from "./provider";
import styles from "./workspace.module.css";

type GoalDraft = {
  name: string;
  target: string;
  years: string;
  monthly: string;
  savings: string;
  annualReturn: string;
  inflation: string;
  annualFee: string;
  targetBasis: string;
};

const rupee = (value: number) => money(value, true);

export function MoneyPlayground() {
  const { plan, setPlan } = usePlanner();
  const summary = planSummary(plan);
  const reserveCoverage = summary.reserveTarget > 0 ? Math.min(100, (plan.liquidSavings / summary.reserveTarget) * 100) : 0;
  const goalCoverage = plan.budget > 0 ? Math.min(100, (summary.assignedMonthly / plan.budget) * 100) : 0;
  const protectedShare = plan.liquidSavings > 0 ? Math.min(100, (Math.min(summary.reserveTarget, plan.liquidSavings) / plan.liquidSavings) * 100) : 0;
  const ringStyle = { "--ring-value": `${protectedShare * 3.6}deg` } as CSSProperties;

  return <section className={styles.playground} aria-labelledby="money-playground-title">
    <div className={styles.playgroundIntro}>
      <span className={styles.eyebrow}>MOVE A LEVER. WATCH THE PLAN.</span>
      <h2 id="money-playground-title">How much room feels like yours?</h2>
      <p>There is no perfect number hiding in a form. Move the sliders until the balance feels realistic; the picture responds as you go.</p>
      <div className={styles.presetRow} aria-label="Monthly goal budget starting points">
        {[5000, 10000, 25000, 50000].map((amount) => <button key={amount} type="button" aria-pressed={plan.budget === amount} onClick={() => setPlan({ ...plan, budget: amount })}>{rupee(amount)}</button>)}
      </div>
    </div>

    <div className={styles.liveStudio}>
      <div className={styles.levers}>
        <RangeLever label="Monthly room for goals" hint="After bills, EMIs and ordinary life" value={plan.budget} min={0} max={Math.max(100000, plan.budget)} step={1000} onChange={(budget) => setPlan({ ...plan, budget })} />
        <RangeLever label="Savings you can reach today" hint="Cash and genuinely liquid savings" value={plan.liquidSavings} min={0} max={Math.max(5000000, plan.liquidSavings)} step={25000} onChange={(liquidSavings) => setPlan({ ...plan, liquidSavings })} />
        <RangeLever label="Essential monthly spending" hint="Only the spending that cannot wait" value={plan.essentials} min={0} max={Math.max(300000, plan.essentials)} step={2500} onChange={(essentials) => setPlan({ ...plan, essentials })} />
        <label className={styles.choiceField}><span>How much safety feels right?</span><select value={plan.reserveMonths} onChange={(event) => setPlan({ ...plan, reserveMonths: Number(event.target.value) })}>{[1, 2, 3, 4, 6, 9, 12, 18, 24].map((months) => <option value={months} key={months}>{months} month{months === 1 ? "" : "s"} of essentials</option>)}</select><small>You can revisit this whenever life changes.</small></label>
      </div>

      <aside className={styles.moneyPicture} aria-live="polite">
        <span className={styles.liveBadge}><i /> LIVE PICTURE</span>
        <div className={styles.reserveRing} style={ringStyle}><div><strong>{rupee(summary.availableSavings)}</strong><span>free for goals after your reserve</span></div></div>
        <div className={styles.pictureLegend}>
          <div><i className={styles.reserveDot} /><span>Protected reserve</span><strong>{rupee(Math.min(summary.reserveTarget, plan.liquidSavings))}</strong></div>
          <div><i className={styles.openDot} /><span>Available pool</span><strong>{rupee(summary.availableSavings)}</strong></div>
        </div>
        <div className={styles.signalGrid}>
          <div><span>Safety net</span><strong>{summary.reserveGap > 0 ? `${Math.round(reserveCoverage)}% built` : plan.essentials ? "Covered" : "Add essentials"}</strong></div>
          <div><span>Monthly room used</span><strong>{Math.round(goalCoverage)}%</strong></div>
        </div>
        <p className={styles.dynamicNudge}>{plan.essentials === 0 ? "Curious what your real buffer is? Add essential spending and this circle will split." : summary.reserveGap > 0 ? `${rupee(summary.reserveGap)} more would complete the safety net you chose.` : summary.assignedMonthly > plan.budget ? "Your goals are asking for more than the monthly room you chose." : "Your safety net is protected. The remaining pool can now work toward goals."}</p>
      </aside>
    </div>
  </section>;
}

function RangeLever({ label, hint, value, min, max, step, onChange }: { label: string; hint: string; value: number; min: number; max: number; step: number; onChange: (value: number) => void }) {
  const id = label.toLowerCase().replace(/[^a-z]+/g, "-");
  const fill = max > min ? ((value - min) / (max - min)) * 100 : 0;
  return <label className={styles.rangeLever} htmlFor={id}>
    <span><b>{label}</b><output htmlFor={id}>{rupee(value)}</output></span>
    <input id={id} type="range" min={min} max={max} step={step} value={value} style={{ "--range-fill": `${fill}%` } as CSSProperties} onChange={(event) => onChange(Number(event.target.value))} />
    <small>{hint}</small>
  </label>;
}

export function GoalPreview({ draft }: { draft: GoalDraft }) {
  const goal: Goal = {
    id: "preview",
    name: draft.name || "Your possibility",
    target: Math.max(0, Number(draft.target) || 0),
    years: Math.max(1, Math.min(50, Math.round(Number(draft.years) || 1))),
    monthly: Math.max(0, Number(draft.monthly) || 0),
    savings: Math.max(0, Number(draft.savings) || 0),
    annualReturn: Math.max(0, Math.min(15, Number(draft.annualReturn) || 0)),
    inflation: Math.max(0, Number(draft.inflation) || 0),
    annualFee: Math.max(0, Number(draft.annualFee) || 0),
    targetBasis: draft.targetBasis === "today" ? "today" : "future",
  };
  const projection = projectGoal(goal);
  const coverage = projection.target > 0 ? Math.min(100, (projection.value / projection.target) * 100) : 0;
  const today = goal.savings;
  const contributions = goal.monthly * goal.years * 12;
  const growth = Math.max(0, projection.value - today - contributions);
  const total = Math.max(1, projection.value);

  return <aside className={styles.goalPreview} aria-live="polite">
    <span className={styles.liveBadge}><i /> YOUR IDEA, TAKING SHAPE</span>
    <div className={styles.goalOrbit} style={{ "--goal-progress": `${coverage * 3.6}deg` } as CSSProperties}>
      <div><span>{Math.round(coverage)}%</span><small>of target</small></div><i aria-hidden="true">✦</i>
    </div>
    <div className={styles.previewCopy}><span>Projected at the deadline</span><strong>{rupee(projection.value)}</strong><p>{projection.gap > 0 ? `${rupee(projection.gap)} still to explore` : "The projection reaches your target"}</p></div>
    <div className={styles.storyBar} aria-label="Projection ingredients">
      <i style={{ width: `${(today / total) * 100}%` }} title="Starting savings" />
      <i style={{ width: `${(contributions / total) * 100}%` }} title="Monthly contributions" />
      <i style={{ width: `${(growth / total) * 100}%` }} title="Assumed growth" />
    </div>
    <div className={styles.storyLegend}><span><i />Today</span><span><i />You add</span><span><i />Assumed growth</span></div>
    <p className={styles.dynamicNudge}>{goal.target === 0 ? "Choose an amount and watch the path appear." : goal.monthly === 0 ? "What happens if you give this goal a small monthly rhythm?" : goal.annualReturn === 0 ? "This view assumes no market growth yet—your own contributions are doing the work." : "Try moving time or the monthly amount. Which one changes the story more?"}</p>
  </aside>;
}
