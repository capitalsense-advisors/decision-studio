import {validAssets,validRisk,deadlineFor,releaseMonth,type RiskAnswers,type ScheduledAsset} from "./planning-realism";
export const indiaToday = () => new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Kolkata"}).format(new Date());
export type CheckIn = { date: string; balance: number; contribution: number; costBasis: number | null };
export type Goal = { swp?: {monthly:number;years:number;start:"now"|"deadline";inflationAdjusted:boolean}; risk?: RiskAnswers; inflation?: number; targetBasis?: "future" | "today"; annualFee?: number; taxRate?: number | null; costBasis?: number | null; createdDate?: string; checkIns?: CheckIn[]; id: string; name: string; target: number; years: number; monthly: number; savings: number; annualReturn: number };
export type Plan = { assets?: ScheduledAsset[]; version: 1; budget: number; liquidSavings: number; essentials: number; reserveMonths: number; goals: Goal[] };
export const emptyPlan: Plan = { version: 1, budget: 0, liquidSavings: 0, essentials: 0, reserveMonths: 3, goals: [] };
const validNumber = (n: unknown) => typeof n === "number" && Number.isFinite(n) && n >= 0 && n <= 1e12;
export function validPlan(value: unknown): value is Plan {
 if (!value || typeof value !== "object") return false;
 const p = value as Plan;
 return p.version === 1 && [p.budget,p.liquidSavings,p.essentials].every(validNumber) && Number.isInteger(p.reserveMonths) && p.reserveMonths >= 1 && p.reserveMonths <= 24 && Array.isArray(p.goals) && p.goals.length <= 20 && new Set(p.goals.map(g=>g?.id)).size === p.goals.length && p.goals.every(g=>g && typeof g.id === "string" && typeof g.name === "string" && g.name.trim().length>0 && g.name.length<=80 && [g.target,g.monthly,g.savings].every(validNumber) && g.target>0 && Number.isInteger(g.years) && g.years>=1 && g.years<=50 && validNumber(g.annualReturn) && g.annualReturn<=15 && validExtras(g)) && (p.assets===undefined||validAssets(p.assets,p.goals.map(g=>g.id)));
}
export function planSummary(p: Plan) {
 const reserveTarget = p.essentials * p.reserveMonths;
 const availableSavings = Math.max(0,p.liquidSavings-reserveTarget);
 const assignedSavings = p.goals.reduce((sum,g)=>sum+g.savings,0);
 const assignedMonthly = p.goals.reduce((sum,g)=>sum+g.monthly,0);
 return {reserveTarget,availableSavings,assignedSavings,assignedMonthly,budgetGap:Math.max(0,assignedMonthly-p.budget),savingsGap:Math.max(0,assignedSavings-availableSavings),reserveGap:Math.max(0,reserveTarget-p.liquidSavings)};
}
const dateValid = (date: unknown): date is string => typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date) && Number.isFinite(Date.parse(date)) && new Date(date).toISOString().slice(0,10)===date;
function validExtras(g:Goal){
 return (g.swp===undefined||(g.swp!==null&&typeof g.swp==="object"&&validNumber(g.swp.monthly)&&g.swp.monthly>0&&Number.isInteger(g.swp.years)&&g.swp.years>=1&&g.swp.years<=50&&["now","deadline"].includes(g.swp.start)&&typeof g.swp.inflationAdjusted==="boolean")) && (g.risk===undefined||validRisk(g.risk)) && (g.inflation===undefined||(validNumber(g.inflation)&&g.inflation<=20)) && (g.targetBasis===undefined||["today","future"].includes(g.targetBasis)) && (g.annualFee===undefined||(validNumber(g.annualFee)&&g.annualFee<=10)) && (g.taxRate===undefined||g.taxRate===null||(validNumber(g.taxRate)&&g.taxRate<=100)) && (g.costBasis===undefined||g.costBasis===null||validNumber(g.costBasis)) && (g.createdDate===undefined||dateValid(g.createdDate)) && (g.checkIns===undefined||(Array.isArray(g.checkIns)&&g.checkIns.length<=600&&new Set(g.checkIns.map(c=>c?.date)).size===g.checkIns.length&&g.checkIns.every(c=>c&&dateValid(c.date)&&c.date<=indiaToday()&&(!g.createdDate||c.date>=g.createdDate)&&[c.balance,c.contribution].every(validNumber)&&(c.costBasis===null||validNumber(c.costBasis)))));
}
export function projectGoal(g: Goal, scenario:{returnChange?:number;inflationChange?:number;pauseMonths?:number}={}, assets:ScheduledAsset[]=[]) {
 const latest=[...(g.checkIns??[])].sort((a,b)=>b.date.localeCompare(a.date))[0];
 let elapsed=0;
 if(latest&&g.createdDate){const start=new Date(g.createdDate),last=new Date(latest.date);elapsed=Math.max(0,(last.getUTCFullYear()-start.getUTCFullYear())*12+last.getUTCMonth()-start.getUTCMonth());}
 const months=Math.max(0,g.years*12-elapsed);
 const annual=Math.max(-50,g.annualReturn+(scenario.returnChange??0))/100;
 const r=Math.pow((1+annual)*(1-(g.annualFee??0)/100),1/12)-1;
 const baseline=latest?.date??g.createdDate??indiaToday();
 const deadline=deadlineFor(g.createdDate??baseline,g.years);
 const eligible=assets.filter(a=>a.goalId===g.id&&a.availableOn!==null&&a.availableOn>baseline&&a.availableOn<=deadline);
 let value=latest?.balance??g.savings,contributions=0,released=0;
 for(let month=0;month<months;month++){const deposit=month<(scenario.pauseMonths??0)?0:g.monthly;const release=eligible.filter(a=>releaseMonth(baseline,a.availableOn!)===month+1).reduce((n,a)=>n+a.amount,0);value=value*(1+r)+deposit+release;contributions+=deposit;released+=release;}
 const target=g.target*Math.pow(1+((g.inflation??0)+(scenario.inflationChange??0))/100,g.targetBasis==="today"?g.years:0);
 const basis=latest?latest.costBasis:(g.costBasis??(g.savings===0?0:null));
 const gain=basis===null||released>0?null:Math.max(0,value-basis-contributions);
 const tax=g.taxRate==null||gain===null?null:gain*g.taxRate/100;
 const spendable=tax===null?null:value-tax;
 return {value,released,deadline,target,gap:Math.max(0,target-value),spendable,tax,spendableGap:spendable===null?null:Math.max(0,target-spendable),months,latest};
}
