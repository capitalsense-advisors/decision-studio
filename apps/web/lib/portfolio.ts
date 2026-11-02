export type Market = "india" | "us";
export type AssetType = "stock" | "fund" | "gold" | "debt" | "cash";
export type HoldingDraft = {
  id: string;
  assetType: AssetType;
  valuationMode: "units" | "value";
  name: string;
  symbol: string;
  quantity: number;
  averageCost: number;
  currentPrice: number | null;
  currentValue: number | null;
  investedValue: number | null;
  priceDate: string | null;
  priceSource: "yahoo" | "manual" | "missing";
};
export type HoldingIssue = { row: number; field: string; message: string };
type WeightedHolding = HoldingDraft & { label: string; value: number; invested: number | null; weight: number };
export type StockConcentration = {
  totalValue: number;
  hhi: number;
  effectiveHoldings: number;
  topWeight: number;
  topThreeWeight: number;
  assessment: "Focused" | "Watch concentration" | "Broadly spread";
  weighted: WeightedHolding[];
};
export type PortfolioAnalysis = {
  totalValue: number;
  investedAmount: number | null;
  gain: number | null;
  gainRate: number | null;
  weighted: WeightedHolding[];
  stockConcentration: StockConcentration | null;
  assetMix: Array<{ assetType: AssetType; value: number; weight: number }>;
};

export const ASSET_LABELS: Record<AssetType, string> = { stock: "Stock", fund: "Fund / ETF", gold: "Gold", debt: "Debt / FD", cash: "Cash" };
const SYMBOL = /^[A-Z0-9.^&-]{1,24}$/;
const ASSET_TYPES = new Set<AssetType>(["stock", "fund", "gold", "debt", "cash"]);
export function isValueHolding(row: Pick<HoldingDraft, "assetType" | "valuationMode">) {
  return row.assetType === "cash" || row.assetType === "debt" || row.assetType === "gold" || (row.assetType === "fund" && row.valuationMode === "value");
}
export function holdingLabel(row: HoldingDraft) {
  return isValueHolding(row) ? row.name.trim() || ASSET_LABELS[row.assetType] : row.symbol;
}
export function createHolding(overrides: Partial<HoldingDraft> = {}): HoldingDraft {
  const assetType = overrides.assetType ?? "stock";
  return {
    id: overrides.id ?? crypto.randomUUID(), assetType,
    valuationMode: overrides.valuationMode ?? (["cash", "debt", "gold"].includes(assetType) ? "value" : "units"),
    name: overrides.name ?? "", symbol: overrides.symbol ?? "", quantity: overrides.quantity ?? 0,
    averageCost: overrides.averageCost ?? 0, currentPrice: overrides.currentPrice ?? null,
    currentValue: overrides.currentValue ?? null, investedValue: overrides.investedValue ?? null,
    priceDate: overrides.priceDate ?? null, priceSource: overrides.priceSource ?? "missing",
  };
}
/** An asset/method change starts a fresh valuation; unit prices never become balances. */
export function changeHoldingType(row: HoldingDraft, assetType: AssetType, valuationMode?: HoldingDraft["valuationMode"]) {
  return createHolding({ id: row.id, assetType, valuationMode });
}
export function normalizeSymbol(value: string) {
  return value.trim().toUpperCase().replace(/\.NS$/i, "");
}
export function validateHoldings(rows: HoldingDraft[]) {
  const issues: HoldingIssue[] = [];
  const seen = new Set<string>();
  rows.forEach((row, index) => {
    const position = index + 1;
    if (!ASSET_TYPES.has(row.assetType)) issues.push({ row: position, field: "assetType", message: "Choose a supported asset type." });
    if (isValueHolding(row)) {
      if (row.name.length > 80) issues.push({ row: position, field: "name", message: "Keep the label within 80 characters." });
      if (row.currentValue === null || !Number.isFinite(row.currentValue) || row.currentValue <= 0) issues.push({ row: position, field: "currentValue", message: "Enter a current amount above zero." });
      if (row.assetType !== "cash" && row.investedValue !== null && (!Number.isFinite(row.investedValue) || row.investedValue < 0)) issues.push({ row: position, field: "investedValue", message: "Amount invested cannot be negative." });
      return;
    }
    const symbol = normalizeSymbol(row.symbol);
    if (!SYMBOL.test(symbol)) issues.push({ row: position, field: "symbol", message: "Use a valid exchange symbol." });
    if (seen.has(symbol)) issues.push({ row: position, field: "symbol", message: "Merge duplicate symbols before analysis." });
    seen.add(symbol);
    if (!Number.isFinite(row.quantity) || row.quantity <= 0) issues.push({ row: position, field: "quantity", message: "Quantity must be above zero." });
    if (!Number.isFinite(row.averageCost) || row.averageCost < 0) issues.push({ row: position, field: "averageCost", message: "Enter a non-negative average cost." });
    if (row.currentPrice !== null && (!Number.isFinite(row.currentPrice) || row.currentPrice <= 0)) issues.push({ row: position, field: "currentPrice", message: "Current price must be above zero." });
  });
  return issues;
}

function parseCsvLine(line: string) {
  const cells: string[] = [];
  let current = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"' && line[index + 1] === '"' && quoted) { current += '"'; index += 1; }
    else if (character === '"') quoted = !quoted;
    else if (character === "," && !quoted) { cells.push(current.trim()); current = ""; }
    else current += character;
  }
  cells.push(current.trim());
  return cells;
}
export function parseHoldingsCsv(text: string) {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) return { rows: [] as HoldingDraft[], issues: [{ row: 1, field: "file", message: "The CSV has no holding rows." }] };
  const headers = parseCsvLine(lines[0]).map((item) => item.toLowerCase().replace(/[.]/g, "").replace(/[\s-]+/g, "_"));
  const column = (...names: string[]) => headers.findIndex((header) => names.includes(header));
  const symbolIndex = column("symbol", "ticker", "security", "instrument");
  const quantityIndex = column("quantity", "qty", "units");
  const costIndex = column("average_cost", "avg_price", "buy_price", "average_price", "avg_cost", "average_buy_price");
  const priceIndex = column("current_price", "ltp", "last_price");
  const typeIndex = column("asset_type", "type", "category");
  const nameIndex = column("label", "name");
  const valueIndex = column("current_value", "market_value", "value", "balance");
  const investedIndex = column("invested_value", "amount_invested");
  const modeIndex = column("valuation_mode");
  const dateIndex = column("valuation_date", "price_date");
  const numeric = (value: string | undefined) => value?.trim() ? Number(value.replaceAll(",", "")) : NaN;
  const optionalNumeric = (value: string | undefined) => value?.trim() ? numeric(value) : null;
  const rows = lines.slice(1, 11).map((line, index) => {
    const cells = parseCsvLine(line);
    const typeText = (cells[typeIndex] ?? "stock").trim().toLowerCase();
    const assetType = (({ "mutual fund": "fund", etf: "fund", equity: "stock", fd: "debt" } as Record<string, string>)[typeText] ?? typeText) as AssetType;
    const valuationMode = cells[modeIndex] === "value" || (assetType === "fund" && valueIndex >= 0 && !cells[quantityIndex]?.trim()) ? "value" : undefined;
    const price = optionalNumeric(cells[priceIndex]);
    return createHolding({
      id: `csv-${index + 1}`, assetType, valuationMode, priceDate: cells[dateIndex]?.trim() || null,
      name: cells[nameIndex] ?? "", symbol: normalizeSymbol(cells[symbolIndex] ?? ""),
      quantity: numeric(cells[quantityIndex]), averageCost: numeric(cells[costIndex]),
      currentPrice: price, currentValue: optionalNumeric(cells[valueIndex]), investedValue: optionalNumeric(cells[investedIndex]),
      priceSource: price !== null || cells[valueIndex]?.trim() ? "manual" : "missing",
    });
  });
  if (rows.some((row) => !isValueHolding(row))) {
    const missing = [symbolIndex < 0 ? "symbol" : "", quantityIndex < 0 ? "quantity" : "", costIndex < 0 ? "average_cost" : ""].filter(Boolean);
    if (missing.length) return { rows: [] as HoldingDraft[], issues: [{ row: 1, field: "headers", message: `Missing columns for stocks / listed ETFs: ${missing.join(", ")}.` }] };
  }
  const issues = validateHoldings(rows);
  if (lines.length > 11) issues.push({ row: 11, field: "file", message: "Only the first 10 holdings were imported." });
  return { rows, issues };
}
export function analyzePortfolio(rows: HoldingDraft[]): PortfolioAnalysis | null {
  if (!rows.length || validateHoldings(rows).length || rows.some((row) => !isValueHolding(row) && (row.currentPrice === null || !Number.isFinite(row.currentPrice) || row.currentPrice <= 0))) return null;
  const values = rows.map((row) => ({
    ...row, label: holdingLabel(row),
    value: isValueHolding(row) ? row.currentValue! : row.quantity * row.currentPrice!,
    invested: isValueHolding(row) ? row.assetType === "cash" ? row.currentValue : row.investedValue : row.quantity * row.averageCost,
  }));
  const totalValue = values.reduce((sum, row) => sum + row.value, 0);
  if (!Number.isFinite(totalValue) || totalValue <= 0 || values.some((row) => !Number.isFinite(row.value) || (row.invested !== null && !Number.isFinite(row.invested)))) return null;
  const investedAmount = values.every((row) => row.invested !== null) ? values.reduce((sum, row) => sum + row.invested!, 0) : null;
  const weighted = values.map((row) => ({ ...row, weight: row.value / totalValue })).sort((a, b) => b.weight - a.weight);
  const stocks = weighted.filter((row) => row.assetType === "stock");
  const stockValue = stocks.reduce((sum, row) => sum + row.value, 0);
  let stockConcentration: StockConcentration | null = null;
  if (stockValue > 0) {
    const stockWeights = stocks.map((row) => ({ ...row, weight: row.value / stockValue }));
    const hhi = stockWeights.reduce((sum, row) => sum + row.weight ** 2, 0);
    const topWeight = stockWeights[0].weight;
    const topThreeWeight = stockWeights.slice(0, 3).reduce((sum, row) => sum + row.weight, 0);
    const assessment = topWeight >= .35 || hhi > .25 + 1e-10 ? "Focused" : topWeight >= .2 || topThreeWeight >= .65 ? "Watch concentration" : "Broadly spread";
    stockConcentration = { totalValue: stockValue, hhi, effectiveHoldings: 1 / hhi, topWeight, topThreeWeight, assessment, weighted: stockWeights };
  }
  const mix = new Map<AssetType, number>();
  weighted.forEach((row) => mix.set(row.assetType, (mix.get(row.assetType) ?? 0) + row.value));
  return {
    totalValue, investedAmount, gain: investedAmount === null ? null : totalValue - investedAmount,
    gainRate: investedAmount !== null && investedAmount > 0 ? totalValue / investedAmount - 1 : null,
    weighted, stockConcentration,
    assetMix: [...mix.entries()].map(([assetType, value]) => ({ assetType, value, weight: value / totalValue })).sort((a, b) => b.value - a.value),
  };
}
export function latestPrices(series: Record<string, Array<{ date: string; value: number }>>) {
  return Object.fromEntries(Object.entries(series).flatMap(([symbol, points]) => {
    const latest = [...points].sort((a, b) => b.date.localeCompare(a.date))[0];
    return latest ? [[symbol, latest]] : [];
  })) as Record<string, { date: string; value: number }>;
}
