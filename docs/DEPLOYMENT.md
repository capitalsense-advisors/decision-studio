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

## Planning workspace and goal-linked SWP candidate — 4 November 2026

Source commit: `71f2bd4` on the development checkout. This candidate ports the web changes into the existing root-level Worker layout. Overview, Goals, My Money and Review share reserve-aware allocations, goal check-ins, future releases and explicit local plan saving. Review includes a goal-linked SWP calculator and an optional manual-policy FIFO worksheet. The former home is preserved as `app/legacy-home.tsx`; other legacy routes/calculations remain. No dependency, lockfile, provider credentials or production compatibility-date changes are required.

Source and Worker checks each pass 111 tests, lint/typecheck and production builds. Browser checks against the built Worker pass at 375/1280px in both themes, including SWP mapping, saved-plan restore, tax illustration, imports/exports and calendar reminders. Local workerd validation used a CLI-only compatibility-date override to 2026-10-30; production remains 2026-10-31. Existing upstream sourcemap/dynamic-import build warnings remain nonfatal.

Current Indian tax rates are not verified or enabled as built-in current-law defaults. The historical equity module rejects current dates; SWP output is before redemption tax. Official-source network access is still pending in the environment settings draft. See docs/design/INDIAN_TAX_RULES.md and docs/releases/2026-11-04-planning-workspace.md for scope, deployment verification and rollback. Preparation does not push this branch or establish a live deployment.

After any Git-triggered Cloudflare build completes, verify its full commit identity and runtime assets:

```bash
RELEASE_ORIGIN=https://paisaan-decision-studio.shubhamtejani9.workers.dev \
EXPECTED_RELEASE=<full-deployment-commit-sha> \
node scripts/check-planning-deployment.mjs
```
