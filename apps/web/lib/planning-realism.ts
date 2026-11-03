export type RiskAnswers = {comfort:"low"|"medium"|"high";income:"stable"|"variable";debt:"manageable"|"expensive";deadline:"fixed"|"flexible";importance:"essential"|"optional"};
export type ScheduledAsset = {id:string;name:string;amount:number;availableOn:string|null;goalId:string|null;separate:true};
export function planningStance(answers:RiskAnswers|undefined,years:number,foundation:{known:boolean;reserveGap:number;budgetGap:number;savingsGap:number}){
 if(!answers||!foundation.known)return {theme:null,reasons:["Complete the money foundation and five reflection questions first."]};
 const reasons:string[]=[];
 if(years<=3)reasons.push("The goal is within three years.");
 if(foundation.reserveGap>0)reasons.push("The emergency reserve is not fully covered.");
 if(foundation.budgetGap>0||foundation.savingsGap>0)reasons.push("The same money is over-allocated.");
 if(answers.income==="variable")reasons.push("Income varies.");
 if(answers.debt==="expensive")reasons.push("Expensive debt needs attention.");
 if(answers.importance==="essential"&&answers.deadline==="fixed"&&years<=5)reasons.push("An essential, fixed-date goal leaves less room for loss.");
 const theme=reasons.length||answers.comfort==="low"?"Conservative":answers.comfort==="high"&&years>=7&&answers.deadline==="flexible"?"Aggressive":"Balanced";
 return {theme,reasons:reasons.length?reasons:[theme==="Aggressive"?"Higher stated loss comfort, a flexible deadline and at least seven years.":theme==="Conservative"?"You prefer smaller losses.":"Your stated comfort and timeline support a middle planning stance."]};
}
export function deadlineFor(created:string,years:number){const start=new Date(created+"T12:00:00Z");const year=start.getUTCFullYear()+years;const month=start.getUTCMonth();const day=Math.min(start.getUTCDate(),new Date(Date.UTC(year,month+1,0)).getUTCDate());return new Date(Date.UTC(year,month,day)).toISOString().slice(0,10);}
export function releaseMonth(start:string,date:string){const a=new Date(start+"T12:00:00Z"),b=new Date(date+"T12:00:00Z");return Math.max(0,(b.getUTCFullYear()-a.getUTCFullYear())*12+b.getUTCMonth()-a.getUTCMonth()+(b.getUTCDate()>a.getUTCDate()?1:0));}
const num=(n:unknown)=>typeof n==="number"&&Number.isFinite(n)&&n>=0&&n<=1e12;
export function validRisk(r:unknown):r is RiskAnswers{if(!r||typeof r!=="object")return false;const a=r as RiskAnswers;return ["low","medium","high"].includes(a.comfort)&&["stable","variable"].includes(a.income)&&["manageable","expensive"].includes(a.debt)&&["fixed","flexible"].includes(a.deadline)&&["essential","optional"].includes(a.importance);}
export function realDate(d:unknown):d is string{return typeof d==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(d)&&Number.isFinite(Date.parse(d))&&new Date(d).toISOString().slice(0,10)===d;}
export function validAssets(value:unknown,ids:string[]):value is ScheduledAsset[]{return Array.isArray(value)&&value.length<=100&&new Set(value.map(a=>a?.id)).size===value.length&&value.every(a=>a&&typeof a.id==="string"&&a.id.length>0&&a.id.length<=80&&typeof a.name==="string"&&a.name.trim().length>0&&a.name.length<=80&&num(a.amount)&&a.amount>0&&a.separate===true&&(a.availableOn===null||realDate(a.availableOn))&&(a.goalId===null||ids.includes(a.goalId)));}
export type TaxLot={id:string;bought:string;units:number;unitCost:number};
export type TaxPolicy={shortRate:number;longRate:number;longAfterMonths:number;remainingAnnualExemption:number;cessRate:number;source:string;asOf:string};
export function fifoSale(lots:TaxLot[],saleDate:string,units:number,unitPrice:number,policy:TaxPolicy){
 if(!realDate(saleDate)||![units,unitPrice].every(num)||units<=0||!policy.source.trim()||!realDate(policy.asOf)||policy.asOf>saleDate||![policy.shortRate,policy.longRate,policy.cessRate].every(n=>num(n)&&n<=100)||!Number.isInteger(policy.longAfterMonths)||policy.longAfterMonths<1||policy.longAfterMonths>120||!num(policy.remainingAnnualExemption)||!lots.length||lots.length>600||new Set(lots.map(l=>l.id)).size!==lots.length||lots.some(l=>!realDate(l.bought)||l.bought>saleDate||!num(l.units)||l.units<=0||!num(l.unitCost)))throw Error("Check lots, sale date, source date and user-supplied tax assumptions.");
 let remaining=units;const allocations=([...lots].sort((a,b)=>a.bought.localeCompare(b.bought)||a.id.localeCompare(b.id))).flatMap(lot=>{
 const sold=Math.min(lot.units,remaining);remaining-=sold;if(sold<=0)return [];
 // Exact month-anniversary boundary, not an approximate day count.
 const a=new Date(lot.bought+"T12:00:00Z"),end=new Date(saleDate+"T12:00:00Z");const months=(end.getUTCFullYear()-a.getUTCFullYear())*12+end.getUTCMonth()-a.getUTCMonth();
 const anniversary=new Date(Date.UTC(a.getUTCFullYear(),a.getUTCMonth()+policy.longAfterMonths,1,12));anniversary.setUTCDate(Math.min(a.getUTCDate(),new Date(Date.UTC(anniversary.getUTCFullYear(),anniversary.getUTCMonth()+1,0)).getUTCDate()));
 const longTerm=months>=policy.longAfterMonths&&end>anniversary;
 return [{id:lot.id,bought:lot.bought,units:sold,cost:sold*lot.unitCost,gain:sold*(unitPrice-lot.unitCost),longTerm}];
 });
 if(remaining>1e-8)throw Error("The sale exceeds the units available in these lots.");
 const shortGain=allocations.filter(l=>!l.longTerm).reduce((n,l)=>n+l.gain,0),longGain=allocations.filter(l=>l.longTerm).reduce((n,l)=>n+l.gain,0);
 // Loss set-off/carry-forward is intentionally not inferred. Withhold tax if a loss is present.
 const hasLoss=allocations.some(l=>l.gain<0);
 const baseTax=Math.max(0,shortGain)*policy.shortRate/100+Math.max(0,longGain-policy.remainingAnnualExemption)*policy.longRate/100;
 const tax=hasLoss?null:baseTax*(1+policy.cessRate/100),gross=units*unitPrice;
 return {allocations,shortGain,longGain,gross,tax,net:tax===null?null:gross-tax,hasLoss};
}
