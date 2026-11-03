# Stride audit and Paisaan referral

Date: 3 November 2026 (India).

Repository: https://github.com/shubham404-error/CapitalSense-portfolio-/tree/feature/sip-social-app

Reviewed commit: `9247b92ecf0767bfdbbd2a8dc9cbf76e6d8bb1cf`.

Referral destination supplied by the owner: https://shubham404-error.github.io/CapitalSense-portfolio-/stride/

## Scope and evidence limits

This is a **source audit**, covering onboarding/profile rules, the AI guide, Supabase migrations, fund/NAV helpers, public sharing, deployment scripts/workflow, relevant UI and project documentation. The checkout was not modified. Public Supabase configuration bindings are present; their values were not copied into this report. Their presence does not establish live service readiness.

Automatic approval review rejected `npm ci` in the newly supplied repository because downloaded dependency lifecycle scripts could execute code with credential access beyond a read-only audit. No workaround, dependency installation or Stride test execution followed that rejection. Stride type checks, builds, RLS/database tests, browser tests, real authentication and real Gemini calls were **not run** during this audit. Existing test files and README statements are not treated as passing results from this session. No live-site readiness claim is made.

The Paisaan referral is separately tested with Paisaan's already-installed dependencies. That does not validate Stride's runtime.

## Product assessment

Stride is a plausible companion to Paisaan for educational exploration and reflecting on money habits. Its source includes preference swipes, financial-foundation questions, learning/social prototypes, private account/profile flows, a conditional authenticated AI guide, photo/story exports, demo funds/baskets and exact-user-selected MFAPI Regular Growth research.

Do not describe it as a live investment-execution service, verified SIP tracker, validated risk profiler or fully live social community. Those claims conflict with its documented implementation boundaries. The owner states that Stride is free; no claim about free investments, fees on future transactions or unlimited AI is inferred.

## Findings

### S1 — Medium: blanket photo-privacy wording is inconsistent with current storage paths

**Evidence:** `components/stride.tsx:59` says "Photos and feed changes stay in this demo session." `supabase/migrations/202611030001_profiles.sql` stores a private profile photo; `supabase/migrations/202611030002_shared_posts.sql` stores a public shared-post photo for an expiring public link. The README and sharing guide describe these newer behaviours.

**Impact:** Users may believe photos never leave the session even when a profile photo or explicitly shared image is persisted. This does not establish an unconsented upload; the separate sharing flow has consent. It is nevertheless misleading privacy copy.

**Recommendation:** Explain three paths distinctly: unsaved composer/feed images are session-only, saved profile photos are private account data, and explicitly published shared moments are accessible through their public link until expiry/revocation. Include retention and deletion instructions. Account deletion remains an operator process per README; do not present onboarding deletion as full account/photo deletion.

### S2 — Medium: database questionnaire constraints permit JSON null answers

**Evidence:** `supabase/migrations/202611020001_backend.sql:10–18` requires a five-element JSON array and checks each `answers->>i IN (...)`. PostgreSQL CHECK constraints allow SQL UNKNOWN; a JSON null extracts as SQL NULL and therefore does not fail those individual enum checks.

**Impact:** An authenticated user can submit their own record containing null answers while marking adult confirmation true. `supabase/functions/guide/index.ts:15–16` checks record/adult presence but does not revalidate all answer enums before generation. This is a data-quality/assumption problem, not evidence of access to other users' records.

**Recommendation:** Require each extracted answer to be non-null and of the expected type/value, and validate the complete answer set in the Edge Function. Add a real PostgreSQL regression for `[null,null,null,null,null]` and mixed null/string arrays. This finding is based on SQL semantics and source inspection; no database reproduction was executed here.

### S3 — Medium: AI output is accepted without completion or explicit content/length checks

**Evidence:** `supabase/functions/guide/index.ts:25–27` concatenates the first candidate's text and returns any nonempty result. The 150-word limit and educational boundaries exist in system instructions; no STOP/finish-reason validation or output word cap is implemented there.

**Impact:** A truncated or overlong explanation can be displayed as a normal complete answer. Prompt instructions alone do not prove that every answer respects product boundaries.

**Recommendation:** Check candidate completion/block status; reject incomplete output; cap/validate length; return a safe deterministic explanation when appropriate. Test truncation, blocked responses and unsuitable outputs. Do not describe regex checks alone as a guarantee of investment-advice compliance.

### S4 — Medium: backend readiness reporting is informational rather than a deployment gate

**Evidence:** `scripts/check-supabase.mjs` reports missing migrations, unreachable services and guide deployment problems, but does not fail based on those statuses. `.github/workflows/deploy-stride-pages.yml:71–74` runs that script before publication. The configured project URL/key exist in source, but live migrations/auth/Gemini are not verified here.

**Impact:** A green Pages publication can coexist with unavailable account, profile, public-sharing or AI capabilities. Publishing an explicitly labelled demo may be intentional; a successful workflow must not be represented as proof all services work.

**Recommendation:** Define separate demo and production-readiness gates. Require the appropriate migrations, configured auth and signed-in acceptance checks before marketing those services as operational. Retain readable degraded states for optional features.

### S5 — Medium: asset/data synchronisation is on the critical deployment path

**Evidence:** `.github/workflows/deploy-stride-pages.yml:55–60` runs artwork sync and live MFAPI probes before build. The workflow then commits downloaded artwork/evidence back to the same branch (`:61–69`). README also notes a separate website deployment can overwrite the combined artifact.

**Impact:** An unrelated provider/artwork outage can block a frontend fix. Repository self-writes add race/provenance complexity; separate publication workflows can replace one another's Pages output. This is a reliability risk, not a reproduced deployment failure.

**Recommendation:** Reuse valid retained artwork, isolate scheduled data refresh from application publication, version its provenance, and consolidate ownership of the combined Pages artifact. Keep meaningful live-provider monitoring without making every UI release depend on it.

### S6 — Low: AI quota and scaling controls need an operational review before broad promotion

**Evidence:** `consume_guide_quota` is a useful atomic server-side per-user daily limit. The Edge Function has no application-wide paid-call ceiling; provider billing limits, signup abuse protection and project-level controls are external and unverified.

**Recommendation:** Confirm provider spend caps, signup controls, failure accounting and total-volume alerts before broad acquisition. Do not claim the absence of external safeguards solely because they are outside the repository.

### S7 — Low: documentation no longer consistently describes the latest feature scope

**Evidence:** Early README sections say photos in exported cards are not implemented and social changes are session-only; later sections describe photo story exports and consented persistent public links. Fund documentation distinguishes fictional sandbox records from live MFAPI research, but those differences are easy to miss.

**Recommendation:** Put a single current capability matrix near the top of README: working locally, requires configured backend, explicitly demo-only, and not implemented. Use the same labels in UI and referral copy.

## Good controls to retain

- Onboarding/profile tables have owner-scoped RLS; service-role access is used server-side, not as a browser credential.
- The guide authenticates the user and reads saved answers from their own database record rather than accepting arbitrary client financial context.
- Per-user AI quota consumption is atomic and not client writable; credentials use a provider header rather than a URL query.
- Risk willingness and financial constraints are separated. Preference swipes are explicitly a prototype heuristic, not a validated risk assessment. Do not import their output as Paisaan's investment-risk profile without validation.
- Real MFAPI NAV lookup verifies the selected scheme code, explicit Regular Growth plan, positive dated NAV and staleness. It is differentiated from fictional sandbox funds and execution.
- Public shared links require explicit publication, have limited payload fields, an expiry and owner deletion. That is intentionally different from private profile/onboarding storage.
- Demo allocations do not place orders or move money. SIP minimums and transaction suitability are not falsely claimed as provider verified.

These are source-level observations, not proof of deployed configuration or successful production tests.

## Referral decision and implementation

Suitable for an **optional awareness referral** with honest prototype boundaries. Not suitable for a CTA promising to execute the calculated SIP, transfer a plan, verify contributions or join a fully live community.

Paisaan placement: Home and below the Future Me planning result. No primary-navigation destination or interruption before the planning result was added. Both emergency-ready and emergency-not-ready users see educational copy, not pressure to invest.

Copy:

> **A clearer plan. A small habit to build on.**
> Explore Stride for money learning and a fresh way to reflect on your goals. Its social and investing demos are labelled inside the app.
> **Explore Stride for free**

The URL is exactly the owner-supplied destination, with no financial parameters or identifiers. The link opens a new tab with `noopener noreferrer` and a no-referrer policy. No SSO, data handoff or plan import is implied. The common CapitalSense relationship and free status are disclosed. No click analytics or cross-app tracking was added.

## Remaining checks

With explicit approval to install dependencies and execute the supplied repository, run its documented type check, backend tests and Pages build, then the relevant browser tests. A configured real project still needs signed-in migration/RLS, deletion, email/Google auth and Gemini acceptance checks. Public site network access is also needed to verify the linked deployment independently.
