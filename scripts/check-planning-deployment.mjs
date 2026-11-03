import assert from "node:assert/strict";

const origin = process.env.RELEASE_ORIGIN;
const expected = process.env.EXPECTED_RELEASE;
assert(origin && /^https?:\/\//.test(origin), "Set RELEASE_ORIGIN to the deployment to verify.");
assert(expected, "Set EXPECTED_RELEASE to the full deployment commit SHA.");
const read = async (path) => {
  const response = await fetch(new URL(path, origin), { signal: AbortSignal.timeout(15000), redirect: "error" });
  assert.equal(response.status, 200, `${path}: expected HTTP 200`);
  return response;
};
const health = await read("/api/health");
const status = await health.json();
assert.equal(status.status, "ok");
assert.equal(status.release, expected, "The deployment is not serving the expected commit.");
assert.match(health.headers.get("cache-control") ?? "", /no-store/);
let root;
for (const [path, title] of [["/", "Big plans. Real-life budgets."], ["/goals", "Your someday starts with a plan."], ["/my-money", "Money sorted. Breathing room included."], ["/review", "Life changes. Your plan can too."]]) {
  const response = await read(path);
  assert.match(response.headers.get("content-type") ?? "", /text\/html/);
  const html = await response.text();
  assert(html.includes(title), `${path}: planning page is missing`);
  const csp = response.headers.get("content-security-policy") ?? "";
  assert(csp.includes("object-src 'none'"), `${path}: CSP is missing`);
  assert(csp.includes("frame-ancestors 'none'"), `${path}: frame protection is missing`);
  const nonce = csp.match(/'nonce-([^']+)'/)?.[1];
  assert(nonce, `${path}: nonce is missing`);
  const scripts = [...html.matchAll(/<script\b([^>]*)>/g)];
  assert(scripts.length > 0);
  for (const [, attrs] of scripts) {
    if (/type="(?:application\/ld\+json|application\/json)"/.test(attrs)) continue;
    assert(attrs.includes(`nonce="${nonce}"`), `${path}: script nonce differs from CSP`);
  }
  if (path === "/") root = html;
}
const assets = new Set([...root.matchAll(/(?:src|href)="([^" ]*\/_next\/static\/[^" ]+)"/g)].map(m => m[1].replaceAll("&amp;", "&")));
assert(assets.size > 0, "No built assets were referenced.");
await Promise.all([...assets].map(async (path) => {
  const response = await read(path);
  assert(!/text\/html/.test(response.headers.get("content-type") ?? ""), `${path}: asset returned HTML`);
}));
const manifest = await (await read("/manifest.webmanifest")).json();
assert.equal(manifest.display, "standalone");
assert.equal(manifest.scope, "/");
assert(manifest.icons.some(icon => icon.purpose?.includes("maskable")));
await Promise.all(manifest.icons.map(icon => read(icon.src)));
// Legacy routes remain available while the primary journey moves to planning.
await read("/portfolio");
await read("/tools");
console.log(`Planning release verified: ${expected}; four pages, CSP nonces, ${assets.size} assets, install manifest/icons and legacy routes.`);
