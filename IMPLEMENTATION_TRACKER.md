# Paisaan Implementation Tracker

> Living product, design, engineering, and release ledger for Paisaan by CapitalSense.
>
> **Last updated:** 29 October 2026<br>
> **Current tracked version:** `0.4.4-dev`<br>
> **Current phase:** Production release foundation and hosted-environment selection<br>
> **Source repository:** `https://github.com/capitalsense-advisors/decision-studio`<br>
> **Latest implementation milestone:** `3cafddb` on `main`

## 1. End goal

Build **Paisaan by CapitalSense** into a trustworthy, mobile-first financial decision product for young Indian investors.

Paisaan should help a user answer three questions:

1. **Future Me:** Can I afford the future I am planning?
2. **Money Mirror:** What is actually happening in my portfolio?
3. **Fund Match:** Does this mutual fund fit my goal, risk, and existing investments?

The app should turn financial complexity into:

- one clear conclusion;
- the most important reason behind it;
- an interactive way to test alternatives; and
- two or three realistic next actions.

The intended experience is consumer-fintech simple, visually distinctive, and decision-grade underneath. The interface should feel approachable to Gen Z without trivialising risk or presenting investment recommendations as certainty.

### Product promise

**Know your money. Make your move.**

### Product philosophy

**Pehchaan → Soch → Plan**

- **Pehchaan:** Understand the current position.
- **Soch:** Explore trade-offs and alternative scenarios.
- **Plan:** Leave with a concrete, reviewable next step.

### Experience principle

> The interface should disappear. The decision should remain.

## 2. User outcomes

Every shipped feature must improve at least one of these outcomes. A feature that produces information without improving a decision should be consolidated, redesigned, or removed.

| Outcome | User should be able to… | Product evidence | Status |
|---|---|---|---|
| Understand | Explain the result in ordinary language | Plain-language result and assumptions | Partial |
| Decide | Compare no more than 2–3 meaningful choices | “Your Move” action card | Implemented in Future Me |
| Test | Change a key assumption and see the consequence | “What If?” interaction | Implemented in Future Me |
| Avoid mistakes | Notice concentration, unrealistic assumptions, costs, and risk | “Reality Check” warnings | Implemented in Future Me; partial elsewhere |
| Act confidently | Know what to do next without receiving an execution prompt | Clear next step and review date | Implemented in Future Me |
| Trust the result | See source, data date, method, limitations, and privacy state | “Show me the math” detail | Partial |
| Return | Save or revisit a decision as circumstances change | Decision history and review reminders | Not started |

## 3. Target audience and jobs to be done

### Primary audience

Gen Z and younger millennial Indians who have started earning, saving, using SIPs, or buying stocks, but do not want to become finance experts before making a sound decision.

### Core jobs

- “Tell me whether my goal is realistic.”
- “Show me what I need to change to reach it.”
- “Tell me whether my portfolio has a hidden problem.”
- “Help me compare funds without chasing the latest winner.”
- “Explain the answer without jargon, judgement, or a wall of charts.”

### Product boundaries

Paisaan is educational decision support. It does **not**:

- execute transactions;
- connect to a broker in the current roadmap;
- promise returns;
- issue unqualified buy or sell calls;
- hide material assumptions or uncertainty;
- use urgency, streaks, confetti, or dark patterns to encourage investing;
- present an AI-generated answer as a verified calculation.

## 4. Product architecture

### User-facing product map

| Experience | Current route | Purpose | Included capabilities | Delivery status |
|---|---|---|---|---|
| Home | `/` | Orient the user around three decisions | Brand story, product paths, trust framing | New design implemented in `0.2.0-dev` |
| Future Me | `/tools` | Turn a goal into a feasible plan | Goal templates, live sliders, scenario testing, Reality Check, and Your Move | MVP implemented in `0.3.0-dev` |
| Money Mirror | `/portfolio` | Explain portfolio health | Guided import, validated holdings, Yahoo/manual pricing, asset and position concentration, Mirror Guide | Core journey implemented; downside and sector layers remain |
| Fund Match | `/mutual-funds` | Evaluate suitability and compare funds | Fund search, NAV history, returns, volatility, drawdown | Single-fund analysis exists; fit and comparison not built |
| Deep Dive | `/risk` | Reveal advanced portfolio risk when requested | Parametric, historical and Monte Carlo VaR | Engine and interface exist; not integrated into Money Mirror |
| How we math | `/guide` | Explain methods, data, assumptions, privacy, and limitations | Existing workflow guide | Exists; needs Paisaan rewrite |

### Supporting interaction language

| Name | Purpose | Status |
|---|---|---|
| **The Read** | One plain-language conclusion | Implemented in Future Me |
| **What If?** | Interactive scenario comparison | Implemented through live planning sliders in Future Me |
| **Reality Check** | Risks, weak assumptions, and missing information | Implemented in Future Me; not yet unified elsewhere |
| **Your Move** | Two or three realistic next actions | Implemented in Future Me |
| **Switch Check** | Tax, exit load, and break-even before changing funds | Tax engine exists; fund workflow not built |
| **Break It Down** | Optional plain-language explanation | AI service exists in legacy app only |
| **Show Me the Math** | Methodology, assumptions, and detailed metrics | Result notes exist; progressive disclosure incomplete |

## 5. Tool consolidation decisions

The web app must not become a menu of unrelated calculators. Existing tools should be absorbed into the three outcome-led experiences.

| Existing capability | Product destination | Decision |
|---|---|---|
| Goal planner | Future Me | Keep as core engine |
| SIP calculator | Future Me | Embed; remove as standalone destination |
| Retirement/FIRE | Future Me | Consolidate as goal templates |
| Home planning | Future Me | Consolidate as a goal template |
| Asset-allocation guidance | Future Me and Money Mirror | Keep contextually; do not expose as a generic calculator |
| Holdings import and allocation | Money Mirror | Keep and improve |
| Concentration analysis | Money Mirror | Keep as core insight |
| VaR and stress measures | Money Mirror / Deep Dive | Embed summary; retain detail behind advanced view |
| Mutual-fund NAV analysis | Fund Match | Keep as underlying evidence |
| Tax-aware return | Fund Match / Switch Check | Embed at the decision point |
| DCF valuation | Future advanced research area | Remove from primary consumer navigation |
| Trade sizing | Outside the core product | Do not prioritise for the Gen Z wealth journey |
| Money multiplier | None | Remove from primary product |
| Fixed allocation rules | Educational context only | Do not present as personalised guidance |
| Generic “where to invest” output | None | Remove; it lacks sufficient context for a sound decision |

## 6. Experience and design system

### Current direction

- **Brand:** Paisaan by CapitalSense
- **Visual concept:** a digital financial atelier
- **Historical influence:** French Renaissance proportion, editorial typography, medallions, fine rules, and restrained ornament
- **Interaction influence:** modern product restraint, layered depth, progressive disclosure, responsive motion, and outcome-first storytelling
- **Palette:** parchment, deep ink, ultramarine, warm coral, antique gold, and teal
- **Motion:** scroll reveals, sticky narrative cards, gentle depth, and spring-like easing
- **Accessibility:** keyboard semantics, visible focus behavior, responsive layout, and reduced-motion support

### Design rules

1. One decision per screen or step.
2. Lead with the conclusion, not the formula.
3. Use large numbers only when they communicate an outcome.
4. Reveal advanced metrics progressively.
5. Use red and green only when they carry real financial meaning.
6. Keep playful language in navigation and microcopy; keep risk and disclosures sober.
7. Use motion to explain hierarchy or change—not as decoration.
8. Never let ornament reduce readability, speed, or mobile usability.
9. Every result must display assumptions, limitations, and data freshness.
10. Every journey must end with “Your Move.”

## 7. Current technical shape

| Area | Current implementation | Target state | Status |
|---|---|---|---|
| Primary web product | Next.js 16 application in `apps/web` | Responsive, production web app | Active |
| Legacy prototype | Streamlit application in `app.py` and `pages/` | Reference implementation until parity, then retire | Maintained temporarily |
| Web calculations | TypeScript in `apps/web/lib/calculations.ts` | Tested shared domain layer | Partial |
| Legacy calculations | Python in `core/` | Retire after verified parity | Active legacy |
| Market data | Validated, cached Yahoo adapter with bounded requests and partial-failure handling | Reliable, source-labelled adapters with monitoring and fallback | Partial |
| Mutual-fund data | Validated, cached `mfapi.in` search and history adapters | Authoritative metadata, comparison, freshness, monitoring, and fallback | Partial |
| Persistence | Browser session only | Account-optional saved decisions | Not started |
| Authentication | None | Deferred until saved cross-device decisions are required | Not started |
| AI explanation | Python service only | Optional explanation grounded in deterministic results | Legacy only |
| Automated tests | 29-test legacy baseline plus 31 current web calculation, journey, API, adapter, and data tests | Domain, component, integration, end-to-end, and accessibility tests | Partial |
| Deployment | CI-gated standalone build and non-root container contract | GitHub-backed preview and production environments | Partial; hosting not selected |

## 8. Delivery roadmap

Release names below are planning labels. A version becomes **released** only after its acceptance criteria pass and it is committed to the source-of-truth branch.

### `0.1.0` — Working baseline

**State:** Released to local Git history<br>
**Commit:** `b8cc842`<br>
**Date:** 27 October 2026

Purpose: preserve the working Streamlit application and establish the Next.js migration baseline.

### `0.2.0` — Paisaan identity and product shell

**State:** In development on `main`; visual browser QA and stakeholder review remain<br>
**Target outcome:** Users immediately understand the three decisions Paisaan helps them make.

Acceptance criteria:

- [x] Rename the consumer surface to Paisaan by CapitalSense.
- [x] Reframe navigation around Future Me, Money Mirror, and Fund Match.
- [x] Build the new outcome-led homepage.
- [x] Establish responsive color, typography, card, and motion language.
- [x] Respect reduced-motion preferences.
- [x] Pass TypeScript, lint, and production build.
- [ ] Perform visual browser QA at desktop, tablet, and mobile widths.
- [ ] Review final copy and brand name with stakeholders.
- [x] Commit and push the development milestone to the source-of-truth repository.
- [ ] Tag the approved `0.2.0` release after visual QA and stakeholder review.

### `0.2.1` — Backend reliability foundation

**State:** Published to `origin/main`<br>
**Target outcome:** Financial data journeys fail safely, return predictable data, and remain diagnosable when an external provider is unavailable.

Acceptance criteria:

- [x] Validate and bound every public API input.
- [x] Validate external fund and market payloads before exposing them to the interface.
- [x] Apply explicit upstream timeouts and consistent cache policies.
- [x] Return stable error codes, request IDs, and safe user-facing messages.
- [x] Preserve available market series when only some requested symbols fail.
- [x] Add a lightweight service-health endpoint.
- [x] Cover adapters and route behavior with automated tests.
- [x] Pass TypeScript, lint, production build, Python regression tests, dependency audit, and live API smoke tests.
- [x] Commit and push the verified increment to `origin/main`.

### `0.3.0` — Future Me MVP

**State:** Published to `origin/main`<br>
**Target outcome:** A user can turn a goal into an understandable plan and compare realistic ways to close the gap.

Acceptance criteria:

- [x] Replace calculator tabs with a guided goal-selection flow.
- [x] Support first crore, home, financial freedom, and custom goals.
- [x] Ask only essential inputs, progressively.
- [x] Produce one plain-language Read.
- [x] Add What If? controls for contribution, time, inflation, and return.
- [x] Add a Reality Check for assumptions and emergency preparedness.
- [x] End with no more than three Your Move options.
- [x] Add calculation unit tests and journey-level interaction tests.

### `0.4.0` — Money Mirror MVP

**State:** Core data and concentration journey published; advanced risk integration remains<br>
**Target outcome:** A user can understand the most important risk or imbalance in their portfolio.

Acceptance criteria:

- [x] Replace the editable table as the first impression with a guided import flow.
- [x] Preserve manual entry and CSV review before analysis.
- [ ] Add asset, sector, and position concentration. Asset and position complete; sector remains.
- [x] Explain the single most important portfolio issue first.
- [ ] Integrate understandable downside-risk summaries.
- [ ] Move VaR detail behind Show Me the Math.
- [x] Add data freshness and incomplete-data states.
- [x] Add privacy, accessibility, and calculation tests.

### `0.5.0` — Fund Match MVP

**State:** Planned<br>
**Target outcome:** A user can decide whether a fund fits their goal and compare it fairly with an alternative.

Acceptance criteria:

- [ ] Add a goal, horizon, and risk context before analysis.
- [ ] Compare two or three funds side by side.
- [ ] Add rolling consistency, cost, drawdown, and portfolio overlap.
- [ ] Distinguish fit from recent performance.
- [ ] Add Switch Check for tax, exit load, and break-even.
- [ ] Present data dates and source limitations.
- [ ] Avoid a universal “best fund” ranking.
- [ ] Add API failure, calculation, and comparison tests.

### `0.6.0` — Connected decision experience

**State:** Proposed<br>
**Target outcome:** The three experiences feel like one coherent product instead of separate tools.

- [ ] Shared onboarding and financial context.
- [ ] Reusable Read, What If?, Reality Check, and Your Move components.
- [ ] Optional saved decisions and review dates.
- [ ] Cross-device persistence only after privacy design is approved.
- [ ] Optional Break It Down explanations grounded in calculation outputs.
- [ ] Consistent methodology, source, and freshness components.

### `0.9.0` — Production candidate

**State:** Proposed

- [ ] Threat model and privacy review completed.
- [ ] Accessibility audit completed.
- [ ] Performance budgets met on representative mobile devices.
- [ ] Core journeys covered by end-to-end tests.
- [ ] Analytics measure decisions and comprehension, not trading activity.
- [ ] Error monitoring and data-source health checks configured.
- [ ] Streamlit parity reviewed and retirement plan approved.

### `1.0.0` — Full web product

**State:** End goal

- [ ] Future Me, Money Mirror, and Fund Match meet their user-outcome acceptance criteria.
- [ ] Users can complete each journey without financial jargon.
- [ ] Every result is explainable, dated, and limitation-aware.
- [ ] The app is safely hosted and available independent of the original laptop.
- [ ] The approved repository and deployment are reproducible from a clean environment.
- [ ] Product, compliance, privacy, accessibility, and reliability reviews are complete.

## 9. Version history and code changes

### `0.4.4-dev` — Production release foundation

**Date:** 29 October 2026<br>
**Implementation commit:** `c177867`<br>
**CI hardening commit:** `3cafddb`<br>
**Git state:** Production-foundation milestone and release ledger pushed to `origin/main`

#### Release engineering changes

- Added one `release:check` command for ESLint, strict TypeScript, all web tests, the optimized build, and a standalone-runtime smoke test.
- Added GitHub Actions gates for pull requests and every push to `main`, using Node.js 22, a clean `npm ci`, the release gate, and a high-severity production dependency audit.
- Added a multi-stage Node.js 22 container that runs the generated Next.js standalone server as a non-root user and probes `/api/health`.
- Added a runtime release identifier to `/api/health`, with `DEPLOYMENT_VERSION` documented as an immutable commit or image identifier.
- Added a repeatable production smoke harness that boots the generated server and verifies health, release identity, the home route, install metadata, robots policy, and security headers.
- Corrected the health-route contract test to honour the injected deployment identifier in clean CI environments, after the first remote run exposed the hard-coded local fallback.
- Upgraded the official checkout and Node setup actions to v7 after GitHub flagged the older action runtime as deprecated.

#### Web and security changes

- Added the install manifest and robots policy as native Next.js metadata routes.
- Added a baseline Content Security Policy, HSTS in production, cross-origin opener/resource policies, permissions policy, clickjacking protection, and framework-header suppression.
- Enabled standalone output and deployment IDs so immutable releases can be identified consistently at build and runtime boundaries.
- Documented the production runtime contract, release procedure, and launch blockers that require hosting, vendor, operational, accessibility, privacy, compliance, or legal ownership.

#### Verification

- ESLint and strict TypeScript passed.
- Vitest passed all 31 tests across ten files.
- The Next.js production build passed for 14 routes, including the new manifest and robots routes.
- The generated standalone server passed the automated production smoke test.
- `npm audit --omit=dev --audit-level=high` reported zero vulnerabilities.
- GitHub Actions production-gate run `40891397111` passed from a clean checkout on Node.js 22, including `npm ci`, the full release gate, and the production dependency audit.
- Docker image execution remains unverified locally because Docker is not installed on this workstation; GitHub CI and the standalone runtime are verified, while hosted deployment remains an explicit blocker.

### `0.4.3-dev` — Future Me outcome canvas

**Date:** 28 October 2026<br>
**Implementation commit:** `4fb9d38`<br>
**Git state:** Future Me outcome milestone pushed to `origin/main`

#### Product and visual changes

- Reframed the result around one explicit action: the additional monthly contribution needed for the lower-return scenario.
- Added a one-click safer-plan preview that updates the plan, headline, metrics, and visual projection together.
- Replaced the funded ring and decorative bar trajectory with a responsive SVG line chart.
- Compare the expected path, 2%-lower-return path, and inflation-adjusted target year by year.
- Added a visual uncertainty band, labelled axes, endpoint markers, and a compact mobile legend without adding a chart dependency.
- Expanded the result canvas, improved metric hierarchy, and kept the chart in focus across desktop and mobile layouts.
- Extended deterministic calculations with a conservative year-by-year series and conservative required-monthly amount.
- Removed the decorative CapitalSense “CS” circle ornament and its unused styles from the homepage.

#### Verification

- All 31 web tests passed across ten files; Future Me's dynamic chart journey passed in a dedicated browser-test run after local worker contention.
- TypeScript passed, ESLint passed with zero warnings, and the Next.js production build passed for all 12 routes.
- Visually checked desktop and 390 px mobile layouts with no viewport overflow.
- Verified that applying the safer plan changes the headline from “Add ₹18,000 / month” to “Keep this rhythm” and changes the SVG projection path.

### `0.4.2-dev` — Verified audit remediation

**Date:** 28 October 2026<br>
**Implementation commit:** `4f5aa6d`<br>
**Git state:** Audit-remediation milestone pushed to `origin/main`

#### Confirmed correctness fixes

- Rebuilt Deep Dive portfolio history from equal-weight daily returns instead of averaging unlike raw share prices.
- Annualise the realised compounded return path instead of compounding the arithmetic mean return.
- Validate holding periods as whole numbers from 1 to 30 and portfolio values as positive finite amounts before requesting data.
- Fail explicitly when aligned history or Monte Carlo observations are insufficient; never substitute a missing risk result with zero.
- Surface failed and short-history symbols, the symbols actually used, and the common-date observation count.
- Correct the Yahoo disclosure to say closing prices, not dividend-adjusted total returns.
- Treat every Future Me target, including First Crore, as a value in today's money and inflate the future target visibly.
- Classify a plan as On track only when the 2%-lower-return scenario also reaches the target; show the conservative corpus alongside the base case.
- Floor funded percentages, keep savings within the target-dependent control range, and prevent suggested monthly or time changes from exceeding planner limits.
- Leave emergency-cushion readiness unanswered until the user chooses a native radio option; block a contradictory contribution increase after “Still building it.”

#### Confirmed trust and reliability fixes

- Limit Fund Match results to Direct Growth schemes, excluding Regular and IDCW variants.
- Clear the previous fund before a new selection loads and handle non-JSON failures without leaking parser errors.
- Replace broad privacy claims with the accurate “No account · session only” description.
- Add dedicated metadata for Deep Dive and Fund Match.

#### Deliberately not changed from the external audit

- Did not apply the proposed wholesale visual redesign, Tailwind migration, animation libraries, or naming rewrite; these are product-direction choices, not verified defects.
- Did not delete legacy calculation exports or retire Streamlit without a completed parity and migration decision.
- Did not change tax logic, regulated suitability language, or market-data providers without legal, tax, licensing, and architecture review.
- Did not add a restrictive CSP without a nonce design for the existing Next.js runtime and inline theme bootstrap.
- Money Mirror CSV, duplicate, validation, pricing, metadata, and journey-test findings were already outdated in the audited snapshot and required no new fix.

#### Verification

- Vitest: 31 tests passed across ten files, including new equal-weight, geometric-return, risk-validation, omission-disclosure, and fund-plan-filter tests.
- TypeScript passed; ESLint passed with zero warnings; Next.js production build passed for all 12 routes.
- Rendered Future Me and Deep Dive production pages were checked for corrected copy, state, outputs, metadata, and viewport overflow.

### `0.4.1-dev` — Paisaan identity refresh

**Date:** 28 October 2026<br>
**Implementation commit:** `34dba55`<br>
**Git state:** Identity milestone pushed to `origin/main`

#### Brand and interface changes

- Replaced the ornamental serif coin badge with an original continuous-ribbon **P** and saffron aperture.
- Changed the lockup to a compact lowercase `paisaan.` wordmark with a restrained CapitalSense endorsement.
- Added a responsive inline logo component with subtle hover motion and automatic reduced-motion support.
- Added a matching SVG application icon for browser tabs and install surfaces.
- Preserved high contrast in light and dark themes without duplicating brand assets.

#### Verification

- Passed all 26 automated web tests across eight files using a single worker to avoid local worker contention.
- Passed TypeScript, ESLint with zero warnings, and the Next.js production build.
- Visually verified the production render at desktop and 390 px mobile widths.
- Confirmed a 42 px symbol, horizontal lockup alignment, centered desktop/mobile headers, and no viewport overflow.

### `0.4.0-dev` — Money Mirror guided portfolio workflow

**Date:** 27 October 2026<br>
**Implementation commit:** `d76c2de`<br>
**Git state:** Money Mirror core milestone pushed to `origin/main`

#### Product changes

- Replaced the editable data table as the first impression with CSV, gentle manual-entry, and sample paths.
- Added compact holding cards for review instead of a wide spreadsheet wall.
- Added India/NSE and US market selection with explicit invalidation when the exchange changes.
- Added Yahoo closing-price refresh with visible source dates and manual-price fallback.
- Added one plain-language Read, position weights, effective holdings, asset mix, Reality Check, and three Your Move options.
- Added the contextual **Mirror Guide** for CSV structure, ticker symbols, price failures, and result interpretation.

#### Data-safety changes

- Parse CSV files in the browser; only ticker symbols are sent to the server price endpoint.
- Enforce a 250 KB file limit and a 10-holding analysis limit.
- Support quoted CSV values, BOMs, header aliases, duplicate detection, and numeric validation.
- Preserve valid Yahoo results during partial failures and never overwrite the draft with missing values.
- Exclude unpriced holdings from analysis and disclose every omission.
- Keep assistant guidance rule-based and separate from deterministic calculations.

#### Code changed

- `apps/web/app/portfolio/page.tsx` — guided import, review, Yahoo refresh, analysis, and Mirror Guide.
- `apps/web/app/portfolio/layout.tsx` — route-specific metadata.
- `apps/web/lib/portfolio.ts` — CSV parsing, validation, latest-price extraction, and portfolio concentration analysis.
- `apps/web/lib/portfolio.test.ts` — parsing, validation, concentration, and price-date tests.
- `apps/web/app/portfolio/page.test.tsx` — complete sample-to-Yahoo-to-Read journey test.
- `apps/web/app/globals.css` — responsive cards, progress, analysis, assistant, and interaction styling.

#### Verification

- TypeScript: passed.
- ESLint: passed with zero warnings.
- Vitest: 26 tests passed across eight files.
- Next.js production build: passed; eleven routes generated.
- Dependency audit: zero known vulnerabilities.
- Production-mode route check: `/portfolio` returned HTTP 200 and correct metadata.
- Live Yahoo check: RELIANCE, HDFCBANK, INFY, and TCS returned 495 points each with no failures; latest RELIANCE date was 27 October 2026.
- Legacy Python regression rerun: blocked by the machine's removed Python 3.11 interpreter; the failure occurred before test collection and is unrelated to changed web files.

### `0.3.0-dev` — Future Me guided decision experience

**Date:** 27 October 2026<br>
**Implementation commit:** `ec171e8`<br>
**Git state:** Future Me milestone pushed to `origin/main`

#### Product changes

- Replaced five calculator tabs and dense number fields with one coherent goal-planning journey.
- Added first crore, home, financial freedom, and personal goal cards with sensible starting points.
- Added tactile range controls for the goal, savings, monthly contribution, and time horizon.
- Moved return, inflation, and annual contribution increases into progressive disclosure.
- Added a live plain-language Read, funding indicator, contribution-versus-growth split, and trajectory.
- Added a Reality Check for emergency preparedness and a conservative lower-return outcome.
- Added three actionable Your Move options that directly update the plan.
- Removed DCF, tax, trading, multiplier, and generic allocation tools from the primary consumer journey.

#### Production details

- Added route-specific title and description metadata.
- Added visible keyboard focus treatment and semantic pressed, live-region, fieldset, slider, and output behavior.
- Removed mobile page overflow at 375px while preserving swipeable navigation.
- Added exact singular/plural action copy and aligned rounded contribution suggestions with applied values.
- Added deterministic calculation bounds for return, inflation, annual step-up, time, and negative inputs.

#### Code changed

- `apps/web/app/tools/page.tsx` — complete guided Future Me interface.
- `apps/web/app/tools/layout.tsx` — route metadata.
- `apps/web/app/globals.css` — tactile controls, responsive studio, cards, results, and accessibility states.
- `apps/web/lib/calculations.ts` — future-plan projection, required contribution, downside scenario, and extension calculation.
- `apps/web/lib/calculations.test.ts` — deterministic financial calculation coverage.
- `apps/web/app/tools/page.test.tsx` — goal, slider, decision-copy, and readiness interaction coverage.
- `apps/web/package.json`, `package-lock.json`, and `apps/web/vitest.config.mjs` — browser-like journey-test support.

#### Verification

- TypeScript: passed.
- ESLint: passed with zero warnings.
- Vitest: 21 tests passed across six files.
- Next.js production build: passed; eleven routes generated.
- Python regression suite: 29 tests passed.
- Dependency audit: zero known vulnerabilities.
- Browser interaction QA: goal switching, live calculations, action states, desktop composition, and 375px mobile behavior passed.
- Mobile overflow check: document width equals viewport width; swipeable navigation scrollbar hidden.

### `0.2.1-dev` — Backend reliability foundation

**Date:** 27 October 2026<br>
**Implementation commit:** `340a024`<br>
**Git state:** Backend milestone pushed to `origin/main`

#### Reliability changes

- Added one server response layer for cache policy, upstream timeouts, structured failures, request IDs, and safe JSON responses.
- Added runtime normalization for mutual-fund search results, fund NAV history, and Yahoo market history.
- Bounded fund queries, scheme codes, market names, symbol formats, and batch size before any upstream call.
- Added per-symbol partial-failure handling so one unavailable ticker does not discard valid market series.
- Added `/api/health` for deployment and uptime probes.
- Added root-level `start` and `test` commands for reproducible local and hosted operation.

#### Code changed

- `apps/web/lib/server/api.ts` — shared server fetch, timeout, cache, request-ID, and error behavior.
- `apps/web/lib/server/funds.ts` — mutual-fund payload validation and normalization.
- `apps/web/lib/server/market.ts` — market input parsing, ticker mapping, and Yahoo payload validation.
- `apps/web/app/api/funds/**` — hardened fund search and NAV history endpoints.
- `apps/web/app/api/market/history/route.ts` — bounded batch requests and partial-failure responses.
- `apps/web/app/api/health/route.ts` — service-health endpoint.
- `apps/web/**/*.test.ts` and `apps/web/vitest.config.mjs` — API and adapter test suite.
- `package.json`, `apps/web/package.json`, and `package-lock.json` — test/start commands and Vitest dependency.

#### Verification

- TypeScript: passed.
- ESLint: passed with zero warnings.
- Vitest: 16 tests passed across four files.
- Next.js production build: passed; eleven routes generated.
- Python regression suite: 29 tests passed.
- Dependency audit: zero known vulnerabilities at moderate severity or higher.
- Production-mode smoke tests: health, real mutual-fund search, real India market history, and invalid-input error contract passed.

### `0.2.0-dev` — Paisaan experience redesign

**Date:** 27 October 2026<br>
**Implementation commit:** `260bc25`<br>
**Git state:** Development milestone pushed to `origin/main`; final `0.2.0` tag pending approval

#### Product changes

- Introduced **Paisaan by CapitalSense** as the consumer-facing identity.
- Replaced technical navigation labels with Home, Future Me, Money Mirror, Fund Match, Deep Dive, and How we math.
- Rebuilt the homepage around the three core user questions.
- Added The Read, What If?, and Your Move as the common decision narrative.
- Added clearer educational and non-execution language in the footer.

#### Design changes

- Added the Renaissance-inspired “digital atelier” visual direction.
- Added parchment, ink, ultramarine, coral, gold, and teal design tokens.
- Added editorial typography, medallion branding, ornamental rules, layered cards, and large outcome typography.
- Added responsive hero, decision cards, sticky storytelling, manifesto, and closing sections.
- Added scroll-triggered reveal behavior and reduced-motion handling.
- Updated the shared shell, navigation, footer, light theme, and dark theme.

#### Code changed

- `apps/web/app/page.tsx` — new outcome-led landing experience.
- `apps/web/app/globals.css` — Paisaan tokens, layouts, components, responsive rules, and motion.
- `apps/web/app/layout.tsx` — metadata, brand identity, trust label, and footer.
- `apps/web/components/primary-nav.tsx` — outcome-led navigation names and order.
- `apps/web/components/motion-ready.tsx` — intersection-observer reveal behavior.

#### Verification

- TypeScript: passed.
- ESLint: passed with zero warnings.
- Next.js production build: passed; ten routes generated.
- Browser visual QA: pending.

#### Tool-generated working-tree changes

- `apps/web/AGENTS.md` was generated by Next.js development tooling with version-specific contributor instructions.
- `apps/web/next-env.d.ts` was updated by Next.js to reference development route types.

These are tracked separately because they do not represent user-facing product functionality.

### `0.1.0` — Initial CapitalSense Decision Studio import

**Date:** 27 October 2026<br>
**Commit:** `b8cc8429112d902d12f970215f8c37f27d78bbb7`

#### Repository and workflow

- Established Git history and the `main` branch.
- Added project ignore rules, Node version requirement, package lock, workspace scripts, and setup documentation.
- Documented the intended GitHub/Codex workflow and secret-handling rules.

#### Next.js web application

- Added the Next.js 16 web workspace.
- Added routes for overview, tools, portfolio, risk, mutual funds, and guide.
- Added shared navigation, theme control, UI primitives, formatting, and calculation utilities.
- Added server endpoints for mutual-fund search/history and market-price history.
- Added responsive light and dark styling.

#### Financial capabilities

- Added money-guide illustrations.
- Added goal and retirement planning.
- Added DCF valuation.
- Added tax-aware return estimation.
- Added trade sizing and risk/reward calculations.
- Added holdings entry, CSV import, allocation, gains, and concentration.
- Added parametric, historical, and seeded Monte Carlo portfolio risk.
- Added mutual-fund search, trailing returns, volatility, and drawdown.

#### Legacy Streamlit application

- Preserved the Streamlit entry point and multi-page experience.
- Preserved Python calculation engines, contracts, data services, AI service, and document generation.
- Preserved Nifty 500 and S&P 500 reference datasets.

#### Verification baseline

- 29 Python tests passed at import time.
- ESLint passed.
- TypeScript passed.
- Next.js production build passed.

### Pre-Git prototype — Streamlit foundation

**State:** Historical; exact versions and dates were not present in Git history.

The imported repository indicates that the project began as a Streamlit decision-support application. It established the financial engines and early workflows later migrated into the Next.js web surface. Because no earlier commits are available, this tracker does not invent granular pre-import version numbers.

## 10. Product decision log

| Date | Decision | Reason | Consequence |
|---|---|---|---|
| 27 Oct 2026 | Make GitHub the eventual source of truth | The project must be accessible without the original laptop | Remote repository and deployment remain to be completed |
| 27 Oct 2026 | Treat Next.js as the target product and Streamlit as the legacy reference | A full consumer web experience needs stronger routing, interaction, responsiveness, and deployment options | Python/TypeScript parity must be managed during migration |
| 27 Oct 2026 | Consolidate the product into three primary decisions | A large tool catalogue creates choice without guaranteed outcomes | Existing calculators become embedded capabilities |
| 27 Oct 2026 | Use Paisaan as the consumer identity | It is more memorable and ownable than “Decision Studio” | CapitalSense remains the parent trust brand |
| 27 Oct 2026 | Make UI and ease of use the central USP | The primary audience should not need finance expertise to start | Every workflow must be outcome-first and progressively disclosed |
| 27 Oct 2026 | Use a Renaissance-inspired, modern-interaction design language | The product needs an identity distinct from generic fintech dashboards | Ornament must remain subordinate to accessibility and clarity |
| 27 Oct 2026 | Keep deterministic calculation separate from optional AI explanation | Financial outputs must remain reproducible and auditable | AI may explain a result but cannot silently produce the underlying answer |
| 27 Oct 2026 | Normalize and validate all third-party data at the server boundary | External schemas and outages must not leak unpredictable behavior into financial journeys | UI consumers receive stable shapes, bounded failures, request IDs, and explicit caching |
| 27 Oct 2026 | Make Future Me one planning journey instead of a tool catalogue | Young users need a clear decision path, not a choice between finance calculators | Non-core valuation, tax, trade, multiplier, and allocation tools are removed from the primary route |
| 27 Oct 2026 | Keep the Money Mirror assistant deterministic and contextual | An assistant should reduce data-entry confusion without becoming an unaudited financial engine | Guidance can explain CSVs, symbols, failures, and results but cannot alter calculations or invent prices |
| 28 Oct 2026 | Treat external audits as evidence to verify, not implementation instructions | Audit snapshots can be stale and redesign recommendations can exceed verified defects | Reproduce claims against current code; implement confirmed correctness and trust issues only |
| 29 Oct 2026 | Separate deployable engineering from public-launch approval | A green build cannot resolve hosting, monitoring, data rights, accessibility, privacy, or regulatory ownership | Automate the engineering gate and track unresolved launch blockers explicitly |

## 11. Known gaps and risks

### Product gaps

- Fund Match, Deep Dive, and How we math still look and behave like utilities rather than guided decisions.
- Money Mirror does not yet analyse sectors, cross-fund overlap, portfolio return series, or understandable downside risk.
- Fund Match analyses one scheme at a time and does not yet measure personal fit.
- Your Move is implemented in Future Me and Money Mirror, but not yet in Fund Match.
- There is no saved decision history or cross-device continuity.

### Engineering gaps

- Financial logic exists in both Python and TypeScript, creating parity risk.
- Browser end-to-end automation is not established; current web coverage includes component journeys, calculations, adapters, and API contracts.
- The legacy Python virtual environment points to a removed Python 3.11 installation and must be recreated before its 29-test baseline can be rerun locally.
- External data adapters still need source-health monitoring, rate limiting, and provider fallback.
- Some imported source strings display encoding artefacts and need cleanup.
- Authentication, persistence, telemetry, external monitoring, and hosted deployment are not configured; the standalone build, container contract, health probe, and CI gates are now implemented.

### Trust and compliance gaps

- Tax assumptions require dated, jurisdiction-specific source notes.
- Mutual-fund metadata and cost fields need authoritative sourcing and validation.
- Suitability language and recommendation boundaries require formal review.
- Privacy behavior must be documented before any account or server-side holdings storage.
- Accessibility requires manual keyboard, screen-reader, contrast, and responsive audits.

## 12. Draft success measures

These are proposed product metrics, not current measurements.

| Measure | Draft target for `1.0.0` |
|---|---|
| Homepage comprehension | 80% of tested users can name the three core experiences after one visit |
| Journey completion | 70% of users who start a core journey reach The Read |
| Decision clarity | 75% can explain why the result was produced |
| Action clarity | 70% can identify the recommended next review or action without assistance |
| Input burden | No core step asks for more than five inputs at once |
| Mobile usability | All core journeys usable at 320px width without horizontal page scrolling |
| Accessibility | WCAG 2.2 AA for core journeys |
| Performance | Core pages meet agreed mobile Core Web Vitals budgets |
| Trust | Every calculated result shows assumptions, limitations, source, and data date where applicable |

## 13. Tracker maintenance rules

This file is part of the implementation, not an occasional project summary.

For every product change:

1. Update the relevant capability status or roadmap checkbox.
2. Add the user outcome the change is intended to improve.
3. Add the changed files and verification performed to the active version.
4. Record any product or architecture decision that will constrain later work.
5. Record newly discovered gaps rather than hiding them.
6. Move a version from `dev` to released only after its acceptance criteria pass.
7. Add the release commit or tag once created.
8. Do not rewrite historical released-version entries except to correct a factual error.

### Status vocabulary

- **Not started:** no usable implementation exists.
- **Planned:** scope and acceptance criteria are defined.
- **Partial:** some usable capability exists, but it does not satisfy the target outcome.
- **In development:** implementation exists in the working branch but is not released.
- **Released:** acceptance criteria passed and the version is committed to the source-of-truth branch.
- **Legacy only:** capability exists only in the Streamlit/Python surface.
- **Deferred:** consciously excluded from the current roadmap.
- **Removed:** deleted or no longer exposed to users.

### Definition of done for a product increment

- The change improves a named user outcome.
- Empty, loading, error, and incomplete-data states are handled.
- Assumptions and limitations are visible.
- Keyboard, touch, narrow-screen, and reduced-motion behavior are considered.
- Relevant unit, integration, and build checks pass.
- The tracker and user-facing documentation are updated.
- The change is reviewed, committed, and pushed to the source-of-truth repository.
