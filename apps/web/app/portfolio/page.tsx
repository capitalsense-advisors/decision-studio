"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useRef, useState } from "react";

import { freshnessWarning } from "@/lib/freshness";
import { ResultNotes } from "@/components/ui";
import { money, percent } from "@/lib/format";
import { ASSET_LABELS, analyzePortfolio, changeHoldingType, createHolding, holdingLabel, isValueHolding, latestPrices, normalizeSymbol, parseHoldingsCsv, validateHoldings, type AssetType, type HoldingDraft, type HoldingIssue, type Market } from "@/lib/portfolio";

const SAMPLE: HoldingDraft[] = [
  createHolding({ id: "sample-1", symbol: "RELIANCE", quantity: 20, averageCost: 2400 }),
  createHolding({ id: "sample-2", symbol: "HDFCBANK", quantity: 40, averageCost: 1500 }),
  createHolding({ id: "sample-3", symbol: "INFY", quantity: 30, averageCost: 1350 }),
  createHolding({ id: "sample-4", symbol: "TCS", quantity: 12, averageCost: 3200 }),
];

type Stage = "choose" | "review" | "mirror";
type AssistantTopic = "start" | "csv" | "symbols" | "prices" | "read";

export default function PortfolioPage() {
  const [stage, setStage] = useState<Stage>("choose");
  const [market, setMarket] = useState<Market>("india");
  const [rows, setRows] = useState<HoldingDraft[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [failures, setFailures] = useState<string[]>([]);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [assistantTopic, setAssistantTopic] = useState<AssistantTopic>("start");
  const fileRef = useRef<HTMLInputElement>(null);
  const issues = useMemo(() => validateHoldings(rows), [rows]);
  const analysis = useMemo(() => analyzePortfolio(rows), [rows]);
  const exchangeRows = rows.filter((row) => !isValueHolding(row));

  function beginManual() {
    setRows([createHolding()]);
    setStage("review");
    setAssistantTopic("symbols");
    setMessage("Add up to 10 holdings. Enter balances for cash, debt and gold; use units and prices for stocks or listed ETFs.");
  }

  function loadSample() {
    setRows(SAMPLE.map((row) => ({ ...row })));
    setStage("review");
    setAssistantTopic("prices");
    setMessage("Sample loaded. Check the quantities and average costs, then fetch prices.");
  }

  async function importCsv(file: File) {
    if (file.size > 250_000) {
      setMessage("That file is too large. Use a CSV under 250 KB with no more than 10 holdings.");
      return;
    }
    const parsed = parseHoldingsCsv(await file.text());
    if (!parsed.rows.length) {
      setMessage(parsed.issues[0]?.message ?? "No usable holdings were found.");
      return;
    }
    setRows(parsed.rows);
    setStage("review");
    setAssistantTopic(parsed.issues.length ? "csv" : "prices");
    setMessage(parsed.issues.length ? parsed.issues.map((issue) => issue.message).join(" ") : `${parsed.rows.length} holdings imported for review.`);
    if (fileRef.current) fileRef.current.value = "";
  }

  function update(id: string, key: keyof HoldingDraft, value: string) {
    setStage("review");
    setFailures([]);
    setRows((current) => current.map((row) => {
      if (row.id !== id) return row;
      if (key === "symbol") return { ...row, symbol: normalizeSymbol(value), currentPrice: null, priceDate: null, priceSource: "missing" };
      if (key === "assetType") return changeHoldingType(row, value as AssetType);
      if (key === "valuationMode") return changeHoldingType(row, row.assetType, value as HoldingDraft["valuationMode"]);
      if (key === "name") return { ...row, name: value };
      if (key === "priceDate") return { ...row, priceDate: value || null };
      if (key === "currentValue" || key === "investedValue") return { ...row, [key]: value === "" ? null : Number(value), ...(key === "currentValue" ? { priceDate: new Date().toISOString().slice(0, 10), priceSource: value === "" ? "missing" as const : "manual" as const } : {}) };
      if (key === "currentPrice") return { ...row, currentPrice: value === "" ? null : Math.max(0, Number(value)), priceDate: new Date().toISOString().slice(0, 10), priceSource: value === "" ? "missing" : "manual" };
      return { ...row, [key]: Math.max(0, Number(value)) };
    }));
  }

  function changeMarket(next: Market) {
    if (next === market) return;
    setMarket(next);
    setStage("review");
    setFailures([]);
    setRows((current) => current.map((row) => ({ ...row, currentPrice: null, currentValue: null, investedValue: null, averageCost: Number.NaN, priceDate: null, priceSource: "missing" })));
    setMessage("Currency changed. All prices, balances and costs were cleared; re-enter amounts in the selected currency.");
    setAssistantTopic("prices");
  }

  async function refreshPrices() {
    if (!exchangeRows.length) {
      setMessage("Cash, debt, physical gold and value-only funds use the values you enter; no exchange price lookup is needed.");
      return;
    }
    const currentIssues = validateHoldings(exchangeRows);
    if (currentIssues.length) {
      setMessage(`Fix ${currentIssues.length} highlighted ${currentIssues.length === 1 ? "issue" : "issues"} before checking prices.`);
      setAssistantTopic("symbols");
      return;
    }
    setLoading(true);
    setMessage("Checking recent closing prices…");
    setFailures([]);
    try {
      const symbols = exchangeRows.map((row) => normalizeSymbol(row.symbol));
      const response = await fetch(`/api/market/history?market=${market}&symbols=${encodeURIComponent(symbols.join(","))}`);
      const body = await response.json() as { detail?: string; series?: Record<string, Array<{ date: string; value: number }>>; failures?: string[] };
      if (!response.ok || !body.series) throw new Error(body.detail ?? "Prices are temporarily unavailable.");
      const latest = latestPrices(body.series);
      const missing = (body.failures ?? []).filter((symbol) => {
        const row = exchangeRows.find((item) => normalizeSymbol(item.symbol) === symbol);
        return !row?.currentPrice;
      });
      setRows((current) => current.map((row) => {
        if (isValueHolding(row)) return row;
        const point = latest[normalizeSymbol(row.symbol)];
        return point ? { ...row, currentPrice: point.value, priceDate: point.date, priceSource: "yahoo" } : row;
      }));
      setFailures(missing);
      setMessage(missing.length ? `Prices loaded for ${exchangeRows.length - missing.length} holdings. Add a manual price for ${missing.join(", ")} or remove them.` : `Prices checked for ${exchangeRows.length} exchange-traded holdings. Other assets keep your entered values.`);
      setAssistantTopic(missing.length ? "prices" : "read");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Prices are temporarily unavailable. Your draft is unchanged.");
      setAssistantTopic("prices");
    } finally {
      setLoading(false);
    }
  }

  function revealMirror() {
    if (!analysis) {
      setMessage("Enter a current amount for each value-based asset and a usable price for each stock or listed ETF.");
      setAssistantTopic("prices");
      return;
    }
    setStage("mirror");
    setAssistantTopic("read");
    setMessage("");
  }

  return (
    <div className="mirror-page">
      <header className="mirror-hero">
        <div><span className="eyebrow">Money Mirror · private portfolio check</span><h1>See the shape of<br /><em>what you own.</em></h1><p>Bring holdings, verify their values, then reveal the one portfolio pattern worth noticing first. Your draft stays in this browser tab.</p></div>
        <div className="mirror-hero-media" aria-hidden="true"><Image src="/media/cards/money-mirror-hero.webp" alt="" width={420} height={420} sizes="(max-width: 900px) 240px, 330px" priority /></div>
      </header>

      <nav className="mirror-progress" aria-label="Money Mirror progress">
        {(["choose", "review", "mirror"] as Stage[]).map((item, index) => <span key={item} className={stage === item ? "active" : (["choose", "review", "mirror"].indexOf(stage) > index ? "done" : "")}><i>{index + 1}</i>{item === "choose" ? "Bring holdings" : item === "review" ? "Check the data" : "Read the mirror"}</span>)}
      </nav>

      {stage === "choose" && <section className="mirror-entry" aria-labelledby="entry-title">
        <div className="future-section-title"><span>01</span><div><p>A safe beginning</p><h2 id="entry-title">How would you like to start?</h2></div></div>
        <div className="entry-cards">
          <button type="button" onClick={() => fileRef.current?.click()}><span>Fastest</span><Image src="/media/cards/portfolio-import.webp" alt="" width={240} height={240} sizes="(max-width: 900px) 160px, 180px" aria-hidden="true" /><strong>Import a CSV</strong><small>Symbol, quantity and average cost. You review everything before analysis.</small></button>
          <button type="button" onClick={beginManual}><span>Most control</span><Image src="/media/cards/portfolio-manual.webp" alt="" width={240} height={240} sizes="(max-width: 900px) 160px, 180px" aria-hidden="true" /><strong>Add them one by one</strong><small>Use one compact holding card at a time. No spreadsheet wall.</small></button>
          <button type="button" onClick={loadSample}><span>Explore first</span><Image src="/media/cards/portfolio-sample.webp" alt="" width={240} height={240} sizes="(max-width: 900px) 160px, 180px" aria-hidden="true" /><strong>Try a sample</strong><small>See the complete journey using four Indian stocks.</small></button>
        </div>
        <input ref={fileRef} hidden type="file" accept=".csv,text/csv" onChange={(event) => event.target.files?.[0] && void importCsv(event.target.files[0])} />
        <p className="privacy-note"><b>Private by design.</b> CSV contents are parsed in your browser and are not uploaded. Only ticker symbols are sent to the price endpoint.</p>
      </section>}

      {stage !== "choose" && <section className="mirror-workspace" aria-labelledby="review-title">
        <div className="mirror-review">
          <div className="future-section-title compact"><span>02</span><div><p>Review before analysis</p><h2 id="review-title">Make the data yours.</h2></div></div>
          <div className="market-toggle" aria-label="Portfolio currency and exchange"><button type="button" className={market === "india" ? "active" : ""} aria-pressed={market === "india"} disabled={loading} onClick={() => changeMarket("india")}>India · NSE</button><button type="button" className={market === "us" ? "active" : ""} aria-pressed={market === "us"} disabled={loading} onClick={() => changeMarket("us")}>United States</button></div>
          {message && <p className="mirror-notice" role="status">{message}</p>}
          <div className="holding-cards">
            {rows.map((row, index) => <HoldingEditor key={row.id} row={row} index={index} currency={market === "us" ? "USD" : "INR"} loading={loading} issues={issues.filter((issue) => issue.row === index + 1)} onChange={(key, value) => update(row.id, key, value)} onRemove={() => { setStage("review"); setRows((current) => current.filter((item) => item.id !== row.id)); }} />)}
          </div>
          <p className="source-line">Amounts are in {market === "us" ? "USD" : "INR"}; no currency conversion is performed. Stocks and listed ETFs need prices. Cash, debt, gold and value-only funds use entered amounts. Imported valuations have no date unless you supply one.</p><div className="review-actions"><button type="button" className="button secondary" disabled={loading || rows.length >= 10} onClick={() => setRows((current) => [...current, createHolding()])}>＋ Add holding</button><button type="button" className="button secondary" disabled={loading || !exchangeRows.length} onClick={() => void refreshPrices()}>{loading ? "Checking prices…" : "Check Yahoo prices"}</button><button type="button" className="button" disabled={!analysis || issues.length > 0 || loading} onClick={revealMirror}>Reveal my mirror</button></div>
          <p className="source-line">Yahoo prices apply only to stocks and listed ETFs · balances and estimated values stay manual · no lookup is needed for cash, FDs or physical gold.</p>
        </div>

        {stage === "mirror" && analysis && <MirrorResult analysis={analysis} failures={failures} market={market} />}
      </section>}

      <MirrorAssistant open={assistantOpen} topic={assistantTopic} stage={stage} issues={issues.length} failures={failures} onOpen={() => setAssistantOpen((current) => !current)} onTopic={setAssistantTopic} />
    </div>
  );
}

function HoldingEditor({ row, index, currency, loading, issues, onChange, onRemove }: { row: HoldingDraft; index: number; currency: string; loading: boolean; issues: HoldingIssue[]; onChange: (key: keyof HoldingDraft, value: string) => void; onRemove: () => void }) {
  const valueBased = isValueHolding(row);
  const position = index + 1;
  const notes: Partial<Record<AssetType, string>> = {
    cash: "Enter the balance available today. No ticker, quantity or market price is needed.",
    debt: "Enter the current value of your FD, bond or other debt holding from a statement, including accrued interest if reported. This does not measure issuer or maturity risk.",
    gold: "Enter the estimated current value of physical gold. For a listed gold ETF, choose Fund / ETF and use its exchange symbol.",
    fund: "Use the total current value from your fund statement. No exchange symbol is needed. For listed ETFs, switch to units and price.",
  };
  return <article className={issues.length ? "holding-card invalid" : "holding-card"}>
    <header><span>Holding {String(position).padStart(2, "0")}</span><button type="button" disabled={loading} aria-label={`Remove ${holdingLabel(row) || `holding ${position}`}`} onClick={onRemove}>Remove</button></header>
    <fieldset className="holding-editor" disabled={loading} aria-label={`Holding ${position} details`}>
      <div className="holding-fields">
        <label><span>Asset type</span><select aria-label={`Asset type holding ${position}`} value={row.assetType} onChange={(event) => onChange("assetType", event.target.value)}>{Object.entries(ASSET_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        {row.assetType === "fund" && <label><span>How to value it</span><select aria-label={`Valuation method holding ${position}`} value={row.valuationMode} onChange={(event) => onChange("valuationMode", event.target.value)}><option value="units">Listed ETF · units and price</option><option value="value">Fund statement · total value</option></select></label>}
        {valueBased ? <>
          <label><span>Label (optional)</span><input aria-label={`Label holding ${position}`} maxLength={80} value={row.name} placeholder={row.assetType === "cash" ? "Savings account" : row.assetType === "debt" ? "Bank FD" : row.assetType === "gold" ? "Physical gold" : "Fund name"} onChange={(event) => onChange("name", event.target.value)} /></label>
          <label><span>{row.assetType === "cash" ? "Cash balance" : "Current total value"} ({currency})</span><input aria-label={`${row.assetType === "cash" ? "Cash balance" : "Current value"} holding ${position}`} type="number" min="0" step="any" value={row.currentValue ?? ""} placeholder="50000" onChange={(event) => onChange("currentValue", event.target.value)} /></label>
          {row.assetType !== "cash" && <label><span>Amount invested ({currency}, optional)</span><input aria-label={`Amount invested holding ${position}`} type="number" min="0" step="any" value={row.investedValue ?? ""} placeholder="Leave blank if unknown" onChange={(event) => onChange("investedValue", event.target.value)} /></label>}
        </> : <>
          <label><span>Exchange symbol</span><input aria-label={`Symbol holding ${position}`} value={row.symbol} placeholder={currency === "INR" ? "RELIANCE" : "AAPL"} onChange={(event) => onChange("symbol", event.target.value)} /></label>
          <label><span>Quantity / units</span><input aria-label={`Quantity ${row.symbol || position}`} type="number" min="0" step="any" value={Number.isFinite(row.quantity) ? row.quantity || "" : ""} placeholder="20" onChange={(event) => onChange("quantity", event.target.value)} /></label>
          <label><span>Average cost per unit ({currency})</span><input aria-label={`Average cost ${row.symbol || position}`} type="number" min="0" step="any" value={Number.isFinite(row.averageCost) ? row.averageCost || "" : ""} placeholder="2400" onChange={(event) => onChange("averageCost", event.target.value)} /></label>
          <label><span>{row.priceSource === "yahoo" ? "Yahoo close" : "Current price per unit"} ({currency})</span><input aria-label={`Current price ${row.symbol || position}`} type="number" min="0" step="any" value={row.currentPrice ?? ""} placeholder="Fetch or enter" onChange={(event) => onChange("currentPrice", event.target.value)} /></label>
        </>}
        <label><span>Valuation date</span><input aria-label={`Valuation date holding ${position}`} type="date" value={row.priceDate ?? ""} onChange={(event) => onChange("priceDate", event.target.value)} /></label>
      </div>
    </fieldset>
    <div className="holding-context"><p className={`price-badge ${row.priceSource}`}>{row.priceSource === "yahoo" ? `Yahoo · ${row.priceDate}` : row.priceSource === "manual" ? `Manual · ${row.priceDate ?? "date not supplied"}` : valueBased ? "Amount needed" : "Price needed"}</p>{valueBased && <p className="source-line">{notes[row.assetType]}</p>}</div>
    {(valueBased ? row.currentValue !== null : row.currentPrice !== null) && freshnessWarning(row.priceDate) && <p className="field-issue" role="status">{freshnessWarning(row.priceDate)}</p>}
    {issues.map((issue) => <p className="field-issue" key={`${issue.field}-${issue.message}`}>{issue.message}</p>)}
  </article>;
}

function MirrorResult({ analysis, failures, market }: { analysis: NonNullable<ReturnType<typeof analyzePortfolio>>; failures: string[]; market: Market }) {
  const moneyForMarket = (value: number | null, compact = true) => money(value, compact, market === "us" ? "USD" : "INR");
  const largestAsset = analysis.assetMix[0];
  const stocks = analysis.stockConcentration;
  const topStock = stocks?.weighted[0];
  const stockShare = stocks ? stocks.totalValue / analysis.totalValue : 0;
  return <div className="mirror-result" aria-live="polite">
    <header><span>The Read</span><i>Overall allocation</i></header>
    <h2>{ASSET_LABELS[largestAsset.assetType]} makes up {percent(largestAsset.weight)} of this snapshot.</h2>
    <p>All {analysis.weighted.length} holdings are included at their displayed values. Asset allocation and individual stock concentration answer different questions.</p>
    <section className="asset-mix" aria-label="Overall asset allocation"><span>Asset allocation · all holdings</span><div>{analysis.assetMix.map((item) => <article key={item.assetType}><i style={{ "--mix": `${item.weight * 100}%` } as React.CSSProperties} /><b>{ASSET_LABELS[item.assetType]}</b><strong>{percent(item.weight)}</strong></article>)}</div></section>
    <div className="mirror-metrics"><article><span>Total current value</span><strong>{moneyForMarket(analysis.totalValue)}</strong></article><article><span>Change versus entered cost</span><strong className={analysis.gain !== null && analysis.gain < 0 ? "negative" : ""}>{moneyForMarket(analysis.gain)}</strong><small>{analysis.gain === null ? "Amount invested is missing for one or more assets; allocation is still available." : "Cash is carried at face value. This is not an annualised investment return."}</small></article><article><span>Individual stocks</span><strong>{percent(stockShare)}</strong><small>Share of the whole portfolio</small></article></div>
    <div className="weight-list" aria-label="Holding allocation">{analysis.weighted.map((row, index) => <div key={row.id}><span><i>{String(index + 1).padStart(2, "0")}</i><b>{row.label}</b><small>{moneyForMarket(row.value)}</small></span><strong>{percent(row.weight)}</strong><em><i style={{ width: `${row.weight * 100}%` }} /></em></div>)}</div>
    <section className="stock-concentration" aria-labelledby="stock-concentration-title">
      <header><h3 id="stock-concentration-title">Stock concentration</h3>{stocks && <span>{stocks.assessment}</span>}</header>
      {stocks && topStock ? <>
        <p>Individual stocks are {percent(stockShare)} of the whole portfolio. The concentration weights below use only that stock slice; cash, debt, gold and funds are excluded.</p>
        <div className="concentration-map" aria-label={`Stock concentration only. ${topStock.label}: ${percent(stocks.topWeight)} of individual stocks`}>
          <div className="concentration-ring" style={{ "--top-weight": `${stocks.topWeight * 100}%`, "--top-three": `${stocks.topThreeWeight * 100}%` } as React.CSSProperties}><i><strong>{stocks.effectiveHoldings.toFixed(1)}</strong><span>effective stocks</span></i></div>
          <div className="concentration-copy"><span>Within stocks only</span><h3>{stocks.assessment === "Focused" ? "A small number of positions dominates your stock slice." : stocks.assessment === "Watch concentration" ? "Stock weights gather near the top." : "No individual stock dominates the stock slice."}</h3><div className="concentration-legend"><p><i className="top-weight-key" />{topStock.label}<strong>{percent(stocks.topWeight)}</strong></p><p><i className="next-two-key" />Next two stocks<strong>{percent(Math.max(0, stocks.topThreeWeight - stocks.topWeight))}</strong></p><p><i className="rest-key" />Other stocks<strong>{percent(Math.max(0, 1 - stocks.topThreeWeight))}</strong></p></div></div>
        </div>
      </> : <p>No individual stocks entered. Cash, FDs, physical gold and pooled funds do not receive a single-company concentration score.</p>}
    </section>
    <section className="mirror-reality"><span>Reality Check</span><h3>Asset allocation is not a full risk assessment.</h3><p>Funds and ETFs need holdings look-through to assess company overlap. Debt needs issuer, maturity and liquidity checks. Physical gold has valuation and selling-cost uncertainty. Cash is not risk-free: inflation and deposit protection still matter.</p></section>
    <section className="mirror-moves"><span>Your Move</span><div><article><i>01</i><b>Review the asset mix</b><p>Compare the whole allocation with when you need the money and the uncertainty you can tolerate.</p></article><article><i>02</i><b>Check stock weights separately</b><p>A cash balance or FD is not one company. Review individual stock dependence within the stock slice.</p></article><article><i>03</i><b>Verify every value</b><p>Use recent statements for cash, debt and funds, and a realistic current estimate for physical gold.</p></article></div><Link className="deep-dive-link" href="/risk"><span>Need an equity scenario?</span><strong>Open the separate equal-weight risk tool <i aria-hidden="true">→</i></strong></Link></section>
    {failures.length > 0 && <p className="mirror-warning">Price lookup failed for: {failures.join(", ")}.</p>}
    <ResultNotes assumptions={["Stock and listed ETF values use quantity × current price; other assets use your entered current total value.", "Cash has no calculated investment gain; it is carried at its entered balance.", "Change versus entered cost is withheld if any non-cash asset has unknown cost; it does not account for interim withdrawals or income.", "HHI and effective stock count use individual stocks only; funds, ETFs, cash, debt and physical gold have no single-company look-through."]} warnings={["This describes allocation and stock weights, not overall diversification, security quality or a recommendation to trade."]} />
  </div>;
}

function MirrorAssistant({ open, topic, stage, issues, failures, onOpen, onTopic }: { open: boolean; topic: AssistantTopic; stage: Stage; issues: number; failures: string[]; onOpen: () => void; onTopic: (topic: AssistantTopic) => void }) {
  const copy: Record<AssistantTopic, { title: string; body: string }> = {
    start: { title: "Let’s build a clean mirror", body: "Start with a CSV if you already have one. Manual entry is calmer for fewer than five holdings. You will always review before analysis." },
    csv: { title: "A small, boring CSV is perfect", body: "For stocks/ETFs use symbol, quantity, average_cost and optionally current_price. For cash, debt, gold or value-only funds use asset_type, label, current_value and optionally invested_value. Review all imported values." },
    symbols: { title: issues ? `${issues} data ${issues === 1 ? "detail needs" : "details need"} attention` : "Use exchange symbols, not company names", body: "Only stocks and listed ETFs need exchange symbols, such as RELIANCE or TCS. Cash, FDs, physical gold and value-only funds use an optional label and current total value." },
    prices: { title: failures.length ? "Some prices need your help" : "Prices are a checkpoint", body: failures.length ? `Yahoo could not return ${failures.join(", ")}. Enter a recent price manually or remove the row; the rest remain usable.` : "Check Yahoo prices for stocks and listed ETFs. For other assets enter the balance or estimated current value from a recent statement, plus its valuation date." },
    read: { title: stage === "mirror" ? "Read weight before return" : "You’re ready for the mirror", body: stage === "mirror" ? "Read overall asset allocation first, then stock concentration within stocks only. Cash, FDs, gold and funds do not count as individual companies; fund look-through and debt issuer risk need separate checks." : "Reveal the mirror when every asset has a current value. Exchange-traded rows also need a symbol, quantity, cost and usable price." },
  };
  const current = copy[topic];
  return <aside className={open ? "mirror-assistant open" : "mirror-assistant"} aria-label="Mirror Guide"><button type="button" className="assistant-toggle" aria-expanded={open} onClick={onOpen}><span aria-hidden="true">P</span>{open ? "Close guide" : "Need help?"}</button>{open && <div><span>Mirror Guide</span><h2>{current.title}</h2><p>{current.body}</p><nav aria-label="Assistant topics"><button type="button" onClick={() => onTopic("csv")}>CSV help</button><button type="button" onClick={() => onTopic("symbols")}>Symbols</button><button type="button" onClick={() => onTopic("prices")}>Prices</button><button type="button" onClick={() => onTopic("read")}>Read results</button></nav><small>Guidance is rule-based and never changes the calculation.</small></div>}</aside>;
}
