import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const outputPath = resolve(root, "apps/web/data/ipo-snapshot.json");
const force = process.argv.includes("--force");
const minimumAgeMinutes = Number(process.env.IPO_SNAPSHOT_MIN_AGE_MINUTES ?? 240);
const maxIpoAlertsRequests = Math.min(5, Math.max(1, Number(process.env.IPOALERTS_MAX_REQUESTS ?? 5)));
const detailLimit = Math.min(8, Math.max(1, Number(process.env.IPOJI_DETAIL_LIMIT ?? 6)));
const now = new Date();

const cleanText = (value = "") => value
  .replace(/<script[\s\S]*?<\/script>/gi, " ")
  .replace(/<style[\s\S]*?<\/style>/gi, " ")
  .replace(/<[^>]+>/g, " ")
  .replace(/&amp;/g, "&")
  .replace(/&nbsp;/g, " ")
  .replace(/&#39;|&apos;/g, "'")
  .replace(/&quot;/g, '"')
  .replace(/â‚¹/g, "₹")
  .replace(/â€“|â€”/g, "-")
  .replace(/\s+/g, " ")
  .trim();

const numberFrom = (value) => {
  const match = String(value ?? "").replace(/,/g, "").match(/-?\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : null;
};

const statusFrom = (value = "") => {
  const text = value.toLowerCase();
  if (text.includes("live") || text.includes("open")) return "open";
  if (text.includes("listed")) return "listed";
  if (text.includes("allotment") || text.includes("closed")) return "closed";
  if (text.includes("coming") || text.includes("upcoming")) return "upcoming";
  return "announced";
};

const extractStat = (html, label) => {
  const pattern = new RegExp(`<span[^>]*ipo-card-secondary-label[^>]*>\\s*${label}\\s*<\\/span>\\s*<span[^>]*ipo-card-body-value[^>]*>([\\s\\S]*?)<\\/span>`, "i");
  return cleanText(html.match(pattern)?.[1] ?? "");
};

const readPrevious = async () => {
  try { return JSON.parse(await readFile(outputPath, "utf8")); } catch { return null; }
};

const previous = await readPrevious();
if (!force && previous?.generatedAt) {
  const ageMinutes = (now.getTime() - new Date(previous.generatedAt).getTime()) / 60000;
  if (ageMinutes < minimumAgeMinutes) {
    console.log(`IPO snapshot is ${Math.round(ageMinutes)} minutes old. Reusing it to protect provider quotas.`);
    process.exit(0);
  }
}

const fetchText = async (url, options = {}) => {
  const response = await fetch(url, { ...options, signal: AbortSignal.timeout(30000), headers: { "User-Agent": "Paisaan IPO snapshot/1.0", ...(options.headers ?? {}) } });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText} for ${url}`);
  return response.text();
};

let ipoJiRequests = 0;
let ipoAlertsRequests = 0;
let ipoJiItems = [];
let ipoAlertsItems = [];
const fetchedAt = now.toISOString();

const readLocalApiKey = async () => {
  if (process.env.IPOALERTS_API_KEY?.trim()) return process.env.IPOALERTS_API_KEY.trim();
  try { return (await readFile(resolve(root, "secrets/ipoalerts-key.txt"), "utf8")).trim(); } catch { return ""; }
};

try {
  const listUrl = "https://www.ipoji.com/ipo?ipoType=mainboard";
  const html = await fetchText(listUrl);
  ipoJiRequests += 1;
  const cards = [...html.matchAll(/<article class="card ipo-card[\s\S]*?<\/article>/gi)]
    .map((match) => match[0])
    .filter((card) => /data-ipo-board="mainboard"/i.test(card));

  ipoJiItems = cards.map((card) => {
    const slug = card.match(/data-agent-href="\/ipo\/([^"]+)"/i)?.[1] ?? "";
    const dates = [...card.matchAll(/<time datetime="([^"]+)"/gi)].map((match) => match[1]);
    const price = extractStat(card, "Offer Price");
    const priceNumbers = [...price.replace(/,/g, "").matchAll(/\d+(?:\.\d+)?/g)].map((match) => Number(match[0]));
    const premium = extractStat(card, "Exp\\. Premium");
    const premiumNumbers = [...premium.replace(/,/g, "").matchAll(/-?\d+(?:\.\d+)?/g)].map((match) => Number(match[0]));
    const cardState = card.match(/data-ipo-status="([^"]+)"/i)?.[1] ?? "";
    return {
      id: `ipoji:${slug}`,
      slug,
      name: cleanText(card.match(/<h3[^>]*ipo-card-name[^>]*>([\s\S]*?)<\/h3>/i)?.[1] ?? slug),
      symbol: null,
      status: cardState === "listed" ? "listed" : statusFrom(cleanText(card.match(/ipo-card-status-badge[^>]*>([\s\S]*?)<\/span>/i)?.[1] ?? cardState)),
      openDate: dates[0] ?? null,
      closeDate: dates[1] ?? null,
      listingDate: null,
      priceLow: priceNumbers[0] ?? null,
      priceHigh: priceNumbers.at(-1) ?? null,
      lotSize: numberFrom(extractStat(card, "Lot Size")),
      minimumAmount: null,
      issueSizeCrore: numberFrom(extractStat(card, "Issue Size")),
      subscription: numberFrom(extractStat(card, "Subscription")),
      subscriptionUpdatedAt: fetchedAt,
      gmp: premiumNumbers[0] ?? null,
      gmpPercent: premiumNumbers[1] ?? null,
      freshIssueShare: null,
      ipoPe: null,
      peerPe: null,
      roe: null,
      debtEquity: null,
      patMargin: null,
      revenueCrore: null,
      profitCrore: null,
      totalBorrowingCrore: null,
      about: null,
      strengths: [],
      risks: [],
      logoUrl: card.match(/<img src="([^"]+)"[^>]*IPO company logo/i)?.[1] ?? null,
      prospectusUrl: null,
      ipoJiUrl: slug ? `https://www.ipoji.com/ipo/${slug}` : null,
      nseInfoUrl: null,
      sourceNames: ["IPOJi"],
    };
  }).filter((item) => item.slug && ["open", "closed", "upcoming", "announced"].includes(item.status));

  const detailTargets = ipoJiItems
    .filter((item) => item.status === "open" || item.status === "closed")
    .slice(0, detailLimit);
  for (const item of detailTargets) {
    try {
      const detail = await fetchText(item.ipoJiUrl);
      ipoJiRequests += 1;
      const pairs = Object.fromEntries([...detail.matchAll(/<dt class="v-dt">[\s\S]*?>([^<>]+)<\/abbr><\/dt>\s*<dd class="v-dd">([\s\S]*?)<\/dd>/gi)]
        .map((match) => [cleanText(match[1]), cleanText(match[2])]));
      item.ipoPe = numberFrom(pairs["P/E Post IPO"] ?? pairs["P/E Pre IPO"]);
      item.roe = numberFrom(pairs.ROE ?? pairs.RoNW);
      item.debtEquity = numberFrom(pairs["Debt / Equity"]);
      item.patMargin = numberFrom(pairs["PAT Margin"]);
      const prospectusAnchor = [...detail.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)]
        .find(([, attributes, body]) => /\bdocument-link\b/i.test(attributes) && />\s*RHP\s*</i.test(body));
      item.prospectusUrl = prospectusAnchor?.[1].match(/\bhref="([^"]+)"/i)?.[1] ?? null;
      const chartJson = detail.match(/<script type="application\/json" id="ipo-bar-chart-data">([\s\S]*?)<\/script>/i)?.[1];
      if (chartJson) {
        const latest = JSON.parse(chartJson).cf?.[0]?.value ?? {};
        item.revenueCrore = numberFrom(latest["Total Revenue"]);
        item.profitCrore = numberFrom(latest["Profit After Tax"]);
        item.totalBorrowingCrore = numberFrom(latest["Total Borrowing"]);
      }
      const faqJson = [...detail.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi)]
        .map((match) => { try { return JSON.parse(match[1]); } catch { return null; } })
        .find((value) => value?.["@type"] === "FAQPage");
      const firstAnswer = faqJson?.mainEntity?.[0]?.acceptedAnswer?.text;
      if (firstAnswer) item.about = cleanText(firstAnswer);
      if (/entirely of a fresh issue/i.test(item.about ?? "")) item.freshIssueShare = 100;
      if (item.priceHigh && item.lotSize) item.minimumAmount = item.priceHigh * item.lotSize;
    } catch (error) {
      console.warn(`IPOJi detail skipped for ${item.slug}: ${error.message}`);
    }
  }
} catch (error) {
  console.warn(`IPOJi snapshot failed: ${error.message}`);
}

try {
  const apiKey = await readLocalApiKey();
  let page = 1;
  let totalPages = 1;
  do {
    const url = `https://api.ipoalerts.in/ipos?status=open&limit=1&page=${page}`;
    const text = await fetchText(url, apiKey ? { headers: { "x-api-key": apiKey } } : {});
    ipoAlertsRequests += 1;
    const payload = JSON.parse(text);
    totalPages = Math.min(Number(payload.meta?.totalPages ?? 1), maxIpoAlertsRequests);
    ipoAlertsItems.push(...(payload.ipos ?? []).filter((ipo) => ipo.type === "EQ"));
    page += 1;
  } while (page <= totalPages && ipoAlertsRequests < maxIpoAlertsRequests);
} catch (error) {
  console.warn(`IPOAlerts snapshot failed: ${error.message}`);
}

const normalizeName = (name = "") => name.toLowerCase().replace(/limited|ltd|ipo|and|&|[^a-z0-9]/g, "");
const merged = [...ipoJiItems];
for (const raw of ipoAlertsItems) {
  const match = merged.find((item) => item.slug === raw.slug || normalizeName(item.name) === normalizeName(raw.name));
  const priceNumbers = [...String(raw.priceRange ?? "").matchAll(/\d+(?:\.\d+)?/g)].map((entry) => Number(entry[0]));
  const target = match ?? {
    id: `ipoalerts:${raw.id}`,
    slug: raw.slug,
    name: raw.name,
    symbol: null,
    status: "open",
    openDate: null,
    closeDate: null,
    listingDate: null,
    priceLow: null,
    priceHigh: null,
    lotSize: null,
    minimumAmount: null,
    issueSizeCrore: null,
    subscription: null,
    subscriptionUpdatedAt: null,
    gmp: null,
    gmpPercent: null,
    freshIssueShare: null,
    ipoPe: null,
    peerPe: null,
    roe: null,
    debtEquity: null,
    patMargin: null,
    revenueCrore: null,
    profitCrore: null,
    totalBorrowingCrore: null,
    about: null,
    strengths: [],
    risks: [],
    logoUrl: null,
    prospectusUrl: null,
    ipoJiUrl: null,
    nseInfoUrl: null,
    sourceNames: [],
  };
  Object.assign(target, {
    symbol: raw.symbol ?? target.symbol,
    status: raw.status ?? target.status,
    openDate: raw.startDate ?? target.openDate,
    closeDate: raw.endDate ?? target.closeDate,
    listingDate: raw.listingDate ?? target.listingDate,
    priceLow: priceNumbers[0] ?? target.priceLow,
    priceHigh: priceNumbers.at(-1) ?? target.priceHigh,
    lotSize: raw.minQty ?? target.lotSize,
    minimumAmount: raw.minAmount ?? target.minimumAmount,
    issueSizeCrore: numberFrom(raw.issueSize) ?? target.issueSizeCrore,
    subscription: raw.subscription?.timesSubscribed ?? target.subscription,
    subscriptionUpdatedAt: raw.subscription?.updatedAt ?? target.subscriptionUpdatedAt,
    about: raw.about ?? target.about,
    strengths: raw.strengths?.length ? raw.strengths : target.strengths,
    risks: raw.risks?.length ? raw.risks : target.risks,
    logoUrl: raw.logo ?? target.logoUrl,
    prospectusUrl: raw.prospectusUrl ?? target.prospectusUrl,
    nseInfoUrl: raw.nseInfoUrl ?? target.nseInfoUrl,
    sourceNames: [...new Set([...target.sourceNames, "IPOAlerts"])],
  });
  if (!match) merged.push(target);
}

const items = merged
  .filter((item) => item.name && item.status !== "listed")
  .sort((a, b) => ({ open: 0, closed: 1, upcoming: 2, announced: 3 }[a.status] - { open: 0, closed: 1, upcoming: 2, announced: 3 }[b.status]));

const snapshot = {
  generatedAt: fetchedAt,
  expiresAt: new Date(now.getTime() + minimumAgeMinutes * 60000).toISOString(),
  market: "India",
  board: "Mainboard",
  providerRequests: { ipoAlerts: ipoAlertsRequests, ipoJi: ipoJiRequests },
  sources: [
    { name: "IPOAlerts", url: "https://ipoalerts.in", fetchedAt, note: "Structured public-offer data. Free plan is cached and quota-limited." },
    { name: "IPOJi", url: "https://www.ipoji.com/ipo?ipoType=mainboard", fetchedAt, note: "Public mainboard snapshot, valuation fields, GMP context, and RHP links." },
  ],
  items: items.length ? items : (previous?.items ?? []),
};

await writeFile(outputPath, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");
console.log(`Saved ${snapshot.items.length} mainboard IPOs. IPOAlerts requests: ${ipoAlertsRequests}; IPOJi requests: ${ipoJiRequests}.`);
