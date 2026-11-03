import {describe,it,expect} from "vitest";
import {projectSwp,validSwp} from "./swp";
import {validPlan,emptyPlan,type Goal} from "./planner";
const g:Goal={id:"g",name:"Career break",createdDate:"2026-01-01",target:100000,years:2,monthly:1000,savings:12000,annualReturn:0};
const swp={monthly:1000,years:2,start:"now" as const,inflationAdjusted:false};
describe("SWP mapped from goal inputs",()=>{
 it("stops contributions and reports the first underfunded month",()=>{const r=projectSwp(g,swp);expect(r.opening).toBe(12000);expect(r.firstShortfall).toBe(13);expect(r.totalWithdrawn).toBe(12000);expect(r.balance).toBe(0);});
 it("maps the accumulation corpus at the deadline without repeating contributions",()=>{const r=projectSwp(g,{...swp,start:"deadline"});expect(r.opening).toBe(36000);expect(r.balance).toBe(12000);expect(r.firstShortfall).toBeNull();expect(r.start).toBe("2028-01-01");});
 it("maps the latest balance and excludes already received releases",()=>{const r=projectSwp({...g,checkIns:[{date:"2026-02-01",balance:24000,contribution:1000,costBasis:null}]},swp,[{id:"a",name:"FD",amount:5000,goalId:"g",availableOn:"2026-02-01",separate:true}]);expect(r.opening).toBe(24000);expect(r.balance).toBe(0);expect(r.firstShortfall).toBeNull();});
 it("can include an upcoming release once",()=>{const r=projectSwp(g,swp,[{id:"a",name:"FD",amount:12000,goalId:"g",availableOn:"2026-12-01",separate:true}]);expect(r.totalWithdrawn).toBe(24000);expect(r.firstShortfall).toBeNull();});
 it("inflates withdrawals only after the first year",()=>{const r=projectSwp({...g,savings:100000,inflation:10},{...swp,inflationAdjusted:true});expect(r.totalWithdrawn).toBeCloseTo(25200);});
 it("maps fees and stress returns into both phases",()=>{const base=projectSwp({...g,annualReturn:5,annualFee:1},{...swp,start:"deadline"});const stress=projectSwp({...g,annualReturn:5,annualFee:1},{...swp,start:"deadline"},[],-2);expect(stress.opening).toBeLessThan(base.opening);expect(stress.balance).toBeLessThan(base.balance);});
 it("validates settings when calculating or importing a saved goal",()=>{expect(validSwp({...swp,monthly:0})).toBe(false);expect(()=>projectSwp(g,{...swp,years:1.5})).toThrow();expect(validPlan({...emptyPlan,goals:[{...g,swp}]})).toBe(true);expect(validPlan({...emptyPlan,goals:[{...g,swp:{...swp,years:100}}]})).toBe(false);});
});
