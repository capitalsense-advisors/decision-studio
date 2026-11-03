# Cloudflare deployment

Production Worker: `paisaan-decision-studio`

Site: https://paisaan-decision-studio.shubhamtejani9.workers.dev

Cloudflare builds this `codex/site-deploy` branch from GitHub using the existing Vinext/Vite Worker configuration. Keep `wrangler.jsonc`, `worker.ts`, `vite.config.ts`, and `pnpm-lock.yaml` together. This branch has the web application at its repository root. The development repository has it under `apps/web`.

Audit source revision: `326135f76c8397b1cbecf7874671d1a13bc634b4`. Python/Docker/CI changes live on the development branch; this branch contains the corresponding web source changes.

Validation before pushing: `pnpm install --frozen-lockfile`, `pnpm run lint`, `pnpm run typecheck`, `pnpm run test`, `pnpm run build`. Output is generated under `dist/`. The Vite build embeds the Git commit identity in `/api/health` (or uses an explicit DEPLOYMENT_VERSION).

Local Worker preview: `pnpm exec vite preview --host 127.0.0.1 --port 3200`. The installed emulator only supports compatibility dates through 2026-10-30, one day before the existing production date. Local runtime checks used a temporary generated-output override to that date; the checked-in production compatibility date stays 2026-10-31. The local health endpoint and browser checks passed in that emulator.

Paid guide AI remains disabled unless GUIDE_AI_ENABLED is explicitly true. Configure shared rate limits and provider billing controls before enabling it. No keys are stored in Git. Expired IPO data remains visibly stale; deployment does not refresh market data.

After Cloudflare's Git build completes, verify `/api/health` reports the deployment commit, the home page and optimized card assets load, scripts pass nonce CSP checks, and the IPO page displays expired data honestly. Pushing a commit is not proof the hosting build has completed.

## Asset-aware holdings update

Source revision `60b84c15cc1139e5ae2574e840bad593f1851a99`. Cash, debt/FDs, physical gold and statement-valued funds use entered current totals. Stock/ETF quotes are fetched separately. Overall allocation covers all assets; concentration applies only within individual stocks. Unknown invested amounts withhold gain calculations. Currency/method changes clear incompatible amounts.

## Browser app installation

Source revision `ecc5c35c7c7d73025cf13cb1212b89f2f27117c8`. Header Install app action uses the supported browser prompt or platform-specific instructions. Stable manifest ID/scope and PNG/maskable/Apple icons allow browser-managed installation. Android full installation can add it to the app drawer; iPhone uses Home Screen installation. Placement is controlled by the browser/launcher. Network access is still required and portfolio drafts are not made persistent. No service worker caches private data or nonce HTML. Chromium regular-profile installability and mobile-width instructions were checked locally; a native device install remains a manual verification.

## Free Stride companion referral

Source revision `c15b54047d2633336fec3d606015f81d05664197`. Home and the planning result link to the owner-supplied Stride URL, with the free/common-brand relationship disclosed, prototype/demo boundaries stated, no plan parameters, and no referrer. The Stride source audit is documented separately; its dependency installation was rejected by automatic approval review, so no Stride runtime-test readiness claim is implied.
