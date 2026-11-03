import {describe,it,expect} from "vitest";
import {indianEquitySale,type EquityTaxContext} from "./indian-capital-gains";
const context:EquityTaxContext={asset:"listed-equity",residentIndividual:true,sttEligible:true,ordinaryIncomeUsesBasicExemption:true,annualIncomeBelow50Lakh:true,noSpecialRelief:true,longTermExemptionUsed:0};
const old={id:"a",bought:"2023-01-01",units:1000,unitCost:100};
describe("dated Indian equity tax rules",()=>{
 it("applies 12.5% to long-term gains above the shared ₹1.25 lakh exemption, with 4% cess",()=>{const r=indianEquitySale([old],"2025-03-01",1000,300,context);expect(r.longGain).toBe(200000);expect(r.tax).toBe(9750);expect(r.net).toBe(290250);});
 it("applies 20% short-term tax without granting the long-term exemption",()=>{const r=indianEquitySale([{...old,bought:"2024-10-01"}],"2025-03-01",1000,300,context);expect(r.tax).toBe(41600);});
 it("reduces the common exemption by the amount used across other sales",()=>{const r=indianEquitySale([old],"2025-03-01",1000,300,{...context,asset:"equity-oriented-fund",longTermExemptionUsed:125000});expect(r.tax).toBe(26000);});
 it("refuses to label historical rates as current",()=>{expect(()=>indianEquitySale([old],"2026-11-03",1000,300,context)).toThrow(/verification/);expect(()=>indianEquitySale([old],"2024-07-22",1000,300,context)).toThrow();});
 it("withholds cases needing surcharge, basic exemption, special relief or grandfathering",()=>{for(const key of ['sttEligible','annualIncomeBelow50Lakh','ordinaryIncomeUsesBasicExemption','noSpecialRelief','residentIndividual'])expect(()=>indianEquitySale([old],"2025-03-01",1000,300,{...context,[key]:false})).toThrow();expect(()=>indianEquitySale([{...old,bought:"2017-01-01"}],"2025-03-01",1000,300,context)).toThrow(/grandfathering/);});
});
