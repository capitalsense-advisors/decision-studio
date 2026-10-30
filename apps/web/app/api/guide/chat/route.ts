import { NextRequest } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";

import { CACHE, isRecord, jsonResponse, problemResponse } from "@/lib/server/api";

type RouteChoice = { href: string; actionLabel: string; fallback: string };

export const runtime = "nodejs";

const choices = {
  plan: { href: "/tools", actionLabel: "Open Plan", fallback: "Start by naming the goal, when you want it, what it may cost, and what you can contribute today. Plan will show whether those assumptions work together and which lever matters most." },
  portfolio: { href: "/portfolio", actionLabel: "Open Portfolio", fallback: "A useful risk check starts with position weights, not the number of holdings. Portfolio will help you spot concentration, overlap and any holding that dominates the outcome." },
  funds: { href: "/mutual-funds", actionLabel: "Open Fund Match", fallback: "Compare funds on fit, cost, consistency and downside behavior. Recent return is useful context, but it should not decide the match by itself." },
  baskets: { href: "/smallcases", actionLabel: "Explore Baskets", fallback: "Start with the basket’s thesis, then check where its conviction is concentrated and what could break the idea. Baskets explains those trade-offs before you continue." },
  learn: { href: "/guide", actionLabel: "Ask another question", fallback: "I can help with four kinds of decisions: planning a goal, reviewing a portfolio, comparing mutual funds, or understanding an investment basket. Tell me which one feels closest to your question." },
} satisfies Record<string, RouteChoice>;

function chooseRoute(message: string): RouteChoice {
  const text = message.toLowerCase();
  if (/goal|afford|house|home|car|retire|retirement|future|sav|sip|monthly|crore|move out|wedding|education/.test(text)) return choices.plan;
  if (/portfolio|holding|stock|diversif|concentrat|overlap|allocation|risk|too risky/.test(text)) return choices.portfolio;
  if (/mutual fund|fund|nav|expense ratio|scheme|return|sip fund/.test(text)) return choices.funds;
  if (/basket|smallcase|theme|strategy|curated/.test(text)) return choices.baskets;
  return choices.learn;
}

function readBody(payload: unknown) {
  if (!isRecord(payload) || typeof payload.message !== "string") return null;
  const message = payload.message.trim();
  if (!message || message.length > 600) return null;
  const history = Array.isArray(payload.history)
    ? payload.history.slice(-6)
      .filter((item) => isRecord(item) && (item.role === "user" || item.role === "assistant") && typeof item.text === "string")
      .map((item) => ({ role: String(item.role), text: String(item.text).slice(0, 600) }))
    : [];
  return { message, history };
}

async function getGeminiConfig() {
  if (process.env.GEMINI_API_KEY) return { apiKey: process.env.GEMINI_API_KEY, model: process.env.GEMINI_MODEL || "gemini-3.5-flash-lite" };
  if (process.env.NODE_ENV === "production") return null;

  const candidates = [path.resolve(process.cwd(), "secrets/key.txt"), path.resolve(process.cwd(), "../../secrets/key.txt")];
  for (const candidate of candidates) {
    try {
      const lines = (await readFile(candidate, "utf8")).split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
      const apiKey = lines[0];
      const model = lines.find((line) => line.startsWith("gemini-")) || "gemini-3.5-flash-lite";
      if (apiKey.length >= 20) return { apiKey, model };
    } catch {
      continue;
    }
  }
  return null;
}

async function askGemini(message: string, history: Array<{ role: string; text: string }>, route: RouteChoice) {
  const config = await getGeminiConfig();
  if (!config) return null;
  const { apiKey, model } = config;
  const context = history.map((item) => `${item.role}: ${item.text}`).join("\n");
  const prompt = `You are Paisaan, a concise financial education guide for Indian users.
Answer the user in plain language and in no more than 90 words.
Use Indian rupees when a currency example is useful.
Do not give buy or sell instructions, predict returns, promise outcomes, or invent current market facts.
Do not request personal identifiers, account numbers, passwords, PAN, or precise holdings values.
Do not use em dashes.
When information is missing, state the one most useful assumption or follow-up question.
The recommended Paisaan workspace is ${route.actionLabel} at ${route.href}.
Do not mention the workspace name, action label, or route in the answer because the interface adds that separately.

Recent conversation:
${context}

Current question: ${message}`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }], generationConfig: { temperature: 0.35, maxOutputTokens: 220 } }),
      signal: AbortSignal.timeout(10_000),
      cache: "no-store",
    });
    if (!response.ok) return null;
    const payload: unknown = await response.json();
    if (!isRecord(payload) || !Array.isArray(payload.candidates)) return null;
    const candidate = payload.candidates[0];
    if (!isRecord(candidate) || !isRecord(candidate.content) || !Array.isArray(candidate.content.parts)) return null;
    const reply = candidate.content.parts.map((part) => isRecord(part) && typeof part.text === "string" ? part.text : "").join("").trim();
    return reply || null;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return problemResponse("Send a valid JSON request.", 400, "INVALID_JSON", "/api/guide/chat");
  }

  const input = readBody(payload);
  if (!input) return problemResponse("Ask a question between 1 and 600 characters.", 400, "INVALID_QUESTION", "/api/guide/chat");

  const route = chooseRoute(input.message);
  const aiReply = await askGemini(input.message, input.history, route);
  return jsonResponse({ reply: aiReply || route.fallback, href: route.href, actionLabel: route.actionLabel, mode: aiReply ? "ai" : "guided" }, CACHE.none);
}
