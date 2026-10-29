"use client";

import { useState } from "react";

import { money, percent } from "@/lib/format";
import { smallcaseStrategies, strategyHoldings } from "@/lib/smallcases";

const palette = ["#d5ad62", "#e78068", "#6f9d91", "#8a82b5", "#6f88ad"];

export default function SmallcasesPage() {
  const [activeId, setActiveId] = useState(smallcaseStrategies[0].id);
  const strategy = smallcaseStrategies.find((item) => item.id === activeId) ?? smallcaseStrategies[0];
  const holdings = strategyHoldings(strategy);
  const segments = [
    ...strategy.themes.map((theme) => ({ label: theme.label, weight: theme.weight })),
    ...(strategy.cash ? [{ label: "Cash", weight: strategy.cash }] : []),
  ];
  let angle = 0;
  const allocationGradient = segments.map((segment, index) => {
    const start = angle;
    angle += segment.weight * 3.6;
    return `${palette[index % palette.length]} ${start}deg ${angle}deg`;
  }).join(", ");

  return <div className="smallcase-page">
    <header className="smallcase-hero">
      <div className="smallcase-blueprint" aria-hidden="true" />
      <div className="smallcase-hero-copy">
        <span className="eyebrow">CapitalSense smallcases · research-led portfolios</span>
        <h1>Three ways to read<br/><em>India’s next chapter.</em></h1>
        <p>One looks for emerging industrial capability. One follows execution. One backs a wider pack of category challengers. Start with the investment question—not the recent return.</p>
      </div>
      <div className="smallcase-compass" aria-label="Three strategy lenses">
        <span>DISCOVER</span><span>DELIVER</span><span>CHALLENGE</span>
        <i aria-hidden="true" />
        <strong>03</strong><small>distinct lenses</small>
      </div>
    </header>

    <section className="smallcase-studio" aria-labelledby="smallcase-studio-title">
      <div className="smallcase-intro">
        <div><span className="eyebrow">Choose the lens</span><h2 id="smallcase-studio-title">Different questions.<br/><em>Different portfolios.</em></h2></div>
        <p>The tabs change the complete strategy story—allocation, holdings and risk—not merely the headline.</p>
      </div>

      <div className="smallcase-tabs" role="tablist" aria-label="Choose a smallcase strategy">
        {smallcaseStrategies.map((item, index) => <button
          type="button"
          role="tab"
          id={`smallcase-tab-${item.id}`}
          aria-controls="smallcase-panel"
          aria-selected={item.id === strategy.id}
          className={item.id === strategy.id ? "active" : ""}
          onClick={() => setActiveId(item.id)}
          key={item.id}
        ><span>0{index + 1}</span>{item.shortName}</button>)}
      </div>

      <div className="smallcase-panel" id="smallcase-panel" role="tabpanel" aria-labelledby={`smallcase-tab-${strategy.id}`} key={strategy.id}>
        <section className="strategy-opening">
          <div className="strategy-question"><span>{strategy.tagline}</span><h2>{strategy.question}</h2><p>{strategy.opener}</p></div>
          <aside>
            <div><span>Style</span><strong>{strategy.style}</strong></div>
            <div><span>Core lens</span><strong>{strategy.lens}</strong></div>
            <div><span>Holdings</span><strong>{holdings.length}</strong></div>
            <a href={strategy.smallcaseUrl} target="_blank" rel="noopener noreferrer">Open on smallcase <span aria-hidden="true">↗</span></a>
            <small>Opens the official Smallcase page. Review its current factsheet, fees and disclosures before acting.</small>
          </aside>
        </section>

        {strategy.snapshot && <section className="strategy-snapshot" aria-label="Supplied Smallcase snapshot">
          <div><span>Basket amount</span><strong>{money(strategy.snapshot.basketAmount)}</strong><small>Amount shown in the supplied snapshot</small></div>
          <div><span>{strategy.snapshot.periodLabel}</span><strong className={strategy.snapshot.periodReturn < 0 ? "negative" : "positive"}>{percent(strategy.snapshot.periodReturn / 100)}</strong><small>Recent return · not a forecast</small></div>
          <div><span>Weighting scheme</span><strong>{strategy.snapshot.weighting}</strong><small>Allocation by portfolio weights</small></div>
          <p>{strategy.snapshot.suppliedAt}. Prices, shares and returns can change; verify the live Smallcase before investing.</p>
        </section>}

        <section className="allocation-story" aria-labelledby="allocation-title">
          <div className="allocation-visual">
            <div className="allocation-orbit" style={{ background: `conic-gradient(${allocationGradient})` }} role="img" aria-label={segments.map((segment) => `${segment.label} ${segment.weight}%`).join(", ")}><i><strong>{holdings.length}</strong><span>holdings</span></i></div>
          </div>
          <div className="allocation-copy"><span className="eyebrow">Portfolio architecture</span><h2 id="allocation-title">See where the conviction lives.</h2><div className="allocation-list">
            {segments.map((segment, index) => <div key={segment.label}><i style={{ background: palette[index % palette.length] }} /><span>{segment.label}</span><em><b style={{ width: `${segment.weight}%`, background: palette[index % palette.length] }} /></em><strong>{segment.weight}%</strong></div>)}
          </div></div>
        </section>

        <section className="strategy-chapters" aria-label={`${strategy.name} portfolio chapters`}>
          {strategy.themes.map((theme, themeIndex) => <article className="strategy-chapter" key={theme.id}>
            <header><span>Chapter {String(themeIndex + 1).padStart(2, "0")} · {theme.label}</span><strong>{theme.weight}%</strong></header>
            <div className="chapter-narrative"><h2>{theme.title}</h2><p>{theme.narrative}</p><blockquote>{theme.takeaway}</blockquote></div>
            <div className="smallcase-table-scroll"><table className="smallcase-holdings-table">
              <thead><tr><th>Holding</th><th>Role in the story</th>{strategy.snapshot && <th className="number">Snapshot price</th>}{strategy.snapshot && <th className="number">Shares</th>}<th className="number">Weight</th></tr></thead>
              <tbody>{theme.holdings.map((item) => <tr key={item.symbol}><td><strong>{item.name}</strong><span>{item.symbol}</span></td><td>{item.role}</td>{strategy.snapshot && <td className="number">{item.price === undefined ? "—" : money(item.price, true)}</td>}{strategy.snapshot && <td className="number">{item.shares ?? "—"}</td>}<td className="number"><b>{item.weight.toFixed(item.weight % 1 ? 2 : 0)}%</b></td></tr>)}</tbody>
            </table></div>
          </article>)}
        </section>

        <section className="smallcase-reality">
          <span className="eyebrow">Reality check</span><h2>A strong story is not a margin of safety.</h2>
          <div><article><i>01</i><h3>Execution can slip.</h3><p>Orders, capacity and adoption matter only when they convert into durable cash flows.</p></article><article><i>02</i><h3>Valuation still matters.</h3><p>A good company can deliver poor investor outcomes when expectations begin too high.</p></article><article><i>03</i><h3>Breadth is not immunity.</h3><p>Thirty holdings can still share the same growth, liquidity or risk-appetite factor.</p></article></div>
        </section>

        <section className="smallcase-disclosure"><strong>Read this before the return.</strong><p>This page explains portfolio construction; it is not a recommendation, personalised suitability assessment or promise of performance. The Alpha’s price, share and two-month figures reproduce the snapshot supplied on 29 October 2026 and are not live market data. Holdings and weights can change on Smallcase. Review the current factsheet, methodology, rebalance history, fees, taxation and regulated disclosures at the linked Smallcase before making a decision.</p></section>
      </div>
    </section>
  </div>;
}
