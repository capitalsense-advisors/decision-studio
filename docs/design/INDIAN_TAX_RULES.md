# Indian tax-rule implementation and verification status

Current-law verification is blocked as of 3 November 2026: the running environment's network policy denies official Income Tax Department and Union Budget destinations. Additions have been saved to the environment configuration draft, preserving all existing destinations. A draft save does not apply runtime policy. No source was successfully fetched and no claim of latest-rate verification is made.

`lib/indian-capital-gains.ts` implements a narrowly scoped historical FY 2024–25 equity baseline for sales from 23 July 2024 through 31 March 2025: 20% short-term rate, 12.5% long-term rate, a shared ₹1,25,000 eligible long-term exemption, and 4% cess. Legislative reference: Finance (No. 2) Act, 2024 / sections 111A and 112A. The official portal is https://incometaxindia.gov.in/. This baseline is from established historical rules; source text has not been retrieved in this environment. It is not enabled as a current-rule preset in the UI.

The engine requires applicable STT conditions, a resident individual, income below ₹50 lakh, ordinary income using the basic exemption, and no special relief. It rejects grandfathering cases before February 2018, unsupported dates and incomplete applicability. Shared exemption consumption must include eligible gains across accounts, stocks and equity-oriented mutual funds. Losses withhold tax rather than inventing set-off. The existing generic worksheet remains an explicitly manual policy illustration.

Before enabling a current-law preset:

- Retrieve the applicable enacted Finance Act, current official tax guidance and relevant amendments for FY 2026–27, rather than assuming that a Budget proposal is enacted.
- Record exact source URLs, effective dates, retrieved date and supported tax year in a versioned ruleset. Validate acquisition-date transitions and STT conditions.
- Check resident basic exemption, rebates, surcharge/marginal relief, grandfathering and annual loss/exemption aggregation.
- Add debt/specified mutual funds, physical gold versus listed gold products, interest and other income only with their own verified classification rules. They must not inherit equity rates.
- Model each SWP redemption lot and aggregate tax by Indian financial year before presenting net monthly withdrawal income. Future-year tax remains an explicit scenario rather than a promise of unchanged law.

Current status: historical math tested; latest-law sources and comprehensive net SWP tax integration pending.
