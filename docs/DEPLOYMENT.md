# Cloudflare deployment

Production Worker: `paisaan-decision-studio`

Site: https://paisaan-decision-studio.shubhamtejani9.workers.dev

Cloudflare builds this `codex/site-deploy` branch from GitHub using the existing Vinext/Vite Worker configuration. Keep `wrangler.jsonc`, `worker.ts`, `vite.config.ts`, and `pnpm-lock.yaml` together. This branch has the web application at its repository root. The development repository has it under `apps/web`.

Audit source revision: `326135f76c8397b1cbecf7874671d1a13bc634b4`. Python/Docker/CI changes live on the development branch; this branch contains the corresponding web source changes.

Validation before pushing: `pnpm install --frozen-lockfile`, `pnpm run lint`, `pnpm run typecheck`, `pnpm run test`, `pnpm run build`. Output is generated under `dist/`. The Vite build embeds the Git commit identity in `/api/health` (or uses an explicit DEPLOYMENT_VERSION).

Local Worker preview: `pnpm exec vite preview --host 127.0.0.1 --port 3200`. The installed emulator only supports compatibility dates through 2026-10-30, one day before the existing production date. Local runtime checks used a temporary generated-output override to that date; the checked-in production compatibility date stays 2026-10-31. The local health endpoint and browser checks passed in that emulator.

Paid guide AI remains disabled unless GUIDE_AI_ENABLED is explicitly true. Configure shared rate limits and provider billing controls before enabling it. No keys are stored in Git. Expired IPO data remains visibly stale; deployment does not refresh market data.

After Cloudflare's Git build completes, verify `/api/health` reports the deployment commit, the home page and optimized card assets load, scripts pass nonce CSP checks, and the IPO page displays expired data honestly. Pushing a commit is not proof the hosting build has completed.
