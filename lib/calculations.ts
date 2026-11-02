export type FuturePlanInput = {
  targetToday: number;
  currentSavings: number;
  monthlyContribution: number;
  years: number;
  annualReturn: number;
  inflation: number;
  annualStepUp: number;
  inflationAdjusted: boolean;
};

export type FuturePlanResult = {
  futureTarget: number;
  projectedCorpus: number;
  conservativeCorpus: number;
  requiredMonthly: number;
  conservativeRequiredMonthly: number;
  shortfall: number;
  fundingRatio: number;
  totalContributed: number;
  growthEarned: number;
  extensionYears: number | null;
  series: Array<{ year: number; corpus: number; target: number }>;
  conservativeSeries: Array<{ year: number; corpus: number; target: number }>;
};

function projectCorpus(input: FuturePlanInput, overrideYears = input.years, returnAdjustment = 0) {
  const years = Math.max(1, Math.round(overrideYears));
  const annualReturn = Math.max(-0.5, input.annualReturn + returnAdjustment);
  const monthlyRate = Math.pow(1 + annualReturn, 1 / 12) - 1;
  let corpus = Math.max(0, input.currentSavings);
  let contributed = corpus;
  const series: Array<{ year: number; corpus: number; target: number }> = [];
  const futureTarget = Math.max(0, input.targetToday) * (input.inflationAdjusted ? Math.pow(1 + Math.max(0, input.inflation), years) : 1);

  for (let year = 1; year <= years; year += 1) {
    const monthly = Math.max(0, input.monthlyContribution) * Math.pow(1 + Math.max(0, input.annualStepUp), year - 1);
    for (let month = 0; month < 12; month += 1) corpus = corpus * (1 + monthlyRate) + monthly;
    contributed += monthly * 12;
    const targetAtYear = Math.max(0, input.targetToday) * (input.inflationAdjusted ? Math.pow(1 + Math.max(0, input.inflation), year) : 1);
    series.push({ year, corpus, target: targetAtYear });
  }

  return { corpus, contributed, futureTarget, series };
}

export function futurePlan(rawInput: FuturePlanInput): FuturePlanResult {
  if (Object.values(rawInput).some((value) => typeof value === "number" && !Number.isFinite(value))) throw new RangeError("Planning inputs must be finite numbers.");
  if (rawInput.annualReturn < -.5 || rawInput.annualReturn > .3 || rawInput.inflation < 0 || rawInput.inflation > .2) throw new RangeError("Return must be between -50% and 30%, and inflation between 0% and 20%.");
  const input = {
    ...rawInput,
    targetToday: Math.max(1, rawInput.targetToday),
    years: Math.min(50, Math.max(1, Math.round(rawInput.years))),
    annualReturn: Math.min(0.3, Math.max(-0.5, rawInput.annualReturn)),
    inflation: Math.min(0.2, Math.max(0, rawInput.inflation)),
    annualStepUp: Math.min(0.5, Math.max(0, rawInput.annualStepUp)),
  };
  const baseline = projectCorpus(input);
  const withoutNewContributions = projectCorpus({ ...input, monthlyContribution: 0 }).corpus;
  const contributionFactor = projectCorpus({ ...input, currentSavings: 0, monthlyContribution: 1 }).corpus;
  const requiredMonthly = contributionFactor > 0
    ? Math.max(0, (baseline.futureTarget - withoutNewContributions) / contributionFactor)
    : 0;
  const conservative = projectCorpus(input, input.years, -0.02);
  const conservativeWithoutNewContributions = projectCorpus({ ...input, monthlyContribution: 0 }, input.years, -0.02).corpus;
  const conservativeContributionFactor = projectCorpus({ ...input, currentSavings: 0, monthlyContribution: 1 }, input.years, -0.02).corpus;
  const conservativeRequiredMonthly = conservativeContributionFactor > 0
    ? Math.max(0, (conservative.futureTarget - conservativeWithoutNewContributions) / conservativeContributionFactor)
    : 0;
  const shortfall = Math.max(0, baseline.futureTarget - baseline.corpus);
  const fundingRatio = Math.min(2, baseline.corpus / baseline.futureTarget);

  let extensionYears: number | null = null;
  if (shortfall > 0) {
    for (let extra = 1; extra <= 10; extra += 1) {
      if (projectCorpus(input, input.years + extra).corpus >= projectCorpus(input, input.years + extra).futureTarget) {
        extensionYears = extra;
        break;
      }
    }
  }

  return {
    futureTarget: baseline.futureTarget,
    projectedCorpus: baseline.corpus,
    conservativeCorpus: conservative.corpus,
    requiredMonthly,
    conservativeRequiredMonthly,
    shortfall,
    fundingRatio,
    totalContributed: baseline.contributed,
    growthEarned: Math.max(0, baseline.corpus - baseline.contributed),
    extensionYears,
    series: baseline.series,
    conservativeSeries: conservative.series,
  };
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
  const index = Math.max(0, Math.ceil(Number(((1 - confidence) * sorted.length).toFixed(10))) - 1);
  const historicalVar = -sorted[index] * Math.sqrt(horizon);
  const tail = sorted.slice(0, index + 1);
  const historicalCvar = -(tail.reduce((a, b) => a + b, 0) / tail.length) * Math.sqrt(horizon);
  const z = inverseNormal(1 - confidence);
  const parametricVar = -(mean * horizon + z * sigma * Math.sqrt(horizon));
  let growth = 1; let peak = 1; let maxDrawdown = 0;
  for (const value of clean) { growth *= 1 + value; peak = Math.max(peak, growth); maxDrawdown = Math.min(maxDrawdown, growth / peak - 1); }
  const annualReturn = growth > 0 ? Math.pow(growth, 252 / clean.length) - 1 : -1;
  return { tailObservations: tail.length, observations: clean.length, annualReturn, annualVolatility: sigma * Math.sqrt(252), historicalVar, historicalCvar, parametricVar, maxDrawdown };
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
  samples.sort((a,b)=>a-b);const index=Math.max(0,Math.ceil(Number(((1-confidence)*samples.length).toFixed(10))) - 1);const varValue=-samples[index];const tail=samples.slice(0,index+1);return {varValue,cvarValue:-(tail.reduce((a,b)=>a+b,0)/tail.length)};
}

export function returnsFromPrices(prices: number[]) {
  return prices.slice(1).map((value, index) => value / prices[index] - 1).filter(Number.isFinite);
}

export function equalWeightReturns(series: Record<string, Array<{ date: string; value: number }>>) {
  const returnMaps = Object.values(series).map((points) => {
    const sorted = [...points].sort((a, b) => a.date.localeCompare(b.date));
    return new Map(sorted.slice(1).flatMap((point, index) => {
      const previous = sorted[index].value;
      const dailyReturn = point.value / previous - 1;
      return Number.isFinite(dailyReturn) ? [[point.date, dailyReturn] as const] : [];
    }));
  });
  if (!returnMaps.length) return [];
  const commonDates = [...returnMaps[0].keys()]
    .filter((date) => returnMaps.every((map) => map.has(date)))
    .sort();
  return commonDates.map((date) => returnMaps.reduce((sum, map) => sum + (map.get(date) ?? 0), 0) / returnMaps.length);
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

export function rollingReturnSummary(points: Array<{ date: string; value: number }>, windowDays = 365) {
  const sorted = [...points]
    .filter((point) => Number.isFinite(point.value) && point.value > 0 && Number.isFinite(Date.parse(point.date)))
    .sort((a, b) => a.date.localeCompare(b.date));
  if (sorted.length < 2) return null;

  const returns: number[] = [];
  let startIndex = 0;
  for (let endIndex = 0; endIndex < sorted.length; endIndex += 1) {
    const endTime = Date.parse(sorted[endIndex].date);
    const targetTime = endTime - windowDays * 86_400_000;
    while (startIndex + 1 < endIndex && Date.parse(sorted[startIndex + 1].date) <= targetTime) startIndex += 1;
    const startTime = Date.parse(sorted[startIndex].date);
    const elapsedDays = (endTime - startTime) / 86_400_000;
    if (elapsedDays < windowDays * .96 || elapsedDays > windowDays * 1.08) continue;
    const annualized = Math.pow(sorted[endIndex].value / sorted[startIndex].value, 365 / elapsedDays) - 1;
    if (Number.isFinite(annualized)) returns.push(annualized);
  }
  if (!returns.length) return null;

  const ordered = [...returns].sort((a, b) => a - b);
  const middle = Math.floor(ordered.length / 2);
  const median = ordered.length % 2 ? ordered[middle] : (ordered[middle - 1] + ordered[middle]) / 2;
  return {
    observations: returns.length,
    median,
    worst: ordered[0],
    positiveShare: returns.filter((value) => value > 0).length / returns.length,
  };
}

export function benchmarkComparison(
  fundPoints: Array<{ date: string; value: number }>,
  benchmarkPoints: Array<{ date: string; value: number }>,
  riskFreeRate = .065,
) {
  const fundMap = new Map(fundPoints.map((point) => [point.date, point.value]));
  const aligned = benchmarkPoints
    .flatMap((point) => {
      const fundValue = fundMap.get(point.date);
      return fundValue && fundValue > 0 && point.value > 0 ? [{ date: point.date, fund: fundValue, benchmark: point.value }] : [];
    })
    .sort((a, b) => a.date.localeCompare(b.date));
  if (aligned.length < 30) return null;

  const start = aligned[0];
  const end = aligned[aligned.length - 1];
  const elapsedDays = (Date.parse(end.date) - Date.parse(start.date)) / 86_400_000;
  if (elapsedDays < 30) return null;
  const fundAnnualReturn = Math.pow(end.fund / start.fund, 365 / elapsedDays) - 1;
  const benchmarkAnnualReturn = Math.pow(end.benchmark / start.benchmark, 365 / elapsedDays) - 1;
  const pairs = aligned.slice(1).map((point, index) => ({
    fund: point.fund / aligned[index].fund - 1,
    benchmark: point.benchmark / aligned[index].benchmark - 1,
  })).filter((pair) => Number.isFinite(pair.fund) && Number.isFinite(pair.benchmark));
  if (pairs.length < 29) return null;

  const fundMean = pairs.reduce((sum, pair) => sum + pair.fund, 0) / pairs.length;
  const benchmarkMean = pairs.reduce((sum, pair) => sum + pair.benchmark, 0) / pairs.length;
  const benchmarkVariance = pairs.reduce((sum, pair) => sum + Math.pow(pair.benchmark - benchmarkMean, 2), 0) / Math.max(1, pairs.length - 1);
  const covariance = pairs.reduce((sum, pair) => sum + (pair.fund - fundMean) * (pair.benchmark - benchmarkMean), 0) / Math.max(1, pairs.length - 1);
  const beta = benchmarkVariance > 0 ? covariance / benchmarkVariance : null;
  const activeReturns = pairs.map((pair) => pair.fund - pair.benchmark);
  const activeMean = activeReturns.reduce((sum, value) => sum + value, 0) / activeReturns.length;
  const trackingError = Math.sqrt(activeReturns.reduce((sum, value) => sum + Math.pow(value - activeMean, 2), 0) / Math.max(1, activeReturns.length - 1)) * Math.sqrt(252);
  const activeAnnualReturn = fundAnnualReturn - benchmarkAnnualReturn;
  const alpha = beta === null ? null : (fundMean - (Math.pow(1 + riskFreeRate, 1 / 252) - 1) - beta * (benchmarkMean - (Math.pow(1 + riskFreeRate, 1 / 252) - 1))) * 252;

  return {
    startDate: start.date,
    endDate: end.date,
    observations: aligned.length,
    fundAnnualReturn,
    benchmarkAnnualReturn,
    activeAnnualReturn,
    beta,
    alpha,
    trackingError,
    informationRatio: trackingError > 0 ? activeMean * 252 / trackingError : null,
  };
}
