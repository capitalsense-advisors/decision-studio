"use client";

import { useState } from "react";

import { freshnessWarning } from "@/lib/freshness";
import { Field, Metric, PageHeading, ResultNotes } from "@/components/ui";
import { equalWeightReturns, monteCarloVar, portfolioRisk } from "@/lib/calculations";
import { money, percent } from "@/lib/format";

type Method = "Parametric" | "Historical" | "Monte Carlo";
type Point = { date: string; value: number };
type HistoryResponse = { series?: Record<string, Point[]>; failures?: string[]; detail?: string };
type RiskResult = NonNullable<ReturnType<typeof portfolioRisk>>;
type Analysis = {
  method: Method;
  confidence: number;
  horizon: number;
  portfolioValue: number;
  risk: RiskResult;
  selectedVar: number;
  selectedCvar: number;
  usedSymbols: string[];
  omittedSymbols: string[];
  market: string;
  histories: Array<{ symbol: string; count: number; date: string }>;
};

export default function RiskPage() {
  const [market, setMarket] = useState("india");
  const [symbols, setSymbols] = useState("RELIANCE,TCS,INFY");
  const [method, setMethod] = useState<Method>("Parametric");
  const [confidence, setConfidence] = useState(.95);
  const [horizonInput, setHorizonInput] = useState("1");
  const [portfolioValueInput, setPortfolioValueInput] = useState("1000000");
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function calculate() {
    const horizon = Number(horizonInput);
    const portfolioValue = Number(portfolioValueInput);
    if (!Number.isInteger(horizon) || horizon < 1 || horizon > 30) {
      setError("Holding period must be a whole number from 1 to 30 days.");
      setAnalysis(null);
      return;
    }
    if (!Number.isFinite(portfolioValue) || portfolioValue <= 0) {
      setError("Portfolio value must be a positive amount.");
      setAnalysis(null);
      return;
    }

    setLoading(true);
    setError("");
    setAnalysis(null);
    try {
      const response = await fetch(`/api/market/history?market=${market}&symbols=${encodeURIComponent(symbols)}`);
      const payload = await response.json().catch(() => null) as HistoryResponse | null;
      if (!response.ok || !payload) throw new Error(payload?.detail ?? "Price history could not be loaded.");
      const allEntries = Object.entries(payload.series ?? {});
      const eligibleEntries = allEntries.filter(([, points]) => points.length >= 60);
      const omittedSymbols = [...new Set([
        ...(payload.failures ?? []),
        ...allEntries.filter(([, points]) => points.length < 60).map(([symbol]) => symbol),
      ])];
      if (!eligibleEntries.length) throw new Error("No selected symbol had at least 60 valid price observations.");

      const eligibleSeries = Object.fromEntries(eligibleEntries);
      const returns = equalWeightReturns(eligibleSeries);
      if (returns.length < 30) throw new Error("The selected symbols do not share enough trading dates for a reliable risk estimate.");
      const risk = portfolioRisk(returns, confidence, horizon);
      if (!risk) throw new Error("Risk could not be calculated from the available history.");

      const simulation = method === "Monte Carlo" ? monteCarloVar(returns, confidence, horizon) : null;
      if (method === "Monte Carlo" && !simulation) throw new Error("Monte Carlo needs at least 30 aligned return observations.");
      const selectedVar = method === "Historical" ? risk.historicalVar : method === "Monte Carlo" ? simulation!.varValue : risk.parametricVar;
      const selectedCvar = method === "Monte Carlo" ? simulation!.cvarValue : risk.historicalCvar;
      if (!Number.isFinite(selectedVar) || !Number.isFinite(selectedCvar)) throw new Error("The selected risk method did not produce a valid estimate.");

      setAnalysis({
        method,
        confidence,
        horizon,
        portfolioValue,
        risk,
        selectedVar,
        selectedCvar,
        usedSymbols: eligibleEntries.map(([symbol]) => symbol),
        omittedSymbols,
        market,
        histories: eligibleEntries.map(([symbol, points]) => ({ symbol, count: points.length - 1, date: points[points.length - 1].date })),
      });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Risk calculation failed.");
    } finally {
      setLoading(false);
    }
  }

  const moneyForMarket = (value: number, compact = true) => money(value, compact, (analysis?.market ?? market) === "us" ? "USD" : "INR");

  return <div className="page-stack">
    <PageHeading kicker="Equal-weight risk scenario" title={<>Measure the loss tail.<br/><span>Keep the model visible.</span></>} copy="Estimate downside risk from two years of public closing-price history using parametric, historical, or deterministic Monte Carlo simulation."/>
    <section className="panel">
      <div className="section-heading"><div><span className="eyebrow">Risk inputs</span><h2>Build a test portfolio</h2></div><p>Each included symbol contributes the same daily weight. This is a separate scenario; Money Mirror holdings and weights are not imported.</p></div>
      <div className="form-grid">
        <Field label="Market"><select value={market} onChange={(event) => setMarket(event.target.value)}><option value="india">India · NSE</option><option value="us">United States</option></select></Field>
        <Field label="Symbols" hint="Comma-separated, up to 10"><input value={symbols} onChange={(event) => setSymbols(event.target.value.toUpperCase())}/></Field>
        <Field label="VaR method"><select value={method} onChange={(event) => setMethod(event.target.value as Method)}><option>Parametric</option><option>Historical</option><option>Monte Carlo</option></select></Field>
        <Field label="Confidence"><select value={confidence} onChange={(event) => setConfidence(Number(event.target.value))}><option value={.90}>90%</option><option value={.95}>95%</option><option value={.99}>99%</option></select></Field>
        <Field label="Holding period (days)" hint="Whole number from 1 to 30"><input type="number" min="1" max="30" step="1" value={horizonInput} onChange={(event) => setHorizonInput(event.target.value)}/></Field>
        <Field label={`Scenario value (${market === "us" ? "USD" : "INR"})`}><input type="number" min="1" value={portfolioValueInput} onChange={(event) => setPortfolioValueInput(event.target.value)}/></Field>
      </div>
      <div className="form-actions"><button className="button" onClick={() => void calculate()} disabled={loading}>{loading ? "Fetching history…" : "Calculate VaR"}</button></div>
      {error && <p className="notice" role="alert">{error}</p>}
    </section>
    {analysis && <section className="panel">
      <div className="section-heading"><div><span className="eyebrow">Result</span><h2>{analysis.method} VaR</h2></div><p>{Math.round(analysis.confidence * 100)}% confidence · {analysis.horizon}-day horizon · {analysis.risk.observations} aligned returns</p></div>
      {analysis.omittedSymbols.length > 0 && <p className="notice" role="status">Excluded because history was missing or insufficient: {analysis.omittedSymbols.join(", ")}.</p>}
      <div className="metric-grid">
        <Metric label="Value at Risk" value={moneyForMarket(analysis.selectedVar * analysis.portfolioValue, true)} note={percent(analysis.selectedVar)}/>
        <Metric label={analysis.method === "Parametric" ? "Historical shortfall reference" : "Expected shortfall"} value={moneyForMarket(analysis.selectedCvar * analysis.portfolioValue, true)} note={percent(analysis.selectedCvar)}/>
        <Metric label="Annualised volatility" value={percent(analysis.risk.annualVolatility)}/>
        <Metric label="Maximum drawdown" value={percent(analysis.risk.maxDrawdown)}/>
      </div>
      <p className="source-line">Original return counts before common-date alignment: {analysis.histories.map((item) => `${item.symbol}: ${item.count} (last close ${item.date})`).join("; ")}.</p>
      {analysis.histories.some((item) => freshnessWarning(item.date)) && <p className="notice" role="status">One or more histories are old or have an unknown date. Verify recent closes before using this scenario.</p>}
      {analysis.risk.tailObservations < 10 && <p className="notice" role="status">Only {analysis.risk.tailObservations} historical tail observations support this confidence level. VaR and expected shortfall may be unstable or identical.</p>}
      {analysis.selectedVar < 0 && <p className="notice">Negative VaR means the model&apos;s selected quantile is a gain; losses are still possible.</p>}
      <RiskLossLadder analysis={analysis} />
      <ResultNotes assumptions={[
        `Equal-weight daily returns use ${analysis.usedSymbols.join(", ")}.`,
        "Yahoo closing prices are used; they are not represented as dividend-adjusted total returns.",
        `${analysis.risk.observations} common-date observations support this estimate.`,
        "Monte Carlo uses 10,000 deterministic seeded normal-return paths, not independent forecasts.",
        "Historical multi-day VaR and shortfall scale the one-day estimate by the square root of time; they are not observed multi-day losses.",
      ]} warnings={["VaR can underestimate losses during regime changes and crises. Use multiple risk measures.", "Historical results do not predict future returns."]}/>
    </section>}
  </div>;
}

function RiskLossLadder({ analysis }: { analysis: Analysis }) {
  const moneyForMarket = (value: number, compact = true) => money(value, compact, analysis.market === "us" ? "USD" : "INR");
  const rows = [
    { label: `${analysis.method} VaR`, detail: `${Math.round(analysis.confidence * 100)}% confidence, ${analysis.horizon} day${analysis.horizon === 1 ? "" : "s"}`, loss: Math.max(0, analysis.selectedVar) },
    { label: analysis.method === "Parametric" ? "Historical tail loss" : "Expected shortfall", detail: "Average loss beyond the VaR threshold", loss: Math.max(0, analysis.selectedCvar) },
    { label: "Worst historical drawdown", detail: "Largest peak-to-trough decline in this history", loss: Math.max(0, Math.abs(analysis.risk.maxDrawdown)) },
  ];
  return <figure className="risk-ladder" aria-labelledby="risk-ladder-title">
    <figcaption><div><span>Loss ladder</span><h3 id="risk-ladder-title">How much of the portfolio remains?</h3></div><p>Every bar starts with your full portfolio. The coloured section is the modelled or historical loss.</p></figcaption>
    <div>
      {rows.map((row) => {
        const boundedLoss = Math.min(1, row.loss);
        return <article key={row.label}>
          <header><div><strong>{row.label}</strong><small>{row.detail}</small></div><b>{moneyForMarket(row.loss * analysis.portfolioValue, true)}</b></header>
          <div className="risk-capital-bar" role="img" aria-label={`${row.label}: ${percent(row.loss)} loss and ${percent(1 - boundedLoss)} remaining`}><i style={{ width: `${boundedLoss * 100}%` }} /><span style={{ width: `${(1 - boundedLoss) * 100}%` }} /></div>
          <footer><span>Loss {percent(row.loss)}</span><strong>Remaining {moneyForMarket((1 - boundedLoss) * analysis.portfolioValue, true)}</strong></footer>
        </article>;
      })}
    </div>
    <div className="risk-ladder-legend"><span><i />Estimated loss</span><span><i />Capital remaining</span></div>
  </figure>;
}
