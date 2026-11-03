import {indiaToday,projectGoal,type Goal} from "./planner";
import {deadlineFor,releaseMonth,type ScheduledAsset} from "./planning-realism";
export type SwpOptions={monthly:number;years:number;start:"now"|"deadline";inflationAdjusted:boolean};
export function validSwp(s:unknown):s is SwpOptions{if(!s||typeof s!=="object")return false;const v=s as SwpOptions;return Number.isFinite(v.monthly)&&v.monthly>0&&v.monthly<=1e12&&Number.isInteger(v.years)&&v.years>=1&&v.years<=50&&["now","deadline"].includes(v.start)&&typeof v.inflationAdjusted==="boolean";}
export function projectSwp(g:Goal,options:SwpOptions,assets:ScheduledAsset[]=[],returnChange=0){
 if(!validSwp(options))throw Error("Enter a positive withdrawal and a 1–50 year duration.");
 const accumulation=projectGoal(g,{returnChange},assets);
 const start=options.start==="deadline"?accumulation.deadline:accumulation.latest?.date??g.createdDate??indiaToday();
 const opening=options.start==="deadline"?accumulation.value:accumulation.latest?.balance??g.savings;
 const end=deadlineFor(start,options.years);
 const releases=options.start==="deadline"?[]:assets.filter(a=>a.goalId===g.id&&a.availableOn&&a.availableOn>start&&a.availableOn<=end&&a.availableOn<=accumulation.deadline);
 const rate=Math.pow((1+Math.max(-50,g.annualReturn+returnChange)/100)*(1-(g.annualFee??0)/100),1/12)-1;
 let balance=opening,totalWithdrawn=0,firstShortfall:number|null=null;const points=[{month:0,balance}];
 for(let month=1;month<=options.years*12;month++){
 balance=balance*(1+rate)+releases.filter(a=>releaseMonth(start,a.availableOn!)===month).reduce((sum,a)=>sum+a.amount,0);
 const requested=options.monthly*Math.pow(1+(g.inflation??0)/100,options.inflationAdjusted?Math.floor((month-1)/12):0);
 const paid=Math.min(requested,Math.max(0,balance));totalWithdrawn+=paid;balance=Math.max(0,balance-paid);
 if(paid+1e-6<requested&&firstShortfall===null)firstShortfall=month;
 if(month%12===0||month===firstShortfall)points.push({month,balance});
 }
 return {opening,balance,totalWithdrawn,firstShortfall,points,start,end};
}
