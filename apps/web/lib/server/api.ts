import { NextResponse } from "next/server";

export const CACHE = {
  funds: "public, s-maxage=86400, stale-while-revalidate=172800",
  market: "public, s-maxage=3600, stale-while-revalidate=7200",
  none: "no-store",
} as const;

type UpstreamFailureKind = "http" | "invalid-json" | "invalid-payload" | "network" | "timeout";

export class UpstreamFailure extends Error {
  constructor(
    readonly kind: UpstreamFailureKind,
    readonly upstreamStatus?: number,
  ) {
    super(`Upstream request failed: ${kind}`);
    this.name = "UpstreamFailure";
  }
}

type FetchJsonOptions = {
  headers?: HeadersInit;
  timeoutMs?: number;
  retries?: number;
};

export async function fetchJson(
  url: string,
  { headers, timeoutMs = 8_000, retries = 1 }: FetchJsonOptions = {},
): Promise<unknown> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    let response = await fetch(url, {
      // Only validated route responses may be cached. Never retain an invalid upstream payload.
      cache: "no-store",
      headers,
      signal: controller.signal,
    });

    // Retry a transient HTTP failure once within the original timeout budget.
    if (retries > 0 && (response.status === 429 || response.status >= 500)) {
      await response.body?.cancel();
      response = await fetch(url, { cache: "no-store", headers, signal: controller.signal });
    }
    if (!response.ok) throw new UpstreamFailure("http", response.status);

    try {
      return await response.json();
    } catch {
      throw new UpstreamFailure("invalid-json");
    }
  } catch (error) {
    if (error instanceof UpstreamFailure) throw error;
    if (controller.signal.aborted) throw new UpstreamFailure("timeout");
    throw new UpstreamFailure("network");
  } finally {
    clearTimeout(timeout);
  }
}

export function invalidPayload(): never {
  throw new UpstreamFailure("invalid-payload");
}

export function jsonResponse<T>(body: T, cacheControl: string = CACHE.none, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": cacheControl,
      "X-Request-Id": crypto.randomUUID(),
    },
  });
}

export function problemResponse(
  detail: string,
  status: number,
  code: string,
  route: string,
  error?: unknown,
) {
  const requestId = crypto.randomUUID();

  if (error) {
    const failure = error instanceof UpstreamFailure
      ? { kind: error.kind, upstreamStatus: error.upstreamStatus }
      : { kind: "unexpected" };
    console.error(JSON.stringify({ event: "api_error", route, requestId, code, ...failure }));
  }

  return NextResponse.json(
    { detail, code, requestId },
    {
      status,
      headers: {
        "Cache-Control": CACHE.none,
        "X-Request-Id": requestId,
      },
    },
  );
}

export function upstreamProblem(error: unknown, detail: string, route: string) {
  const status = error instanceof UpstreamFailure && error.kind === "timeout" ? 504 : 502;
  const code = status === 504 ? "UPSTREAM_TIMEOUT" : "UPSTREAM_UNAVAILABLE";
  return problemResponse(detail, status, code, route, error);
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function mapConcurrent<T, R>(items: T[], limit: number, work: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const index = next++;
      results[index] = await work(items[index]);
    }
  }));
  return results;
}
