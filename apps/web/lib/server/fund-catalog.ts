import catalog from "@/data/funds-catalog.json";

export type FundCatalogRecord = {
  name: string;
  category: string;
  plan: string;
  aumCrore: number | null;
  cagr3yPct: number | null;
  expenseRatioPct: number | null;
  sourceUrl: string | null;
};

type FundCatalog = {
  source: string;
  asOf: string | null;
  records: FundCatalogRecord[];
};

const data = catalog as FundCatalog;

export type FundSuggestion = Pick<FundCatalogRecord, "name" | "category"> & { score: number };

export function normalizeCatalogName(name: string) {
  return name
    .toLowerCase()
    .replace(/\b(direct|regular)\b/g, " ")
    .replace(/\b(plan|growth|option|idcw|payout|reinvestment)\b/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function editDistance(left: string, right: string) {
  if (left === right) return 0;
  if (!left.length) return right.length;
  if (!right.length) return left.length;

  let previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    const current = [leftIndex];
    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      current[rightIndex] = Math.min(
        current[rightIndex - 1] + 1,
        previous[rightIndex] + 1,
        previous[rightIndex - 1] + (left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1),
      );
    }
    previous = current;
  }
  return previous[right.length];
}

function tokenSimilarity(queryToken: string, candidateToken: string) {
  if (candidateToken.startsWith(queryToken) || queryToken.startsWith(candidateToken)) return 1;
  const longest = Math.max(queryToken.length, candidateToken.length);
  return longest ? 1 - editDistance(queryToken, candidateToken) / longest : 0;
}

function fuzzyScore(query: string, candidate: string) {
  if (candidate === query) return 1;
  if (candidate.startsWith(query)) return .96;
  if (candidate.includes(query)) return .92;

  const queryTokens = query.split(" ").filter(Boolean);
  const candidateTokens = candidate.split(" ").filter((token) => token.length > 1);
  if (!queryTokens.length || !candidateTokens.length) return 0;
  const tokenScore = queryTokens.reduce((total, token) => {
    return total + Math.max(...candidateTokens.map((candidateToken) => tokenSimilarity(token, candidateToken)));
  }, 0) / queryTokens.length;
  const coverage = queryTokens.filter((token) => candidateTokens.some((candidateToken) => candidateToken.includes(token) || token.includes(candidateToken))).length / queryTokens.length;
  return tokenScore * .82 + coverage * .18;
}

export function getFundSuggestions(query: string, limit = 6): FundSuggestion[] {
  const wanted = normalizeCatalogName(query);
  if (wanted.length < 2) return [];

  const unique = new Map<string, FundSuggestion>();
  for (const record of data.records) {
    if (record.plan.toLowerCase() !== "growth") continue;
    const candidate = normalizeCatalogName(record.name);
    const score = fuzzyScore(wanted, candidate);
    if (score < .58) continue;
    const existing = unique.get(candidate);
    if (!existing || score > existing.score) unique.set(candidate, { name: record.name, category: record.category, score });
  }

  return [...unique.values()]
    .sort((left, right) => right.score - left.score || left.name.localeCompare(right.name))
    .slice(0, Math.min(8, Math.max(1, limit)));
}

function matchRecord(name: string) {
  const wanted = normalizeCatalogName(name);
  const exact = data.records.find((record) => normalizeCatalogName(record.name) === wanted);
  if (exact) return exact;

  return data.records.find((record) => {
    const candidate = normalizeCatalogName(record.name);
    return candidate.length >= 8 && (candidate.includes(wanted) || wanted.includes(candidate));
  }) ?? null;
}

export function getFundCatalogPeers(name: string, limit = 12) {
  const selected = matchRecord(name);
  if (!selected) return { selected: null, peers: [], source: data.source, asOf: data.asOf };

  const peers = data.records
    .filter((record) => record.category === selected.category && record.plan.toLowerCase() === "growth")
    .sort((a, b) => (b.aumCrore ?? -1) - (a.aumCrore ?? -1))
    .slice(0, Math.min(20, Math.max(3, limit)));

  if (!peers.some((record) => record.name === selected.name)) {
    peers[peers.length - 1] = selected;
  }

  return { selected, peers, source: data.source, asOf: data.asOf };
}
