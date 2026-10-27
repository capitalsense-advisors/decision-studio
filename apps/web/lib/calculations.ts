export type Result = {
  outputs: Record<string, number | string | boolean | null>;
  series?: Array<Record<string, number>>;
  assumptions: string[];
  warnings: string[];
};

export function goalPlan(input: { monthlySip: number; stepUp: number; years: number; annualReturn: number; inflation: number; monthlyExpenses: number }): Result {
  const monthlyRate = Math.pow(1 + input.annualReturn, 1 / 12) - 1;
  let corpus = 0;
  const series: Array<Record<string, number>> = [];
  for (let year = 1; year <= input.years; year += 1) {
    const contribution = Math.max(0, input.monthlySip) * Math.pow(1 + Math.max(0, input.stepUp) / 100, year - 1);
    for (let month = 0; month < 12; month += 1) corpus = corpus * (1 + monthlyRate) + contribution;
    series.push({ year, corpus, contribution: contribution * 12 });
  }
  const futureExpenses = Math.max(0, input.monthlyExpenses) * Math.pow(1 + input.inflation, input.years);
  const fireCorpus = futureExpenses * 12 * 25;
  return {
    outputs: { projectedCorpus: corpus, futureMonthlyExpenses: futureExpenses, fireCorpus, goalGap: Math.max(0, fireCorpus - corpus) },
    series,
    assumptions: ["Contributions are made at each month-end.", "The FIRE illustration uses 25× annual expenses."],
    warnings: ["Returns and inflation are assumptions. Compare a lower-return and higher-inflation scenario."],
  };
}

export function dcf(input: { fcff: number; growth: number; terminalGrowth: number; beta: number; riskFree: number; equityPremium: number; netDebt: number; shares: number; equityWeight: number }): Result {
  const costEquity = input.riskFree + Math.max(0, input.beta) * input.equityPremium;
  const wacc = input.equityWeight * costEquity + (1 - input.equityWeight) * 0.09 * 0.75;
  let current = Math.max(0, input.fcff);
  let presentValue = 0;
  const series: Array<Record<string, number>> = [];
  for (let year = 1; year <= 5; year += 1) {
    current *= 1 + input.growth;
    const discounted = current / Math.pow(1 + wacc, year);
    presentValue += discounted;
    series.push({ year, fcff: current, presentValue: discounted });
  }
  const validTerminal = wacc > input.terminalGrowth;
  const terminalValue = validTerminal ? current * (1 + input.terminalGrowth) / (wacc - input.terminalGrowth) : null;
  const enterpriseValue = presentValue + (terminalValue === null ? 0 : terminalValue / Math.pow(1 + wacc, 5));
  const equityValue = enterpriseValue - input.netDebt;
  return {
    outputs: { costEquity, wacc, terminalValue, enterpriseValue, equityValue, valuePerShare: equityValue / Math.max(1, input.shares) },
    series,
    assumptions: ["Uses FCFF and a Gordon-growth terminal value.", "Debt cost is 9% and the illustrative tax rate is 25%."],
    warnings: [...(!validTerminal ? ["WACC must exceed terminal growth, so terminal value is withheld."] : []), "DCF is highly sensitive to FCFF, WACC and terminal growth."],
  };
}

export function capitalGains(input: { purchase: number; sale: number; costs: number; months: number; listedEquity: boolean; longRate: number }): Result {
  const longTerm = input.listedEquity ? input.months >= 12 : input.months >= 24;
  const rate = longTerm ? input.longRate : 0.20;
  const gain = Math.max(0, input.sale) - Math.max(0, input.purchase) - Math.max(0, input.costs);
  const taxableGain = gain > 0 ? (longTerm && input.listedEquity ? Math.max(0, gain - 125_000) : gain) : gain;
  const estimatedTax = taxableGain > 0 ? taxableGain * rate : 0;
  return {
    outputs: { gain, taxableGain, estimatedTax, netSaleProceeds: input.sale - input.costs - estimatedTax, afterTaxReturn: input.purchase ? (input.sale - input.costs - estimatedTax) / input.purchase - 1 : null, longTerm },
    assumptions: ["Uses editable FY 2026–27 planning assumptions.", "Listed equity uses a ₹1.25 lakh long-term exemption."],
    warnings: ["This is an indicative estimate. Cess, surcharge, set-off, grandfathering and special cases are excluded."],
  };
}

export function tradePlan(input: { capital: number; riskPercent: number; entry: number; stop: number; target: number; leverage: number; chargesRate: number }): Result {
  const perUnitRisk = Math.abs(input.entry - input.stop);
  const riskBudget = Math.max(0, input.capital) * Math.min(Math.max(input.riskPercent / 100, 0), 0.1);
  const riskQuantity = perUnitRisk ? Math.floor(riskBudget / perUnitRisk) : 0;
  const capitalQuantity = input.entry ? Math.floor((input.capital * Math.max(1, input.leverage)) / input.entry) : 0;
  const quantity = Math.min(riskQuantity, capitalQuantity);
  const exposure = quantity * input.entry;
  return {
    outputs: { riskBudget, quantity, exposure, charges: exposure * Math.max(0, input.chargesRate) * 2, riskReward: perUnitRisk ? Math.abs(input.target - input.entry) / perUnitRisk : null, margin: exposure / Math.max(1, input.leverage) },
    assumptions: ["Margin is an exposure/leverage illustration, not broker SPAN margin."],
    warnings: ["Position size is capped by the risk budget and available leveraged capital.", ...(perUnitRisk ? [] : ["Entry and stop are identical, so position size cannot be calculated."])],
  };
}

export function moneyGuide(tool: string, amount: number) {
  const value = Math.max(0, amount);
  const monthlyRate = 0.12 / 12;
  if (tool === "multiplier") return { results: [["Double", value * 2, "about 6 years"], ["Triple", value * 3, "about 9.5 years"], ["Quadruple", value * 4, "about 12 years"]] };
  if (tool === "allocation") return { results: [["Equity · 77%", value * 0.77, "Growth-oriented allocation"], ["Debt · 23%", value * 0.23, "Stability-oriented allocation"]] };
  if (tool === "crore") {
    const months = Math.log(1 + 10_000_000 * monthlyRate / Math.max(value, 1)) / Math.log(1 + monthlyRate);
    return { results: [["With investing", months / 12, "years at 12% assumed return"], ["Saving only", 10_000_000 / Math.max(value, 1) / 12, "years without growth"]], years: true };
  }
  if (tool === "spends") return { results: [["Needs · 50%", value * 0.5, "Essentials"], ["Wants · 30%", value * 0.3, "Lifestyle"], ["Invest · 20%", value * 0.2, "Goals and reserves"]] };
  if (tool === "home") return { results: [["Maximum home budget", value * 3, "Up to 3× annual income"], ["Maximum EMI", value / 12 * 0.3, "30% of monthly income"], ["Down payment", value * 3 * 0.4, "40% of home budget"]] };
  if (tool === "fire") {
    const futureMonthly = value * Math.pow(1.07, 27);
    return { results: [["Estimated FIRE number", futureMonthly * 12 * 25, "At age 50"], ["Future monthly expenses", futureMonthly, "After 27 years of inflation"]] };
  }
  const months = 60;
  const futureSip = value * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate);
  return { results: [["Monthly SIP value", futureSip, "after 5 years"], ["One-time value", value * Math.pow(1.12, 5), "after 5 years"]] };
}

function inverseNormal(p: number) {
  const a = [-39.6968302866538, 220.946098424521, -275.928510446969, 138.357751867269, -30.6647980661472, 2.50662827745924];
  const b = [-54.4760987982241, 161.585836858041, -155.698979859887, 66.8013118877197, -13.2806815528857];
  const c = [-0.00778489400243029, -0.322396458041136, -2.40075827716184, -2.54973253934373, 4.37466414146497, 2.93816398269878];
  const d = [0.00778469570904146, 0.32246712907004, 2.445134137143, 3.75440866190742];
  const plow = 0.02425;
  if (p < plow) { const q = Math.sqrt(-2 * Math.log(p)); return (((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5]) / ((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1); }
  if (p > 1 - plow) { const q = Math.sqrt(-2 * Math.log(1-p)); return -(((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5]) / ((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1); }
  const q = p - 0.5; const r = q*q;
  return (((((a[0]*r+a[1])*r+a[2])*r+a[3])*r+a[4])*r+a[5])*q / (((((b[0]*r+b[1])*r+b[2])*r+b[3])*r+b[4])*r+1);
}

export function portfolioRisk(returns: number[], confidence = 0.95, horizon = 1) {
  const clean = returns.filter(Number.isFinite);
  if (!clean.length) return null;
  const mean = clean.reduce((a, b) => a + b, 0) / clean.length;
  const variance = clean.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / Math.max(1, clean.length - 1);
  const sigma = Math.sqrt(variance);
  const sorted = [...clean].sort((a, b) => a - b);
  const index = Math.max(0, Math.floor((1 - confidence) * sorted.length));
  const historicalVar = -sorted[index] * Math.sqrt(horizon);
  const tail = sorted.slice(0, index + 1);
  const historicalCvar = -(tail.reduce((a, b) => a + b, 0) / tail.length) * Math.sqrt(horizon);
  const z = inverseNormal(1 - confidence);
  const parametricVar = -(mean * horizon + z * sigma * Math.sqrt(horizon));
  let growth = 1; let peak = 1; let maxDrawdown = 0;
  for (const value of clean) { growth *= 1 + value; peak = Math.max(peak, growth); maxDrawdown = Math.min(maxDrawdown, growth / peak - 1); }
  return { observations: clean.length, annualReturn: Math.pow(1 + mean, 252) - 1, annualVolatility: sigma * Math.sqrt(252), historicalVar, historicalCvar, parametricVar, maxDrawdown };
}

export function monteCarloVar(returns: number[], confidence = 0.95, horizon = 1, simulations = 10000) {
  const clean = returns.filter(Number.isFinite);
  if (clean.length < 30) return null;
  const mean = clean.reduce((a,b)=>a+b,0)/clean.length;
  const sigma = Math.sqrt(clean.reduce((sum,value)=>sum+Math.pow(value-mean,2),0)/Math.max(1,clean.length-1));
  let seed = 2_026_1026;
  const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return (seed + 1) / 4294967297; };
  const samples:number[]=[];
  for(let i=0;i<simulations;i+=1){let total=0;for(let day=0;day<horizon;day+=1){const u1=random();const u2=random();const z=Math.sqrt(-2*Math.log(u1))*Math.cos(2*Math.PI*u2);total+=mean+sigma*z}samples.push(total)}
  samples.sort((a,b)=>a-b);const index=Math.max(0,Math.floor((1-confidence)*samples.length));const varValue=-samples[index];const tail=samples.slice(0,index+1);return {varValue,cvarValue:-(tail.reduce((a,b)=>a+b,0)/tail.length)};
}

export function returnsFromPrices(prices: number[]) {
  return prices.slice(1).map((value, index) => value / prices[index] - 1).filter(Number.isFinite);
}

export function trailingReturns(points: Array<{ date: string; value: number }>) {
  if (!points.length) return {};
  const sorted = [...points].sort((a, b) => a.date.localeCompare(b.date));
  const latest = sorted[sorted.length - 1];
  const latestTime = Date.parse(latest.date);
  return Object.fromEntries([["1M",30,false],["3M",91,false],["6M",182,false],["1Y",365,true],["3Y",1095,true],["5Y",1825,true]].map(([label, days, annualized]) => {
    const target = latestTime - Number(days) * 86400000;
    const past = [...sorted].reverse().find((point) => Date.parse(point.date) <= target);
    if (!past) return [label, null];
    const simple = latest.value / past.value;
    return [label, annualized ? Math.pow(simple, 365 / ((latestTime - Date.parse(past.date)) / 86400000)) - 1 : simple - 1];
  }));
}
