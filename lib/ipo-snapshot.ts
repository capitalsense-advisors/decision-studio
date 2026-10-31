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
