"use client";

import { useEffect, useMemo, useState } from "react";
import { ResultNotes } from "@/components/ui";
import { benchmarkComparison, portfolioRisk, returnsFromPrices, rollingReturnSummary, trailingReturns } from "@/lib/calculations";
import { money, percent } from "@/lib/format";
import styles from "./page.module.css";

type Scheme = { schemeCode: number; schemeName: string };
type Fund = {
  meta: Record<string, string | number>;
  points: Array<{ date: string; value: number }>;
  detail?: string;
};
type CatalogPeer = {
  name: string;
  category: string;
  plan: string;
  aumCrore: number | null;
  cagr3yPct: number | null;
  expenseRatioPct: number | null;
  sourceUrl: string | null;
};
type CatalogPayload = {
  selected: CatalogPeer | null;
  peers: CatalogPeer[];
  source: string;
  asOf: string | null;
  detail?: string;
};
type FundSuggestion = { name: string; category: string; score: number };
type Benchmark = { label: string; ticker: string; points: Array<{ date: string; value: number }> };
type Goal = "wealth" | "planned" | "soon";
type DropComfort = "low" | "medium" | "high";
type FundKind = "equity" | "hybrid" | "debt" | "other";

export type FundBrief = { goal: Goal; horizonYears: number; dropComfort: DropComfort };
export type FundFitInput = {
  category: string;
  observations: number;
  maxDrawdown: number | null;
  brief: FundBrief;
};

export function benchmarkForCategory(category: string) {
  const value = category.toLowerCase();
  if (value.includes("small cap")) return { label: "Nifty Smallcap 250 ETF proxy", ticker: "HDFCSML250.NS" };
  if (value.includes("mid cap")) return { label: "Nifty Midcap 50", ticker: "^NSEMDCP50" };
  if (/large cap|flexi cap|multi cap|focused|value|contra|dividend|elss|equity|index/.test(value)) return { label: "Nifty 50 broad-market proxy", ticker: "^NSEI" };
  return null;
}

const GOALS: Array<{ id: Goal; label: string; copy: string; years: number }> = [
  { id: "wealth", label: "Build long-term wealth", copy: "Money I can leave invested for 7 years or more.", years: 8 },
  { id: "planned", label: "Fund a planned goal", copy: "A house, education, wedding, or another dated goal.", years: 5 },
  { id: "soon", label: "Use the money soon", copy: "I may need this money within the next 3 years.", years: 2 },
];

const DROP_OPTIONS: Array<{ id: DropComfort; label: string; copy: string; limit: number }> = [
  { id: "low", label: "Keep the ride calmer", copy: "A fall beyond 10% would make me uncomfortable.", limit: 0.1 },
  { id: "medium", label: "I can handle a rough year", copy: "I can stay invested through a fall near 20%.", limit: 0.2 },
  { id: "high", label: "I accept deep market falls", copy: "I understand that 30% or more can happen.", limit: 0.35 },
];

function classifyFund(category: string): FundKind {
  const value = category.toLowerCase();
  if (/equity|index|elss|large cap|mid cap|small cap|flexi cap|multi cap|sector|thematic/.test(value)) return "equity";
  if (/hybrid|balanced|asset allocation|multi asset|arbitrage/.test(value)) return "hybrid";
  if (/debt|liquid|overnight|money market|gilt|duration|bond|income|credit risk/.test(value)) return "debt";
  return "other";
}

export function isDirectGrowth(scheme: Scheme) {
  const name = scheme.schemeName.toLowerCase();
  return name.includes("direct") && name.includes("growth") && !name.includes("idcw");
}

export function evaluateFundFit({ category, observations, maxDrawdown, brief }: FundFitInput) {
  const kind = classifyFund(category);
  const tolerance = DROP_OPTIONS.find((option) => option.id === brief.dropComfort)?.limit ?? 0.2;
  const minimumYears = kind === "equity" ? 5 : kind === "hybrid" ? 3 : 0;
  const timeMismatch = brief.horizonYears < minimumYears;
  const dropMismatch = maxDrawdown !== null && Math.abs(maxDrawdown) > tolerance + 0.04;
  const shortHistory = observations < 756;
  const concentrated = /sector|thematic/.test(category.toLowerCase());
  const seriousMismatch = timeMismatch || (brief.goal === "soon" && kind !== "debt");
  const cautionCount = [dropMismatch, shortHistory, concentrated, kind === "other"].filter(Boolean).length;

  const status = seriousMismatch ? "mismatch" : cautionCount >= 2 ? "caution" : "possible";
  const title = status === "mismatch"
    ? "This fund and your timeline may not belong together."
    : status === "caution"
      ? "There are reasons to slow down before choosing this fund."
      : "This fund is worth a closer look, not an instant yes.";

  const lead = timeMismatch
    ? `This looks like a ${kind} fund, while your money may be needed in about ${brief.horizonYears} years.`
    : dropMismatch
      ? `Its worst historical fall was deeper than the loss range you said you could comfortably tolerate.`
      : `Its category and historical ride are broadly compatible with the brief you gave us.`;

  return { status, title, lead, kind, tolerance, timeMismatch, dropMismatch, shortHistory, concentrated };
}

function chartPath(points: Fund["points"]) {
  if (points.length < 2) return "";
  const sampleSize = Math.min(96, points.length);
  const sampled = Array.from({ length: sampleSize }, (_, index) => points[Math.round(index * (points.length - 1) / (sampleSize - 1))]);
  const values = sampled.map((point) => point.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const spread = Math.max(max - min, 0.0001);
  return sampled.map((point, index) => {
    const x = index * 100 / (sampled.length - 1);
    const y = 92 - ((point.value - min) / spread) * 84;
    return `${index === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
  }).join(" ");
}

function comparisonPaths(fundPoints: Fund["points"], benchmarkPoints: Fund["points"]) {
  const fundMap = new Map(fundPoints.map((point) => [point.date, point.value]));
  const aligned = benchmarkPoints.flatMap((point) => {
    const fund = fundMap.get(point.date);
    return fund && fund > 0 && point.value > 0 ? [{ date: point.date, fund, benchmark: point.value }] : [];
  }).sort((a, b) => a.date.localeCompare(b.date));
  if (aligned.length < 2) return null;
  const sampleSize = Math.min(90, aligned.length);
  const sampled = Array.from({ length: sampleSize }, (_, index) => aligned[Math.round(index * (aligned.length - 1) / (sampleSize - 1))]);
  const first = sampled[0];
  const normalized = sampled.map((point) => ({
    fund: point.fund / first.fund * 100,
    benchmark: point.benchmark / first.benchmark * 100,
  }));
  const values = normalized.flatMap((point) => [point.fund, point.benchmark]);
  const minimum = Math.min(...values);
  const maximum = Math.max(...values);
  const spread = Math.max(maximum - minimum, .001);
  const path = (key: "fund" | "benchmark") => normalized.map((point, index) => {
    const x = index * 100 / Math.max(1, normalized.length - 1);
    const y = 88 - ((point[key] - minimum) / spread) * 76;
    return `${index === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
  }).join(" ");
  return { fund: path("fund"), benchmark: path("benchmark"), startDate: aligned[0].date, endDate: aligned[aligned.length - 1].date };
}

function median(values: Array<number | null>) {
  const clean = values.filter((value): value is number => value !== null && Number.isFinite(value)).sort((a, b) => a - b);
  if (!clean.length) return null;
  const middle = Math.floor(clean.length / 2);
  return clean.length % 2 ? clean[middle] : (clean[middle - 1] + clean[middle]) / 2;
}

function percentagePoints(value: number | null | undefined) {
  return value === null || value === undefined || !Number.isFinite(value) ? "Not available" : `${value.toFixed(2)}%`;
}

function crore(value: number | null | undefined) {
  return value === null || value === undefined || !Number.isFinite(value)
    ? "Not available"
    : `₹${new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(value)} Cr`;
}

export default function MutualFundsPage() {
  const [goal, setGoal] = useState<Goal>("wealth");
  const [horizonYears, setHorizonYears] = useState(8);
  const [dropComfort, setDropComfort] = useState<DropComfort>("medium");
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<FundSuggestion[]>([]);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [fund, setFund] = useState<Fund | null>(null);
  const [peers, setPeers] = useState<CatalogPeer[]>([]);
  const [selectedCatalog, setSelectedCatalog] = useState<CatalogPeer | null>(null);
  const [catalogSource, setCatalogSource] = useState("");
  const [catalogAsOf, setCatalogAsOf] = useState<string | null>(null);
  const [peersLoading, setPeersLoading] = useState(false);
  const [peerNote, setPeerNote] = useState("");
  const [benchmark, setBenchmark] = useState<Benchmark | null>(null);
  const [benchmarkLoading, setBenchmarkLoading] = useState(false);
  const [benchmarkNote, setBenchmarkNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2 || fund) return;

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setSuggestionsLoading(true);
      try {
        const response = await fetch(`/api/funds/suggest?q=${encodeURIComponent(trimmed)}`, { signal: controller.signal });
        const payload = await response.json().catch(() => []);
        if (!response.ok || !Array.isArray(payload)) return;
        setSuggestions(payload as FundSuggestion[]);
        setActiveSuggestion(-1);
      } catch (caught) {
        if (!(caught instanceof DOMException && caught.name === "AbortError")) setSuggestions([]);
      } finally {
        if (!controller.signal.aborted) setSuggestionsLoading(false);
      }
    }, 180);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [fund, query]);

  useEffect(() => {
    if (!fund) return;
    const category = String(fund.meta.scheme_category ?? "");
    const proxy = benchmarkForCategory(category);
    const controller = new AbortController();
    const loadBenchmark = async () => {
      await Promise.resolve();
      setBenchmark(null);
      setBenchmarkNote("");
      if (!proxy) {
        setBenchmarkNote("A reasonable public benchmark proxy was not assigned to this category.");
        return;
      }
      setBenchmarkLoading(true);
      try {
        const response = await fetch(`/api/market/history?market=india&symbols=${encodeURIComponent(proxy.ticker)}`, { signal: controller.signal });
        const payload = await response.json().catch(() => null);
        const points = payload?.series?.[proxy.ticker];
        if (!response.ok || !Array.isArray(points)) throw new Error("Benchmark unavailable");
        setBenchmark({ ...proxy, points });
      } catch (caught) {
        if (!(caught instanceof DOMException && caught.name === "AbortError")) setBenchmarkNote("Benchmark history is temporarily unavailable. The fund analysis above is unaffected.");
      } finally {
        if (!controller.signal.aborted) setBenchmarkLoading(false);
      }
    };
    void loadBenchmark();
    return () => controller.abort();
  }, [fund]);

  function chooseGoal(nextGoal: Goal, years: number) {
    setGoal(nextGoal);
    setHorizonYears(years);
  }

  async function search(searchQuery = query) {
    const trimmed = searchQuery.trim();
    if (trimmed.length < 3) {
      setError("Type at least three letters from the fund name.");
      return;
    }
    setQuery(trimmed);
    setSuggestionsOpen(false);
    setSuggestions([]);
    setLoading(true);
    setError("");
    setFund(null);
    setPeers([]);
    setSelectedCatalog(null);
    setPeerNote("");
    try {
      const response = await fetch(`/api/funds/search?q=${encodeURIComponent(trimmed)}`);
      const payload = await response.json().catch(() => null);
      if (!response.ok || !Array.isArray(payload)) throw new Error(payload?.detail ?? "Search failed.");
      const matches = (payload as Scheme[]).filter(isDirectGrowth);
      setSchemes(matches);
      if (!matches.length) setError("No Direct Growth plans matched. Try fewer words from the scheme name.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Search failed.");
    } finally {
      setLoading(false);
    }
  }

  function chooseSuggestion(suggestion: FundSuggestion) {
    setQuery(suggestion.name);
    setSuggestionsOpen(false);
    setSuggestions([]);
    setActiveSuggestion(-1);
    void search(suggestion.name);
  }

  async function select(scheme: Scheme) {
    setLoading(true);
    setSchemes([]);
    setFund(null);
    setPeers([]);
    setSelectedCatalog(null);
    setPeerNote("");
    setQuery(scheme.schemeName);
    setError("");
    try {
      const response = await fetch(`/api/funds/${scheme.schemeCode}`);
      const payload = await response.json().catch(() => null) as Fund | null;
      if (!response.ok || !payload) throw new Error(payload?.detail ?? "NAV history failed.");
      setFund(payload);
      void loadPeers(scheme.schemeName);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "NAV history failed.");
    } finally {
      setLoading(false);
    }
  }

  async function loadPeers(fundName: string) {
    setPeersLoading(true);
    try {
      const response = await fetch(`/api/funds/catalog?name=${encodeURIComponent(fundName)}`);
      const payload = await response.json().catch(() => null) as CatalogPayload | null;
      if (!response.ok || !payload) throw new Error(payload?.detail ?? "Peer catalog failed.");
      setSelectedCatalog(payload.selected);
      setPeers(payload.peers);
      setCatalogSource(payload.source);
      setCatalogAsOf(payload.asOf);
      if (!payload.selected || !payload.peers.length) setPeerNote("This scheme could not be matched confidently to the supplied peer catalog.");
    } catch {
      setPeerNote("Peer data could not be loaded right now. Your fund check is still available above.");
    } finally {
      setPeersLoading(false);
    }
  }

  const analysis = useMemo(() => {
    if (!fund?.points.length) return null;
    const trailing = trailingReturns(fund.points);
    const returns = returnsFromPrices(fund.points.map((point) => point.value));
    const risk = portfolioRisk(returns, 0.95, 1);
    const rolling = rollingReturnSummary(fund.points);
    const relative = benchmark ? benchmarkComparison(fund.points, benchmark.points) : null;
    const comparison = benchmark ? comparisonPaths(fund.points, benchmark.points) : null;
    const category = String(fund.meta.scheme_category ?? "Category not supplied");
    const brief = { goal, horizonYears, dropComfort };
    const fit = evaluateFundFit({
      category,
      observations: risk?.observations ?? 0,
      maxDrawdown: risk?.maxDrawdown ?? null,
      brief,
    });
    return {
      trailing,
      risk,
      rolling,
      relative,
      comparison,
      fit,
      category,
      first: fund.points[0],
      last: fund.points[fund.points.length - 1],
      path: chartPath(fund.points),
    };
  }, [benchmark, dropComfort, fund, goal, horizonYears]);

  const worstValue = analysis?.risk ? 100000 * (1 + analysis.risk.maxDrawdown) : null;
  const peerMedians = useMemo(() => ({
    cagr3yPct: median(peers.map((item) => item.cagr3yPct)),
    expenseRatioPct: median(peers.map((item) => item.expenseRatioPct)),
    aumCrore: median(peers.map((item) => item.aumCrore)),
  }), [peers]);

  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <div>
          <span className={styles.kicker}>Fund Match</span>
          <h1>Do not ask which fund is best. <em>Ask what fits your life.</em></h1>
          <p>Give one fund a job. We will test its category, timeline, and historical downside against what you actually need.</p>
        </div>
        <aside className={styles.heroAside} aria-label="What this tool answers">
          <span>One useful answer</span>
          <strong>Could I hold this fund when it gets uncomfortable?</strong>
          <p>Returns come last. Fit, risk, and missing evidence come first.</p>
        </aside>
      </header>

      <section className={styles.brief} aria-labelledby="brief-title">
        <div className={styles.sectionIntro}>
          <span>01 / Your brief</span>
          <div>
            <h2 id="brief-title">What job should this money do?</h2>
            <p>The same fund can be sensible for one goal and wrong for another.</p>
          </div>
        </div>

        <div className={styles.choiceGrid}>
          {GOALS.map((option) => (
            <button
              type="button"
              className={goal === option.id ? styles.selected : ""}
              aria-pressed={goal === option.id}
              key={option.id}
              onClick={() => chooseGoal(option.id, option.years)}
            >
              <i aria-hidden="true">{goal === option.id ? "●" : "○"}</i>
              <strong>{option.label}</strong>
              <small>{option.copy}</small>
            </button>
          ))}
        </div>

        <div className={styles.profileRow}>
          <label>
            <span>When might you need the money?</span>
            <strong>{horizonYears >= 8 ? "7+ years" : `${horizonYears} years`}</strong>
            <input
              type="range"
              min="1"
              max="10"
              value={horizonYears}
              onChange={(event) => setHorizonYears(Number(event.target.value))}
              aria-label="Investment horizon in years"
            />
            <small>1 year <b>10 years</b></small>
          </label>
          <fieldset>
            <legend>How much decline could you sit through?</legend>
            <div className={styles.dropOptions}>
              {DROP_OPTIONS.map((option) => (
                <button
                  type="button"
                  key={option.id}
                  className={dropComfort === option.id ? styles.selected : ""}
                  aria-pressed={dropComfort === option.id}
                  onClick={() => setDropComfort(option.id)}
                >
                  <strong>{option.label}</strong>
                  <small>{option.copy}</small>
                </button>
              ))}
            </div>
          </fieldset>
        </div>
      </section>

      <section className={styles.finder} aria-labelledby="finder-title">
        <div className={styles.sectionIntro}>
          <span>02 / Pick a fund</span>
          <div>
            <h2 id="finder-title">Search the scheme you are considering.</h2>
            <p>We keep only Direct Growth plans so the comparison starts on cleaner terms.</p>
          </div>
        </div>
        <div
          className={styles.searchBox}
          onFocus={() => setSuggestionsOpen(true)}
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setSuggestionsOpen(false);
          }}
        >
          <label htmlFor="fund-search">Fund or scheme name</label>
          <div className={styles.searchRow}>
            <div className={styles.searchInputWrap}>
              <input
                id="fund-search"
                role="combobox"
                aria-autocomplete="list"
                aria-expanded={suggestionsOpen && suggestions.length > 0}
                aria-controls="fund-suggestions"
                aria-activedescendant={activeSuggestion >= 0 ? `fund-suggestion-${activeSuggestion}` : undefined}
                value={query}
                onChange={(event) => {
                  const nextQuery = event.target.value;
                  setQuery(nextQuery);
                  setSuggestionsOpen(true);
                  setActiveSuggestion(-1);
                  setSchemes([]);
                  setError("");
                  if (nextQuery.trim().length < 2) {
                    setSuggestions([]);
                    setSuggestionsLoading(false);
                  }
                }}
                onKeyDown={(event) => {
                  if (event.key === "ArrowDown" && suggestions.length) {
                    event.preventDefault();
                    setSuggestionsOpen(true);
                    setActiveSuggestion((current) => (current + 1) % suggestions.length);
                  } else if (event.key === "ArrowUp" && suggestions.length) {
                    event.preventDefault();
                    setSuggestionsOpen(true);
                    setActiveSuggestion((current) => current <= 0 ? suggestions.length - 1 : current - 1);
                  } else if (event.key === "Escape") {
                    setSuggestionsOpen(false);
                    setActiveSuggestion(-1);
                  } else if (event.key === "Enter" && !loading) {
                    event.preventDefault();
                    if (suggestionsOpen && activeSuggestion >= 0) chooseSuggestion(suggestions[activeSuggestion]);
                    else void search();
                  }
                }}
                placeholder="Try Parag Parikh Flexi Cap"
                autoComplete="off"
              />
              {suggestionsOpen && query.trim().length >= 2 && (
                <div className={styles.suggestions} id="fund-suggestions" role="listbox" aria-label="Recommended funds">
                  <header><span>{suggestionsLoading ? "Finding close matches" : "Recommended matches"}</span><small>Direct Growth search</small></header>
                  {!suggestionsLoading && suggestions.map((suggestion, index) => (
                    <button
                      type="button"
                      role="option"
                      aria-selected={index === activeSuggestion}
                      id={`fund-suggestion-${index}`}
                      className={index === activeSuggestion ? styles.activeSuggestion : ""}
                      key={`${suggestion.name}-${suggestion.category}`}
                      onMouseEnter={() => setActiveSuggestion(index)}
                      onClick={() => chooseSuggestion(suggestion)}
                    >
                      <span>{suggestion.name}</span>
                      <small>{suggestion.category}<i aria-hidden="true">↗</i></small>
                    </button>
                  ))}
                  {!suggestionsLoading && !suggestions.length && <p>No close match yet. Try the fund house or category.</p>}
                </div>
              )}
            </div>
            <button type="button" onClick={() => void search()} disabled={loading}>
              {loading ? "Checking..." : "Find my fund"}
              <span aria-hidden="true">↘</span>
            </button>
          </div>
        </div>
        {error && <p className={styles.error} role="alert">{error}</p>}
        {schemes.length > 0 && (
          <div className={styles.results} aria-label="Matching Direct Growth plans">
            {schemes.map((scheme) => (
              <button type="button" key={scheme.schemeCode} onClick={() => void select(scheme)}>
                <span>{scheme.schemeName}</span>
                <small>Select <i aria-hidden="true">→</i></small>
              </button>
            ))}
          </div>
        )}
      </section>

      {analysis && fund && (
        <section className={styles.report} aria-labelledby="verdict-title">
          <header className={`${styles.verdict} ${styles[analysis.fit.status]}`}>
            <div className={styles.returnGrid}>
              <span>03 / Your first-pass answer</span>
              <p>{analysis.category}</p>
            </div>
            <h2 id="verdict-title">{analysis.fit.title}</h2>
            <p>{analysis.fit.lead}</p>
            <small>This is a screening result, not a recommendation to buy or sell.</small>
          </header>

          <div className={styles.fundIdentity}>
            <div>
              <span>Fund reviewed</span>
              <h3>{String(fund.meta.scheme_name ?? fund.meta.schemeName ?? query)}</h3>
            </div>
            <button type="button" onClick={() => { setFund(null); setQuery(""); }}>
              Check another fund
            </button>
          </div>

          <div className={styles.storyGrid}>
            <article className={styles.stressCard}>
              <span>The discomfort test</span>
              <h3>Could you stay invested if ₹1 lakh looked like this?</h3>
              <strong>{worstValue === null ? "Not available" : money(worstValue)}</strong>
              <p>That is the effect of the worst fall in the available NAV history, before any recovery.</p>
              <div className={styles.dropLine}>
                <i style={{ width: `${Math.min(100, Math.abs(analysis.risk?.maxDrawdown ?? 0) * 200)}%` }} />
              </div>
              <small>Historical maximum drawdown {percent(analysis.risk?.maxDrawdown)}</small>
            </article>

            <article className={styles.journeyCard}>
              <div>
                <span>The journey, not a forecast</span>
                <strong>{analysis.first.date.slice(0, 4)} to {analysis.last.date.slice(0, 4)}</strong>
              </div>
              <svg viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-label="NAV history shape">
                <path d={analysis.path} vectorEffect="non-scaling-stroke" />
              </svg>
              <p>Latest published NAV <strong>₹{analysis.last.value.toFixed(2)}</strong> as of {analysis.last.date}</p>
            </article>
          </div>

          <div className={styles.evidence}>
            <article>
              <span>{analysis.fit.timeMismatch ? "Needs attention" : "Timeline check"}</span>
              <h3>{analysis.fit.timeMismatch ? "Your timeline is too short for this category." : "The timeline clears the first filter."}</h3>
              <p>{analysis.fit.kind === "equity" ? "Equity funds are designed for long-term capital growth and can be volatile." : `This scheme appears to be in the ${analysis.fit.kind} category.`}</p>
            </article>
            <article>
              <span>{analysis.fit.dropMismatch ? "Needs attention" : "Downside check"}</span>
              <h3>{analysis.fit.dropMismatch ? "The historical fall exceeded your comfort range." : "The worst recorded fall sits near your stated range."}</h3>
              <p>Past drawdown cannot predict the next one, but it makes the emotional cost more concrete.</p>
            </article>
            <article>
              <span>{analysis.fit.shortHistory ? "Limited evidence" : "History check"}</span>
              <h3>{analysis.fit.shortHistory ? "There is less than three years of daily history." : "There is enough history for a basic cycle check."}</h3>
              <p>History length improves context. It still cannot prove how the fund will behave next.</p>
            </article>
          </div>

          <section className={styles.returnContext}>
            <header>
              <div>
                <span>Supporting detail</span>
                <h3>Returns are evidence, not the verdict.</h3>
              </div>
              <p>Read multiple periods together. One strong year can hide a poor fit.</p>
            </header>
            <div>
              {["1Y", "3Y", "5Y"].map((period) => (
                <article key={period}>
                  <span>{period} annualised return</span>
                  <strong>{percent(analysis.trailing[period] as number | null)}</strong>
                </article>
              ))}
              <article>
                <span>Annualised volatility</span>
                <strong>{percent(analysis.risk?.annualVolatility)}</strong>
              </article>
              <article>
                <span>Median rolling 1Y return</span>
                <strong>{percent(analysis.rolling?.median)}</strong>
                <small>Across {analysis.rolling?.observations ?? 0} available one-year windows</small>
              </article>
              <article>
                <span>Positive 1Y windows</span>
                <strong>{percent(analysis.rolling?.positiveShare)}</strong>
                <small>How often a one-year holding window finished above its start</small>
              </article>
              <article>
                <span>Weakest rolling year</span>
                <strong>{percent(analysis.rolling?.worst)}</strong>
                <small>The least favourable one-year window in the available history</small>
              </article>
            </div>
          </section>

          <section className={styles.benchmarkSection} aria-labelledby="benchmark-title">
            <header>
              <div><span>Benchmark reality check</span><h3 id="benchmark-title">Did the fund earn its extra risk?</h3></div>
              <p>Compared over shared dates with a public market proxy. This is context, not the scheme&apos;s official benchmark record.</p>
            </header>
            {benchmarkLoading && <div className={styles.peerLoading}><i /><span>Aligning benchmark dates...</span></div>}
            {!benchmarkLoading && benchmark && analysis.relative && <>
              {analysis.comparison && <figure className={styles.benchmarkChart}>
                <figcaption><span>Growth of 100</span><div><i className={styles.fundKey} />Fund <i className={styles.benchmarkKey} />Proxy</div></figcaption>
                <svg viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-label={`Normalized fund and ${benchmark.label} performance from ${analysis.comparison.startDate} to ${analysis.comparison.endDate}`}>
                  <line x1="0" x2="100" y1="88" y2="88" />
                  <line x1="0" x2="100" y1="50" y2="50" />
                  <path className={styles.benchmarkPath} d={analysis.comparison.benchmark} vectorEffect="non-scaling-stroke" />
                  <path className={styles.fundPath} d={analysis.comparison.fund} vectorEffect="non-scaling-stroke" />
                </svg>
                <footer><span>{analysis.comparison.startDate}</span><span>{analysis.comparison.endDate}</span></footer>
              </figure>}
              <div className={styles.benchmarkLead}>
                <div><span>Fund annualised</span><strong>{percent(analysis.relative.fundAnnualReturn)}</strong></div>
                <div><span>{benchmark.label}</span><strong>{percent(analysis.relative.benchmarkAnnualReturn)}</strong></div>
                <div className={analysis.relative.activeAnnualReturn >= 0 ? styles.benchmarkPositive : styles.benchmarkNegative}><span>Active return</span><strong>{percent(analysis.relative.activeAnnualReturn)}</strong></div>
              </div>
              <div className={styles.benchmarkDetail}>
                <article><span>Risk-adjusted alpha</span><strong>{percent(analysis.relative.alpha)}</strong><small>CAPM estimate using a 6.5% risk-free assumption</small></article>
                <article><span>Beta</span><strong>{analysis.relative.beta?.toFixed(2) ?? "Not available"}</strong><small>How strongly the fund moved with the proxy</small></article>
                <article><span>Tracking error</span><strong>{percent(analysis.relative.trackingError)}</strong><small>Variability of return differences</small></article>
                <article><span>Information ratio</span><strong>{analysis.relative.informationRatio?.toFixed(2) ?? "Not available"}</strong><small>Active return per unit of tracking error</small></article>
              </div>
              <p className={styles.benchmarkLimit}>Proxy: {benchmark.label}. Shared period {analysis.relative.startDate} to {analysis.relative.endDate}. Yahoo market history can differ from an AMC&apos;s total-return benchmark. Dividends, tracking differences, and scheme expenses can affect the comparison.</p>
            </>}
            {!benchmarkLoading && benchmarkNote && <p className={styles.peerNote}>{benchmarkNote}</p>}
          </section>

          <section className={styles.peerSection} aria-labelledby="peer-title">
            <header>
              <div>
                <span>Same-category context</span>
                <h3 id="peer-title">See the fund beside the alternatives it should beat.</h3>
              </div>
              <p>Growth-plan peers from the supplied catalog. Compare return, cost, and scale without turning one metric into a winner.</p>
            </header>

            {peersLoading && <div className={styles.peerLoading}><i /><span>Building the peer set...</span></div>}
            {!peersLoading && selectedCatalog && peers.length > 1 && (
              <>
                <div className={styles.peerRead}>
                  <article>
                    <span>Three-year CAGR</span>
                    <strong>{selectedCatalog.cagr3yPct !== null && peerMedians.cagr3yPct !== null
                      ? selectedCatalog.cagr3yPct >= peerMedians.cagr3yPct ? "Above the category median" : "Below the category median"
                      : "Not enough history"}</strong>
                    <small>Your fund {percentagePoints(selectedCatalog.cagr3yPct)}. Median {percentagePoints(peerMedians.cagr3yPct)}.</small>
                  </article>
                  <article>
                    <span>Expense ratio</span>
                    <strong>{selectedCatalog.expenseRatioPct !== null && peerMedians.expenseRatioPct !== null
                      ? selectedCatalog.expenseRatioPct <= peerMedians.expenseRatioPct ? "Costs less than the median" : "Costs more than the median"
                      : "Cost unavailable"}</strong>
                    <small>Your fund {percentagePoints(selectedCatalog.expenseRatioPct)}. Median {percentagePoints(peerMedians.expenseRatioPct)}.</small>
                  </article>
                  <article>
                    <span>Fund size</span>
                    <strong>{selectedCatalog.aumCrore !== null && peerMedians.aumCrore !== null
                      ? selectedCatalog.aumCrore >= peerMedians.aumCrore ? "Larger than the median peer" : "Smaller than the median peer"
                      : "AUM unavailable"}</strong>
                    <small>Your fund {crore(selectedCatalog.aumCrore)}. Median {crore(peerMedians.aumCrore)}.</small>
                  </article>
                </div>

                <div className={styles.peerTableWrap}>
                  <table className={styles.peerTable}>
                    <thead><tr><th>Fund</th><th>Category</th><th>3Y CAGR</th><th>Expense ratio</th><th>AUM</th></tr></thead>
                    <tbody>
                      {peers.map((item) => (
                        <tr key={item.name} className={item.name === selectedCatalog.name ? styles.currentFund : ""}>
                          <td><strong>{item.name}</strong>{item.name === selectedCatalog.name && <small>Your fund</small>}</td>
                          <td>{item.category}</td>
                          <td>{percentagePoints(item.cagr3yPct)}</td>
                          <td>{percentagePoints(item.expenseRatioPct)}</td>
                          <td>{crore(item.aumCrore)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className={styles.peerLimit}>Source: {catalogSource || "User-supplied catalog"}. Snapshot date: {catalogAsOf ?? "not supplied"}. CAGR, expense ratio, and AUM may have changed. Peer rows do not include current holdings, portfolio overlap, or the official Riskometer.</p>
              </>
            )}
            {!peersLoading && peerNote && <p className={styles.peerNote}>{peerNote}</p>}
          </section>

          <section className={styles.nextMove}>
            <div>
              <span>Before any investment</span>
              <h3>Four things this NAV history cannot answer.</h3>
              <p>Use the latest fund factsheet and Scheme Information Document to finish the check.</p>
            </div>
            <ol>
              <li><i>01</i><span><strong>Current Riskometer</strong><small>Confirm that the official risk label matches your tolerance.</small></span></li>
              <li><i>02</i><span><strong>Current costs and exit rules</strong><small>Confirm the latest expense ratio, exit load, and any tax impact before investing.</small></span></li>
              <li><i>03</i><span><strong>Benchmark and portfolio</strong><small>Check what the fund owns and whether it has delivered against the right benchmark.</small></span></li>
              <li><i>04</i><span><strong>Role in your whole portfolio</strong><small>A decent fund can still duplicate risks you already own.</small></span></li>
            </ol>
          </section>

          <ResultNotes
            assumptions={[
              "NAV history is sourced from mfapi.in using AMFI-published data.",
              "Category peer metrics come from the supplied 600-fund catalog and are shown as an undated snapshot.",
              "The first-pass fit uses scheme category, your timeline, your stated loss comfort, and historical NAV behavior.",
              "Annualisation uses 252 daily observations for risk metrics.",
            ]}
            warnings={[
              "Past performance and historical drawdown do not predict future returns or losses.",
              "This check does not yet include the official Riskometer, exit load, benchmark, holdings, taxation, or your full financial situation.",
            ]}
          />
        </section>
      )}
    </div>
  );
}
