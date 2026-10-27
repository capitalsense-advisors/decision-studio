import { CACHE, jsonResponse } from "@/lib/server/api";

export async function GET() {
  return jsonResponse({ status: "ok", service: "paisaan-web" }, CACHE.none);
}
