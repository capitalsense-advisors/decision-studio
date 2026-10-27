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
  revalidate: number;
  timeoutMs?: number;
};

export async function fetchJson(
  url: string,
  { headers, revalidate, timeoutMs = 8_000 }: FetchJsonOptions,
): Promise<unknown> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      cache: "force-cache",
      headers,
      next: { revalidate },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new UpstreamFailure("http", response.status);
    }

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
