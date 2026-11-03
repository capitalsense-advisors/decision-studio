import {describe,it,expect} from "vitest";
import {fifoSale,planningStance,deadlineFor,validAssets,type TaxPolicy,type RiskAnswers} from "./planning-realism";
import {projectGoal,validPlan,emptyPlan,type Goal} from "./planner";
const policy:TaxPolicy={shortRate:20,longRate:10,longAfterMonths:12,remainingAnnualExemption:50,cessRate:4,source:"Test policy only",asOf:"2024-01-01"};
const lot={id:"a",bought:"2024-01-15",units:10,unitCost:100};
const goal:Goal={id:"g",name:"Home",createdDate:"2024-01-01",years:2,target:2000,monthly:0,savings:100,annualReturn:0,taxRate:0,costBasis:100};
const asset={id:"a",name:"FD",amount:500,availableOn:"2025-01-01",goalId:"g",separate:true as const};
describe("manual tax-lot policy",()=>{
 it("uses FIFO, partial lots, per-sale exemption and cess",()=>{const r=fifoSale([{...lot,id:"b",bought:"2025-01-01",units:5},lot],"2025-02-01",12,150,policy);expect(r.allocations.map(l=>l.units)).toEqual([10,2]);expect(r.shortGain).toBe(100);expect(r.longGain).toBe(500);expect(r.tax).toBeCloseTo(67.6);expect(r.net).toBeCloseTo(1732.4);});
 it("treats the exact month anniversary as short term",()=>{expect(fifoSale([lot],"2025-01-15",1,150,policy).allocations[0].longTerm).toBe(false);expect(fifoSale([lot],"2025-01-16",1,150,policy).allocations[0].longTerm).toBe(true);});
 it("withholds net proceeds when any lot loses money",()=>{expect(fifoSale([lot],"2025-02-01",1,90,policy).net).toBeNull();});
 it("rejects overselling and unsupported input",()=>{expect(()=>fifoSale([lot],"2025-02-01",11,150,policy)).toThrow();expect(()=>fifoSale([lot],"2025-02-01",1,150,{...policy,source:""})).toThrow();expect(()=>fifoSale([lot],"2025-02-01",1,150,{...policy,asOf:"2026-01-01"})).toThrow();});
});
describe("money available later",()=>{
 it("counts only assigned releases before deadline, once",()=>{const r=projectGoal(goal,{},[asset,{...asset,id:"b",availableOn:null},{...asset,id:"c",availableOn:"2027-01-01"},{...asset,id:"d",goalId:null}]);expect(r.value).toBe(600);expect(r.released).toBe(500);expect(r.spendable).toBeNull();});
 it("does not double count releases already inside a check-in",()=>{expect(projectGoal({...goal,checkIns:[{date:"2025-01-01",balance:600,contribution:0,costBasis:600}]},{},[asset]).value).toBe(600);});
 it("handles leap-day deadlines and validates imports",()=>{expect(deadlineFor("2024-02-29",1)).toBe("2025-02-28");expect(validAssets([{...asset,availableOn:"2025-02-30"}],["g"])).toBe(false);expect(validPlan({...emptyPlan,goals:[goal],assets:[{...asset,goalId:"missing"}]})).toBe(false);});
});
describe("goal-specific planning reflection",()=>{const a:RiskAnswers={comfort:"high",income:"stable",debt:"manageable",deadline:"flexible",importance:"optional"};const foundation={known:true,reserveGap:0,budgetGap:0,savingsGap:0};it("lets capacity constraints override high comfort",()=>{expect(planningStance(a,10,foundation).theme).toBe("Aggressive");expect(planningStance(a,2,foundation).theme).toBe("Conservative");expect(planningStance(a,10,{...foundation,reserveGap:1}).theme).toBe("Conservative");expect(planningStance({...a,comfort:"medium"},10,foundation).theme).toBe("Balanced");});it("withholds a theme for unknown foundations",()=>{expect(planningStance(a,10,{...foundation,known:false}).theme).toBeNull();});});
