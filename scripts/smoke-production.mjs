import { spawn } from "node:child_process";
import { resolve } from "node:path";

const port = Number(process.env.SMOKE_PORT ?? 3199);
const origin = `http://127.0.0.1:${port}`;
const release = "production-smoke-check";
const serverPath = resolve("apps/web/.next/standalone/apps/web/server.js");

const server = spawn(process.execPath, [serverPath], {
  env: {
    ...process.env,
    DEPLOYMENT_VERSION: release,
    HOSTNAME: "127.0.0.1",
    NODE_ENV: "production",
    PORT: String(port),
  },
  stdio: ["ignore", "pipe", "pipe"],
  windowsHide: true,
});

let serverOutput = "";
server.stdout.on("data", (chunk) => {
  serverOutput += chunk;
});
server.stderr.on("data", (chunk) => {
  serverOutput += chunk;
});

const waitForReady = async () => {
  let lastProbe = "No health response received.";
  for (let attempt = 0; attempt < 120; attempt += 1) {
    if (server.exitCode !== null) {
      throw new Error(`Standalone server exited before becoming ready.\n${serverOutput}`);
    }

    try {
      const response = await fetch(`${origin}/api/health`, {
        signal: AbortSignal.timeout(1_000),
      });
      if (response.ok) return;
      lastProbe = `Health probe returned HTTP ${response.status}.`;
    } catch (error) {
      lastProbe = error instanceof Error ? error.message : String(error);
    }

    await new Promise((resolveDelay) => setTimeout(resolveDelay, 250));
  }

  throw new Error(`Standalone server was not ready within 30 seconds. Last probe: ${lastProbe}\n${serverOutput}`);
};

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

try {
  await waitForReady();

  const [healthResponse, pageResponse, smallcasesResponse, manifestResponse, robotsResponse] = await Promise.all([
    fetch(`${origin}/api/health`),
    fetch(origin),
    fetch(`${origin}/smallcases`),
    fetch(`${origin}/manifest.webmanifest`),
    fetch(`${origin}/robots.txt`),
  ]);
  const [health, smallcasesPage, manifest, robots] = await Promise.all([
    healthResponse.json(),
    smallcasesResponse.text(),
    manifestResponse.json(),
    robotsResponse.text(),
  ]);

  assert(healthResponse.ok, "Health endpoint did not return a successful status.");
  assert(health.status === "ok", "Health endpoint did not report an ok status.");
  assert(health.release === release, "Health endpoint did not expose the runtime release.");
  assert(pageResponse.ok, "Home page did not return a successful status.");
  assert(smallcasesResponse.ok, "Smallcases page did not return a successful status.");
  assert(smallcasesPage.includes("Three ways to read"), "Smallcases page did not include its strategy studio.");
  assert(manifest.name === "Paisaan by CapitalSense", "Web manifest name is incorrect.");
  assert(robots.includes("Disallow: /api/"), "Robots policy does not protect API routes.");
  assert(pageResponse.headers.has("content-security-policy"), "CSP header is missing.");
  assert(pageResponse.headers.has("strict-transport-security"), "HSTS header is missing.");
  assert(pageResponse.headers.get("cross-origin-opener-policy") === "same-origin", "COOP header is incorrect.");
  assert(pageResponse.headers.get("cross-origin-resource-policy") === "same-origin", "CORP header is incorrect.");
  assert(!pageResponse.headers.has("x-powered-by"), "Framework disclosure header is present.");

  console.log(`Production smoke check passed at ${origin}.`);
} finally {
  server.kill("SIGTERM");
  await new Promise((resolveExit) => {
    if (server.exitCode !== null) {
      resolveExit();
      return;
    }

    const forceStop = setTimeout(() => {
      server.kill("SIGKILL");
      resolveExit();
    }, 3_000);
    server.once("exit", () => {
      clearTimeout(forceStop);
      resolveExit();
    });
  });
}
