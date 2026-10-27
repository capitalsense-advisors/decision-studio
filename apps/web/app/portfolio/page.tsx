"use client";

import { useMemo, useState } from "react";
import { Metric, PageHeading } from "@/components/ui";
import { money, percent } from "@/lib/format";

type Holding = { symbol: string; quantity: number; averageCost: number; currentPrice: number; value: number };
const sample: Holding[] = [
  { symbol:"RELIANCE", quantity:20, averageCost:2400, currentPrice:2900, value:58000 },
  { symbol:"HDFCBANK", quantity:40, averageCost:1500, currentPrice:1700, value:68000 },
  { symbol:"INFY", quantity:30, averageCost:1350, currentPrice:1600, value:48000 },
];
const blank = (): Holding => ({symbol:"",quantity:0,averageCost:0,currentPrice:0,value:0});

export default function PortfolioPage(){
  const [rows,setRows]=useState<Holding[]>([blank()]);
  const [confirmed,setConfirmed]=useState<Holding[]|null>(null);
  const [message,setMessage]=useState("");
  const stats=useMemo(()=>{
    if(!confirmed?.length)return null;
    const normalized=confirmed.map(row=>({...row,value:row.value>0?row.value:row.quantity*row.currentPrice}));
    const total=normalized.reduce((sum,row)=>sum+row.value,0);
    const invested=normalized.reduce((sum,row)=>sum+row.quantity*row.averageCost,0);
    const weighted=normalized.map(row=>({...row,weight:total?row.value/total:0})).sort((a,b)=>b.weight-a.weight);
    const hhi=weighted.reduce((sum,row)=>sum+row.weight*row.weight,0);
    return {total,invested,gain:total-invested,weighted,hhi,assessment:weighted[0]?.weight>=.35||hhi>=.25?"High concentration":weighted[0]?.weight>=.2?"Moderate concentration":"Diversified"};
  },[confirmed]);

  function update(index:number,key:keyof Holding,value:string){setConfirmed(null);setRows(current=>current.map((row,i)=>i===index?{...row,[key]:key==="symbol"?value.toUpperCase():Number(value)}:row))}
  async function importCsv(file:File){const text=await file.text();const lines=text.split(/\r?\n/).filter(Boolean);if(lines.length<2){setMessage("The CSV has no holding rows.");return}const headers=lines[0].split(",").map(item=>item.trim().toLowerCase().replaceAll(" ","_"));const parsed=lines.slice(1,101).map(line=>{const cells=line.split(",");const at=(...names:string[])=>{const index=headers.findIndex(h=>names.includes(h));return index>=0?cells[index]?.trim():""};return {symbol:at("symbol","ticker").toUpperCase(),quantity:Number(at("quantity","qty"))||0,averageCost:Number(at("average_cost","avg_price","buy_price"))||0,currentPrice:Number(at("current_price","price","ltp"))||0,value:Number(at("value","market_value"))||0}}).filter(row=>row.symbol);setRows(parsed.length?parsed:[blank()]);setConfirmed(null);setMessage(parsed.length?"CSV loaded for review. Confirm the table before analysis.":"No valid symbol rows were found.");}
  function confirm(){const valid=rows.filter(row=>row.symbol.trim()&&(row.value>0||(row.quantity>0&&row.currentPrice>0)));setConfirmed(valid.length?valid:null);setMessage(valid.length?"Holdings confirmed for this browser session.":"Add a symbol and either market value or quantity with current price.");}

  return <div className="page-stack"><PageHeading kicker="Holdings" title={<>Add, check, then<br/><span>analyse your portfolio.</span></>} copy="Nothing is analysed until you confirm the editable table. Your holdings remain in this browser session and are not permanently stored."/>
    <section className="panel"><div className="section-heading"><div><span className="eyebrow">Step 1</span><h2>Add holdings</h2></div><p>Use the sample, import a CSV, or edit rows directly.</p></div><div className="form-actions"><button className="button secondary" onClick={()=>{setRows(sample);setConfirmed(null);setMessage("Sample loaded for review.");}}>Load sample portfolio</button><label className="button secondary" style={{cursor:"pointer"}}>Import CSV<input hidden type="file" accept=".csv,text/csv" onChange={e=>e.target.files?.[0]&&void importCsv(e.target.files[0])}/></label><button className="button secondary" onClick={()=>setRows(current=>[...current,blank()])}>Add row</button></div>{message&&<p className="notice" role="status">{message}</p>}<div className="table-scroll"><table className="holdings-table"><thead><tr><th>Symbol</th><th>Quantity</th><th>Average cost</th><th>Current price</th><th>Market value</th><th></th></tr></thead><tbody>{rows.map((row,index)=><tr key={index}><td><input aria-label={"Symbol row "+(index+1)} value={row.symbol} onChange={e=>update(index,"symbol",e.target.value)}/></td><td><input type="number" value={row.quantity} onChange={e=>update(index,"quantity",e.target.value)}/></td><td><input type="number" value={row.averageCost} onChange={e=>update(index,"averageCost",e.target.value)}/></td><td><input type="number" value={row.currentPrice} onChange={e=>update(index,"currentPrice",e.target.value)}/></td><td><input type="number" value={row.value} onChange={e=>update(index,"value",e.target.value)}/></td><td><button className="button secondary" onClick={()=>{setRows(current=>current.filter((_,i)=>i!==index));setConfirmed(null)}}>Remove</button></td></tr>)}</tbody></table></div><div className="form-actions"><button className="button" onClick={confirm}>Confirm holdings for analysis</button></div></section>
    {!stats?<section className="state-panel"><span className="eyebrow">Waiting for confirmation</span><h2>Your analysis will appear here.</h2><p>Confirmation prevents an imported draft from being mistaken for verified data.</p></section>:<section className="panel"><div className="section-heading"><div><span className="eyebrow">Portfolio health</span><h2>{stats.assessment}</h2></div><p>Concentration describes allocation—not quality, suitability, or future return.</p></div><div className="metric-grid"><Metric label="Current value" value={money(stats.total,true)}/><Metric label="Invested amount" value={money(stats.invested,true)}/><Metric label="Unrealised return" value={percent(stats.invested?stats.gain/stats.invested:null)} note={money(stats.gain,true)}/><Metric label="Top holding" value={percent(stats.weighted[0]?.weight)} note={stats.weighted[0]?.symbol}/></div><div className="table-scroll"><table className="holdings-table"><thead><tr><th>Stock</th><th>Value</th><th>Weight</th><th>Allocation</th></tr></thead><tbody>{stats.weighted.map(row=><tr key={row.symbol}><td><strong>{row.symbol}</strong></td><td>{money(row.value)}</td><td>{percent(row.weight)}</td><td style={{minWidth:180}}><div className="allocation-bar"><i style={{width:(row.weight*100)+"%"}}/></div></td></tr>)}</tbody></table></div></section>}
  </div>
}
