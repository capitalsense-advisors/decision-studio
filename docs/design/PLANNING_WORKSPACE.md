# Paisaan planning workspace design — 3 November 2026

## Decisions before implementation

Retain Manrope/Nunito, existing brand mark, periwinkle/coral accents, warm ivory light surfaces and midnight dark surfaces. Reuse pill actions, fine borders, 24px cards and the current theme/install controls. Use tabular numbers and text equivalents for every financial graphic. The visual hierarchy is one decision, supporting numbers, then editable details. Avoid invented example balances in the default dashboard.

Overview introduces the planning position and next step. Goals holds named targets and allocations. My Money defines the shared budget and liquid reserve. Review exposes conflicts, assumptions and saving controls. Four navigation entries replace the feature directory. Legacy routes, components, calculations and the original home (now legacy-home.tsx) remain in source, with no legacy links in the new primary journey. This change does not rewrite the old direct URLs.

Motion: a single 450ms/8px entry transition and 180ms card hover; no looping number animation, flashing returns or gamified urgency. Reduced motion disables both. Small screens use one column and the existing mobile navigation. Minimum decision-copy size is 14px; primary copy uses 16px. SVG allocation/progress artwork uses the existing palette, not stock photography or financial success imagery. New image generation is unnecessary for these functional graphics.

## First implemented slice

Four connected routes share a client provider. Users can enter an optional manually chosen contribution budget without disclosing salary, liquid savings, essential spending and reserve months. Goal assignments share this pool; oversubscription is visibly flagged. The full emergency target is excluded from assignable savings. Goals have editable assumptions during creation and removable allocations. A month-end projection uses the selected explicit 0–15% return assumption, defaulting to zero, without claiming risk suitability. Targets are nominal future rupees.

Saving is explicit and device-local, with validated restoration, failure states and confirmed deletion. It is not encrypted by Paisaan, synchronised, automatically backed up, or automatically saved after every edit. The app works without saving and defaults to an empty personal state. Stride remains an optional disclosed companion referral.

## Deliberately incomplete

This is the first working workspace, not the complete approved financial methodology. Goal editing after creation, import/export, monthly check-ins/history, combined scenarios, current tax rules/lot accounting, profile-derived allocations/returns, inflation-linked target selection, restricted investment access dates, account sync and contextual AI remain future increments. Review explicitly states these gaps; projected balances are not represented as after-tax spendable money. No automatic Conservative/Balanced/Aggressive return numbers were invented. Monthly budget is user-confirmed, not verified affordability.

## Review checks

Check empty and populated states, shared allocation conflicts, no double-counted savings, reserve treatment, local restore/deletion, keyboard focus, light/dark themes and 375/1280px widths. Preserve existing tests for legacy components. Replacing a navigation label does not establish that old capabilities have been deleted.


## Second working slice and India-first voice

Added goal editing, named India-relevant starting points, nominal/today’s-money target choice, explicit inflation and annual fee assumptions, and optional gains-tax/cost-basis scenarios. These are illustrative inputs, not asset-specific Indian tax law or profile-generated returns. Unknown tax/cost basis withholds a spendable scenario. Monthly check-ins use the latest actual balance without adding its contribution twice; the original deadline is retained at month resolution. Check-in replacement/removal is explicit. Actual balances are manual and not bank-verified.

Review now provides combined return/inflation/contribution-pause illustrations, opt-in JSON export, validated import with replacement confirmation, history and a neutral calendar reminder. Imports and saved v1 plans are validated with backward-compatible optional fields. Exported files contain private financial data. No cloud account, automated notification or bank connection was added.

Active copy is for younger Indian earners: INR, first ₹1 crore, rent/EMIs, higher studies and career breaks. Tone is direct and friendly, without guaranteed outcomes, wealth flexing or forced slang. Existing legacy screens remain preserved outside the primary journey. New template chips, gradient scenario cards and a softly floating vector mark add visual life; reduced-motion mode disables decorative movement.

Outstanding: validated Indian tax rules/purchase lots, risk-profile suitability/asset assumptions, locked-asset modelling, cross-device sync and contextual AI. These are not represented as implemented.

## Goal reflection, scheduled money and lot worksheet

Risk reflection uses five explicit answers (loss comfort, income variability, expensive debt, date flexibility and importance) and the shared foundation. It uses remaining goal months, not the original horizon. Unknown foundation/answers withhold the theme. A horizon of three years or less, reserve shortfall, over-allocation, variable income, expensive debt, or an essential fixed goal within five years yields Conservative; low comfort also yields Conservative. Aggressive requires high comfort, seven remaining years, flexibility and no constraints. Otherwise Balanced. These are educational planning labels, not validated risk profiles, asset allocations or return estimates. Returns remain manual. Only complete reflections enter the plan.

Future releases are user-entered net proceeds, explicitly separate from all existing liquid savings/goal balances. A release belongs to at most one goal. Unknown dates, unassigned releases, dates after the deadline and dates on/before the latest balance are excluded. Each eligible amount enters once at the next monthly projection boundary, then uses the goal's manually assumed growth. Their unknown purchase basis withholds the aggregate simplified spendable projection. Goal deletion unassigns releases. No lock-in, maturity value, product-specific tax or access rule is inferred.

The session-only FIFO worksheet handles one capital asset/account, manually supplied rates, a strict month-anniversary holding threshold, one remaining long-term exemption and cess. It splits partial lots, rejects overselling and future purchases, and withholds tax/net amounts if any sold lot loses money. It does not infer loss set-off, surcharge, special acquisition-date rules, interest, dividends or exit charges. Policy reference and checked date are mandatory, with no prefilled statutory rates or applicability guarantee. The worksheet is deliberately separate from saved goal projections and plan exports. Current Indian policy verification and broader product coverage remain pending.

The existing animated vector mark and scenario panels supply the visual language without decorative image downloads. All new controls reuse themed surfaces, rounded inputs and responsive single-column layouts.

## SWP mapped to a goal

Review's advanced calculator offers systematic monthly withdrawals for an existing goal. It maps assigned savings/latest check-in, goal return, annual fee, inflation and assigned future releases. Starting at the deadline first projects contributions to that date and uses that estimated corpus; starting at the latest balance uses the actual entered balance/date instead. Contributions stop when the withdrawal phase begins. The user explicitly enters withdrawal amount and duration; annual inflation increases are optional and begin after the first twelve withdrawals. Returns and fees are compounded monthly, with releases/withdrawals at month end. A parallel lower-return illustration applies a two-percentage-point reduction to both accumulation and withdrawal phases. The first underfunded withdrawal is reported, including partial payments. Later releases may permit subsequent payments.

No after-tax withdrawal income is asserted: each redemption needs its own acquisition lots and applicable policy, and the separate one-off worksheet is not silently applied to recurring withdrawals. This deterministic model does not capture sequence-of-returns risk, exit loads or a safe withdrawal rate. An explicit Attach action stores SWP settings on the goal; Save persists them locally, with import/export validation. Goal edits preserve the settings. A responsive inline balance path uses the existing theme and no image download.
