import { CACHE, jsonResponse } from "@/lib/server/api";

export async function GET() {
  return jsonResponse({
    status: "ok",
    service: "paisaan-web",
    release: process.env.DEPLOYMENT_VERSION || process.env.VERCEL_GIT_COMMIT_SHA || "development",
  }, CACHE.none);
}
