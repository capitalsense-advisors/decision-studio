import { NextResponse } from "next/server";
import snapshot from "@/data/ipo-snapshot.json";
import { ipoStatusAt, snapshotIsStale, type IpoSnapshot } from "@/lib/ipo-snapshot";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ ...snapshot, stale: snapshotIsStale(snapshot), items: (snapshot as IpoSnapshot).items.map((item) => ({ ...item, status: ipoStatusAt(item) })) }, {
    headers: {
      "Cache-Control": "no-store",
      "X-IPO-Snapshot-Generated-At": snapshot.generatedAt,
    },
  });
}
