"use client";

import { useState } from "react";

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
      });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Risk calculation failed.");
    } finally {
      setLoading(false);
    }
  }

  return <div className="page-stack">
    <PageHeading kicker="Portfolio risk" title={<>Measure the loss tail.<br/><span>Keep the model visible.</span></>} copy="Estimate downside risk from two years of public closing-price history using parametric, historical, or deterministic Monte Carlo simulation."/>
    <section className="panel">
      <div className="section-heading"><div><span className="eyebrow">Risk inputs</span><h2>Build a test portfolio</h2></div><p>Each included symbol contributes the same daily weight.</p></div>
      <div className="form-grid">
        <Field label="Market"><select value={market} onChange={(event) => setMarket(event.target.value)}><option value="india">India · NSE</option><option value="us">United States</option></select></Field>
        <Field label="Symbols" hint="Comma-separated, up to 10"><input value={symbols} onChange={(event) => setSymbols(event.target.value.toUpperCase())}/></Field>
        <Field label="VaR method"><select value={method} onChange={(event) => setMethod(event.target.value as Method)}><option>Parametric</option><option>Historical</option><option>Monte Carlo</option></select></Field>
        <Field label="Confidence"><select value={confidence} onChange={(event) => setConfidence(Number(event.target.value))}><option value={.90}>90%</option><option value={.95}>95%</option><option value={.99}>99%</option></select></Field>
        <Field label="Holding period (days)" hint="Whole number from 1 to 30"><input type="number" min="1" max="30" step="1" value={horizonInput} onChange={(event) => setHorizonInput(event.target.value)}/></Field>
        <Field label="Portfolio value"><input type="number" min="1" value={portfolioValueInput} onChange={(event) => setPortfolioValueInput(event.target.value)}/></Field>
      </div>
      <div className="form-actions"><button className="button" onClick={() => void calculate()} disabled={loading}>{loading ? "Fetching history…" : "Calculate VaR"}</button></div>
      {error && <p className="notice" role="alert">{error}</p>}
    </section>
    {analysis && <section className="panel">
      <div className="section-heading"><div><span className="eyebrow">Result</span><h2>{analysis.method} VaR</h2></div><p>{Math.round(analysis.confidence * 100)}% confidence · {analysis.horizon}-day horizon · {analysis.risk.observations} aligned returns</p></div>
      {analysis.omittedSymbols.length > 0 && <p className="notice" role="status">Excluded because history was missing or insufficient: {analysis.omittedSymbols.join(", ")}.</p>}
      <div className="metric-grid">
        <Metric label="Value at Risk" value={money(analysis.selectedVar * analysis.portfolioValue, true)} note={percent(analysis.selectedVar)}/>
        <Metric label={analysis.method === "Parametric" ? "Historical shortfall reference" : "Expected shortfall"} value={money(analysis.selectedCvar * analysis.portfolioValue, true)} note={percent(analysis.selectedCvar)}/>
        <Metric label="Annualised volatility" value={percent(analysis.risk.annualVolatility)}/>
        <Metric label="Maximum drawdown" value={percent(analysis.risk.maxDrawdown)}/>
      </div>
      <ResultNotes assumptions={[
        `Equal-weight daily returns use ${analysis.usedSymbols.join(", ")}.`,
        "Yahoo closing prices are used; they are not represented as dividend-adjusted total returns.",
        `${analysis.risk.observations} common-date observations support this estimate.`,
        "Monte Carlo uses 10,000 seeded normal-return paths.",
      ]} warnings={["VaR can underestimate losses during regime changes and crises. Use multiple risk measures.", "Historical results do not predict future returns."]}/>
    </section>}
  </div>;
}
