# Planning workspace release candidate — 4 November 2026

## Prepared scope

Overview, Goals, My Money and Review replace the primary navigation. Existing screens and calculation code remain; the former homepage is retained verbatim as `app/legacy-home.tsx` in the web application. The shared plan includes reserve-aware allocations, goal assumptions/check-ins, stress comparisons, risk reflection, separate future net releases, local save/restore and JSON backup/import. Review includes an expandable goal-linked SWP calculator and an explicitly manual FIFO tax worksheet. SWP maps goal balances, return/fee/inflation assumptions and releases, supports the entered essential-spending amount, and reports gross withdrawals/shortfalls.

No new dependencies, credentials, cloud storage, database migrations or paid AI activation are required. Existing installation icons and reduced-motion-aware vector decoration are reused. Financial plans remain device-local and export files contain private financial details. Installation does not back them up.

## Verified

- Source `npm run release:check`: lint, TypeScript, 111 tests, Next production build and standalone smoke passed.
- Cloudflare checkout: lint, TypeScript, the same 111 tests and Vinext/Vite production build passed with existing frozen dependencies/lockfile.
- Built Worker emulator: mobile 375px and desktop 1280px, light/dark themes; goals/editing, future releases, risk reflection, SWP mapping/attach/save, check-ins, FIFO illustration, JSON import/export and private calendar reminders passed. No horizontal overflow or uncaught browser errors.
- Reusable `scripts/check-planning-deployment.mjs`: four planning pages, matching CSP script nonces, built assets, manifest/icons, legacy routes and exact health release identity passed locally.

The installed local emulator supports compatibility dates only through 2026-10-30. Worker validation used that date as a command-line override; checked-in production compatibility remains 2026-10-31. Vinext's existing sourcemap/dynamic-import warnings remain nonfatal. A successful local check does not establish a completed Cloudflare deployment.

## Outstanding tax scope

Current Indian statutory rates have NOT been verified. Official-source hosts are denied by the current network policy; additions are saved in the environment settings draft but not applied. The historical FY 2024–25 rule module is dated, tested and rejects current dates; it is not a current-law UI preset. The FIFO worksheet requires explicit user policy assumptions. SWP withdrawals are before redemption tax. This candidate must not be described as a latest-rate Indian tax calculator or net-income SWP planner. See `docs/design/INDIAN_TAX_RULES.md`.

## Deployment handoff

The development tree is `apps/web`. Cloudflare builds the repository-root app on branch `codex/site-deploy`, with its existing `wrangler.jsonc`, `worker.ts`, `vite.config.ts` and `pnpm-lock.yaml`. A push to that branch can initiate publication; preparing this candidate does not push either branch.

1. Review the prepared source and deployment commits, especially financial methodology and the outstanding tax scope.
2. On deployment authorization, check the remote branch has not advanced, then push the prepared deployment commit without force. Preserve any newer work instead of overwriting it.
3. Wait for the Cloudflare Git build to complete. Do not infer success from Git push alone.
4. Verify the public build with the full deployment commit SHA:

   ```bash
   RELEASE_ORIGIN=https://paisaan-decision-studio.shubhamtejani9.workers.dev \
   EXPECTED_RELEASE=<full-deployment-commit-sha> \
   node scripts/check-planning-deployment.mjs
   ```

5. Repeat a real mobile/desktop goal → save → reload → SWP journey on the public origin. Check Install app and theme switching. Review runtime errors and data-provider behavior separately; a deployment does not refresh provider data.

## Rollback

The previous prepared Cloudflare deployment is `5d6429378c9b39a42b69ef60915fd31e6a5f7bd4` (Stride referral). Restore that immutable Cloudflare deployment using hosting version history, or create a revert commit of this candidate and let Git build it; do not force-reset the shared branch. Then check `/api/health` against the actual restored/built SHA. Deployment changes do not delete browser-local plans; older UI will not expose the new planning workspace. Export a plan before switching origins/devices. The source baseline is `c15b54047d2633336fec3d606015f81d05664197`.
