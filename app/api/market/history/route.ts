import { NextRequest, NextResponse } from "next/server";

const SYMBOL = /^[A-Z0-9.^&-]{1,24}$/;

type YahooChart = { chart?: { result?: Array<{ timestamp?: number[]; indicators?: { quote?: Array<{ close?: Array<number|null> }> } }> } };

export async function GET(request: NextRequest) {
  const market = request.nextUrl.searchParams.get("market") === "us" ? "us" : "india";
  const symbols = [...new Set((request.nextUrl.searchParams.get("symbols") ?? "").split(",").map(item=>item.trim().toUpperCase()).filter(item=>SYMBOL.test(item)))].slice(0,10);
  if (!symbols.length) return NextResponse.json({detail:"Provide at least one valid symbol."},{status:400});
  try {
    const entries = await Promise.all(symbols.map(async symbol=>{
      const ticker = market === "india" && !symbol.startsWith("^") ? symbol + ".NS" : symbol;
      const response = await fetch("https://query1.finance.yahoo.com/v8/finance/chart/" + encodeURIComponent(ticker) + "?range=2y&interval=1d&events=history", {headers:{"User-Agent":"CapitalSense-Decision-Studio/1.0"}, next:{revalidate:3600}, signal:AbortSignal.timeout(10000)});
      if(!response.ok) return [symbol,[]] as const;
      const payload = await response.json() as YahooChart;
      const result = payload.chart?.result?.[0]; const timestamps=result?.timestamp??[]; const closes=result?.indicators?.quote?.[0]?.close??[];
      return [symbol,timestamps.map((timestamp,index)=>({date:new Date(timestamp*1000).toISOString().slice(0,10),value:closes[index]})).filter(point=>typeof point.value==="number")] as const;
    }));
    return NextResponse.json({market,series:Object.fromEntries(entries)}, {headers:{"Cache-Control":"public, s-maxage=3600, stale-while-revalidate=7200"}});
  } catch {
    return NextResponse.json({detail:"Market history is temporarily unavailable."},{status:503});
  }
}
