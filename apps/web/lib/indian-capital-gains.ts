import {fifoSale,realDate,type TaxLot} from "./planning-realism";
/** Historical legislative baseline, NOT evidence of current law. Never extend its window without source review. */
export const equityRuleSnapshot={id:"india-equity-2024-post-budget",title:"Listed equity / equity-oriented funds · historical FY 2024–25",effectiveFrom:"2024-07-23",supportedThrough:"2025-03-31",shortRate:20,longRate:12.5,longAfterMonths:12,annualLongTermExemption:125000,cessRate:4,sections:["111A","112A"],reference:"Finance (No. 2) Act, 2024; sections 111A and 112A",sourcePortal:"https://incometaxindia.gov.in/",currentVerification:"pending" as const};
export type EquityTaxContext={asset:"listed-equity"|"equity-oriented-fund";residentIndividual:boolean;sttEligible:boolean;ordinaryIncomeUsesBasicExemption:boolean;annualIncomeBelow50Lakh:boolean;noSpecialRelief:boolean;longTermExemptionUsed:number};
export function indianEquitySale(lots:TaxLot[],saleDate:string,units:number,unitPrice:number,context:EquityTaxContext){
 const rule=equityRuleSnapshot;
 if(!realDate(saleDate)||saleDate<rule.effectiveFrom||saleDate>rule.supportedThrough)throw Error("No verified built-in rule covers this sale date. Current official tax-policy verification is required; historical rates have not been carried forward.");
 if(!["listed-equity","equity-oriented-fund"].includes(context.asset)||!context.residentIndividual||!context.sttEligible||!context.ordinaryIncomeUsesBasicExemption||!context.annualIncomeBelow50Lakh||!context.noSpecialRelief)throw Error("This rule covers a limited resident-individual equity case: applicable STT conditions, basic exemption used, income below ₹50 lakh and no special relief. Other cases need a fuller tax calculation.");
 if(!Number.isFinite(context.longTermExemptionUsed)||context.longTermExemptionUsed<0||context.longTermExemptionUsed>rule.annualLongTermExemption)throw Error("Enter exemption already used across all eligible stocks and funds, between ₹0 and ₹1,25,000.");
 if(lots.some(l=>l.bought<"2018-02-01"))throw Error("Pre-February 2018 purchases need grandfathering inputs, which this worksheet does not yet cover.");
 const calculation=fifoSale(lots,saleDate,units,unitPrice,{shortRate:rule.shortRate,longRate:rule.longRate,longAfterMonths:rule.longAfterMonths,remainingAnnualExemption:rule.annualLongTermExemption-context.longTermExemptionUsed,cessRate:rule.cessRate,source:rule.reference,asOf:rule.effectiveFrom});
 return {...calculation,ruleId:rule.id,remainingExemption:rule.annualLongTermExemption-context.longTermExemptionUsed};
}
