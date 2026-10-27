"""Deterministic calculations for the one-input Money Guide.

Every calculator accepts one rupee amount. All other values are deliberately
fixed, visible product assumptions so visitors can understand the illustration.
"""

from __future__ import annotations

from dataclasses import dataclass
ANNUAL_RETURN = 0.12
HORIZON_YEARS = 5
CURRENT_AGE = 23
RETIREMENT_AGE = 50
INFLATION = 0.07


@dataclass(frozen=True)
class MoneyMultiplierResult:
    amount: float
    annual_return: float
    rule_72_years: float
    rule_114_years: float
    rule_144_years: float


def money_multiplier(amount: float) -> MoneyMultiplierResult:
    value = max(0.0, float(amount))
    return MoneyMultiplierResult(value, ANNUAL_RETURN, 72 / 12, 114 / 12, 144 / 12)


def ideal_allocation(amount: float) -> dict[str, float]:
    value = max(0.0, float(amount))
    equity_share = (100 - CURRENT_AGE) / 100
    return {
        "amount": value,
        "age": CURRENT_AGE,
        "equity_share": equity_share,
        "debt_share": 1 - equity_share,
        "equity_amount": value * equity_share,
        "debt_amount": value * (1 - equity_share),
    }


def sip_projection(monthly_amount: float) -> dict[str, float]:
    contribution = max(0.0, float(monthly_amount))
    months = HORIZON_YEARS * 12
    # The product convention is a nominal annual rate divided monthly.
    monthly_rate = ANNUAL_RETURN / 12
    invested = contribution * months
    # Contributions at the start of each month, matching the reference example.
    future_value = contribution * (((1 + monthly_rate) ** months - 1) / monthly_rate) * (1 + monthly_rate)
    return {
        "monthly_amount": contribution,
        "years": HORIZON_YEARS,
        "annual_return": ANNUAL_RETURN,
        "invested": invested,
        "future_value": future_value,
        "estimated_return": future_value - invested,
    }


def lump_sum_projection(amount: float) -> dict[str, float]:
    value = max(0.0, float(amount))
    future_value = value * (1 + ANNUAL_RETURN) ** HORIZON_YEARS
    return {
        "amount": value,
        "years": HORIZON_YEARS,
        "annual_return": ANNUAL_RETURN,
        "future_value": future_value,
        "estimated_return": future_value - value,
    }


def crore_timeline(monthly_amount: float, target: float = 10_000_000) -> dict[str, float]:
    contribution = max(1.0, float(monthly_amount))
    monthly_rate = (1 + ANNUAL_RETURN) ** (1 / 12) - 1
    balance = 0.0
    months = 0
    while balance < target and months < 1_200:
        balance = (balance + contribution) * (1 + monthly_rate)
        months += 1
    return {
        "monthly_amount": contribution,
        "target": target,
        "annual_return": ANNUAL_RETURN,
        "investing_years": months / 12,
        "saving_only_years": target / contribution / 12,
    }


def monthly_spend_plan(monthly_income: float) -> dict[str, float]:
    income = max(0.0, float(monthly_income))
    return {"income": income, "needs": income * 0.50, "wants": income * 0.30, "invest": income * 0.20}


def dream_home_plan(annual_income: float) -> dict[str, float]:
    income = max(0.0, float(annual_income))
    home_budget = income * 3
    return {
        "annual_income": income,
        "home_budget": home_budget,
        "repayment_years": 20,
        "monthly_emi_limit": income / 12 * 0.30,
        "down_payment": home_budget * 0.40,
    }


def fire_plan(monthly_expenses: float) -> dict[str, float]:
    expenses = max(0.0, float(monthly_expenses))
    years = RETIREMENT_AGE - CURRENT_AGE
    future_monthly_expenses = expenses * (1 + INFLATION) ** years
    return {
        "monthly_expenses": expenses,
        "current_age": CURRENT_AGE,
        "retirement_age": RETIREMENT_AGE,
        "inflation": INFLATION,
        "future_monthly_expenses": future_monthly_expenses,
        "fire_number": future_monthly_expenses * 12 * 25,
    }


def compact_years(value: float) -> str:
    """Readable whole-year output for goal timelines."""
    return f"{round(value):,} years"
