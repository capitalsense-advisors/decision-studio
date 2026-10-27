import { afterEach, describe, expect, it, vi } from "vitest";

import { fetchJson } from "@/lib/server/api";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("fetchJson", () => {
  it("uses persistent caching and returns JSON", async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json({ ok: true }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchJson("https://example.test/data", { revalidate: 60 })).resolves.toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledWith("https://example.test/data", expect.objectContaining({
      cache: "force-cache",
      next: { revalidate: 60 },
    }));
  });

  it("classifies timeouts without exposing the network error", async () => {
    vi.stubGlobal("fetch", vi.fn((_url: string, init?: RequestInit) => new Promise((_resolve, reject) => {
      init?.signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
    })));

    await expect(fetchJson("https://example.test/slow", { revalidate: 60, timeoutMs: 5 }))
      .rejects.toMatchObject({ kind: "timeout" });
  });

  it("classifies malformed JSON", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("not-json", { status: 200 })));
    await expect(fetchJson("https://example.test/bad", { revalidate: 60 }))
      .rejects.toMatchObject({ kind: "invalid-json" });
  });
});
