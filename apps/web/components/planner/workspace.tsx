"use client";
import Link from "next/link";
import Image from "next/image";
import {useState,type CSSProperties} from "react";
import {money} from "@/lib/format";
import {planSummary,projectGoal,type Goal} from "@/lib/planner";
import {RiskReflection,AssetAvailability,TaxLotWorksheet} from "./advanced-planning";
import {SwpCalculator} from "./swp-calculator";
import {ReviewTools} from "./review-tools";
import {usePlanner} from "./provider";
import {StrideReferral} from "@/components/stride-referral";
import {GoalPreview,MoneyPlayground} from "./plan-playground";
import styles from "./workspace.module.css";
const headings={overview:["YOUR NEXT CHAPTER","Big plans. Real-life budgets.","One budget. Your priorities. Room for real life."],goals:["WHAT MATTERS TO YOU","Your someday starts with a plan.","First crore, higher studies or a place of your own. Let’s put a number on it."],money:["YOUR FOUNDATION","Money sorted. Breathing room included.","No salary reveal needed. Start with what’s left after rent, EMIs and real life."],review:["A MOMENT TO REFLECT","Life changes. Your plan can too.","See the constraints and assumptions before making your next move."]};
const workspaceVisuals={
 overview:{lead:"Big plans.",accent:"Real-life budgets.",asset:"/media/planner/overview-journey.webp",alt:"A rupee coin moving across three steps toward a goal flag",index:"01",label:"See the whole plan"},
 goals:{lead:"Your someday",accent:"starts with a plan.",asset:"/media/planner/goals-target.webp",alt:"A goal target surrounded by home, education and travel milestones",index:"02",label:"Name what matters"},
 money:{lead:"Money sorted.",accent:"Breathing room included.",asset:"/media/planner/money-foundation.webp",alt:"A rupee coin protected inside a soft safety cushion",index:"03",label:"Protect the foundation"},
 review:{lead:"Life changes.",accent:"Your plan can too.",asset:"/media/planner/review-paths.webp",alt:"Two planning paths being compared with a check marker",index:"04",label:"Check the honest read"},
};

export function PlanningWorkspace({screen}:{screen:keyof typeof headings}) {
 const {plan,setPlan,message,save,clear,ready}=usePlanner();const summary=planSummary(plan);
 const [editing,setEditing]=useState<string|null>(null);
 const [error,setError]=useState("");const [confirmDelete,setConfirmDelete]=useState(false);
 const [draft,setDraft]=useState({name:"",target:"",years:"5",monthly:"",savings:"",annualReturn:"0",inflation:"0",annualFee:"0",taxRate:"",costBasis:"",targetBasis:"future"});
 function editGoal(g:Goal){setEditing(g.id);setDraft({name:g.name,target:String(g.target),years:String(g.years),monthly:String(g.monthly),savings:String(g.savings),annualReturn:String(g.annualReturn),inflation:String(g.inflation??0),annualFee:String(g.annualFee??0),taxRate:g.taxRate==null?"":String(g.taxRate),costBasis:g.costBasis==null?"":String(g.costBasis),targetBasis:g.targetBasis??"future"});window.scrollTo({top:0,behavior:"auto"});}
 const [eyebrow,,subtitle]=headings[screen];
 const visual=workspaceVisuals[screen];
 function addGoal(e:React.FormEvent){e.preventDefault();const goal:Goal={id:editing??crypto.randomUUID(),createdDate:plan.goals.find(g=>g.id===editing)?.createdDate??new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Kolkata"}).format(new Date()),checkIns:plan.goals.find(g=>g.id===editing)?.checkIns,risk:plan.goals.find(g=>g.id===editing)?.risk,swp:plan.goals.find(g=>g.id===editing)?.swp,inflation:Number(draft.inflation),annualFee:Number(draft.annualFee),taxRate:draft.taxRate===""?null:Number(draft.taxRate),costBasis:draft.costBasis===""?null:Number(draft.costBasis),targetBasis:draft.targetBasis as "future"|"today",name:draft.name.trim(),target:Number(draft.target),years:Number(draft.years),monthly:Number(draft.monthly||0),savings:Number(draft.savings||0),annualReturn:Number(draft.annualReturn)};
 if(!goal.name||goal.name.length>80||!Number.isFinite(goal.target)||goal.target<=0||goal.target>1e12||![goal.monthly,goal.savings,goal.annualReturn].every(n=>Number.isFinite(n)&&n>=0&&n<=1e12)||goal.annualReturn>15||!Number.isInteger(goal.years)||goal.years<1||goal.years>50||(!editing&&plan.goals.length>=20)||!Number.isFinite(goal.inflation)||goal.inflation!<0||goal.inflation!>20||!Number.isFinite(goal.annualFee)||goal.annualFee!<0||goal.annualFee!>10||(goal.taxRate!==null&&(!Number.isFinite(goal.taxRate)||goal.taxRate!<0||goal.taxRate!>100))||(goal.costBasis!==null&&(!Number.isFinite(goal.costBasis)||goal.costBasis!<0||goal.costBasis!>1e12))){setError("Enter a name, positive target, 1–50 years, non-negative allocations and a return assumption from 0–15%.");return;}
 setPlan({...plan,goals:editing?plan.goals.map(g=>g.id===editing?goal:g):[...plan.goals,goal]});setDraft({...draft,name:"",target:"",monthly:"",savings:""});setError("");setEditing(null);}
 return <div className={`${styles.workspace} ${styles[screen]}`}>
  <header className={styles.hero}>
   <div className={styles.heroCopy}><span className={styles.eyebrow}>{eyebrow}</span><h1>{visual.lead}<br/><em>{visual.accent}</em></h1><p>{subtitle}</p><div className={styles.heroMeta}><span><i/>Private by default</span><span>Manual assumptions</span><span>No signup</span></div></div>
   <div className={styles.heroVisual} aria-hidden="true"><div className={styles.visualHalo}/><Image className={styles.heroAsset} src={visual.asset} alt={visual.alt} width={720} height={720} priority={screen==="overview"}/><div className={styles.visualLabel}><span>{visual.index} / 04</span><strong>{visual.label}</strong></div></div>
  </header>
  <div className={styles.storage}><span role="status">{ready?message:"Opening your workspace…"}</span><button className="button secondary" disabled={!ready} onClick={save}>Save on this device</button></div>
  {!ready?<p>Loading your plan…</p>:<>
  {(summary.budgetGap>0||summary.savingsGap>0)&&<div className={styles.warning} role="alert">Your goals share the same money. {summary.budgetGap>0&&`${money(summary.budgetGap)} more per month is allocated than your budget allows. `}{summary.savingsGap>0&&`${money(summary.savingsGap)} more savings are assigned than are available after the reserve.`} Review allocations before treating the projections as feasible.</div>}
  {screen==="overview"&&<>
   <section className={styles.metrics} aria-label="Your planning position"><Metric label="Monthly budget" value={money(plan.budget)} note="Your chosen amount, not independently verified"/><Metric label="Assigned to goals" value={money(summary.assignedMonthly)} note="Per month across all goals"/><Metric label="Reserve to protect" value={money(summary.reserveTarget)} note={plan.essentials?`${plan.reserveMonths} months of essential spending`:"Enter essentials to calculate your reserve"}/></section>
   {!plan.goals.length?<section className={styles.empty}><span className={styles.eyebrow}>LET’S START SMALL</span><h2>What would you like your money to make possible?</h2><p>No salary details or account connections needed. Start with one goal; build the rest when you’re ready.</p><Link className="button" href="/goals">Create my first goal →</Link><Link href="/my-money">Work out my starting budget</Link></section>:<section className={styles.panel}><div className={styles.sectionHead}><h2>Your goals, together.</h2><Link href="/goals">Manage goals →</Link></div><GoalList goals={plan.goals}/></section>}
   <div className={styles.steps}>{[["01","Make space","Set a monthly amount that leaves breathing room.","/my-money"],["02","Choose what matters","Give each goal a share of the same budget.","/goals"],["03","Keep it honest","Check gaps, assumptions and access to your money.","/review"]].map(([n,h,p,url])=><Link href={url} key={n}><span>{n}</span><h3>{h}</h3><p>{p}</p></Link>)}</div>
  </>}
  {screen==="money"&&<MoneyPlayground/>}
  {screen==="money"&&<AssetAvailability/>}
  {screen==="goals"&&<>
   <section className={styles.goalStudio}>
    <div className={styles.goalComposer}>
     <span className={styles.eyebrow}>START WITH A POSSIBILITY</span>
     <h2>{editing?"Let’s reshape this goal.":"What would feel exciting to make real?"}</h2>
     <div className={styles.templateRow} aria-label="Goal starting points">{[
      {name:"My first ₹1 crore",target:"10000000",years:"10"},
      {name:"Home down payment",target:"3000000",years:"5"},
      {name:"Higher studies",target:"2000000",years:"4"},
      {name:"Career break",target:"600000",years:"2"},
      {name:"A trip I’m saving for",target:"250000",years:"1"},
     ].map(option=><button type="button" key={option.name} aria-pressed={draft.name===option.name} onClick={()=>setDraft({...draft,...option})}>{option.name}</button>)}</div>
     <form onSubmit={addGoal}>
      <label className={styles.ideaField}><span>Name this possibility</span><input required maxLength={80} value={draft.name} placeholder="A home with a sunlit balcony" onChange={e=>setDraft({...draft,name:e.target.value})}/></label>
      <label className={styles.choiceField}><span>How are you imagining the amount?</span><select value={draft.targetBasis} onChange={e=>setDraft({...draft,targetBasis:e.target.value})}><option value="future">A fixed rupee target at the deadline</option><option value="today">What this amount buys today</option></select></label>
      <div className={styles.goalLevers}>
       <GoalLever label="Target" prefix="₹" value={draft.target} min={10000} max={Math.max(10000000,Number(draft.target)||0)} step={10000} onChange={target=>setDraft({...draft,target})}/>
       <GoalLever label="Time to explore" suffix=" years" value={draft.years} min={1} max={30} step={1} onChange={years=>setDraft({...draft,years})}/>
       <GoalLever label="Monthly rhythm" prefix="₹" value={draft.monthly} min={0} max={Math.max(200000,Number(draft.monthly)||0)} step={1000} onChange={monthly=>setDraft({...draft,monthly})}/>
       <GoalLever label="Already set aside" prefix="₹" value={draft.savings} min={0} max={Math.max(5000000,Number(draft.savings)||0)} step={10000} onChange={savings=>setDraft({...draft,savings})}/>
      </div>
      <details className={styles.assumptions}><summary>Curious about return, inflation, fees or tax? <span>Open the assumption lab</span></summary><div className={styles.form}>{([["annualReturn","Annual return assumption (%)","0"],["inflation","Annual inflation assumption (%)","0"],["annualFee","Annual fee assumption (%)","0"],["taxRate","Illustrative tax on gains (%) — optional","Unknown"],["costBasis","Cost of savings already invested — optional","Unknown"]] as const).map(([key,label,placeholder])=><label key={key}><span>{label}</span><input type="number" min="0" max={key==="annualReturn"?15:key==="inflation"?20:key==="annualFee"?10:key==="taxRate"?100:1e12} step="any" value={draft[key]} placeholder={placeholder} onChange={e=>setDraft({...draft,[key]:e.target.value})}/></label>)}</div></details>
      <p className={styles.note}>The picture is a projection, not a promise. Return, inflation and fees stay visible as your assumptions; optional tax remains an illustrative what-if.</p>
      {error&&<p role="alert">{error}</p>}
      <div className={styles.formActions}><button className="button" type="submit" disabled={!editing&&plan.goals.length>=20}>{editing?"Save this version":"Keep this goal"}</button>{editing&&<button type="button" className="button secondary" onClick={()=>{setEditing(null);setDraft({...draft,name:"",target:"",monthly:"",savings:""});}}>Cancel</button>}</div>
     </form>
    </div>
    <GoalPreview draft={draft}/>
   </section>
   <section className={styles.panel}><div className={styles.sectionHead}><h2>Your priorities.</h2><span>{plan.goals.length}/20 goals</span></div><GoalList goals={plan.goals} edit={editGoal} remove={id=>setPlan({...plan,goals:plan.goals.filter(g=>g.id!==id),assets:plan.assets?.map(a=>a.goalId===id?{...a,goalId:null}:a)})}/></section>
  </>}
  {screen==="review"&&<><section className={styles.darkPanel}><span className={styles.eyebrow}>THE HONEST READ</span><h2>{!plan.goals.length?"Your first goal comes next.":summary.budgetGap||summary.savingsGap?"The plan needs a little more room.":"Allocations fit. Now check the assumptions."}</h2><p>Fitting a budget does not guarantee a goal. Check-ins and scenarios help you keep it real. Use the risk reflection, future releases and tax-lot worksheet below. Product-specific access rules and Indian tax-policy applicability still need independent verification. An illustrative tax scenario is not a verified spendable amount.</p><Link className="button" href="/goals">Review goal amounts →</Link></section><section className={styles.panel}><h2>Before you act.</h2><ul className={styles.checklist}><li>Monthly commitments: {summary.budgetGap?"over your chosen budget":"within your chosen budget"}.</li><li>Reserve: {plan.essentials===0?"essential spending has not been entered":summary.reserveGap?`${money(summary.reserveGap)} still to build`:"target covered by entered liquid savings"}.</li><li>Savings allocations: {summary.savingsGap?"more than the available pool":"within the remaining pool"}.</li><li>Fees use your entered assumption. Tax is unknown unless you enter a simplified gains-tax scenario and cost basis; Indian tax rules are not yet applied.</li><li>All entries are manual and should be checked against current statements.</li></ul><GoalList goals={plan.goals}/></section><RiskReflection/><ReviewTools/><SwpCalculator/><TaxLotWorksheet/><section className={styles.panel}><h2>Your plan stays yours.</h2><p>Saving is optional, device-local and not encrypted by Paisaan or synced to an account. Installing the app does not back it up. Changes are saved only when you press Save.</p><button className="button secondary" onClick={()=>setConfirmDelete(true)}>Delete this plan</button>{confirmDelete&&<div className={styles.callout}><p>Delete the plan from this session and this device? This cannot be undone.</p><button className="button" onClick={()=>{clear();setConfirmDelete(false);}}>Confirm deletion</button> <button className="button secondary" onClick={()=>setConfirmDelete(false)}>Keep plan</button></div>}</section></>}
  <StrideReferral/>
  </>}
 </div>;
}
function Metric({label,value,note}:{label:string;value:string;note:string}){return <article><span>{label}</span><strong>{value}</strong><small>{note}</small></article>;}
function GoalLever({label,value,min,max,step,prefix="",suffix="",onChange}:{label:string;value:string;min:number;max:number;step:number;prefix?:string;suffix?:string;onChange:(value:string)=>void}){const number=Math.max(min,Math.min(max,Number(value)||min));const fill=((number-min)/(max-min))*100;return <label className={styles.goalLever}><span><b>{label}</b><output>{prefix}{number.toLocaleString("en-IN")}{suffix}</output></span><input type="range" min={min} max={max} step={step} value={number} style={{"--range-fill":`${fill}%`} as CSSProperties} onChange={event=>onChange(event.target.value)}/></label>;}
function GoalList({goals,remove,edit}:{goals:Goal[];remove?:(id:string)=>void;edit?:(goal:Goal)=>void}){const {plan}=usePlanner();return goals.length?<div className={styles.goalList}>{goals.map(g=>{const r=projectGoal(g,{},plan.assets??[]);return <article key={g.id}><div><span className={styles.eyebrow}>{g.years} YEARS · {g.targetBasis==="today"?"TODAY’S MONEY":"FUTURE RUPEES"}</span><h3>{g.name}</h3><p>{money(g.monthly)}/month · {money(g.savings)} assigned today</p></div><div><strong>{money(r.value,true)}</strong><small>Projected after assumed annual fees, before tax · {g.annualReturn}% return assumed</small><progress aria-label={`${g.name} projected target coverage`} max={r.target} value={Math.min(r.target,r.value)}/><p>{r.gap?`${money(r.gap,true)} gap before tax`:"Before-tax target reached; tax and access checks still matter"}</p><small>{r.released>0?`${money(r.released)} in future releases included · `:""}Target at the deadline: {money(r.target,true)}{r.latest?` · Updated from ${r.latest.date}`:""}</small><small>{r.spendable===null?"Spendable amount unknown: tax rate or cost basis is missing, including any future releases.":`Illustrative amount after assumed tax: ${money(r.spendable,true)}. After-tax scenario gap: ${money(r.spendableGap,true)}. Not based on verified Indian tax rules.`}</small>{edit&&<button className="button secondary" onClick={()=>edit(g)} aria-label={`Edit ${g.name}`}>Edit goal</button>}{remove&&<button className="button secondary" onClick={()=>remove(g.id)} aria-label={`Remove ${g.name}`}>Remove goal</button>}</div></article>;})}</div>:<p>No goals yet. Add one when you’re ready.</p>;}
