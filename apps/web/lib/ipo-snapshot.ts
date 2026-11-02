export type IpoSnapshotSource = {
  name: "IPOAlerts" | "IPOJi";
  url: string;
  fetchedAt: string;
  note: string;
};

export type IpoSnapshotItem = {
  id: string;
  slug: string;
  name: string;
  symbol: string | null;
  status: "open" | "closed" | "upcoming" | "listed" | "announced";
  openDate: string | null;
  closeDate: string | null;
  listingDate: string | null;
  priceLow: number | null;
  priceHigh: number | null;
  lotSize: number | null;
  minimumAmount: number | null;
  issueSizeCrore: number | null;
  subscription: number | null;
  subscriptionUpdatedAt: string | null;
  gmp: number | null;
  gmpPercent: number | null;
  freshIssueShare: number | null;
  ipoPe: number | null;
  peerPe: number | null;
  roe: number | null;
  debtEquity: number | null;
  patMargin: number | null;
  revenueCrore: number | null;
  profitCrore: number | null;
  totalBorrowingCrore: number | null;
  about: string | null;
  strengths: string[];
  risks: string[];
  logoUrl: string | null;
  prospectusUrl: string | null;
  ipoJiUrl: string | null;
  nseInfoUrl: string | null;
  sourceNames: Array<"IPOAlerts" | "IPOJi">;
};

export type IpoSnapshot = {
  generatedAt: string;
  expiresAt: string;
  market: "India";
  board: "Mainboard";
  providerRequests: { ipoAlerts: number; ipoJi: number };
  sources: IpoSnapshotSource[];
  items: IpoSnapshotItem[];
};

export const emptyIpoSnapshot: IpoSnapshot = {
  generatedAt: new Date(0).toISOString(),
  expiresAt: new Date(0).toISOString(),
  market: "India",
  board: "Mainboard",
  providerRequests: { ipoAlerts: 0, ipoJi: 0 },
  sources: [],
  items: [],
};

/** Dates are Indian exchange calendar dates. Never promote stale "open" labels. */
export function ipoStatusAt(item: Pick<IpoSnapshotItem, "status" | "openDate" | "closeDate" | "listingDate">, now = new Date()): IpoSnapshotItem["status"] {
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
  if (item.listingDate && today >= item.listingDate) return "listed";
  if (item.status === "listed") return "listed";
  if (item.closeDate && today > item.closeDate) return "closed";
  if (item.openDate && today < item.openDate) return "upcoming";
  if (item.openDate && item.closeDate && today >= item.openDate && today <= item.closeDate) return "open";
  return item.status === "open" ? "announced" : item.status;
}
export function snapshotIsStale(snapshot: Pick<IpoSnapshot, "expiresAt">, now = new Date()) {
  const expires = Date.parse(snapshot.expiresAt);
  return !Number.isFinite(expires) || now.getTime() >= expires;
}
