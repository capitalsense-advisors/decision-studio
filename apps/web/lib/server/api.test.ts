import { afterEach, describe, expect, it, vi } from "vitest";

import { fetchJson, mapConcurrent } from "@/lib/server/api";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("fetchJson", () => {
  it("avoids caching unvalidated upstream responses", async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json({ ok: true }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchJson("https://example.test/data")).resolves.toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledWith("https://example.test/data", expect.objectContaining({
      cache: "no-store",
    }));
  });

  it("classifies timeouts without exposing the network error", async () => {
    vi.stubGlobal("fetch", vi.fn((_url: string, init?: RequestInit) => new Promise((_resolve, reject) => {
      init?.signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
    })));

    await expect(fetchJson("https://example.test/slow", { timeoutMs: 5 }))
      .rejects.toMatchObject({ kind: "timeout" });
  });

  it("classifies malformed JSON", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("not-json", { status: 200 })));
    await expect(fetchJson("https://example.test/bad"))
      .rejects.toMatchObject({ kind: "invalid-json" });
  });
});

it("retries transient HTTP failures once but not authorization failures", async () => {
 const fetchMock=vi.fn().mockResolvedValueOnce(new Response("busy",{status:503})).mockResolvedValueOnce(Response.json({ok:true}));
 vi.stubGlobal("fetch",fetchMock);
 await expect(fetchJson("https://example.test/data")).resolves.toEqual({ok:true});
 expect(fetchMock).toHaveBeenCalledTimes(2);
 fetchMock.mockReset().mockResolvedValue(new Response("denied",{status:403}));
 await expect(fetchJson("https://example.test/data")).rejects.toMatchObject({kind:"http",upstreamStatus:403});
 expect(fetchMock).toHaveBeenCalledTimes(1);
});

it("bounds provider concurrency and preserves symbol order", async () => {
 let active=0, maximum=0;
 const result=await mapConcurrent([1,2,3,4,5,6,7],3,async value=>{
  maximum=Math.max(maximum,++active);
  await new Promise(resolve=>setTimeout(resolve,1)); active--; return value*2;
 });
 expect(maximum).toBe(3); expect(result).toEqual([2,4,6,8,10,12,14]);
});
