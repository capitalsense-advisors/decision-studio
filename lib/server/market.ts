import { invalidPayload, isRecord } from "@/lib/server/api";

export type Market = "india" | "us";
export type PricePoint = { date: string; value: number };

const SYMBOL = /^[A-Z0-9.^&-]{1,24}$/;

export function parseMarket(value: string | null): Market | null {
  return value === "india" || value === "us" ? value : null;
}
export function parseSymbols(value: string | null) {
  if (!value || value.length > 300) return { symbols: [], invalid: [] };
  const entries = value.split(",").map((item) => item.trim().toUpperCase()).filter(Boolean);
  const invalid = entries.filter((item) => !SYMBOL.test(item));
  const symbols = [...new Set(entries.filter((item) => SYMBOL.test(item)))];
  return { symbols, invalid };
}

export function yahooTicker(symbol: string, market: Market) {
  if (market === "us" || symbol.startsWith("^") || symbol.endsWith(".NS") || symbol.endsWith(".BO")) return symbol;
  return `${symbol}.NS`;
}

export function normalizeYahooChart(payload: unknown): PricePoint[] {
  if (!isRecord(payload) || !isRecord(payload.chart)) invalidPayload();
  const results = Array.isArray(payload.chart.result) ? payload.chart.result : [];
  const result = results[0];
  if (!isRecord(result)) invalidPayload();

  const timestamps = Array.isArray(result.timestamp) ? result.timestamp : [];
  const indicators = isRecord(result.indicators) ? result.indicators : {};
  const quotes = Array.isArray(indicators.quote) ? indicators.quote : [];
  const quote = quotes[0];
  const closes = isRecord(quote) && Array.isArray(quote.close) ? quote.close : [];
  const points: PricePoint[] = [];

  for (let index = 0; index < Math.min(timestamps.length, closes.length); index += 1) {
    const timestamp = Number(timestamps[index]);
    const value = Number(closes[index]);
    if (!Number.isFinite(timestamp) || !Number.isFinite(value) || value <= 0) continue;
    points.push({ date: new Date(timestamp * 1000).toISOString().slice(0, 10), value });
  }

  if (!points.length) invalidPayload();
  return points;
}
