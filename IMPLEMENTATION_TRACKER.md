# Paisaan Implementation Tracker

> Living product, design, engineering, and release ledger for Paisaan by CapitalSense.
>
> **Last updated:** 27 October 2026<br>
> **Current tracked version:** `0.2.0-dev`<br>
> **Current phase:** Product consolidation and experience redesign<br>
> **Git baseline:** `b8cc842` on `main`

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
| Decide | Compare no more than 2–3 meaningful choices | “Your Move” action card | Not started |
| Test | Change a key assumption and see the consequence | “What If?” interaction | Partial |
| Avoid mistakes | Notice concentration, unrealistic assumptions, costs, and risk | “Reality Check” warnings | Partial |
| Act confidently | Know what to do next without receiving an execution prompt | Clear next step and review date | Not started |
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
| Future Me | `/tools` | Turn a goal into a feasible plan | Goal, SIP, retirement, FIRE, home affordability, scenario testing | Existing calculators; consolidation not started |
| Money Mirror | `/portfolio` | Explain portfolio health | Manual holdings, CSV import, allocation, concentration | Basic MVP exists |
| Fund Match | `/mutual-funds` | Evaluate suitability and compare funds | Fund search, NAV history, returns, volatility, drawdown | Single-fund analysis exists; fit and comparison not built |
| Deep Dive | `/risk` | Reveal advanced portfolio risk when requested | Parametric, historical and Monte Carlo VaR | Engine and interface exist; not integrated into Money Mirror |
| How we math | `/guide` | Explain methods, data, assumptions, privacy, and limitations | Existing workflow guide | Exists; needs Paisaan rewrite |

### Supporting interaction language

| Name | Purpose | Status |
|---|---|---|
| **The Read** | One plain-language conclusion | Demonstrated on home only |
| **What If?** | Interactive scenario comparison | Calculators exist; unified interaction not built |
| **Reality Check** | Risks, weak assumptions, and missing information | Warnings exist; presentation not unified |
| **Your Move** | Two or three realistic next actions | Not built |
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
| Market data | Server routes and services | Reliable, cached, source-labelled adapters | Partial |
| Mutual-fund data | AMFI-derived history via `mfapi.in` | Validated fund metadata, comparison, and freshness | Partial |
| Persistence | Browser session only | Account-optional saved decisions | Not started |
| Authentication | None | Deferred until saved cross-device decisions are required | Not started |
| AI explanation | Python service only | Optional explanation grounded in deterministic results | Legacy only |
| Automated tests | 29 Python tests plus TypeScript/lint/build checks | Domain, component, integration, and accessibility tests | Partial |
| Deployment | Local application | GitHub-backed hosted environments | Not configured |

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

### `0.3.0` — Future Me MVP

**State:** Planned<br>
**Target outcome:** A user can turn a goal into an understandable plan and compare realistic ways to close the gap.

Acceptance criteria:

- [ ] Replace calculator tabs with a guided goal-selection flow.
- [ ] Support first crore, home, financial freedom, and custom goals.
- [ ] Ask only essential inputs, progressively.
- [ ] Produce one plain-language Read.
- [ ] Add What If? controls for contribution, time, inflation, and return.
- [ ] Add a Reality Check for assumptions and emergency preparedness.
- [ ] End with no more than three Your Move options.
- [ ] Add calculation unit tests and journey-level interaction tests.

### `0.4.0` — Money Mirror MVP

**State:** Planned<br>
**Target outcome:** A user can understand the most important risk or imbalance in their portfolio.

Acceptance criteria:

- [ ] Replace the editable table as the first impression with a guided import flow.
- [ ] Preserve manual entry and CSV review before analysis.
- [ ] Add asset, sector, and position concentration.
- [ ] Explain the single most important portfolio issue first.
- [ ] Integrate understandable downside-risk summaries.
- [ ] Move VaR detail behind Show Me the Math.
- [ ] Add data freshness and incomplete-data states.
- [ ] Add privacy, accessibility, and calculation tests.

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

### `0.2.0-dev` — Paisaan experience redesign

**Date:** 27 October 2026<br>
**Git state:** Development milestone tracked on `main`; final `0.2.0` tag pending approval

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

## 11. Known gaps and risks

### Product gaps

- Current internal pages still look and behave like calculators rather than guided decisions.
- Future Me contains tools that should be removed or hidden from the primary journey.
- Money Mirror does not yet analyse sectors, asset classes, or cross-fund overlap.
- Fund Match analyses one scheme at a time and does not yet measure personal fit.
- Your Move has not been implemented in any working result flow.
- There is no saved decision history or cross-device continuity.

### Engineering gaps

- Financial logic exists in both Python and TypeScript, creating parity risk.
- Browser and end-to-end testing are not established.
- Web calculation utilities need dedicated unit tests.
- External data adapters need clearer caching, freshness, and failure handling.
- Some imported source strings display encoding artefacts and need cleanup.
- Authentication, persistence, telemetry, monitoring, and deployment are not configured.

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
