import { invalidPayload, isRecord } from "@/lib/server/api";

export type FundScheme = { schemeCode: number; schemeName: string };
export type FundPoint = { date: string; value: number };

export function normalizeFundSearch(payload: unknown): FundScheme[] {
  if (!Array.isArray(payload)) invalidPayload();

  const unique = new Map<number, FundScheme>();
  for (const item of payload) {
    if (!isRecord(item)) continue;
    const schemeCode = Number(item.schemeCode);
    const schemeName = typeof item.schemeName === "string" ? item.schemeName.trim() : "";
    if (!Number.isSafeInteger(schemeCode) || schemeCode <= 0 || schemeName.length < 2 || schemeName.length > 240) continue;
    unique.set(schemeCode, { schemeCode, schemeName });
    if (unique.size === 20) break;
  }
  return [...unique.values()];
}

export function normalizeFundDetail(payload: unknown) {
  if (!isRecord(payload)) invalidPayload();

  const rawMeta = isRecord(payload.meta) ? payload.meta : {};
  const meta = Object.fromEntries(
    Object.entries(rawMeta).filter(([, value]) => typeof value === "string" || typeof value === "number"),
  );
  const rows = Array.isArray(payload.data) ? payload.data : [];
  const unique = new Map<string, FundPoint>();

  for (const item of rows) {
    if (!isRecord(item) || typeof item.date !== "string") continue;
    const match = /^(\d{2})-(\d{2})-(\d{4})$/.exec(item.date);
    const value = typeof item.nav === "string" || typeof item.nav === "number" ? Number(item.nav) : Number.NaN;
    if (!match || !Number.isFinite(value) || value <= 0) continue;
    const [, day, month, year] = match;
    const date = `${year}-${month}-${day}`;
    unique.set(date, { date, value });
  }

  return { meta, points: [...unique.values()].sort((a, b) => a.date.localeCompare(b.date)) };
}

