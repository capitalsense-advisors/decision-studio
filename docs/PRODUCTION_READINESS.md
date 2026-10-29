# Paisaan production readiness

This document separates deployable engineering work from decisions that require a named owner, vendor, or formal review. A green build is necessary, but it is not by itself production approval for a financial product.

## Automated release gate

Run the same gate locally and in GitHub Actions:

```bash
npm ci
npm run release:check
npm audit --omit=dev --audit-level=high
```

The gate covers ESLint, strict TypeScript, deterministic unit and journey tests, an optimized Next.js production build, and a smoke test that boots the generated standalone server and verifies its health, release identity, metadata, and security headers. Pull requests and every push to `main` run these checks in `.github/workflows/ci.yml`.

## Runtime contract

- Node.js 22 is the release runtime.
- `DEPLOYMENT_VERSION` must be an immutable identifier such as the Git commit SHA.
- `GET /api/health` returns the service and release identifier and must be used by the hosting platform's liveness check.
- The app emits a standalone Next.js server and includes a multi-stage, non-root Docker image.
- TLS terminates at the hosting edge. Production responses enable HSTS and a baseline Content Security Policy.
- API responses retain request IDs, bounded upstream timeouts, stable problem responses, and explicit cache policies.

## Before public launch

The following are intentionally not faked in code and remain launch blockers:

- [ ] Choose the production hostname and hosting platform; configure TLS and deployment from `main`.
- [ ] Configure preview deployments for pull requests and a protected production environment.
- [ ] Add external uptime monitoring against `/api/health` and alert ownership.
- [ ] Select error monitoring and verify source-map/privacy policy before enabling it.
- [ ] Add rate limiting at the edge for `/api/funds/*` and `/api/market/*`.
- [ ] Decide licensed production market and mutual-fund data providers, fallback behavior, and usage rights.
- [ ] Complete manual mobile performance, keyboard, screen-reader, and contrast audits.
- [ ] Complete privacy, DPDP, SEBI-boundary, financial-copy, and legal reviews.
- [ ] Publish privacy, terms, methodology, data-source, and support/contact pages.
- [ ] Define rollback ownership and test rollback to the previous immutable image.
- [ ] Decide whether the legacy Streamlit application is archived or maintained; do not expose two drifting public products.

## Release procedure

1. Open a pull request from a short-lived branch and require the Production gates check.
2. Review financial-output changes separately from presentation changes.
3. Deploy the immutable commit to a preview environment and complete the core journey smoke tests.
4. Promote that same commit/image to production; do not rebuild different source.
5. Verify `/api/health` reports the expected release and smoke-test Future Me, Money Mirror, Fund Match, and Deep Dive.
6. Monitor errors, upstream failures, latency, and availability during the release window.
7. Roll back to the previous immutable release if a trust, calculation, or availability threshold is breached.
