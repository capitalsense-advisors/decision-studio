import { NextResponse } from "next/server";
import snapshot from "@/data/ipo-snapshot.json";
import type { IpoSnapshot } from "@/lib/ipo-snapshot";

export async function GET() {
  return NextResponse.json(snapshot as IpoSnapshot, {
    headers: {
      "Cache-Control": "public, s-maxage=900, stale-while-revalidate=86400",
      "X-IPO-Snapshot-Generated-At": snapshot.generatedAt,
    },
  });
}
