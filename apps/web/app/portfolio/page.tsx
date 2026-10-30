"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useRef, useState } from "react";

import { ResultNotes } from "@/components/ui";
import { money, percent } from "@/lib/format";
import { analyzePortfolio, createHolding, latestPrices, normalizeSymbol, parseHoldingsCsv, validateHoldings, type AssetType, type HoldingDraft, type Market } from "@/lib/portfolio";

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
  const [assistantOpen, setAssistantOpen] = useState(true);
  const [assistantTopic, setAssistantTopic] = useState<AssistantTopic>("start");
  const fileRef = useRef<HTMLInputElement>(null);
  const issues = useMemo(() => validateHoldings(rows), [rows]);
  const analysis = useMemo(() => analyzePortfolio(rows), [rows]);

  function beginManual() {
    setRows([createHolding()]);
    setStage("review");
    setAssistantTopic("symbols");
    setMessage("Add up to 10 holdings. Nothing is analysed until prices are checked.");
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
      if (key === "assetType") return { ...row, assetType: value as AssetType };
      if (key === "currentPrice") return { ...row, currentPrice: value === "" ? null : Math.max(0, Number(value)), priceDate: new Date().toISOString().slice(0, 10), priceSource: value === "" ? "missing" : "manual" };
      return { ...row, [key]: Math.max(0, Number(value)) };
    }));
  }

  function changeMarket(next: Market) {
    if (next === market) return;
    setMarket(next);
    setStage("review");
    setFailures([]);
    setRows((current) => current.map((row) => row.priceSource === "yahoo" ? { ...row, currentPrice: null, priceDate: null, priceSource: "missing" } : row));
    setMessage("Exchange changed. Check Yahoo prices again before revealing the mirror.");
    setAssistantTopic("prices");
  }

  async function refreshPrices() {
    const currentIssues = validateHoldings(rows);
    if (currentIssues.length) {
      setMessage(`Fix ${currentIssues.length} highlighted ${currentIssues.length === 1 ? "issue" : "issues"} before checking prices.`);
      setAssistantTopic("symbols");
      return;
    }
    setLoading(true);
    setMessage("Checking recent closing prices…");
    setFailures([]);
    try {
      const symbols = rows.map((row) => normalizeSymbol(row.symbol));
      const response = await fetch(`/api/market/history?market=${market}&symbols=${encodeURIComponent(symbols.join(","))}`);
      const body = await response.json() as { detail?: string; series?: Record<string, Array<{ date: string; value: number }>>; failures?: string[] };
      if (!response.ok || !body.series) throw new Error(body.detail ?? "Prices are temporarily unavailable.");
      const latest = latestPrices(body.series);
      const missing = (body.failures ?? []).filter((symbol) => {
        const row = rows.find((item) => normalizeSymbol(item.symbol) === symbol);
        return !row?.currentPrice;
      });
      setRows((current) => current.map((row) => {
        const point = latest[normalizeSymbol(row.symbol)];
        return point ? { ...row, currentPrice: point.value, priceDate: point.date, priceSource: "yahoo" } : row;
      }));
      setFailures(missing);
      setMessage(missing.length ? `Prices loaded for ${rows.length - missing.length} holdings. Add a manual price for ${missing.join(", ")} or remove them.` : `Prices checked for all ${rows.length} holdings.`);
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
      setMessage("Every analysed holding needs a recent Yahoo price or a manually entered price.");
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
        <div><span className="eyebrow">Money Mirror · private portfolio check</span><h1>See the shape of<br /><em>what you own.</em></h1><p>Bring holdings, verify prices, then reveal the one portfolio pattern worth noticing first. Your draft stays in this browser tab.</p></div>
        <div className="mirror-hero-media" aria-hidden="true"><Image src="/media/cards/money-mirror-hero.png" alt="" width={420} height={420} sizes="(max-width: 900px) 240px, 330px" priority /></div>
      </header>

      <nav className="mirror-progress" aria-label="Money Mirror progress">
        {(["choose", "review", "mirror"] as Stage[]).map((item, index) => <span key={item} className={stage === item ? "active" : (["choose", "review", "mirror"].indexOf(stage) > index ? "done" : "")}><i>{index + 1}</i>{item === "choose" ? "Bring holdings" : item === "review" ? "Check the data" : "Read the mirror"}</span>)}
      </nav>

      {stage === "choose" && <section className="mirror-entry" aria-labelledby="entry-title">
        <div className="future-section-title"><span>01</span><div><p>A safe beginning</p><h2 id="entry-title">How would you like to start?</h2></div></div>
        <div className="entry-cards">
          <button type="button" onClick={() => fileRef.current?.click()}><span>Fastest</span><Image src="/media/cards/portfolio-import.png" alt="" width={240} height={240} sizes="(max-width: 900px) 160px, 180px" aria-hidden="true" /><strong>Import a CSV</strong><small>Symbol, quantity and average cost. You review everything before analysis.</small></button>
          <button type="button" onClick={beginManual}><span>Most control</span><Image src="/media/cards/portfolio-manual.png" alt="" width={240} height={240} sizes="(max-width: 900px) 160px, 180px" aria-hidden="true" /><strong>Add them one by one</strong><small>Use one compact holding card at a time. No spreadsheet wall.</small></button>
          <button type="button" onClick={loadSample}><span>Explore first</span><Image src="/media/cards/portfolio-sample.png" alt="" width={240} height={240} sizes="(max-width: 900px) 160px, 180px" aria-hidden="true" /><strong>Try a sample</strong><small>See the complete journey using four Indian stocks.</small></button>
        </div>
        <input ref={fileRef} hidden type="file" accept=".csv,text/csv" onChange={(event) => event.target.files?.[0] && void importCsv(event.target.files[0])} />
        <p className="privacy-note"><b>Private by design.</b> CSV contents are parsed in your browser and are not uploaded. Only ticker symbols are sent to the price endpoint.</p>
      </section>}

      {stage !== "choose" && <section className="mirror-workspace" aria-labelledby="review-title">
        <div className="mirror-review">
          <div className="future-section-title compact"><span>02</span><div><p>Review before analysis</p><h2 id="review-title">Make the data yours.</h2></div></div>
          <div className="market-toggle" aria-label="Stock exchange"><button type="button" className={market === "india" ? "active" : ""} aria-pressed={market === "india"} onClick={() => changeMarket("india")}>India · NSE</button><button type="button" className={market === "us" ? "active" : ""} aria-pressed={market === "us"} onClick={() => changeMarket("us")}>United States</button></div>
          {message && <p className="mirror-notice" role="status">{message}</p>}
          <div className="holding-cards">
            {rows.map((row, index) => {
              const rowIssues = issues.filter((issue) => issue.row === index + 1);
              return <article className={rowIssues.length ? "holding-card invalid" : "holding-card"} key={row.id}>
                <header><span>Holding {String(index + 1).padStart(2, "0")}</span><button type="button" aria-label={`Remove ${row.symbol || `holding ${index + 1}`}`} onClick={() => setRows((current) => current.filter((item) => item.id !== row.id))}>Remove</button></header>
                <div className="holding-fields">
                  <label><span>Symbol</span><input aria-label={`Symbol holding ${index + 1}`} value={row.symbol} placeholder={market === "india" ? "RELIANCE" : "AAPL"} onChange={(event) => update(row.id, "symbol", event.target.value)} /></label>
                  <label><span>Quantity</span><input aria-label={`Quantity ${row.symbol || index + 1}`} type="number" min="0" step="any" value={row.quantity || ""} placeholder="20" onChange={(event) => update(row.id, "quantity", event.target.value)} /></label>
                  <label><span>Average cost</span><input aria-label={`Average cost ${row.symbol || index + 1}`} type="number" min="0" step="any" value={row.averageCost || ""} placeholder="2400" onChange={(event) => update(row.id, "averageCost", event.target.value)} /></label>
                  <label><span>Asset type</span><select aria-label={`Asset type ${row.symbol || index + 1}`} value={row.assetType} onChange={(event) => update(row.id, "assetType", event.target.value)}><option value="stock">Stock</option><option value="fund">Fund / ETF</option><option value="gold">Gold</option><option value="debt">Debt</option><option value="cash">Cash</option></select></label>
                </div>
                <footer><label><span>{row.priceSource === "yahoo" ? "Yahoo close" : "Current price"}</span><input aria-label={`Current price ${row.symbol || index + 1}`} type="number" min="0" step="any" value={row.currentPrice ?? ""} placeholder="Fetch or enter" onChange={(event) => update(row.id, "currentPrice", event.target.value)} /></label><p className={`price-badge ${row.priceSource}`}>{row.priceSource === "yahoo" ? `Yahoo · ${row.priceDate}` : row.priceSource === "manual" ? `Manual · ${row.priceDate}` : "Price needed"}</p></footer>
                {rowIssues.map((issue) => <p className="field-issue" key={`${issue.field}-${issue.message}`}>{issue.message}</p>)}
              </article>;
            })}
          </div>
          <div className="review-actions"><button type="button" className="button secondary" disabled={rows.length >= 10} onClick={() => setRows((current) => [...current, createHolding()])}>＋ Add holding</button><button type="button" className="button secondary" disabled={loading || !rows.length} onClick={() => void refreshPrices()}>{loading ? "Checking prices…" : "Check Yahoo prices"}</button><button type="button" className="button" disabled={!analysis || issues.length > 0 || loading} onClick={revealMirror}>Reveal my mirror</button></div>
          <p className="source-line">Yahoo Finance closing prices · cached for one hour · manual prices are clearly marked · failed symbols never overwrite your draft.</p>
        </div>

        {stage === "mirror" && analysis && <MirrorResult analysis={analysis} failures={failures} />}
      </section>}

      <MirrorAssistant open={assistantOpen} topic={assistantTopic} stage={stage} issues={issues.length} failures={failures} onOpen={() => setAssistantOpen((current) => !current)} onTopic={setAssistantTopic} />
    </div>
  );
}

function MirrorResult({ analysis, failures }: { analysis: NonNullable<ReturnType<typeof analyzePortfolio>>; failures: string[] }) {
  const top = analysis.weighted[0];
  const secondThird = Math.max(0, analysis.topThreeWeight - analysis.topWeight);
  const remainder = Math.max(0, 1 - analysis.topThreeWeight);
  const read = analysis.assessment === "Focused" ? `${top.symbol} is doing too much of the portfolio's work.` : analysis.assessment === "Watch concentration" ? `Your portfolio has variety, but its weight still gathers near the top.` : "No single holding dominates this snapshot.";
  return <div className="mirror-result" aria-live="polite">
    <header><span>The Read</span><i>{analysis.assessment}</i></header><h2>{read}</h2><p>{top.symbol} represents <b>{percent(top.weight)}</b> of the priced portfolio. The top three together represent <b>{percent(analysis.topThreeWeight)}</b>.</p>
    <section className="concentration-map" aria-label={`Concentration map. ${top.symbol} ${percent(analysis.topWeight)}, next two holdings ${percent(secondThird)}, remaining holdings ${percent(remainder)}`}>
      <div className="concentration-ring" style={{ "--top-weight": `${analysis.topWeight * 100}%`, "--top-three": `${analysis.topThreeWeight * 100}%` } as React.CSSProperties}>
        <i><strong>{analysis.effectiveHoldings.toFixed(1)}</strong><span>effective holdings</span></i>
      </div>
      <div className="concentration-copy"><span>Risk shape</span><h3>{analysis.weighted.length} lines do not always mean {analysis.weighted.length} independent bets.</h3><div className="concentration-legend"><p><i className="top-weight-key" />{top.symbol}<strong>{percent(analysis.topWeight)}</strong></p><p><i className="next-two-key" />Next two<strong>{percent(secondThird)}</strong></p><p><i className="rest-key" />Everything else<strong>{percent(remainder)}</strong></p></div></div>
    </section>
    <div className="mirror-metrics"><article><span>Current value</span><strong>{money(analysis.totalValue, true)}</strong></article><article><span>Unrealised return</span><strong className={analysis.gain < 0 ? "negative" : ""}>{percent(analysis.gainRate)}</strong><small>{money(analysis.gain, true)}</small></article><article><span>Effective holdings</span><strong>{analysis.effectiveHoldings.toFixed(1)}</strong><small>Concentration-adjusted</small></article></div>
    <div className="weight-list" aria-label="Holding allocation">{analysis.weighted.map((row, index) => <div key={row.id}><span><i>{String(index + 1).padStart(2, "0")}</i><b>{row.symbol}</b><small>{money(row.value, true)}</small></span><strong>{percent(row.weight)}</strong><em><i style={{ width: `${row.weight * 100}%` }} /></em></div>)}</div>
    <section className="asset-mix"><span>Asset mix</span><div>{analysis.assetMix.map((item) => <article key={item.assetType}><i style={{ "--mix": `${item.weight * 100}%` } as React.CSSProperties} /><b>{item.assetType === "fund" ? "Fund / ETF" : item.assetType[0].toUpperCase() + item.assetType.slice(1)}</b><strong>{percent(item.weight)}</strong></article>)}</div></section>
    <section className="mirror-reality"><span>Reality Check</span><h3>{analysis.effectiveHoldings < analysis.weighted.length * .6 ? `You own ${analysis.weighted.length} lines, but concentration behaves more like ${analysis.effectiveHoldings.toFixed(1)} equal holdings.` : "The number of lines and the spread of risk are reasonably aligned."}</h3><p>This says nothing about whether a company is good or bad. It only shows how strongly one outcome can move the whole portfolio.</p></section>
    <section className="mirror-moves"><span>Your Move</span><div><article><i>01</i><b>Review the top weight</b><p>Decide the maximum share one company should have before the market decides it for you.</p></article><article><i>02</i><b>Direct new money thoughtfully</b><p>New contributions can change weights without forcing an immediate sale or tax event.</p></article><article><i>03</i><b>Check the missing layer</b><p>Add funds, debt, gold and cash to see the full household allocation, not only stocks.</p></article></div><Link className="deep-dive-link" href="/risk"><span>Need the advanced layer?</span><strong>Open volatility and downside analysis <i aria-hidden="true">→</i></strong></Link></section>
    {failures.length > 0 && <p className="mirror-warning">Not included because no fresh price was available: {failures.join(", ")}.</p>}
    <ResultNotes assumptions={["Values use quantity × the displayed current price.", "Concentration uses the Herfindahl index and position weights.", "Only holdings with a usable current price are included."]} warnings={["This is allocation analysis, not a judgement of security quality or a recommendation to trade."]} />
  </div>;
}

function MirrorAssistant({ open, topic, stage, issues, failures, onOpen, onTopic }: { open: boolean; topic: AssistantTopic; stage: Stage; issues: number; failures: string[]; onOpen: () => void; onTopic: (topic: AssistantTopic) => void }) {
  const copy: Record<AssistantTopic, { title: string; body: string }> = {
    start: { title: "Let’s build a clean mirror", body: "Start with a CSV if you already have one. Manual entry is calmer for fewer than five holdings. You will always review before analysis." },
    csv: { title: "A small, boring CSV is perfect", body: "Use headers: symbol, quantity, average_cost, and optionally asset_type. Exported broker files often need only those three columns renamed." },
    symbols: { title: issues ? `${issues} data ${issues === 1 ? "detail needs" : "details need"} attention` : "Use exchange symbols, not company names", body: "For India, enter RELIANCE or TCS. Paisaan adds the NSE suffix safely. Merge duplicate symbols so weights stay honest." },
    prices: { title: failures.length ? "Some prices need your help" : "Prices are a checkpoint", body: failures.length ? `Yahoo could not return ${failures.join(", ")}. Enter a recent price manually or remove the row; the rest remain usable.` : "Check Yahoo prices after quantities and costs are clean. If the source is unavailable, your draft stays untouched and you can retry." },
    read: { title: stage === "mirror" ? "Read weight before return" : "You’re ready for the mirror", body: stage === "mirror" ? "The first question is not ‘am I up?’ but ‘what single outcome matters too much?’ Effective holdings translates unequal weights into a more honest count." : "Reveal the mirror when every row has a valid symbol, positive quantity, non-negative cost and usable price." },
  };
  const current = copy[topic];
  return <aside className={open ? "mirror-assistant open" : "mirror-assistant"} aria-label="Mirror Guide"><button type="button" className="assistant-toggle" aria-expanded={open} onClick={onOpen}><span aria-hidden="true">P</span>{open ? "Close guide" : "Need help?"}</button>{open && <div><span>Mirror Guide</span><h2>{current.title}</h2><p>{current.body}</p><nav aria-label="Assistant topics"><button type="button" onClick={() => onTopic("csv")}>CSV help</button><button type="button" onClick={() => onTopic("symbols")}>Symbols</button><button type="button" onClick={() => onTopic("prices")}>Prices</button><button type="button" onClick={() => onTopic("read")}>Read results</button></nav><small>Guidance is rule-based and never changes the calculation.</small></div>}</aside>;
}
