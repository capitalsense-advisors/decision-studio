import {expect,it} from "vitest";
import {emptyPlan,planSummary,projectGoal,validPlan} from "./planner";
it("protects the reserve and detects reused savings and monthly budget",()=>{
 const p={...emptyPlan,budget:10000,liquidSavings:100000,essentials:20000,reserveMonths:3,goals:[{id:"a",name:"Home",target:200000,years:2,monthly:12000,savings:50000,annualReturn:0}]};
 expect(validPlan(p)).toBe(true);expect(planSummary(p)).toMatchObject({availableSavings:40000,savingsGap:10000,budgetGap:2000});
 expect(projectGoal(p.goals[0]).value).toBe(338000);
});
it("rejects invalid or duplicate restored records",()=>{
 expect(validPlan({...emptyPlan,budget:Infinity})).toBe(false);
 expect(validPlan({...emptyPlan,goals:[null]})).toBe(false);
 expect(validPlan({...emptyPlan,reserveMonths:0})).toBe(false);
});
it("inflates today's-money targets and preserves nominal milestones",()=>{
 const g={id:"x",name:"Studies",target:100000,years:2,monthly:1000,savings:0,annualReturn:0,inflation:6,targetBasis:"today" as const};
 expect(projectGoal(g).target).toBeCloseTo(112360);expect(projectGoal({...g,targetBasis:"future"}).target).toBe(100000);
 expect(projectGoal(g,{inflationChange:2}).target).toBeCloseTo(116640);
});
it("does not double-count actual contributions in the new balance",()=>{
 const g={id:"x",name:"Trip",target:20000,years:1,monthly:1000,savings:0,annualReturn:0,createdDate:"2026-01-01",checkIns:[{date:"2026-03-01",balance:2500,contribution:1000,costBasis:null}]};
 const p=projectGoal(g);expect(p.months).toBe(10);expect(p.value).toBe(12500);expect(p.spendable).toBeNull();
});
it("withholds unknown tax and applies only explicitly assumed tax on gains",()=>{
 const g={id:"x",name:"Goal",target:1000,years:1,monthly:0,savings:1000,annualReturn:10,taxRate:20,costBasis:1000};
 expect(projectGoal(g).value).toBeCloseTo(1100);expect(projectGoal(g).tax).toBeCloseTo(20);expect(projectGoal(g).spendable).toBeCloseTo(1080);
 expect(projectGoal({...g,costBasis:null}).spendable).toBeNull();expect(projectGoal({...g,taxRate:null}).spendable).toBeNull();
});
it("rejects malformed import extensions",()=>{
 const g={id:"x",name:"Goal",target:1000,years:1,monthly:0,savings:0,annualReturn:0};
 expect(validPlan({...emptyPlan,goals:[{...g,taxRate:101}]})).toBe(false);
 expect(validPlan({...emptyPlan,goals:[{...g,checkIns:[null]}]})).toBe(false);
});
