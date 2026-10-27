export type Market = "india" | "us";
export type AssetType = "stock" | "fund" | "gold" | "debt" | "cash";

export type HoldingDraft = {
  id: string;
  symbol: string;
  quantity: number;
  averageCost: number;
  currentPrice: number | null;
  priceDate: string | null;
  assetType: AssetType;
  priceSource: "yahoo" | "manual" | "missing";
};

export type HoldingIssue = { row: number; field: string; message: string };

export type PortfolioAnalysis = {
  totalValue: number;
  investedAmount: number;
  gain: number;
  gainRate: number | null;
  hhi: number;
  effectiveHoldings: number;
  topWeight: number;
  topThreeWeight: number;
  assessment: "Focused" | "Watch concentration" | "Broadly spread";
  weighted: Array<HoldingDraft & { value: number; invested: number; weight: number }>;
  assetMix: Array<{ assetType: AssetType; value: number; weight: number }>;
};

const SYMBOL = /^[A-Z0-9.^&-]{1,24}$/;
const ASSET_TYPES = new Set<AssetType>(["stock", "fund", "gold", "debt", "cash"]);

export function createHolding(overrides: Partial<HoldingDraft> = {}): HoldingDraft {
  return {
    id: overrides.id ?? crypto.randomUUID(),
    symbol: overrides.symbol ?? "",
    quantity: overrides.quantity ?? 0,
    averageCost: overrides.averageCost ?? 0,
    currentPrice: overrides.currentPrice ?? null,
    priceDate: overrides.priceDate ?? null,
    assetType: overrides.assetType ?? "stock",
    priceSource: overrides.priceSource ?? "missing",
  };
}

export function normalizeSymbol(value: string) {
  return value.trim().toUpperCase().replace(/\.NS$/i, "");
}

export function validateHoldings(rows: HoldingDraft[]) {
  const issues: HoldingIssue[] = [];
  const seen = new Set<string>();

  rows.forEach((row, index) => {
    const position = index + 1;
    const symbol = normalizeSymbol(row.symbol);
    if (!SYMBOL.test(symbol)) issues.push({ row: position, field: "symbol", message: "Use a valid exchange symbol." });
    if (seen.has(symbol)) issues.push({ row: position, field: "symbol", message: "Merge duplicate symbols before analysis." });
    seen.add(symbol);
    if (!Number.isFinite(row.quantity) || row.quantity <= 0) issues.push({ row: position, field: "quantity", message: "Quantity must be above zero." });
    if (!Number.isFinite(row.averageCost) || row.averageCost < 0) issues.push({ row: position, field: "averageCost", message: "Average cost cannot be negative." });
    if (!ASSET_TYPES.has(row.assetType)) issues.push({ row: position, field: "assetType", message: "Choose a supported asset type." });
  });

  return issues;
}

function parseCsvLine(line: string) {
  const cells: string[] = [];
  let current = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"' && line[index + 1] === '"' && quoted) {
      current += '"';
      index += 1;
    } else if (character === '"') quoted = !quoted;
    else if (character === "," && !quoted) {
      cells.push(current.trim());
      current = "";
    } else current += character;
  }
  cells.push(current.trim());
  return cells;
}

export function parseHoldingsCsv(text: string) {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) return { rows: [] as HoldingDraft[], issues: [{ row: 1, field: "file", message: "The CSV has no holding rows." }] };
  const headers = parseCsvLine(lines[0]).map((item) => item.toLowerCase().replace(/[\s-]+/g, "_"));
  const column = (...names: string[]) => headers.findIndex((header) => names.includes(header));
  const symbolIndex = column("symbol", "ticker", "security");
  const quantityIndex = column("quantity", "qty", "units");
  const costIndex = column("average_cost", "avg_price", "buy_price", "average_price");
  const typeIndex = column("asset_type", "type", "category");
  const missing = [symbolIndex < 0 ? "symbol" : "", quantityIndex < 0 ? "quantity" : "", costIndex < 0 ? "average_cost" : ""].filter(Boolean);
  if (missing.length) return { rows: [] as HoldingDraft[], issues: [{ row: 1, field: "headers", message: `Missing column${missing.length > 1 ? "s" : ""}: ${missing.join(", ")}.` }] };

  const rows = lines.slice(1, 11).map((line, index) => {
    const cells = parseCsvLine(line);
    const rawType = (cells[typeIndex] ?? "stock").toLowerCase() as AssetType;
    return createHolding({
      id: `csv-${index + 1}`,
      symbol: normalizeSymbol(cells[symbolIndex] ?? ""),
      quantity: Number((cells[quantityIndex] ?? "").replaceAll(",", "")),
      averageCost: Number((cells[costIndex] ?? "").replaceAll(",", "")),
      assetType: ASSET_TYPES.has(rawType) ? rawType : "stock",
    });
  });

  const issues = validateHoldings(rows);
  if (lines.length > 11) issues.push({ row: 11, field: "file", message: "Only the first 10 holdings were imported." });
  return { rows, issues };
}

export function analyzePortfolio(rows: HoldingDraft[]): PortfolioAnalysis | null {
  const priced = rows.filter((row) => row.currentPrice !== null && row.currentPrice > 0 && row.quantity > 0);
  if (!priced.length) return null;
  const values = priced.map((row) => ({ ...row, value: row.quantity * row.currentPrice!, invested: row.quantity * Math.max(0, row.averageCost) }));
  const totalValue = values.reduce((sum, row) => sum + row.value, 0);
  const investedAmount = values.reduce((sum, row) => sum + row.invested, 0);
  const weighted = values.map((row) => ({ ...row, weight: row.value / totalValue })).sort((a, b) => b.weight - a.weight);
  const hhi = weighted.reduce((sum, row) => sum + row.weight ** 2, 0);
  const topWeight = weighted[0]?.weight ?? 0;
  const topThreeWeight = weighted.slice(0, 3).reduce((sum, row) => sum + row.weight, 0);
  const assessment = topWeight >= 0.35 || hhi >= 0.25 ? "Focused" : topWeight >= 0.2 || topThreeWeight >= 0.65 ? "Watch concentration" : "Broadly spread";
  const mix = new Map<AssetType, number>();
  weighted.forEach((row) => mix.set(row.assetType, (mix.get(row.assetType) ?? 0) + row.value));

  return {
    totalValue,
    investedAmount,
    gain: totalValue - investedAmount,
    gainRate: investedAmount > 0 ? totalValue / investedAmount - 1 : null,
    hhi,
    effectiveHoldings: hhi > 0 ? 1 / hhi : 0,
    topWeight,
    topThreeWeight,
    assessment,
    weighted,
    assetMix: [...mix.entries()].map(([assetType, value]) => ({ assetType, value, weight: value / totalValue })).sort((a, b) => b.value - a.value),
  };
}

export function latestPrices(series: Record<string, Array<{ date: string; value: number }>>) {
  return Object.fromEntries(Object.entries(series).flatMap(([symbol, points]) => {
    const latest = [...points].sort((a, b) => b.date.localeCompare(a.date))[0];
    return latest ? [[symbol, latest]] : [];
  })) as Record<string, { date: string; value: number }>;
}
