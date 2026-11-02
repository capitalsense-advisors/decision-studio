# Technical audit disposition — 3 November 2026

Reviewed `DecisionStudio_Audit_Findings.md` against this checkout. The attachment was evidence to evaluate, not authority to deploy, delete a product, supply data, or change business policy. Changes are local and have not been deployed.

## Financial and data behavior

| Findings | Resolution |
| --- | --- |
| T1, U3 | Portfolio analysis requires all rows to have valid quantities, costs, types and prices. No silent partial portfolio. Removed the unsupported overlap promise. |
| T2, T3 | IPO inputs retain missing values. Incomplete quality, valuation or demand evidence withholds the relevant score and combined verdict. Real zero debt is still valid. Selection updates state in fetch/event callbacks, removing the lint failure. |
| T4, T16 | Snapshot expiry is prominent; offer status is derived from saved dates in Asia/Kolkata. Snapshot API is uncached to avoid stale date-derived status. Parser distinguishes upcoming openings from open issues. Failed empty refreshes preserve the previous file and fail, rather than relabelling old items as fresh. |
| T5 | Labels explicitly distinguish Growth NAV (including retained income) from dividend-excluding price proxies. Return differences and alpha are not represented as total-return outperformance. CAPM alpha and information ratio now use consistent arithmetic daily returns, annualised; the fixed 6.5% risk-free assumption is visible. |
| T6 | Removed the hidden four-point drawdown tolerance buffer. Hybrid/debt classifications take priority over equity keywords. Ambiguous index, sectoral and large-and-mid-cap categories have no invented benchmark. |
| T7 | The lower-return check explicitly keeps inflation unchanged; users are told to test higher inflation separately. It is not a joint stress test. |
| T8 | Removed five unused web calculation exports after checking for consumers. Retained Python DCF withholds incomplete/invalid valuations, and trade sizing rejects invalid stop/target direction. |
| T10 | Clearly labels the equal-weight scenario as separate from Money Mirror. Shows original counts, shared sample size, close dates and small-tail warnings. Historical/Monte Carlo quantiles use the same documented nearest-rank convention. Discloses square-root-of-time scaling. |
| T11 | Exact normalised matching is required for catalog analytics; fuzzy search remains discovery only. The sample is explicitly described, with counts and missing-metric coverage. A selected fund is appended instead of displacing a peer. The source date stays unknown; no date was invented. |
| T12 | Handles Zerodha-style Instrument/Qty./Avg. cost/LTP headers and average-buy-price aliases. Imports LTP as an undated manual price. ETF/Mutual Fund types map to funds; unknown types and blank numeric inputs need correction. Company names are not guessed into exchange tickers. The ten-row limit remains visible. |
| T13 | US portfolio/scenario amounts use USD; India uses INR. Switching portfolio market clears all prices to avoid silently mixing currencies. No FX conversion is claimed. |
| T14 | Portfolio rows, NAV analysis and risk results warn about dates older than seven calendar days or unknown dates. Calendar age is a conservative heuristic, not an exchange-holiday service. Imported manual prices remain explicitly undated. |
| T15 | Four equal positions no longer get a dominant-position verdict from the HHI boundary. Concentration copy describes aggregate position concentration rather than blaming an arbitrary tied holding. Pooled assets have no look-through analysis, explicitly disclosed. |
| T17 | Market requests are limited to three simultaneous upstream calls per request. Transient HTTP failures get one retry inside the original timeout budget. Invalid upstream payloads are not persistently cached; partial market responses use no-store. All-provider failure is an explicit problem response. No fabricated backup price source was added. |
| T21 | CSV numeric errors remain missing and reduce the completeness indicator instead of turning into zero. CAGR is withheld for interim cashflows; XIRR remains available. AI failures no longer reveal exception details. Streamlit home renders without the unavailable optional cs_core engines; those pages show an unavailable message rather than breaking the whole app. |
| T22 | Static basket figures show the supplied date beside the strategy. The existing disclosure already said 29 October 2026; the original capture date remains unverified. |
| T23 | Negative VaR is explained. Direct Future Me calls reject nonfinite or out-of-range return/inflation inputs. Deterministic seeded Monte Carlo is intentionally retained as a reproducible illustration, not cryptographic randomness or independent forecasts. |

## Security, build and UI

| Findings | Resolution |
| --- | --- |
| T9 | Paid guide AI is opt-in (`GUIDE_AI_ENABLED=true`) and disabled by default. A process-wide ceiling limits total requests; paid calls additionally have minute/day ceilings, independent of spoofable forwarded IPs. Body size is capped before JSON parsing. Keys use `x-goog-api-key`, not URLs. System instructions are separate from untrusted user context; forged assistant turns are ignored. Truncated/blocked/overlong and obvious unsafe replies fall back to guided copy. Word-boundary routing avoids refund→fund. This is defence in depth, not a guarantee that generated advice is safe. |
| T18 | Licensed Latin Manrope/Nunito Sans files are vendored with SIL licenses and loaded through next/font/local. Production builds need no Google Fonts network requests. |
| T19 | Per-request nonces replace production unsafe-inline script execution. The theme script and framework scripts receive the nonce. Styles still permit inline declarations for the existing dynamic UI. Pages now render dynamically, as Next.js requires for request-specific nonces; the static-page hosting/caching assumption must not be retained. Production smoke verifies CSP and matching HTML nonce. |
| T20 | Actions pinned to the resolved commit SHAs for the existing versions. CI now runs Python tests and the scraper parser regression, and has a weekly check schedule. Frozen npm installs already make caret declarations reproducible; caret syntax alone was not a defect. |
| U1, U2 | Raised explicit small rem text declarations to at least 12px and decision helper text to 14px. Replaced translucent dark-panel helper colours with opaque light text. Chart labels enlarged. These changes do not claim a complete WCAG audit. |
| U4–U7 | Direct Growth scope and Regular/IDCW exclusions explained; emergency-cushion headline follows the gate; chart title/description includes end values; Mirror Guide starts closed. |
| U8, U9 | Card PNGs replaced with 480px WebP versions, reducing the card directory from about 15MB to under 400KB. Kept skip link, focus rings, reduced motion, labels, themes and status messages. |

## Outstanding external requirements and limits

- **T4:** Live IPO ingestion and redeployment still require a selected production storage/deployment workflow, provider access and quota management. No deployment credentials exist here; no scheduled job that commits or redeploys external data was invented. The app truthfully presents an expired saved snapshot. `npm run refresh:ipos` remains a controlled manual operation. The scraper still depends on source markup; parser tests cannot establish live compatibility.
- **T5/T11/T17:** A licensed/authoritative total-return benchmark, dated fund catalog and resilient market provider are data acquisition decisions. Existing unofficial services are disclosed, not promoted to official sources. No authenticated/live provider checks were performed during this work.
- **T9:** Before enabling paid AI in a public deployment, configure shared edge rate limiting, provider billing quotas, and the intended model via `GEMINI_MODEL`. Process memory is not shared across replicas or restarts. Generated-output checks are conservative heuristics, not a semantic safety proof. The supplied default model is retained for compatibility; no unverified immutable provider model identifier was fabricated.
- **T20:** The full npm audit still reports 16 moderate development-tool advisories, all tracing to minimatch. Its suggested automatic fixes downgrade ESLint 9 to 4 and Next ESLint config 16 to 12; these are incompatible with this project. Forcing minimatch 11 into tools requiring its CommonJS v3 API is also unsafe. Await compatible upstream patches rather than breaking or silencing lint. Production dependencies have zero reported vulnerabilities.
- **T21:** The source of `cs_core.risk` and `cs_core.mf_metrics` is still missing. Their optional Streamlit pages remain unavailable; no package of uncertain provenance was installed. The Streamlit surface is retained; retirement would be a product decision. Other Python calculator defaults remain explicit educational assumptions, not a full tax engine; XIRR continues to use its existing 365.25-day convention.
- No deployment, provider refresh, load test, full screen-reader audit or fresh-cloud-task restoration was performed.

## Validation

- Full web release gate passed: lint, TypeScript, 69 web tests, offline-capable production build, and standalone production smoke (including matching CSP nonce). The smoke runner also assembles and checks public/static assets as in Docker; the Docker runner was missing its public-directory copy and is corrected.
- 35 Python tests passed, including Streamlit home rendering and financial regressions; pip dependency consistency passed.
- Node parser regression for future/open/closed/listed IPO labels.
- Chromium: seven pages in light/dark themes at 375px and 1280px, plus hydrated portfolio/currency reset, emergency-cushion and stale/missing-data IPO interactions. No document overflow or script CSP violations in those checks. This is a targeted browser check, not exhaustive accessibility coverage.
